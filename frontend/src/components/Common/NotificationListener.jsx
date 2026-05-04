import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { getUnreadCounts } from '../../api/messages';

/**
 * Global notification listener — mounts in Layout.
 * 
 * Shows sonner toasts for incoming messages ONLY when the user
 * is NOT on the /chat page (Chat.jsx handles its own notifications).
 * 
 * Strategy:
 * 1. Primary: Ably real-time subscription on `notify:{userId}` channel
 * 2. Fallback: Polls unread counts every 15s if Ably is NOT connected
 * 
 * Only ONE of these fires at a time — never duplicates.
 */
export default function NotificationListener() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const ablyConnectedRef = useRef(false);
  const prevUnreadsRef = useRef(null);

  // Check if user is currently on the chat page
  const isOnChatPage = location.pathname === '/chat';

  // ── Ably real-time subscription ──
  useEffect(() => {
    const key = import.meta.env.VITE_ABLY_KEY;
    if (!key || !user?._id) return;

    let mounted = true;
    let client = null;
    let notifyChannel = null;

    const connect = async () => {
      try {
        const Ably = await import('ably');
        client = new Ably.Realtime({ key, clientId: user._id });
        if (!mounted) { client.close(); return; }

        client.connection.on('connected', () => {
          ablyConnectedRef.current = true;
        });

        client.connection.on('disconnected', () => {
          ablyConnectedRef.current = false;
        });

        notifyChannel = client.channels.get(`notify:${user._id}`);

        notifyChannel.subscribe('new_message', (msg) => {
          if (!mounted) return;
          const data = msg.data;
          if (!data || data.senderId === user._id) return;

          // Skip toast if user is on the chat page — Chat.jsx handles its own
          if (window.location.pathname === '/chat') return;

          const isTeam = data.channel?.startsWith('team:');
          toast(data.senderName || 'New message', {
            description: `${isTeam ? `#${data.channelLabel}: ` : ''}${data.text?.slice(0, 80)}${data.text?.length > 80 ? '…' : ''}`,
            icon: isTeam ? '💬' : '✉️',
            duration: 5000,
            action: {
              label: isTeam ? 'Open' : 'Reply',
              onClick: () => navigate(isTeam ? '/chat' : `/chat?dm=${data.senderId}`),
            },
          });
        });
      } catch (err) {
        console.warn('[NotificationListener] Ably init failed:', err);
      }
    };

    connect();

    return () => {
      mounted = false;
      if (notifyChannel) notifyChannel.unsubscribe();
      if (client) client.close();
      ablyConnectedRef.current = false;
    };
  }, [user?._id, navigate]);

  // ── Polling fallback: only when Ably is NOT connected ──
  useEffect(() => {
    if (!user?._id) return;

    const poll = async () => {
      // Skip if Ably is handling it, or user is on chat page
      if (ablyConnectedRef.current) return;
      if (window.location.pathname === '/chat') return;

      try {
        const res = await getUnreadCounts();
        const counts = res.data.data || {};
        const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

        if (prevUnreadsRef.current !== null && total > prevUnreadsRef.current) {
          const diff = total - prevUnreadsRef.current;
          toast(`${diff} new message${diff > 1 ? 's' : ''}`, {
            description: 'You have unread messages in chat',
            icon: '💬',
            duration: 5000,
            action: {
              label: 'Open Chat',
              onClick: () => navigate('/chat'),
            },
          });
        }
        prevUnreadsRef.current = total;
      } catch {
        // Silent fail
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user?._id, navigate]);

  return null;
}
