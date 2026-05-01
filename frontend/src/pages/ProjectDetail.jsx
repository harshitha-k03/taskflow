import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Plus, Users, LayoutKanban, Trash2, UserPlus,
  Crown, UserMinus, Edit, Loader2, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as projectApi from '../api/projects';
import { getProjectTasks } from '../api/tasks';
import Modal from '../components/Common/Modal';
import ProjectForm from '../components/Projects/ProjectForm';
import { format } from 'date-fns';

const STATUS_BADGE = {
  Active: 'bg-green-900/40 text-green-300',
  'On Hold': 'bg-yellow-900/40 text-yellow-300',
  Completed: 'bg-blue-900/40 text-blue-300',
  Archived: 'bg-gray-800 text-gray-400',
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
    if (!confirm('Remove this member from the project?')) return;
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
    <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
  );
  if (!project) return (
    <div className="text-center py-20"><p className="text-gray-400">Project not found</p></div>
  );

  const totalTasks = analytics?.total || 0;
  const doneTasks = analytics?.tasksByStatus?.Done || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div>
        <Link to="/projects" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${project.color || '#6366f1'}25`, border: `1px solid ${project.color || '#6366f1'}40` }}>
              <div className="w-5 h-5 rounded-full" style={{ background: project.color || '#6366f1' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <span className={`badge ${STATUS_BADGE[project.status]}`}>{project.status}</span>
              </div>
              <p className="text-gray-400 text-sm mt-0.5">{project.description || 'No description'}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {myRole === 'Admin' && (
              <button onClick={() => setShowEdit(true)} className="btn-secondary btn-sm">
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <Link to={`/projects/${id}/board`} className="btn-primary btn-sm">
              <LayoutKanban className="w-3.5 h-3.5" /> Open Board
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: totalTasks },
          { label: 'Completed', value: doneTasks },
          { label: 'Overdue', value: analytics?.overdue || 0, red: true },
          { label: 'Team Members', value: members.length },
        ].map(({ label, value, red }) => (
          <div key={label} className="card p-4">
            <p className={`text-2xl font-bold ${red && value > 0 ? 'text-red-400' : 'text-white'}`}>{value}</p>
            <p className="text-gray-400 text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Overall Progress</span>
          <span className="text-sm font-bold text-primary-400">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-600 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
          <span>{doneTasks} done</span>
          <span>{totalTasks - doneTasks} remaining</span>
        </div>
      </div>

      {/* Team Members */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-400" /> Team Members
          </h2>
          {myRole === 'Admin' && (
            <button onClick={() => setShowAddMember(true)} className="btn-secondary btn-sm">
              <UserPlus className="w-3.5 h-3.5" /> Add Member
            </button>
          )}
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div key={member._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {member.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{member.user?.name}</p>
                <p className="text-xs text-gray-500">{member.user?.email}</p>
              </div>
              {member.role === 'Admin' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
              {myRole === 'Admin' && member.user?._id !== user?._id && (
                <div className="flex items-center gap-2">
                  <select value={member.role}
                    onChange={(e) => handleRoleChange(member._id, member.user._id, e.target.value)}
                    className="input py-1 px-2 text-xs w-28">
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                  <button onClick={() => handleRemoveMember(member._id, member.user._id)}
                    className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {member.user?._id === user?._id && (
                <span className="badge bg-primary-900/40 text-primary-300 text-xs">You</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Recent Tasks</h2>
          <Link to={`/projects/${id}/board`} className="text-xs text-primary-400 hover:text-primary-300">
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 6).map((task) => (
            <Link key={task._id} to={`/tasks/${task._id}`}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800 transition-colors group">
              <span className={`badge text-xs flex-shrink-0 ${
                task.status === 'Done' ? 'badge-done' :
                task.status === 'In Progress' ? 'badge-inprogress' :
                task.status === 'In Review' ? 'badge-inreview' : 'badge-todo'
              }`}>{task.status}</span>
              <span className="text-sm text-gray-200 group-hover:text-white flex-1 truncate">{task.title}</span>
              {task.assignedTo && (
                <span className="text-xs text-gray-500 flex-shrink-0">{task.assignedTo.name}</span>
              )}
            </Link>
          ))}
          {tasks.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No tasks yet. Open the board to create tasks.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <ProjectForm initialData={project} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>

      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="form-group">
            <label className="label">Email address</label>
            <input type="email" required value={addMemberEmail}
              onChange={(e) => setAddMemberEmail(e.target.value)}
              className="input" placeholder="teammate@example.com" />
          </div>
          <div className="form-group">
            <label className="label">Role</label>
            <select value={addMemberRole} onChange={(e) => setAddMemberRole(e.target.value)} className="input">
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addingMember} className="btn-primary flex-1">
              {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
