import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Users, Kanban, Trash2, UserPlus,
  Crown, UserMinus, Edit, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as projectApi from '../api/projects';
import { getProjectTasks } from '../api/tasks';
import Modal from '../components/Common/Modal';
import ProjectForm from '../components/Projects/ProjectForm';
import { format } from 'date-fns';

const STATUS_BADGE = {
  Active: { bg: 'rgba(0,213,176,0.15)', color: '#00D5B0', border: 'rgba(0,213,176,0.25)' },
  'On Hold': { bg: 'rgba(255,162,0,0.15)', color: '#FFA200', border: 'rgba(255,162,0,0.25)' },
  Completed: { bg: 'rgba(43,140,220,0.15)', color: '#2B8CDC', border: 'rgba(43,140,220,0.25)' },
  Archived: { bg: 'rgba(255,255,255,0.06)', color: '#B1B4BA', border: 'rgba(255,255,255,0.1)' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('Member');
  const [addingMember, setAddingMember] = useState(false);

  const fetchAll = async () => {
    try {
      const [projRes, taskRes, analyticsRes] = await Promise.all([
        projectApi.getProject(id),
        getProjectTasks(id, { limit: 100 }),
        projectApi.getProjectAnalytics(id),
      ]);
      setProject(projRes.data.project);
      setMembers(projRes.data.members);
      setMyRole(projRes.data.myRole);
      setTasks(taskRes.data.tasks);
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleUpdate = async (data) => {
    try {
      const res = await projectApi.updateProject(id, data);
      setProject(res.data.project);
      setShowEdit(false);
      toast.success('Project updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      const res = await projectApi.addMember(id, { email: addMemberEmail, role: addMemberRole });
      setMembers((m) => [...m, res.data.member]);
      setAddMemberEmail('');
      setShowAddMember(false);
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId, memberUserId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await projectApi.removeMember(id, memberUserId);
      setMembers((m) => m.filter((mem) => mem._id !== memberId));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleRoleChange = async (memberId, memberUserId, newRole) => {
    try {
      const res = await projectApi.updateMemberRole(id, memberUserId, newRole);
      setMembers((m) => m.map((mem) => mem._id === memberId ? res.data.member : mem));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <Loader2 size={32} color="#00D5B0" className="animate-spin" />
    </div>
  );
  if (!project) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#B1B4BA' }}>Project not found</div>
  );

  const totalTasks = analytics?.total || 0;
  const doneTasks = analytics?.tasksByStatus?.Done || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const statusStyle = STATUS_BADGE[project.status] || STATUS_BADGE.Archived;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back + Header */}
      <div className="animate-enter">
        <Link to="/projects" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, color: '#B1B4BA',
          textDecoration: 'none', fontSize: 14, marginBottom: 20, transition: 'color 150ms ease'
        }} onMouseEnter={(e) => e.target.style.color = '#F2F4F7'} onMouseLeave={(e) => e.target.style.color = '#B1B4BA'}>
          <ArrowLeft size={16} /> Back to Projects
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${project.color || '#2B8CDC'}20`,
              boxShadow: `0 0 0 1px ${project.color || '#2B8CDC'}40`
            }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: project.color || '#2B8CDC' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 className="page-title">{project.name}</h1>
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                  {project.status}
                </div>
              </div>
              <p style={{ color: '#B1B4BA', fontSize: 14, margin: '4px 0 0', maxWidth: 600 }}>{project.description || 'No description'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {myRole === 'Admin' && (
              <button onClick={() => setShowEdit(true)} className="btn btn-secondary btn-sm">
                <Edit size={16} /> Edit
              </button>
            )}
            <Link to={`/projects/${id}/board`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              <Kanban size={16} /> Open Board
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {[
          { label: 'Total Tasks', value: totalTasks },
          { label: 'Completed', value: doneTasks },
          { label: 'Overdue', value: analytics?.overdue || 0, red: true },
          { label: 'Team Members', value: members.length },
        ].map(({ label, value, red }, i) => (
          <div key={label} className={`card animate-enter stagger-${(i % 5) + 1}`} style={{ padding: 20 }}>
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: red && value > 0 ? '#FF3F6D' : '#F2F4F7' }}>{value}</p>
            <p style={{ fontSize: 13, color: '#B1B4BA', margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Progress bar */}
          <div className="card animate-enter stagger-5" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F2F4F7' }}>Overall Progress</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#00D5B0' }}>{progress}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(96.54deg, #2B8CDC 5.62%, #00D5B0 91.41%)',
                transition: 'width 700ms cubic-bezier(0.23, 1, 0.32, 1)'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#B1B4BA', marginTop: 8 }}>
              <span>{doneTasks} done</span>
              <span>{totalTasks - doneTasks} remaining</span>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="card animate-enter stagger-5" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F2F4F7', margin: 0 }}>Recent Tasks</h2>
              <Link to={`/projects/${id}/board`} style={{ fontSize: 12, color: '#00D5B0', textDecoration: 'none', fontWeight: 500 }}>
                View all →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.slice(0, 6).map((task) => (
                <Link key={task._id} to={`/projects/${id}/board?task=${task._id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                    borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                    textDecoration: 'none', transition: 'background 150ms ease, transform 150ms ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <span className={`badge ${
                    task.status === 'Done' ? 'badge-done' :
                    task.status === 'In Progress' ? 'badge-inprogress' :
                    task.status === 'In Review' ? 'badge-inreview' : 'badge-todo'
                  }`}>{task.status}</span>
                  <span className="line-clamp-2" style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 13, color: '#F2F4F7', fontWeight: 500 }}>{task.title}</span>
                  {task.assignedTo && (
                    <span style={{ fontSize: 11, color: '#B1B4BA', flexShrink: 0 }}>{task.assignedTo.name}</span>
                  )}
                </Link>
              ))}
              {tasks.length === 0 && (
                <p style={{ color: '#B1B4BA', fontSize: 13, textAlign: 'center', padding: '24px 0', margin: 0 }}>No tasks yet. Open the board to create tasks.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Team Members */}
        <div className="card animate-enter stagger-5" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F2F4F7', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="#00D5B0" /> Team Members
            </h2>
            {myRole === 'Admin' && (
              <button onClick={() => setShowAddMember(true)} className="btn btn-secondary btn-sm">
                <UserPlus size={16} /> Add Member
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map((member) => (
              <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2B8CDC 0%, #1a5c96 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F2F4F7', fontSize: 13, fontWeight: 700, flexShrink: 0
                }}>
                  {member.user?.name ? member.user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F2F4F7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.user?.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#B1B4BA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.user?.email}
                  </p>
                </div>
                
                {member.role === 'Admin' && <Crown size={16} color="#FFA200" />}
                
                {myRole === 'Admin' && member.user?._id !== user?._id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={member.role}
                      onChange={(e) => handleRoleChange(member._id, member.user._id, e.target.value)}
                      className="input" style={{ padding: '6px 10px', fontSize: 12, width: 90, height: 'auto', background: 'rgba(255,255,255,0.06)' }}>
                      <option value="Admin" style={{ background: '#111827' }}>Admin</option>
                      <option value="Member" style={{ background: '#111827' }}>Member</option>
                    </select>
                    <button onClick={() => handleRemoveMember(member._id, member.user._id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#FF3F6D', borderRadius: 6 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,63,109,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <UserMinus size={16} />
                    </button>
                  </div>
                )}
                {member.user?._id === user?._id && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#00D5B0', padding: '2px 8px', background: 'rgba(0,213,176,0.15)', borderRadius: 6, border: '1px solid rgba(0,213,176,0.25)' }}>
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <ProjectForm initialData={project} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>

      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">Email address</label>
            <input type="email" required value={addMemberEmail}
              onChange={(e) => setAddMemberEmail(e.target.value)}
              className="input" placeholder="teammate@example.com" />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select value={addMemberRole} onChange={(e) => setAddMemberRole(e.target.value)} className="input" style={{ cursor: 'pointer' }}>
              <option value="Member" style={{ background: '#111827' }}>Member</option>
              <option value="Admin" style={{ background: '#111827' }}>Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => setShowAddMember(false)} className="btn btn-secondary btn-md" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={addingMember} className="btn btn-primary btn-md" style={{ flex: 1 }}>
              {addingMember ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
