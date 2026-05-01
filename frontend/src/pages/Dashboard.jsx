import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  Clock, ArrowRight, Loader2, Calendar, CheckCircle, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { getDashboard } from '../api/tasks';
import { format, isPast } from 'date-fns';

const PRIORITY_COLORS = { Low: '#9ca3af', Medium: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444' };
const STATUS_COLORS = { 'To Do': '#6b7280', 'In Progress': '#3b82f6', 'In Review': '#8b5cf6', Done: '#10b981' };

function StatCard({ icon: Icon, label, value, sub, colorClass = "from-primary-500 to-primary-600" }) {
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

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={48} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const statusData = data
    ? Object.entries(data.tasksByStatus).map(([name, value]) => ({ name, value }))
    : [];
  const priorityData = data
    ? Object.entries(data.tasksByPriority).map(([name, value]) => ({ name, value }))
    : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <div className="page-enter flex flex-col gap-xl max-w-7xl mx-auto pb-xl">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">
            Good {greeting}, <span className="text-primary-600 dark:text-primary-400">{user?.name?.split(' ')[0]}</span>
          </h1>
          <div className="flex items-center gap-2 text-neutral-500 mt-1 font-medium">
            <Calendar size={16} />
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/projects" className="btn-secondary">View Projects</Link>
          <button onClick={() => window.location.href = '/projects'} className="btn-primary">
            New Project
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {data?.overdueTasks > 0 && (
        <div className="flex items-center gap-4 p-md bg-error-50 dark:bg-error-900/20 border border-error-100 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 shadow-sm animate-pulse">
          <div className="w-10 h-10 rounded-full bg-error-100 dark:bg-error-900 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-error-600 dark:text-error-400" />
          </div>
          <p className="font-medium text-body-sm">
            Attention: You have <span className="font-bold underline">{data.overdueTasks} overdue tasks</span> that require immediate action.
          </p>
          <ChevronRight size={20} className="ml-auto opacity-50" />
        </div>
      )}

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        <StatCard 
          icon={FolderKanban} 
          label="Total Projects" 
          value={data?.totalProjects ?? 0}
          colorClass="from-blue-600 to-indigo-700"
        />
        <StatCard 
          icon={CheckSquare} 
          label="Total Tasks" 
          value={data?.totalTasks ?? 0}
          colorClass="from-amber-500 to-orange-600"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Completion Rate" 
          value={`${data?.completionRate ?? 0}%`}
          colorClass="from-emerald-500 to-teal-600"
        />
        <StatCard 
          icon={Clock} 
          label="Done This Week" 
          value={data?.completedThisWeek ?? 0}
          sub={`${data?.completedThisMonth ?? 0} this month`}
          colorClass="from-purple-600 to-violet-700"
        />
      </div>

      {/* Analytics & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        
        {/* Status Distribution */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-primary-500" /> Task Status
          </h3>
          {statusData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                    dataKey="value" paddingAngle={5} stroke="none">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 w-full px-4">
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
              <p className="text-body-sm font-medium">No tasks found</p>
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-500" /> Priority Distribution
          </h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={priorityData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#9ca3af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <TrendingUp size={48} className="opacity-20" />
              <p className="text-body-sm font-medium">No data available</p>
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <h3 className="text-h3 font-bold mb-lg border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center justify-between">
            <span className="flex items-center gap-2"><Clock size={20} className="text-primary-500" /> My Tasks</span>
            <span className="text-label bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full">{data?.myTasks?.length || 0}</span>
          </h3>
          <div className="space-y-3">
            {data?.myTasks?.length > 0 ? (
              data.myTasks.map((task) => (
                <Link key={task._id} to={`/projects/${task.project}/board`}
                  className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all group"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Low }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-bold truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.title}</p>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar size={12} className={isPast(new Date(task.dueDate)) ? 'text-error-500' : 'text-neutral-400'} />
                        <span className={`text-[11px] font-semibold ${isPast(new Date(task.dueDate)) ? 'text-error-600 dark:text-error-400' : 'text-neutral-500'}`}>
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-neutral-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <CheckSquare size={32} className="text-neutral-300" />
                </div>
                <h4 className="text-body font-bold text-neutral-900 dark:text-neutral-50">All caught up!</h4>
                <p className="text-body-sm text-neutral-500 mt-1 px-4">You don't have any open tasks assigned to you right now.</p>
              </div>
            )}
          </div>
          {data?.myTasks?.length > 0 && (
            <Link to="/projects" className="mt-6 block text-center text-body-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
              View All Tasks
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
