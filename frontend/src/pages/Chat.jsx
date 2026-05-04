import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as Ably from 'ably';
import {
  MessageSquare, Send, UsersRound, User as UserIcon, Hash, Loader2,
  Smile, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { getMessages, sendMessage, markChannelRead, getUnreadCounts } from '../api/messages';
import { getTeamOverview, getDashboard } from '../api/tasks';
import { format, isToday, isYesterday } from 'date-fns';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDmChannel(userId1, userId2) {
  return `dm:${[userId1, userId2].sort().join('_')}`;
}

function DateDivider({ date }) {
  const d = new Date(date);
  let label = format(d, 'MMMM d, yyyy');
  if (isToday(d)) label = 'Today';
  else if (isYesterday(d)) label = 'Yesterday';
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</span>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}

function MessageBubble({ msg, isOwnMessage }) {
  const senderName = msg.sender?.name || 'Unknown';
  const senderAvatar = msg.sender?.avatar;
  const initial = senderName.charAt(0).toUpperCase();
  const time = format(new Date(msg.createdAt), 'h:mm a');

  return (
    <div className={`flex gap-3 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
        {senderAvatar ? (
          <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
        ) : initial}
      </div>

      {/* Bubble */}
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-xs font-bold ${isOwnMessage ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
            {isOwnMessage ? 'You' : senderName}
          </span>
          <span className="text-[10px] text-neutral-400 font-medium">{time}</span>
        </div>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isOwnMessage
            ? 'bg-primary-600 text-white rounded-tr-md'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-md'
        }`}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

// ── Main Chat Component ──────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('team');
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelLabel, setChannelLabel] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [lastMessageTimes, setLastMessageTimes] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const ablyClientRef = useRef(null);
  const ablyChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedChannelRef = useRef(null);
  const dmAutoOpenedRef = useRef(false);

  useEffect(() => { selectedChannelRef.current = selectedChannel; }, [selectedChannel]);

  // ── Auto-open DM from URL ?dm=userId (from Team page "Send Message") ──
  useEffect(() => {
    if (dmAutoOpenedRef.current || team.length === 0) return;
    const dmUserId = searchParams.get('dm');
    if (!dmUserId) return;
    const member = team.find((m) => m._id === dmUserId);
    if (member) {
      dmAutoOpenedRef.current = true;
      const ch = getDmChannel(user._id, member._id);
      setSelectedChannel(ch);
      setChannelLabel(member.name);
      setTab('dm');
      loadMessages(ch);
      setSearchParams({}, { replace: true });
    }
  }, [team, searchParams, user._id]);

  // ── Load projects + team on mount ──
  useEffect(() => {
    getDashboard()
      .then((r) => {
        const data = r.data.data;
        const projMap = {};
        (data.myTasks || []).forEach((t) => {
          const p = t.project;
          if (p && p._id) projMap[p._id] = { _id: p._id, name: p.name, color: p.color };
        });
        setProjects(Object.values(projMap));
      })
      .catch(() => {});

    getTeamOverview()
      .then((r) => setTeam(r.data.data.filter((m) => m._id !== user._id)))
      .catch(() => {});

    getUnreadCounts()
      .then((r) => {
        const counts = r.data.data || {};
        setUnreadCounts(counts);
        // Initialize sort times from unread presence (channels with unreads are "recent")
        const times = {};
        Object.keys(counts).forEach((ch, i) => { times[ch] = Date.now() - i; });
        setLastMessageTimes((prev) => ({ ...times, ...prev }));
      })
      .catch(() => {});
  }, [user._id]);

  // ── Ably realtime connection + global listener for toast notifications ──
  useEffect(() => {
    const key = import.meta.env.VITE_ABLY_KEY;
    if (!key) return;

    const client = new Ably.Realtime({
      key,
      clientId: user._id,
    });
    ablyClientRef.current = client;

    return () => {
      client.close();
      ablyClientRef.current = null;
    };
  }, [user._id]);

  // ── Subscribe to ALL channels for toast notifications (Slack-style) ──
  useEffect(() => {
    if (!ablyClientRef.current || projects.length === 0) return;

    const subs = [];

    // Subscribe to all team channels
    projects.forEach((p) => {
      const chName = `team:${p._id}`;
      const ch = ablyClientRef.current.channels.get(chName);
      const handler = (msg) => {
        const data = msg.data;
        if (data.sender?._id === user._id) return; // Don't toast own messages

        // Update last message time for sorting
        setLastMessageTimes((prev) => ({ ...prev, [chName]: Date.now() }));

        // If this channel is NOT currently open, show toast + increment unread
        if (selectedChannelRef.current !== chName) {
          setUnreadCounts((prev) => ({ ...prev, [chName]: (prev[chName] || 0) + 1 }));
          toast(`${data.sender?.name} in #${p.name}`, {
            description: data.text?.slice(0, 80) + (data.text?.length > 80 ? '…' : ''),
            icon: '💬',
            duration: 5000,
            action: { label: 'Open', onClick: () => navigate(`/chat`) },
          });
        }
      };
      ch.subscribe('message', handler);
      subs.push(() => ch.unsubscribe('message', handler));
    });

    // Subscribe to all DM channels
    team.forEach((m) => {
      const chName = getDmChannel(user._id, m._id);
      const ch = ablyClientRef.current.channels.get(chName);
      const handler = (msg) => {
        const data = msg.data;
        if (data.sender?._id === user._id) return;

        setLastMessageTimes((prev) => ({ ...prev, [chName]: Date.now() }));

        if (selectedChannelRef.current !== chName) {
          setUnreadCounts((prev) => ({ ...prev, [chName]: (prev[chName] || 0) + 1 }));
          toast(data.sender?.name || 'New message', {
            description: data.text?.slice(0, 80) + (data.text?.length > 80 ? '…' : ''),
            icon: '✉️',
            duration: 5000,
            action: { label: 'Reply', onClick: () => navigate(`/chat?dm=${data.sender?._id}`) },
          });
        }
      };
      ch.subscribe('message', handler);
      subs.push(() => ch.unsubscribe('message', handler));
    });

    return () => subs.forEach((unsub) => unsub());
  }, [projects, team, user._id]);

  // ── Subscribe to selected channel for live messages ──
  useEffect(() => {
    if (!selectedChannel || !ablyClientRef.current) return;

    const channel = ablyClientRef.current.channels.get(selectedChannel);
    ablyChannelRef.current = channel;

    const onMessage = (msg) => {
      const data = msg.data;
      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });
      // scrollToBottom handled by the useEffect below
    };

    const onTyping = (msg) => {
      const { userId, name, isTyping } = msg.data;
      if (userId === user._id) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.find((t) => t.userId === userId)) return prev;
          return [...prev, { userId, name }];
        }
        return prev.filter((t) => t.userId !== userId);
      });
    };

    channel.subscribe('message', onMessage);
    channel.subscribe('typing', onTyping);

    // Enter presence
    channel.presence.enter({ name: user.name, avatar: user.avatar });

    return () => {
      channel.unsubscribe('message', onMessage);
      channel.unsubscribe('typing', onTyping);
      channel.presence.leave();
      setTypingUsers([]);
    };
  }, [selectedChannel, user._id, user.name, user.avatar]);

  // ── Load message history ──
  const loadMessages = useCallback(async (channel) => {
    setLoading(true);
    setMessages([]);
    try {
      const res = await getMessages(channel);
      setMessages(res.data.data);
      await markChannelRead(channel).catch(() => {});
      setUnreadCounts((prev) => ({ ...prev, [channel]: 0 }));
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  }, []);

  // ── Select a channel ──
  const selectTeamChannel = (project) => {
    const ch = `team:${project._id}`;
    setSelectedChannel(ch);
    setChannelLabel(project.name);
    setTab('team');
    loadMessages(ch);
  };

  const selectDmChannel = (member) => {
    const ch = getDmChannel(user._id, member._id);
    setSelectedChannel(ch);
    setChannelLabel(member.name);
    setTab('dm');
    loadMessages(ch);
  };

  // ── Send message ──
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !selectedChannel || sending) return;
    setSending(true);
    try {
      const res = await sendMessage(selectedChannel, input.trim());
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data.data._id)) return prev;
        return [...prev, res.data.data];
      });
      setInput('');
      setLastMessageTimes((prev) => ({ ...prev, [selectedChannel]: Date.now() }));
      scrollToBottom();
      publishTyping(false);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // ── Typing indicator ──
  const publishTyping = (isTyping) => {
    if (!ablyChannelRef.current) return;
    ablyChannelRef.current.publish('typing', {
      userId: user._id,
      name: user.name?.split(' ')[0],
      isTyping,
    });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    publishTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => publishTyping(false), 2000);
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  // Auto-scroll when messages change (new message received or sent)
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages.length]);

  // ── Group messages by date for dividers ──
  const groupedMessages = messages.reduce((groups, msg, i) => {
    const date = new Date(msg.createdAt).toDateString();
    const prevDate = i > 0 ? new Date(messages[i - 1].createdAt).toDateString() : null;
    if (date !== prevDate) {
      groups.push({ type: 'divider', date: msg.createdAt });
    }
    groups.push({ type: 'message', data: msg });
    return groups;
  }, []);

  // ── Sort channels by most recent message (WhatsApp-style) ──
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const timeA = lastMessageTimes[`team:${a._id}`] || 0;
      const timeB = lastMessageTimes[`team:${b._id}`] || 0;
      return timeB - timeA;
    });
  }, [projects, lastMessageTimes]);

  const sortedTeam = useMemo(() => {
    return [...team].sort((a, b) => {
      const chA = getDmChannel(user._id, a._id);
      const chB = getDmChannel(user._id, b._id);
      const timeA = lastMessageTimes[chA] || 0;
      const timeB = lastMessageTimes[chB] || 0;
      return timeB - timeA;
    });
  }, [team, lastMessageTimes, user._id]);

  // ── Compute per-tab unread totals for tab dots ──
  const teamUnreadTotal = useMemo(() => {
    return Object.entries(unreadCounts)
      .filter(([ch]) => ch.startsWith('team:'))
      .reduce((sum, [, count]) => sum + count, 0);
  }, [unreadCounts]);

  const dmUnreadTotal = useMemo(() => {
    return Object.entries(unreadCounts)
      .filter(([ch]) => ch.startsWith('dm:'))
      .reduce((sum, [, count]) => sum + count, 0);
  }, [unreadCounts]);

  const totalUnread = teamUnreadTotal + dmUnreadTotal;

  return (
    <div className="page-enter flex h-[calc(100vh-7.5rem)] gap-0 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg">

      {/* ── Left Panel: Channel List ── */}
      <div className="w-72 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50 dark:bg-neutral-950">
        {/* Tabs */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50 mb-3 flex items-center gap-2">
            <MessageSquare size={20} className="text-primary-500" />
            Messages
          </h2>
          <div className="flex bg-neutral-200/60 dark:bg-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setTab('team')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all relative ${
                tab === 'team' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <UsersRound size={12} /> Team
              {teamUnreadTotal > 0 && (
                <span className="ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {teamUnreadTotal > 99 ? '99+' : teamUnreadTotal}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('dm')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all relative ${
                tab === 'dm' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <UserIcon size={12} /> Direct
              {dmUnreadTotal > 0 && (
                <span className="ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {dmUnreadTotal > 99 ? '99+' : dmUnreadTotal}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tab === 'team' ? (
            sortedProjects.length > 0 ? sortedProjects.map((p) => {
              const ch = `team:${p._id}`;
              const isActive = selectedChannel === ch;
              const unread = unreadCounts[ch] || 0;
              return (
                <button
                  key={p._id}
                  onClick={() => selectTeamChannel(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: p.color || '#6366f1' }}>
                    <UsersRound size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-extrabold' : 'font-bold'}`}>{p.name}</p>
                    <p className="text-[10px] text-neutral-400 font-medium">Team chat</p>
                  </div>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unread}</span>
                  )}
                </button>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                <UsersRound size={32} className="mb-2 opacity-30" />
                <p className="text-xs font-medium">No projects yet</p>
              </div>
            )
          ) : (
            sortedTeam.length > 0 ? sortedTeam.map((m) => {
              const ch = getDmChannel(user._id, m._id);
              const isActive = selectedChannel === ch;
              const unread = unreadCounts[ch] || 0;
              const initial = m.name?.charAt(0).toUpperCase() || '?';
              return (
                <button
                  key={m._id}
                  onClick={() => selectDmChannel(m)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="relative w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                    {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : initial}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-neutral-50 dark:border-neutral-950 ${
                      m.availability?.status === 'available' ? 'bg-emerald-500' : m.availability?.status === 'busy' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-extrabold' : 'font-bold'}`}>{m.name}</p>
                    <p className="text-[10px] text-neutral-400 font-medium truncate">{m.email}</p>
                  </div>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unread}</span>
                  )}
                </button>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                <UserIcon size={32} className="mb-2 opacity-30" />
                <p className="text-xs font-medium">No team members</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3 bg-white dark:bg-neutral-900 z-10 flex-shrink-0">
              <button onClick={() => setSelectedChannel(null)} className="md:hidden text-neutral-400 hover:text-neutral-600">
                <ArrowLeft size={18} />
              </button>
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                {selectedChannel.startsWith('team:')
                  ? <UsersRound size={16} className="text-primary-600 dark:text-primary-400" />
                  : <UserIcon size={16} className="text-primary-600 dark:text-primary-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate">{channelLabel}</h3>
                {typingUsers.length > 0 && (
                  <p className="text-[10px] text-primary-500 font-semibold animate-pulse">
                    {typingUsers.map((t) => t.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ paddingBottom: '0.5rem' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={32} className="animate-spin text-primary-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <MessageSquare size={32} className="opacity-30" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-500">No messages yet</p>
                    <p className="text-xs mt-1">Be the first to say hello! 👋</p>
                  </div>
                </div>
              ) : (
                groupedMessages.map((item, i) => {
                  if (item.type === 'divider') {
                    return <DateDivider key={`d-${i}`} date={item.date} />;
                  }
                  return (
                    <MessageBubble
                      key={item.data._id}
                      msg={item.data}
                      isOwnMessage={item.data.sender?._id === user._id}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2">
                <Smile size={18} className="text-neutral-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 outline-none"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    input.trim()
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                  }`}
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1.5 text-center font-medium">
                <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 font-bold">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 font-bold">Shift+Enter</kbd> for new line
              </p>
            </form>
          </>
        ) : (
          /* Empty state — no channel selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center">
              <MessageSquare size={36} className="text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Welcome to Chat</h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-sm">
                Select a team channel or a teammate to start chatting. Messages are saved and synced in real-time.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setTab('team')}
                className="btn-secondary text-xs"
              >
                <UsersRound size={14} /> Team Channels
              </button>
              <button
                onClick={() => setTab('dm')}
                className="btn-primary text-xs"
              >
                <UserIcon size={14} /> Direct Messages
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
