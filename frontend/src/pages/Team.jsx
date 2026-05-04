import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Ably from 'ably';
import {
  Loader2, Users, Mail, CheckSquare, Wifi, WifiOff, Coffee,
  X, FolderKanban, MessageSquare, CheckCircle, Clock, AlertTriangle,
} from 'lucide-react';
import { getTeamOverview, getMemberDetail } from '../api/tasks';

const AVAILABILITY = {
  available: {
    label: 'Available',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    icon: Wifi,
  },
  busy: {
    label: 'Busy',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    icon: Coffee,
  },
  ooo: {
    label: 'Out of Office',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    icon: WifiOff,
  },
};

function MemberDetailPanel({ memberId, onClose }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    getMemberDetail(memberId)
      .then((r) => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [memberId]);

  if (!memberId) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50">Member Details</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">Could not load member details.</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                {data.profile.avatar ? (
                  <img src={data.profile.avatar} alt={data.profile.name} className="w-full h-full object-cover" />
                ) : data.profile.name?.charAt(0).toUpperCase()}
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 ${
                  AVAILABILITY[data.profile.availability?.status]?.dot || 'bg-emerald-500'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 truncate">{data.profile.name}</h4>
                <p className="text-sm text-neutral-500 truncate">{data.profile.email}</p>
                <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  AVAILABILITY[data.profile.availability?.status]?.bg || ''
                } ${AVAILABILITY[data.profile.availability?.status]?.text || ''}`}>
                  {AVAILABILITY[data.profile.availability?.status]?.label || 'Available'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => { onClose(); navigate(`/chat?dm=${memberId}`); }}
              className="w-full btn-primary text-sm justify-center"
            >
              <MessageSquare size={16} /> Send Message
            </button>

            {/* Task Stats */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Task Overview</h5>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Completed', value: data.taskStats.done, icon: CheckCircle, color: 'text-emerald-500' },
                  { label: 'In Progress', value: data.taskStats.inProgress, icon: Clock, color: 'text-blue-500' },
                  { label: 'To Do', value: data.taskStats.toDo, icon: CheckSquare, color: 'text-neutral-400' },
                  { label: 'In Review', value: data.taskStats.inReview, icon: AlertTriangle, color: 'text-violet-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 flex items-center gap-3">
                    <Icon size={16} className={color} />
                    <div>
                      <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{value}</p>
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Projects ({data.projects.length})</h5>
              <div className="space-y-2">
                {data.projects.map((p) => (
                  <div key={p._id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.color || '#6366f1' }}>
                      <FolderKanban size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate">{p.name}</p>
                      <p className="text-[10px] text-neutral-400 font-medium">{p.role} · {p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Done */}
            {data.recentDone.length > 0 && (
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Recently Completed</h5>
                <div className="space-y-2">
                  {data.recentDone.map((t) => (
                    <div key={t._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">{t.title}</p>
                        <p className="text-[10px] text-neutral-400">{t.project?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const ablyRef = useRef(null);

  useEffect(() => {
    getTeamOverview()
      .then((r) => setTeam(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Subscribe to real-time status changes
  useEffect(() => {
    const key = import.meta.env.VITE_ABLY_KEY;
    if (!key) return;

    const client = new Ably.Realtime({ key });
    ablyRef.current = client;
    const channel = client.channels.get('taskflow:status');

    channel.subscribe('status_change', (msg) => {
      const { userId, status } = msg.data;
      setTeam((prev) =>
        prev.map((m) =>
          m._id === userId
            ? { ...m, availability: { ...m.availability, status } }
            : m
        )
      );
    });

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={40} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const grouped = {
    available: team.filter((m) => m.availability?.status === 'available' || !m.availability?.status),
    busy: team.filter((m) => m.availability?.status === 'busy'),
    ooo: team.filter((m) => m.availability?.status === 'ooo'),
  };

  return (
    <div className="page-enter max-w-5xl mx-auto pb-xl flex flex-col gap-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-50">Your Team</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {team.length} member{team.length !== 1 ? 's' : ''} across your projects
          </p>
        </div>
        <div className="flex items-center gap-3 text-body-sm">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{grouped.available.length} Available
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{grouped.busy.length} Busy
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />{grouped.ooo.length} Out of Office
          </span>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Users size={56} className="text-slate-200 dark:text-slate-700 mb-4" />
          <h3 className="text-h3 font-bold text-slate-500">No team members yet</h3>
          <p className="text-slate-400 mt-2 max-w-sm">
            Add members to your projects and they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((member) => {
            const avail = AVAILABILITY[member.availability?.status] || AVAILABILITY.available;
            const AvailIcon = avail.icon;
            const initial = member.name?.charAt(0).toUpperCase() || '?';

            return (
              <button
                key={member._id}
                onClick={() => setSelectedMember(member._id)}
                className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4 text-left cursor-pointer group"
              >
                {/* Top row: avatar + name + availability */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-neutral-800"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                        {initial}
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 ${avail.dot}`}
                      title={avail.label}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-50 truncate text-body-lg group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                    </div>
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold ${avail.bg} ${avail.text}`}>
                      <AvailIcon size={11} />
                      {avail.label}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/60">
                    <div className="flex items-center gap-1 text-primary-500 mb-1">
                      <CheckSquare size={14} />
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{member.openTasks ?? 0}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Open Tasks</p>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/60">
                    <div className="flex items-center gap-1 text-emerald-500 mb-1">
                      <Users size={14} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Status</p>
                    <p className={`text-xs font-bold mt-0.5 ${avail.text}`}>{avail.label}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      <MemberDetailPanel memberId={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}
