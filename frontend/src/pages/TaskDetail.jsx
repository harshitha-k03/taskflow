import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Edit, Trash2, Calendar, User, Flag, Clock,
  MessageSquare, Loader2, Send, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateTask, removeTask } from '../store/taskSlice';
import { getTask, updateTask as updateTaskApi, deleteTask, addComment } from '../api/tasks';
import * as projectApi from '../api/projects';
import Modal from '../components/Common/Modal';
import TaskForm from '../components/Tasks/TaskForm';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const STATUS_STYLES = {
  'To Do': 'badge-todo', 'In Progress': 'badge-inprogress',
  'In Review': 'badge-inreview', Done: 'badge-done',
};
const PRIORITY_STYLES = {
  Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Urgent: 'badge-urgent',
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
    if (!confirm('Delete this task permanently?')) return;
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>;
  if (!task) return <div className="text-center py-20 text-gray-400">Task not found</div>;

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => setShowEdit(true)} className="btn-secondary btn-sm">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={handleDelete} className="btn-danger btn-sm">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white leading-tight">{task.title}</h1>
                {task.project && (
                  <Link to={`/projects/${task.project._id}/board`}
                    className="text-sm text-primary-400 hover:text-primary-300 mt-1 inline-block transition-colors">
                    {task.project.name}
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className={`badge ${STATUS_STYLES[task.status]}`}>{task.status}</span>
              <span className={`badge ${PRIORITY_STYLES[task.priority]}`}>
                <Flag className="w-3 h-3 mr-1" />{task.priority}
              </span>
              {task.labels?.map(label => (
                <span key={label} className="badge bg-primary-900/30 text-primary-300">
                  <Tag className="w-3 h-3 mr-1" />{label}
                </span>
              ))}
            </div>

            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {task.description || <span className="text-gray-500 italic">No description provided.</span>}
              </p>
            </div>
          </div>

          {/* Comments */}
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-400" />
              Comments <span className="text-gray-500 font-normal text-sm">({comments.length})</span>
            </h3>

            <div className="space-y-4 mb-5">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.author?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{c.author?.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 relative">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  className="input pr-10" placeholder="Add a comment…" />
                <button type="submit" disabled={submittingComment || !commentText.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-300 disabled:opacity-30">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white mb-2">Details</h3>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Assigned to</p>
                {task.assignedTo ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                      {task.assignedTo.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-200">{task.assignedTo.name}</span>
                  </div>
                ) : <p className="text-sm text-gray-400">Unassigned</p>}
              </div>
            </div>

            {task.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 flex-shrink-0 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-xs text-gray-500">Due date</p>
                  <p className={`text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-gray-200'}`}>
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    {isOverdue && ' (Overdue)'}
                  </p>
                </div>
              </div>
            )}

            {task.completedAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-sm text-green-300">{format(new Date(task.completedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Created by</p>
                <p className="text-sm text-gray-200">{task.createdBy?.name}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500">Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>
              <p className="text-xs text-gray-500">Updated {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Task" size="lg">
        <TaskForm
          projectId={task.project?._id}
          members={members}
          initialData={task}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
}
