import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus, Loader2, GripVertical, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { setTasks, addTask, updateTask } from '../store/taskSlice';
import { getProjectTasks, updateTaskStatus, createTask } from '../api/tasks';
import * as projectApi from '../api/projects';
import Modal from '../components/Common/Modal';
import TaskForm from '../components/Tasks/TaskForm';
import { format, isPast } from 'date-fns';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'];
const COLUMN_STYLES = {
  'To Do': { bg: 'rgba(255,255,255,0.06)', color: '#B1B4BA', dot: '#B1B4BA' },
  'In Progress': { bg: 'rgba(43,140,220,0.15)', color: '#2B8CDC', dot: '#2B8CDC' },
  'In Review': { bg: 'rgba(255,162,0,0.15)', color: '#FFA200', dot: '#FFA200' },
  Done: { bg: 'rgba(0,213,176,0.15)', color: '#00D5B0', dot: '#00D5B0' },
};
const PRIORITY_COLORS = { Low: '#B1B4BA', Medium: '#2B8CDC', High: '#FFA200', Urgent: '#FF3F6D' };

function TaskCard({ task, isDragging = false }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
  
  return (
    <div className="card" style={{ 
      padding: '16px', 
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.6 : 1,
      transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
      boxShadow: isDragging ? '0 24px 48px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
      transition: isDragging ? 'none' : 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease, background 200ms ease',
      border: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      zIndex: isDragging ? 50 : 1
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <GripVertical size={16} color="#B1B4BA" style={{ marginTop: 2, flexShrink: 0, opacity: 0.5 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/tasks/${task._id}`} onClick={(e) => e.stopPropagation()}
            style={{ 
              fontSize: 14, fontWeight: 600, color: '#F2F4F7', 
              textDecoration: 'none', display: 'block', marginBottom: 8,
              lineHeight: 1.4
            }}
            className="line-clamp-2"
            onMouseEnter={(e) => e.target.style.color = '#00D5B0'}
            onMouseLeave={(e) => e.target.style.color = '#F2F4F7'}
          >
            {task.title}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ 
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, 
              color: PRIORITY_COLORS[task.priority] || '#B1B4BA', 
              background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[task.priority] || '#B1B4BA', boxShadow: `0 0 6px ${PRIORITY_COLORS[task.priority] || '#B1B4BA'}` }} />
              {task.priority}
            </span>
            {task.dueDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isOverdue ? '#FF3F6D' : '#B1B4BA', background: isOverdue ? 'rgba(255,63,109,0.1)' : 'transparent', padding: '2px 6px', borderRadius: 6 }}>
                <Calendar size={12} /> {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          {task.assignedTo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2F4F7', fontSize: 10, fontWeight: 700
              }}>
                {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
              </div>
              <span style={{ fontSize: 11, color: '#B1B4BA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.assignedTo.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id, data: { type: 'task', task } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

function Column({ status, tasks, onAdd }) {
  const style = COLUMN_STYLES[status];
  const colTasks = Array.isArray(tasks) ? tasks : [];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 300, flexShrink: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '12px 16px', borderRadius: 12, marginBottom: 16,
        background: style.bg, border: `1px solid ${style.bg.replace('0.15', '0.25')}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.dot, boxShadow: `0 0 8px ${style.dot}` }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: style.color }}>{status}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#F2F4F7', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 999 }}>
            {colTasks.length}
          </span>
        </div>
        <button onClick={() => onAdd(status)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: style.color, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Plus size={16} />
        </button>
      </div>
      <SortableContext items={colTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 200 }}>
          {colTasks.map(task => <SortableCard key={task._id} task={task} />)}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TaskBoard() {
  const { id: projectId } = useParams();
  const dispatch = useDispatch();
  const { tasks } = useSelector((s) => s.tasks);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('To Do');
  const [filters, setFilters] = useState({ priority: '', assignedTo: '', search: '' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    Promise.all([projectApi.getProject(projectId), getProjectTasks(projectId, { limit: 200 })])
      .then(([p, t]) => {
        setProject(p.data.project);
        setMembers(p.data.members);
        dispatch(setTasks(t.data.tasks));
      })
      .catch(() => toast.error('Failed to load board'))
      .finally(() => setLoading(false));
  }, [projectId, dispatch]);

  const tasksList = Array.isArray(tasks) ? tasks : [];
  const filtered = tasksList.filter(t => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignedTo && t.assignedTo?._id !== filters.assignedTo) return false;
    if (filters.search && t.title && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
  const byStatus = COLUMNS.reduce((a, c) => { a[c] = filtered.filter(t => t.status === c); return a; }, {});

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const dragged = tasksList.find(t => t._id === active.id);
    if (!dragged) return;
    let newStatus = null;
    for (const col of COLUMNS) {
      if (over.id === col || byStatus[col].some(t => t._id === over.id)) { newStatus = col; break; }
    }
    if (!newStatus || newStatus === dragged.status) return;
    dispatch(updateTask({ _id: dragged._id, status: newStatus }));
    try { await updateTaskStatus(dragged._id, newStatus); }
    catch { dispatch(updateTask({ _id: dragged._id, status: dragged.status })); toast.error('Failed to update'); }
  };

  const handleCreate = async (data) => {
    try {
      const res = await createTask({ ...data, project: projectId });
      dispatch(addTask(res.data.task));
      setShowCreate(false);
      toast.success('Task created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Loader2 size={32} color="#00D5B0" className="animate-spin" /></div>;

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexShrink: 0 }}>
        <div>
          <Link to={`/projects/${projectId}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, color: '#B1B4BA',
            textDecoration: 'none', fontSize: 13, marginBottom: 8, transition: 'color 150ms ease'
          }} onMouseEnter={(e) => e.target.style.color = '#F2F4F7'} onMouseLeave={(e) => e.target.style.color = '#B1B4BA'}>
            <ArrowLeft size={14} /> {project?.name}
          </Link>
          <h1 className="page-title">Task Board</h1>
        </div>
        <button onClick={() => { setDefaultStatus('To Do'); setShowCreate(true); }} className="btn btn-primary btn-md">
          <Plus size={18} /> Add Task
        </button>
      </div>

      <div className="card stagger-1" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexShrink: 0, flexWrap: 'wrap', padding: '16px 20px' }}>
        <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input" style={{ width: 200, padding: '8px 12px' }} placeholder="Search tasks…" />
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="input" style={{ width: 160, padding: '8px 12px', cursor: 'pointer' }}>
          <option value="" style={{ background: '#111827' }}>All priorities</option>
          {['Low','Medium','High','Urgent'].map(p => <option key={p} value={p} style={{ background: '#111827' }}>{p}</option>)}
        </select>
        <select value={filters.assignedTo} onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))} className="input" style={{ width: 180, padding: '8px 12px', cursor: 'pointer' }}>
          <option value="" style={{ background: '#111827' }}>All members</option>
          {members.map(m => <option key={m.user._id} value={m.user._id} style={{ background: '#111827' }}>{m.user.name}</option>)}
        </select>
        {(filters.search || filters.priority || filters.assignedTo) && (
          <button onClick={() => setFilters({ priority:'', assignedTo:'', search:'' })} className="btn btn-ghost btn-sm">Clear Filters</button>
        )}
      </div>

      <div className="stagger-2" style={{ flex: 1, overflowX: 'auto', paddingBottom: 24, paddingRight: 24 }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveTask(tasksList.find(t => t._id === active.id) || null)}
          onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 24, paddingBottom: 16 }}>
            {COLUMNS.map(col => <Column key={col} status={col} tasks={byStatus[col]} onAdd={(s) => { setDefaultStatus(s); setShowCreate(true); }} />)}
          </div>
          <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
        </DndContext>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task" size="lg">
        <TaskForm projectId={projectId} members={members} defaultStatus={defaultStatus}
          onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
