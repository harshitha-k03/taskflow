import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Edit, Trash2, Calendar, User, Flag, Clock,
  MessageSquare, Loader2, Send, Tag, ChevronRight, CheckCircle, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { updateTask, removeTask } from '../store/taskSlice';
import { getTask, updateTask as updateTaskApi, deleteTask, addComment } from '../api/tasks';
import * as projectApi from '../api/projects';
import Modal from '../components/Common/Modal';
import TaskForm from '../components/Tasks/TaskForm';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const STATUS_BADGE = {
  'To Do': { bg: 'rgba(255,255,255,0.06)', color: '#B1B4BA', border: 'rgba(255,255,255,0.1)' },
  'In Progress': { bg: 'rgba(43,140,220,0.15)', color: '#2B8CDC', border: 'rgba(43,140,220,0.25)' },
  'In Review': { bg: 'rgba(255,162,0,0.15)', color: '#FFA200', border: 'rgba(255,162,0,0.25)' },
  Done: { bg: 'rgba(0,213,176,0.15)', color: '#00D5B0', border: 'rgba(0,213,176,0.25)' },
};

const PRIORITY_BADGE = {
  Low: { bg: 'rgba(255,255,255,0.06)', color: '#B1B4BA', border: 'rgba(255,255,255,0.1)' },
  Medium: { bg: 'rgba(43,140,220,0.15)', color: '#2B8CDC', border: 'rgba(43,140,220,0.25)' },
  High: { bg: 'rgba(255,162,0,0.15)', color: '#FFA200', border: 'rgba(255,162,0,0.25)' },
  Urgent: { bg: 'rgba(255,63,109,0.15)', color: '#FF3F6D', border: 'rgba(255,63,109,0.25)' },
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    getTask(id)
      .then(async (res) => {
        setTask(res.data.task);
        setComments(res.data.comments || []);
        if (res.data.task?.project?._id) {
          const projRes = await projectApi.getProject(res.data.task.project._id);
          setMembers(projRes.data.members);
        }
      })
      .catch(() => toast.error('Task not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (data) => {
    try {
      const res = await updateTaskApi(id, data);
      setTask(res.data.task);
      dispatch(updateTask(res.data.task));
      setShowEdit(false);
      toast.success('Task updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await deleteTask(id);
      dispatch(removeTask(id));
      toast.success('Task deleted');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await addComment(id, commentText.trim());
      setComments((c) => [...c, res.data.comment]);
      setCommentText('');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Loader2 size={32} color="#00D5B0" className="animate-spin" /></div>;
  if (!task) return <div style={{ textAlign: 'center', padding: '80px 0', color: '#B1B4BA' }}>Task not found</div>;

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
  const statusStyle = STATUS_BADGE[task.status] || STATUS_BADGE['To Do'];
  const priorityStyle = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.Low;

  return (
    <div className="page-enter max-w-6xl mx-auto flex flex-col gap-lg pb-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-600 font-medium text-body-sm transition-colors w-fit">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-3">
          <button onClick={() => setShowEdit(true)} className="btn-secondary">
            <Edit size={16} /> Edit Task
          </button>
          <button onClick={handleDelete} className="btn-danger">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          <div className="card">
            <div className="mb-6">
              {task.project && (
                <Link to={`/projects/${task.project._id}/board`} className="text-[11px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 mb-2">
                  {task.project.name} <ChevronRight size={12} />
                </Link>
              )}
              <h1 className="text-display leading-tight">{task.title}</h1>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <span className="badge px-3 py-1" style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}>
                {task.status}
              </span>
              <span className="badge px-3 py-1" style={{ background: priorityStyle.bg, color: priorityStyle.color, borderColor: priorityStyle.border }}>
                <Flag size={12} className="mr-1" /> {task.priority}
              </span>
              {task.labels?.map(label => (
                <span key={label} className="badge bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                  <Tag size={12} /> {label}
                </span>
              ))}
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <h4 className="text-body font-bold mb-3">Description</h4>
              <div className="text-neutral-700 dark:text-neutral-300 text-body-sm leading-relaxed bg-neutral-50 dark:bg-neutral-800/50 p-lg rounded-xl border border-neutral-100 dark:border-neutral-800 min-h-[120px] whitespace-pre-wrap">
                {task.description || <span className="text-neutral-400 italic font-medium">No description provided for this task.</span>}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="card">
            <h3 className="text-h3 font-bold mb-8 flex items-center gap-2">
              <MessageSquare size={20} className="text-primary-500" /> Discussion
              <span className="ml-2 text-label bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full font-bold">
                {comments.length}
              </span>
            </h3>

            <div className="space-y-6 mb-8">
              {comments.length === 0 ? (
                <div className="text-center py-10 bg-neutral-50 dark:bg-neutral-800/30 rounded-xl border-2 border-dashed border-neutral-100 dark:border-neutral-800">
                  <p className="text-body-sm text-neutral-400 font-medium">No comments yet. Start the conversation!</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm">
                      {c.author?.name ? c.author.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-body-sm font-bold text-neutral-900 dark:text-neutral-100">{c.author?.name}</h4>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl rounded-tl-none border border-neutral-100 dark:border-neutral-700 text-body-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap shadow-sm">
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment} className="mt-8 flex gap-4 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm hidden sm:flex">
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1 flex gap-2">
                <input 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)}
                  className="bg-transparent border-none outline-none text-body-sm w-full font-medium px-2" 
                  placeholder="Share your thoughts..." 
                />
                <button 
                  type="submit" 
                  disabled={submittingComment || !commentText.trim()} 
                  className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-lg">
          <div className="card">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-6">Task Information</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mb-1">Assignee</p>
                  {task.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-[10px] font-black">
                        {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <span className="text-body-sm font-bold text-neutral-900 dark:text-neutral-100">{task.assignedTo.name}</span>
                    </div>
                  ) : <span className="text-body-sm font-bold text-neutral-400 italic">Unassigned</span>}
                </div>
              </div>

              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-error-50 dark:bg-error-900/20 text-error-500' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mb-1">Due Date</p>
                  {task.dueDate ? (
                    <p className={`text-body-sm font-bold ${isOverdue ? 'text-error-600 dark:text-error-400 underline decoration-wavy decoration-error-500/50' : 'text-neutral-900 dark:text-neutral-100'}`}>
                      {format(new Date(task.dueDate), 'MMMM do, yyyy')}
                      {isOverdue && <span className="block text-[10px] font-black text-error-500 uppercase mt-0.5 tracking-wider">Overdue</span>}
                    </p>
                  ) : <span className="text-body-sm font-bold text-neutral-400">No deadline</span>}
                </div>
              </div>

              {task.completedAt && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center text-success-500 shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mb-1">Completed On</p>
                    <p className="text-body-sm font-bold text-success-600 dark:text-success-400">{format(new Date(task.completedAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center text-neutral-400 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mb-1">Creator</p>
                  <p className="text-body-sm font-bold text-neutral-900 dark:text-neutral-100">{task.createdBy?.name || 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <span>Created</span>
                <span className="text-neutral-500">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <span>Last Update</span>
                <span className="text-neutral-500">{formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showEdit} onClose={() => setShowEdit(false)} title="Edit Task Information">
        <TaskForm projectId={task.project?._id} members={members} initialData={task} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
