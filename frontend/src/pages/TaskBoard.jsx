import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  'To Do': { header: 'bg-gray-800/80 text-gray-300', dot: 'bg-gray-400' },
  'In Progress': { header: 'bg-blue-900/40 text-blue-300', dot: 'bg-blue-400' },
  'In Review': { header: 'bg-yellow-900/40 text-yellow-300', dot: 'bg-yellow-400' },
  Done: { header: 'bg-green-900/40 text-green-300', dot: 'bg-green-400' },
};
const PRIORITY_COLORS = { Low: 'bg-gray-600', Medium: 'bg-blue-500', High: 'bg-orange-500', Urgent: 'bg-red-500' };

function TaskCard({ task, isDragging = false }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
  return (
    <div className={`card p-3 cursor-grab active:cursor-grabbing hover:border-gray-700 transition-all ${isDragging ? 'opacity-50 rotate-1 shadow-2xl' : 'hover:shadow-md'}`}>
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Link to={`/tasks/${task._id}`} onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-gray-200 hover:text-white line-clamp-2 leading-snug block">
            {task.title}
          </Link>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
            <span className="text-xs text-gray-500">{task.priority}</span>
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                <Calendar className="w-3 h-3" />{format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          {task.assignedTo && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-500 truncate">{task.assignedTo.name}</span>
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
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 ${style.header}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className="text-sm font-medium">{status}</span>
          <span className="text-xs opacity-70 bg-black/20 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button onClick={() => onAdd(status)} className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1 min-h-48 p-1">
          {tasks.map(task => <SortableCard key={task._id} task={task} />)}
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

  const filtered = tasks.filter(t => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignedTo && t.assignedTo?._id !== filters.assignedTo) return false;
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
  const byStatus = COLUMNS.reduce((a, c) => { a[c] = filtered.filter(t => t.status === c); return a; }, {});

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const dragged = tasks.find(t => t._id === active.id);
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <Link to={`/projects/${projectId}`} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {project?.name}
          </Link>
          <h1 className="text-xl font-bold text-white">Task Board</h1>
        </div>
        <button onClick={() => { setDefaultStatus('To Do'); setShowCreate(true); }} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-shrink-0 flex-wrap">
        <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input w-48 py-1.5 text-sm" placeholder="Search tasks…" />
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="input w-36 py-1.5 text-sm">
          <option value="">All priorities</option>
          {['Low','Medium','High','Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.assignedTo} onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))} className="input w-40 py-1.5 text-sm">
          <option value="">All members</option>
          {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
        </select>
        {(filters.search || filters.priority || filters.assignedTo) && (
          <button onClick={() => setFilters({ priority:'', assignedTo:'', search:'' })} className="btn-ghost btn-sm text-xs">Clear</button>
        )}
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveTask(tasks.find(t => t._id === active.id) || null)}
          onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {COLUMNS.map(col => <Column key={col} status={col} tasks={byStatus[col]} onAdd={(s) => { setDefaultStatus(s); setShowCreate(true); }} />)}
          </div>
          <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task" size="lg">
        <TaskForm projectId={projectId} members={members} defaultStatus={defaultStatus}
          onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
