import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Sparkles, Send, X, Loader2, Bot, User, Trash2, ChevronDown } from 'lucide-react';
import { sendChatbotMessage } from '../../api/chatbot';

const STORAGE_PREFIX = 'taskbot_chat_';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "👋 Hi! I'm **TaskBot**, your AI project assistant.\n\nI can help you with:\n- Checking your tasks and deadlines\n- Team workload insights\n- Project analytics\n\nAsk me anything or try a quick action below!",
};

const QUICK_ACTIONS = [
  { label: '📋 My overdue tasks', message: 'What are my overdue tasks?' },
  { label: '📊 Completion rate', message: "What's our completion rate this week?" },
  { label: '⏰ Due this week', message: "What tasks are due this week?" },
  { label: '👥 Team workload', message: 'Who has the most tasks right now?' },
];

function MarkdownText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Headings: ### text, ## text, # text → render as bold styled text
        const h3Match = line.match(/^###\s+(.*)/);
        if (h3Match) {
          let inner = h3Match[1].replace(
            /\*\*(.+?)\*\*/g,
            '<strong class="font-bold">$1</strong>'
          );
          return (
            <p
              key={i}
              className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-2 mb-1"
              dangerouslySetInnerHTML={{ __html: inner }}
            />
          );
        }
        const h2Match = line.match(/^##\s+(.*)/);
        if (h2Match) {
          let inner = h2Match[1].replace(
            /\*\*(.+?)\*\*/g,
            '<strong class="font-bold">$1</strong>'
          );
          return (
            <p
              key={i}
              className="font-bold text-[14px] text-neutral-900 dark:text-neutral-100 mt-2 mb-1"
              dangerouslySetInnerHTML={{ __html: inner }}
            />
          );
        }
        const h1Match = line.match(/^#\s+(.*)/);
        if (h1Match) {
          let inner = h1Match[1].replace(
            /\*\*(.+?)\*\*/g,
            '<strong class="font-bold">$1</strong>'
          );
          return (
            <p
              key={i}
              className="font-extrabold text-[15px] text-neutral-900 dark:text-neutral-100 mt-2 mb-1"
              dangerouslySetInnerHTML={{ __html: inner }}
            />
          );
        }

        // Bold: **text**
        let processed = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-bold">$1</strong>'
        );
        // Inline code: `code`
        processed = processed.replace(
          /`(.+?)`/g,
          '<code class="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-xs font-mono">$1</code>'
        );

        // Bullet points
        const isBullet = /^\s*[-•]\s/.test(processed);
        if (isBullet) {
          processed = processed.replace(/^\s*[-•]\s/, '');
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-violet-500 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: processed }} />
            </div>
          );
        }

        // Numbered list: 1. text
        const numberedMatch = processed.match(/^\s*(\d+)\.\s(.*)/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-violet-500 font-bold shrink-0 text-xs mt-0.5">
                {numberedMatch[1]}.
              </span>
              <span dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />
            </div>
          );
        }

        if (!processed.trim()) return <div key={i} className="h-1" />;
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />
        );
      })}
    </div>
  );
}

// ── Load / save chat from localStorage ──────────────────────────────────────

function loadMessages(userId) {
  if (!userId) return [WELCOME_MESSAGE];
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [WELCOME_MESSAGE];
}

function saveMessages(userId, messages) {
  if (!userId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(messages));
  } catch {
    // Ignore quota errors
  }
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AIChatbot() {
  const { user } = useSelector((s) => s.auth);
  const userId = user?._id || user?.id;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadMessages(userId));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Re-load messages when user changes (login/logout)
  useEffect(() => {
    setMessages(loadMessages(userId));
  }, [userId]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    saveMessages(userId, messages);
  }, [userId, messages]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 100);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history (excluding the first welcome message)
      const history = messages
        .filter((_, i) => i > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendChatbotMessage(text.trim(), history);
      const reply = res.data.data.reply;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply },
      ]);
    } catch (err) {
      const errorMsg =
        err.response?.status === 429
          ? "⏳ I've hit my rate limit. Please try again in a minute!"
          : "❌ Sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group ${
          isOpen
            ? 'bg-neutral-800 dark:bg-neutral-700 rotate-0 scale-90'
            : 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:scale-110 hover:shadow-xl hover:shadow-violet-500/25'
        }`}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        id="ai-chatbot-toggle"
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <Sparkles
              size={24}
              className="text-white group-hover:animate-pulse"
            />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse" />
          </>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[420px] max-h-[620px] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/20 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-90 opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm">TaskBot AI</h3>
            <p className="text-violet-200 text-[10px] font-medium">
              Your project assistant
            </p>
          </div>
          <button
            onClick={clearChat}
            className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-white dark:bg-neutral-900 px-4 py-4 space-y-4 relative"
          style={{ maxHeight: '440px', minHeight: '220px' }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              } animate-fade-in`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'bg-violet-100 dark:bg-violet-900/30'
                }`}
              >
                {msg.role === 'user' ? (
                  <User
                    size={14}
                    className="text-primary-600 dark:text-primary-400"
                  />
                ) : (
                  <Sparkles
                    size={14}
                    className="text-violet-600 dark:text-violet-400"
                  />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-md'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownText text={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Sparkles
                  size={14}
                  className="text-violet-600 dark:text-violet-400"
                />
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-[150px] right-8 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all z-10"
          >
            <ChevronDown size={16} className="text-neutral-500" />
          </button>
        )}

        {/* Quick Actions (show only at the beginning) */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-4 py-2 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.message}
                  onClick={() => sendMessage(action.message)}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-200 dark:border-violet-800"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 shrink-0"
        >
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
              placeholder="Ask TaskBot anything..."
              className="flex-1 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 outline-none"
              maxLength={2000}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isLoading
                  ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-500/20'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
              }`}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <p className="text-[9px] text-neutral-400 mt-1.5 text-center font-medium">
            Powered by AI • Responses may be inaccurate
          </p>
        </form>
      </div>
    </>
  );
}
