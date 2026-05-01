import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus, Loader2, GripVertical, Calendar, Search, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { setTasks, addTask, updateTask } from '../store/taskSlice';
import { getProjectTasks, updateTaskStatus, createTask } from '../api/tasks';
import * as projectApi from '../api/projects';
import Modal from '../components/Common/Modal';
import TaskForm from '../components/Tasks/TaskForm';
import { format, isPast } from 'date-fns';

const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITY_COLORS = { Low: '#9ca3af', Medium: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444' };

function TaskCard({ task, isDragging = false, dragListeners, dragAttributes }) {
  const navigate = useNavigate();
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
  
  return (
    <div 
      onClick={() => navigate(`/tasks/${task._id}`)}
      className={`card mb-3 !p-4 cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors ${isDragging ? 'opacity-50 scale-105 ring-2 ring-primary-500 shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div 
          {...dragAttributes} 
          {...dragListeners} 
          onClick={(e) => e.stopPropagation()} 
          className="mt-1 flex-shrink-0 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-body-sm font-bold text-neutral-900 dark:text-neutral-50 block mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
            {task.title}
          </h4>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="badge" style={{ background: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority] }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[task.priority] }} />
              {task.priority}
            </span>
            {task.labels && task.labels.map(label => (
              <span key={label} className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {label}
              </span>
            ))}
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[11px] font-semibold ${isOverdue ? 'text-error-600 dark:text-error-400' : 'text-neutral-500'}`}>
                <Calendar size={12} /> {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>
          {task.assignedTo && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold">
                {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
              </div>
              <span className="text-[11px] text-neutral-500 font-medium truncate">
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
  const style = { transform: CSS.Translate.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard task={task} isDragging={isDragging} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}

function Column({ status, tasks, onAdd }) {
  const colTasks = Array.isArray(tasks) ? tasks : [];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col w-80 flex-shrink-0 bg-neutral-50 dark:bg-neutral-950/50 rounded-xl p-md border transition-colors ${
        isOver ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <div className="flex items-center justify-between mb-lg px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-body font-bold text-neutral-900 dark:text-neutral-50">{status}</h3>
          <span className="text-[11px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full">
            {colTasks.length}
          </span>
        </div>
        <button 
          onClick={() => onAdd(status)} 
          className="p-1 hover:bg-white dark:hover:bg-neutral-800 rounded-md transition-all text-neutral-400 hover:text-primary-500 shadow-sm border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
        >
          <Plus size={18} />
        </button>
      </div>
      <SortableContext items={colTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col flex-1 min-h-[200px]">
          {colTasks.map(task => <SortableCard key={task._id} task={task} />)}
          {colTasks.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg py-12 opacity-40">
              <CheckSquare size={32} className="text-neutral-400 mb-2" />
              <p className="text-[11px] font-medium">Empty column</p>
            </div>
          )}
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
    // Clear stale tasks from previous project before loading
    dispatch(setTasks([]));
    setLoading(true);
    Promise.all([projectApi.getProject(projectId), getProjectTasks(projectId, { limit: 200 })])
      .then(([p, t]) => {
        setProject(p.data.project);
        setMembers(p.data.members || []);
        dispatch(setTasks(t.data.tasks || []));
      })
      .catch(() => toast.error('Failed to load board'))
      .finally(() => setLoading(false));
    // Clear tasks when leaving the board
    return () => dispatch(setTasks([]));
  }, [projectId, dispatch]);

  const tasksList = Array.isArray(tasks) ? tasks : [];
  const filtered = tasksList.filter(t => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignedTo && t.assignedTo?._id !== filters.assignedTo) return false;
    if (filters.search && t.title && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
  const byStatus = COLUMNS.reduce((a, c) => { 
    a[c] = filtered.filter(t => t.status === c); 
    return a; 
  }, {});

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

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 size={40} className="animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="page-enter flex flex-col h-full gap-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link 
            to={`/projects/${projectId}`} 
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-600 font-medium text-body-sm transition-colors mb-2"
          >
            <ArrowLeft size={16} /> {project?.name}
          </Link>
          <h1 className="text-display leading-none">Task Board</h1>
        </div>
        <button 
          onClick={() => { setDefaultStatus('To Do'); setShowCreate(true); }} 
          className="btn-primary shadow-lg shadow-primary-500/20"
        >
          <Plus size={20} /> Add Task
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-md bg-white dark:bg-neutral-900 p-md rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-md p-2">
            <Search size={18} className="text-neutral-500" />
          </div>
          <input 
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search tasks..."
            className="bg-transparent border-none outline-none text-body-sm w-full font-medium"
          />
        </div>
        
        <div className="flex items-center gap-md flex-wrap">
          <select 
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            className="bg-neutral-50 dark:bg-neutral-800 border-none rounded-md px-3 py-2 text-body-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">All Priorities</option>
            {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            value={filters.assignedTo}
            onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))}
            className="bg-neutral-50 dark:bg-neutral-800 border-none rounded-md px-3 py-2 text-body-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">All Assignees</option>
            {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
          </select>

          {(filters.priority || filters.assignedTo || filters.search) && (
            <button 
              onClick={() => setFilters({ priority: '', assignedTo: '', search: '' })}
              className="text-body-sm font-bold text-primary-600 hover:text-primary-700 underline px-2 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Board Scrollable Area */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd} onDragStart={({ active }) => setActiveTask(tasksList.find(t => t._id === active.id) || null)}>
          <div className="flex gap-lg h-full min-h-[500px]">
            {COLUMNS.map(col => <Column key={col} status={col} tasks={byStatus[col]} onAdd={(s) => { setDefaultStatus(s); setShowCreate(true); }} />)}
          </div>
          <DragOverlay>
            {activeTask ? <div className="w-80 rotate-2"><TaskCard task={activeTask} isDragging /></div> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="Create New Task">
        <TaskForm members={members} defaultStatus={defaultStatus} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
