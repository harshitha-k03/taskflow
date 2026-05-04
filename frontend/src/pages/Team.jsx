import { useEffect, useState } from 'react';
import { Loader2, Users, Mail, CheckSquare, Wifi, WifiOff, Coffee } from 'lucide-react';
import { getTeamOverview } from '../api/tasks';

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

export default function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeamOverview()
      .then((r) => setTeam(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />{grouped.ooo.length} OOO
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
              <div
                key={member._id}
                className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4"
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
                    <p className="font-bold text-slate-900 dark:text-slate-50 truncate text-body-lg">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
