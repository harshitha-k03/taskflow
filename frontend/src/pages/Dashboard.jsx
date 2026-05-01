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

// Nefee Color Tokens
const PRIORITY_COLORS = { Low: '#B1B4BA', Medium: '#2B8CDC', High: '#FFA200', Urgent: '#FF3F6D' };
const STATUS_COLORS = { 'To Do': '#B1B4BA', 'In Progress': '#2B8CDC', 'In Review': '#FFA200', Done: '#00D5B0' };

function StatCard({ icon: Icon, label, value, gradient, sub, delayClass }) {
  return (
    <div className={`card animate-enter ${delayClass}`} style={{ 
      padding: '24px', 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: '16px',
      transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 200ms ease'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
      }}>
        <Icon size={24} color="#F2F4F7" />
      </div>
      <div>
        <p style={{ fontSize: 28, fontWeight: 700, color: '#F2F4F7', margin: 0, lineHeight: 1.2 }}>{value}</p>
        <p style={{ fontSize: 13, color: '#B1B4BA', margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: 'rgba(242,244,247,0.4)', margin: '4px 0 0' }}>{sub}</p>}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} color="#00D5B0" className="animate-spin" />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-enter" style={{ marginBottom: 8 }}>
        <h1 className="page-title">
          Good {greeting},{' '}
          <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: '#B1B4BA', fontSize: 14, margin: '6px 0 0' }}>
          {format(new Date(), 'EEEE, MMMM do yyyy')}
        </p>
      </div>

      {/* Overdue alert */}
      {data?.overdueTasks > 0 && (
        <div className="animate-enter stagger-1" style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
          background: 'linear-gradient(90deg, rgba(195,40,77,0.15) 0%, rgba(195,40,77,0.05) 100%)',
          borderLeft: '4px solid #FF3F6D',
          borderRadius: '0 12px 12px 0',
        }}>
          <AlertTriangle size={20} color="#FF3F6D" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, color: '#F2F4F7' }}>
            You have <strong style={{ color: '#FF3F6D' }}>{data.overdueTasks}</strong> overdue task{data.overdueTasks !== 1 ? 's' : ''} that need attention.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        <StatCard delayClass="stagger-1" icon={FolderKanban} label="Total Projects" value={data?.totalProjects ?? 0}
          gradient="linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)" />
        <StatCard delayClass="stagger-2" icon={CheckSquare} label="Total Tasks" value={data?.totalTasks ?? 0}
          gradient="linear-gradient(135deg, #FFA200 0%, #b37300 100%)" />
        <StatCard delayClass="stagger-3" icon={TrendingUp} label="Completion Rate" value={`${data?.completionRate ?? 0}%`}
          gradient="linear-gradient(135deg, #00D5B0 0%, #008a72 100%)" />
        <StatCard delayClass="stagger-4" icon={Clock} label="Done This Week" value={data?.completedThisWeek ?? 0}
          gradient="linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)" sub={`${data?.completedThisMonth ?? 0} this month`} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
        
        {/* Status Pie */}
        <div className="card animate-enter stagger-5" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F2F4F7', marginBottom: 20, margin: 0 }}>Tasks by Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    dataKey="value" paddingAngle={4} stroke="none">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#B1B4BA'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#F2F4F7', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                {statusData.map((s) => (
                  <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#B1B4BA', fontWeight: 500 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.name], boxShadow: `0 0 8px ${STATUS_COLORS[s.name]}` }} />
                    {s.name} <span style={{ color: '#F2F4F7' }}>{s.value}</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B1B4BA', fontSize: 13 }}>No tasks yet</div>
          )}
        </div>

        {/* Priority Bar */}
        <div className="card animate-enter stagger-5" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F2F4F7', marginBottom: 20, margin: 0 }}>Tasks by Priority</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={236}>
              <BarChart data={priorityData} barSize={36} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#B1B4BA', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#B1B4BA', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, backdropFilter: 'blur(8px)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#B1B4BA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 236, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B1B4BA', fontSize: 13 }}>No tasks yet</div>
          )}
        </div>

        {/* My Tasks List */}
        <div className="card animate-enter stagger-5" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F2F4F7', marginBottom: 16, margin: 0 }}>My Open Tasks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.myTasks?.length > 0 ? (
              data.myTasks.map((task) => (
                <Link key={task._id} to={`/projects/${task.project}/tasks?task=${task._id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                    borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                    textDecoration: 'none', transition: 'background 150ms ease, transform 150ms ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Low,
                    boxShadow: `0 0 8px ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Low}`
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="line-clamp-2" style={{ margin: 0, fontSize: 14, color: '#F2F4F7', fontWeight: 500, lineHeight: 1.4 }}>{task.title}</p>
                    {task.dueDate && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: isPast(new Date(task.dueDate)) ? '#FF3F6D' : '#B1B4BA' }}>
                        Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={16} color="#B1B4BA" style={{ flexShrink: 0 }} />
                </Link>
              ))
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#B1B4BA', fontSize: 14 }}>
                No tasks assigned to you 🎉
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
