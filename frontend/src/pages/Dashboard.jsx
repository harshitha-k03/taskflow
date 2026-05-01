import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  Clock, ArrowRight, Loader2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { getDashboard } from '../api/tasks';
import { format, isPast } from 'date-fns';

const PRIORITY_COLORS = { Low: '#6b7280', Medium: '#3b82f6', High: '#f97316', Urgent: '#ef4444' };
const STATUS_COLORS = { 'To Do': '#6b7280', 'In Progress': '#3b82f6', 'In Review': '#eab308', Done: '#22c55e' };

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5 flex items-start gap-4 hover:border-gray-700 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  const statusData = data
    ? Object.entries(data.tasksByStatus).map(([name, value]) => ({ name, value }))
    : [];
  const priorityData = data
    ? Object.entries(data.tasksByPriority).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
      </div>

      {/* Overdue alert */}
      {data?.overdueTasks > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800/50 rounded-xl animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            You have <strong>{data.overdueTasks}</strong> overdue task{data.overdueTasks !== 1 ? 's' : ''} that need attention.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={data?.totalProjects ?? 0}
          color="bg-primary-600" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={data?.totalTasks ?? 0}
          color="bg-blue-600" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={`${data?.completionRate ?? 0}%`}
          color="bg-green-600" />
        <StatCard icon={Clock} label="Done This Week" value={data?.completedThisWeek ?? 0}
          color="bg-violet-600" sub={`${data?.completedThisMonth ?? 0} this month`} />
      </div>

      {/* Charts + My tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tasks by Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {statusData.map((s) => (
                  <span key={s.name} className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No tasks yet</p>
          )}
        </div>

        {/* Priority Bar */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tasks by Priority</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No tasks yet</p>
          )}
        </div>

        {/* My tasks */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">My Open Tasks</h3>
          <div className="space-y-2">
            {data?.myTasks?.length > 0 ? (
              data.myTasks.map((task) => (
                <Link key={task._id} to={`/tasks/${task._id}`}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-800 transition-colors group">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    task.priority === 'Urgent' ? 'bg-red-400' :
                    task.priority === 'High' ? 'bg-orange-400' :
                    task.priority === 'Medium' ? 'bg-blue-400' : 'bg-gray-500'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 group-hover:text-white truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className={`text-xs mt-0.5 ${isPast(new Date(task.dueDate)) ? 'text-red-400' : 'text-gray-500'}`}>
                        Due {format(new Date(task.dueDate), 'MMM d')}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-1" />
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No tasks assigned to you 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
