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
    <div className="animate-enter" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none',
          color: '#B1B4BA', cursor: 'pointer', fontSize: 14, transition: 'color 150ms ease'
        }} onMouseEnter={(e) => e.currentTarget.style.color = '#F2F4F7'} onMouseLeave={(e) => e.currentTarget.style.color = '#B1B4BA'}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowEdit(true)} className="btn btn-secondary btn-sm">
            <Edit size={16} /> Edit
          </button>
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2' }}>
          <div className="card stagger-1" style={{ padding: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F2F4F7', margin: '0 0 8px 0', lineHeight: 1.3 }}>{task.title}</h1>
            {task.project && (
              <Link to={`/projects/${task.project._id}/board`} style={{
                fontSize: 14, color: '#00D5B0', textDecoration: 'none', display: 'inline-block', marginBottom: 24
              }}>
                {task.project.name}
              </Link>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                {task.status}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: priorityStyle.bg, color: priorityStyle.color, border: `1px solid ${priorityStyle.border}` }}>
                <Flag size={12} /> {task.priority}
              </span>
              {task.labels?.map(label => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(43,140,220,0.1)', color: '#2B8CDC', border: '1px solid rgba(43,140,220,0.2)' }}>
                  <Tag size={12} /> {label}
                </span>
              ))}
            </div>

            <div style={{ color: '#F2F4F7', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {task.description || <span style={{ color: '#B1B4BA', fontStyle: 'italic' }}>No description provided.</span>}
            </div>
          </div>

          {/* Comments */}
          <div className="card stagger-2" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F2F4F7', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} color="#00D5B0" /> Comments <span style={{ color: '#B1B4BA', fontWeight: 400 }}>({comments.length})</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {comments.length === 0 ? (
                <p style={{ color: '#B1B4BA', fontSize: 14, margin: 0 }}>No comments yet. Be the first!</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2F4F7', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {c.author?.name ? c.author.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#F2F4F7' }}>{c.author?.name}</span>
                        <span style={{ fontSize: 12, color: '#B1B4BA' }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: '#F2F4F7', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2F4F7', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  className="input" style={{ paddingRight: 44, height: 40 }} placeholder="Add a comment…" />
                <button type="submit" disabled={submittingComment || !commentText.trim()} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: submittingComment || !commentText.trim() ? 'not-allowed' : 'pointer',
                  color: submittingComment || !commentText.trim() ? '#B1B4BA' : '#00D5B0', display: 'flex', alignItems: 'center', padding: 4
                }}>
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Details */}
        <div className="card stagger-3" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#F2F4F7', margin: 0 }}>Details</h3>

          <div style={{ display: 'flex', gap: 12 }}>
            <User size={18} color="#B1B4BA" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 12, color: '#B1B4BA', margin: '0 0 4px 0' }}>Assigned to</p>
              {task.assignedTo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2F4F7', fontSize: 10, fontWeight: 700 }}>
                    {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <span style={{ fontSize: 14, color: '#F2F4F7', fontWeight: 500 }}>{task.assignedTo.name}</span>
                </div>
              ) : <p style={{ fontSize: 14, color: '#B1B4BA', margin: 0 }}>Unassigned</p>}
            </div>
          </div>

          {task.dueDate && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Calendar size={18} color={isOverdue ? '#FF3F6D' : '#B1B4BA'} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 12, color: '#B1B4BA', margin: '0 0 4px 0' }}>Due date</p>
                <p style={{ fontSize: 14, color: isOverdue ? '#FF3F6D' : '#F2F4F7', fontWeight: 500, margin: 0 }}>
                  {format(new Date(task.dueDate), 'MMM d, yyyy')} {isOverdue && '(Overdue)'}
                </p>
              </div>
            </div>
          )}

          {task.completedAt && (
            <div style={{ display: 'flex', gap: 12 }}>
              <Clock size={18} color="#00D5B0" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 12, color: '#B1B4BA', margin: '0 0 4px 0' }}>Completed</p>
                <p style={{ fontSize: 14, color: '#00D5B0', fontWeight: 500, margin: 0 }}>{format(new Date(task.completedAt), 'MMM d, yyyy')}</p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <User size={18} color="#B1B4BA" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 12, color: '#B1B4BA', margin: '0 0 4px 0' }}>Created by</p>
              <p style={{ fontSize: 14, color: '#F2F4F7', fontWeight: 500, margin: 0 }}>{task.createdBy?.name}</p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 4 }}>
            <p style={{ fontSize: 12, color: '#B1B4BA', margin: '0 0 4px 0' }}>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>
            <p style={{ fontSize: 12, color: '#B1B4BA', margin: 0 }}>Updated {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</p>
          </div>
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Task" size="lg">
        <TaskForm projectId={task.project?._id} members={members} initialData={task} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>
    </div>
  );
}
