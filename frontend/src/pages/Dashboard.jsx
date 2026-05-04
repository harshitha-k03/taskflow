import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  Clock, Calendar, CheckCircle, ChevronRight, Zap,
  Users, Flame, Target, Loader2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { getDashboard, getTeamOverview } from '../api/tasks';
import { format, isPast, isToday, differenceInDays, isTomorrow } from 'date-fns';

const PRIORITY_COLORS = { Low: '#9ca3af', Medium: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444' };
const STATUS_COLORS = { 'To Do': '#6b7280', 'In Progress': '#3b82f6', 'In Review': '#8b5cf6', Done: '#10b981' };
const PRIORITY_WEIGHT = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

const AVAILABILITY_COLORS = {
  available: { bg: 'bg-emerald-500', label: 'Available', text: 'text-emerald-600 dark:text-emerald-400' },
  busy: { bg: 'bg-amber-500', label: 'Busy', text: 'text-amber-600 dark:text-amber-400' },
  ooo: { bg: 'bg-red-500', label: 'Out of Office', text: 'text-red-600 dark:text-red-400' },
};

function StatCard({ icon: Icon, label, value, sub, colorClass = 'from-primary-500 to-primary-600' }) {
  return (
    <div className={`bg-gradient-to-br ${colorClass} text-white rounded-lg p-lg shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative`}>
      <Icon size={48} className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform duration-500" />
      <div className="relative z-10">
        <p className="text-body-sm opacity-90 font-medium mb-1 tracking-wide uppercase">{label}</p>
        <h3 className="text-4xl font-bold mb-2 tracking-tight">{value}</h3>
        {sub && <p className="text-[11px] opacity-75 font-semibold bg-white/10 inline-block px-2 py-0.5 rounded-full">{sub}</p>}
      </div>
    </div>
  );
}

// Smart score: higher = more urgent
function priorityScore(task) {
  const weight = PRIORITY_WEIGHT[task.priority] || 1;
  if (!task.dueDate) return weight;
  const days = differenceInDays(new Date(task.dueDate), new Date());
  if (days < 0) return weight + 100; // overdue = top priority
  if (days === 0) return weight + 50;
  return weight + (1 / (days + 1)) * 10;
}

function DeadlinePill({ dueDate }) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const days = differenceInDays(date, new Date());

  if (isPast(date) && !isToday(date))
    return <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">{Math.abs(days)}d overdue</span>;
  if (isToday(date))
    return <span className="text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full animate-pulse">Due today!</span>;
  if (isTomorrow(date))
    return <span className="text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">Tomorrow</span>;
  if (days <= 7)
    return <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">{days}d left</span>;
  return <span className="text-[10px] font-medium text-neutral-400">{format(date, 'MMM d')}</span>;
}

function getGreeting(name, hour) {
  const firstName = name?.split(' ')[0] || 'there';
  if (hour < 5)  return { text: `Night owl, ${firstName}! 🦉`, sub: 'Working late? Remember to rest.' };
  if (hour < 12) return { text: `Good morning, ${firstName}! ☀️`, sub: 'Ready to crush today\'s goals?' };
  if (hour < 17) return { text: `Good afternoon, ${firstName}! 👋`, sub: 'Keep the momentum going!' };
  if (hour < 21) return { text: `Good evening, ${firstName}! 🌆`, sub: 'Wrapping up the day?' };
  return { text: `Good night, ${firstName}! 🌙`, sub: 'Time to wind down soon.' };
}

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard().then((r) => setData(r.data.data)),
      getTeamOverview().then((r) => setTeam(r.data.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={48} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const statusData = data ? Object.entries(data.tasksByStatus).map(([name, value]) => ({ name, value })) : [];
  const priorityData = data ? Object.entries(data.tasksByPriority).map(([name, value]) => ({ name, value })) : [];

  // Smart priority sorted tasks
  const focusTasks = [...(data?.myTasks || [])]
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, 5);

  // Deadline alerts grouped
  const overdueTasks = (data?.myTasks || []).filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
  const dueTodayTasks = (data?.myTasks || []).filter(t => t.dueDate && isToday(new Date(t.dueDate)));
  const dueThisWeekTasks = (data?.myTasks || []).filter(t => {
    if (!t.dueDate) return false;
    const days = differenceInDays(new Date(t.dueDate), new Date());
    return days > 0 && days <= 7;
  });

  const hour = new Date().getHours();
  const { text: greetingText, sub: greetingSub } = getGreeting(user?.name, hour);

  return (
    <div className="page-enter flex flex-col gap-xl max-w-7xl mx-auto pb-xl">

      {/* ── Greeting Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-extrabold text-slate-900 dark:text-white">
            {greetingText}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">{greetingSub}</p>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mt-2 text-body-sm">
            <Calendar size={14} />
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/projects" className="btn-secondary">View Projects</Link>
          <Link to="/projects" className="btn-primary"><Target size={16} /> New Project</Link>
        </div>
      </div>

      {/* ── Overdue Alert Banner — clickable ── */}
      {data?.overdueTasks > 0 && (
        <Link
          to={overdueTasks[0] ? `/projects/${overdueTasks[0].project?._id || overdueTasks[0].project}/board` : '/projects'}
          className="flex items-center gap-4 p-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 shadow-sm hover:shadow-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-body-sm">
              ⚠️ You have <span className="underline">{data.overdueTasks} overdue {data.overdueTasks === 1 ? 'task' : 'tasks'}</span> requiring immediate attention.
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 font-medium">Click to view → {overdueTasks[0]?.title}</p>
          </div>
          <ChevronRight size={20} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        <StatCard icon={FolderKanban} label="Total Projects" value={data?.totalProjects ?? 0} colorClass="from-blue-600 to-indigo-700" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={data?.totalTasks ?? 0} colorClass="from-amber-500 to-orange-600" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${data?.completionRate ?? 0}%`} colorClass="from-emerald-500 to-teal-600" />
        <StatCard icon={Clock} label="Done This Week" value={data?.completedThisWeek ?? 0} sub={`${data?.completedThisMonth ?? 0} this month`} colorClass="from-purple-600 to-violet-700" />
      </div>

      {/* ── Smart Focus + Deadline Alerts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">

        {/* Smart Priority Engine */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" /> Your Focus Today
            <span className="ml-auto text-label bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">Smart Sorted</span>
          </h3>
          <div className="space-y-3">
            {focusTasks.length > 0 ? focusTasks.map((task, i) => (
              <Link key={task._id} to={`/projects/${task.project._id || task.project}/board`}
                className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all group"
              >
                <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-500 shrink-0">
                  {i + 1}
                </span>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[task.priority] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{task.title}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{task.project?.name || 'Project'}</p>
                </div>
                <DeadlinePill dueDate={task.dueDate} />
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Flame size={40} className="text-neutral-200 dark:text-neutral-700 mb-3" />
                <p className="font-bold text-neutral-500">All tasks done! 🎉</p>
                <p className="text-xs text-neutral-400 mt-1">No pending tasks assigned to you.</p>
              </div>
            )}
          </div>
        </div>

        {/* Smart Deadline Alerts */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <Flame size={20} className="text-red-500" /> Deadline Alerts
          </h3>
          <div className="flex flex-col gap-4">
            {overdueTasks.length === 0 && dueTodayTasks.length === 0 && dueThisWeekTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle size={40} className="text-emerald-300 dark:text-emerald-700 mb-3" />
                <p className="font-bold text-neutral-500">No upcoming deadlines!</p>
                <p className="text-xs text-neutral-400 mt-1">You're on top of everything.</p>
              </div>
            ) : (
              <>
                {overdueTasks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 mb-2">🔴 Overdue ({overdueTasks.length})</p>
                    {overdueTasks.slice(0, 3).map(t => (
                      <Link key={t._id} to={`/projects/${t.project._id || t.project}/board`}
                        className="flex items-center gap-2 py-2 hover:text-red-600 transition-colors group">
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        <p className="text-body-sm font-semibold truncate flex-1 group-hover:underline">{t.title}</p>
                        <DeadlinePill dueDate={t.dueDate} />
                      </Link>
                    ))}
                  </div>
                )}
                {dueTodayTasks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2">🟡 Due Today ({dueTodayTasks.length})</p>
                    {dueTodayTasks.map(t => (
                      <Link key={t._id} to={`/projects/${t.project._id || t.project}/board`}
                        className="flex items-center gap-2 py-2 hover:text-amber-600 transition-colors group">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <p className="text-body-sm font-semibold truncate flex-1 group-hover:underline">{t.title}</p>
                        <DeadlinePill dueDate={t.dueDate} />
                      </Link>
                    ))}
                  </div>
                )}
                {dueThisWeekTasks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500 mb-2">🔵 This Week ({dueThisWeekTasks.length})</p>
                    {dueThisWeekTasks.slice(0, 3).map(t => (
                      <Link key={t._id} to={`/projects/${t.project._id || t.project}/board`}
                        className="flex items-center gap-2 py-2 hover:text-blue-600 transition-colors group">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <p className="text-body-sm font-semibold truncate flex-1 group-hover:underline">{t.title}</p>
                        <DeadlinePill dueDate={t.dueDate} />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Analytics + My Tasks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">

        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-primary-500" /> Task Status
          </h3>
          {statusData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={5} stroke="none">
                    {statusData.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-2 w-full px-4">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
                      <span className="text-body-sm text-neutral-500 font-medium group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">{s.name}</span>
                    </div>
                    <span className="text-body-sm font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <CheckSquare size={48} className="opacity-20" />
              <p className="text-body-sm font-medium">No tasks yet</p>
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" /> Priority Breakdown
          </h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#9ca3af'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <TrendingUp size={48} className="opacity-20" />
              <p className="text-body-sm font-medium">No data yet</p>
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Clock size={20} className="text-primary-500" /> My Tasks</span>
            <span className="text-label bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full">{data?.myTasks?.length || 0}</span>
          </h3>
          <div className="space-y-3">
            {data?.myTasks?.length > 0 ? data.myTasks.map((task) => (
              <Link key={task._id} to={`/projects/${task.project._id || task.project}/board`}
                className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all group"
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Low }} />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.title}</p>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar size={11} className={isPast(new Date(task.dueDate)) ? 'text-error-500' : 'text-neutral-400'} />
                      <span className={`text-[11px] font-semibold ${isPast(new Date(task.dueDate)) ? 'text-error-600 dark:text-error-400' : 'text-neutral-500'}`}>
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="text-neutral-300 group-hover:text-primary-500 transition-colors" />
              </Link>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <CheckSquare size={32} className="text-neutral-300" />
                </div>
                <h4 className="text-body font-bold text-neutral-900 dark:text-neutral-50">All caught up!</h4>
                <p className="text-body-sm text-neutral-500 mt-1 px-4">No open tasks assigned to you.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Team Status ── */}
      {team.length > 0 && (
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <Users size={20} className="text-primary-500" /> Your Team
            <span className="ml-auto text-label bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">{team.length} members</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.map((member) => {
              const avail = AVAILABILITY_COLORS[member.availability?.status] || AVAILABILITY_COLORS.available;
              const memberInitial = member.name?.charAt(0).toUpperCase() || '?';
              return (
                <div key={member._id} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                  <div className="relative shrink-0">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                        {memberInitial}
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 ${avail.bg}`} title={avail.label} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-bold truncate">{member.name}</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${avail.text}`}>{avail.label}</p>
                    {member.openTasks !== undefined && (
                      <p className="text-[10px] text-neutral-400 font-medium">{member.openTasks} open tasks</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
