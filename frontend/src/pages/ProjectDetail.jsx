import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft, Users, Kanban, Trash2, UserPlus, FolderKanban, TrendingUp,
  Crown, UserMinus, Edit, Loader2, CheckCircle, Clock, AlertCircle, ChevronRight, Mail, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import * as projectApi from '../api/projects';
import { getProjectTasks } from '../api/tasks';
import Modal from '../components/Common/Modal';
import ProjectForm from '../components/Projects/ProjectForm';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  Active: { color: 'text-success-600', bg: 'bg-success-100', darkText: 'dark:text-success-400', darkBg: 'dark:bg-success-900/30' },
  'On Hold': { color: 'text-warning-600', bg: 'bg-warning-100', darkText: 'dark:text-warning-400', darkBg: 'dark:bg-warning-900/30' },
  Completed: { color: 'text-primary-600', bg: 'bg-primary-100', darkText: 'dark:text-primary-400', darkBg: 'dark:bg-primary-900/30' },
  Archived: { color: 'text-neutral-600', bg: 'bg-neutral-100', darkText: 'dark:text-neutral-400', darkBg: 'dark:bg-neutral-800' },
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
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 size={40} className="animate-spin text-primary-500" />
    </div>
  );
  if (!project) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-500">
      <AlertCircle size={48} className="mb-4 opacity-20" />
      <p className="text-h3 font-bold">Project not found</p>
      <Link to="/projects" className="btn-secondary mt-6">Back to Projects</Link>
    </div>
  );

  const totalTasks = analytics?.total || 0;
  const doneTasks = analytics?.tasksByStatus?.Done || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.Archived;

  return (
    <div className="page-enter max-w-7xl mx-auto flex flex-col gap-lg pb-xl">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <Link to="/projects" className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary-600 font-medium text-body-sm transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Projects
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white dark:border-neutral-800 shrink-0" style={{ background: `${project.color || '#3b82f6'}`, color: '#fff' }}>
              <FolderKanban size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-display leading-tight">{project.name}</h1>
                <span className={`badge ${status.bg} ${status.color} ${status.darkBg} ${status.darkText}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-body-sm text-neutral-500 mt-1 max-w-2xl font-medium">{project.description || 'No description provided.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {myRole === 'Admin' && (
              <button onClick={() => setShowEdit(true)} className="btn-secondary">
                <Edit size={18} /> Edit Project
              </button>
            )}
            <Link to={`/projects/${id}/board`} className="btn-primary shadow-lg shadow-primary-500/20">
              <Kanban size={18} /> Open Kanban Board
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: CheckCircle, color: 'text-primary-500' },
          { label: 'Completed', value: doneTasks, icon: CheckCircle, color: 'text-success-500' },
          { label: 'Overdue', value: analytics?.overdue || 0, icon: Clock, color: 'text-error-500' },
          { label: 'Team Size', value: members.length, icon: Users, color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={stat.label} className="card !p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
        
        {/* Left Column: Progress & Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          
          {/* Progress Card */}
          <div className="card">
            <h3 className="text-h3 font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-500" /> Project Health
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-body-sm font-bold text-neutral-700 dark:text-neutral-300">Completion Progress</span>
              <span className="text-h3 font-black text-primary-600 dark:text-primary-400">{progress}%</span>
            </div>
            <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-4 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-success-500 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-500 uppercase">
              <span>{doneTasks} Tasks Finished</span>
              <span>{totalTasks - doneTasks} Remaining</span>
            </div>
          </div>

          {/* Recent Tasks List */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h3 font-bold flex items-center gap-2">
                <Clock size={20} className="text-primary-500" /> Recent Activities
              </h3>
              <Link to={`/projects/${id}/board`} className="text-body-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
                View all tasks →
              </Link>
            </div>
            
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <Link key={task._id} to={`/projects/${id}/board?task=${task._id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-sm transition-all group"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                    task.status === 'Done' ? 'bg-success-500' : 
                    task.status === 'In Progress' ? 'bg-primary-500' : 'bg-neutral-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-bold truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-tighter bg-neutral-200/50 dark:bg-neutral-700/50 px-1.5 py-0.5 rounded leading-none">
                        {task.status}
                      </span>
                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[8px] font-bold text-primary-700 dark:text-primary-400">
                            {task.assignedTo.name.charAt(0)}
                          </div>
                          <span className="text-[11px] text-neutral-500 font-medium">{task.assignedTo.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-300 group-hover:text-primary-500" />
                </Link>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-body-sm text-neutral-500 font-medium">No tasks found. Start by creating one on the board!</p>
                  <Link to={`/projects/${id}/board`} className="btn-secondary btn-sm mt-4">Go to Board</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Team Management */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-h3 font-bold flex items-center gap-2">
              <Users size={20} className="text-primary-500" /> Team
            </h3>
            {myRole === 'Admin' && (
              <button 
                onClick={() => setShowAddMember(true)} 
                className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 rounded-lg transition-all"
                title="Add member"
              >
                <UserPlus size={20} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {members.map((member) => (
              <div key={member._id} className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white dark:ring-neutral-900">
                    {member.user?.name ? member.user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  {member.role === 'Admin' && (
                    <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full ring-1 ring-white dark:ring-neutral-900">
                      <Shield size={10} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-bold truncate flex items-center gap-2">
                    {member.user?.name}
                    {member.user?._id === user?._id && <span className="text-[10px] text-primary-600 dark:text-primary-400 font-black tracking-widest">(YOU)</span>}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">{member.user?.email}</p>
                </div>

                {myRole === 'Admin' && member.user?._id !== user?._id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select 
                      value={member.role}
                      onChange={(e) => handleRoleChange(member._id, member.user._id, e.target.value)}
                      className="bg-neutral-100 dark:bg-neutral-800 border-none rounded-md px-2 py-1 text-[10px] font-bold outline-none cursor-pointer"
                    >
                      <option value="Admin">ADMIN</option>
                      <option value="Member">MEMBER</option>
                    </select>
                    <button 
                      onClick={() => handleRemoveMember(member._id, member.user._id)}
                      className="p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-md transition-colors"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {myRole === 'Admin' && (
            <button 
              onClick={() => setShowAddMember(true)}
              className="w-full mt-8 py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-body-sm font-bold text-neutral-500 hover:text-primary-600 hover:border-primary-200 dark:hover:border-primary-900/50 hover:bg-primary-50/50 dark:hover:bg-primary-900/5 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus size={18} /> Invite Team Member
            </button>
          )}
        </div>

      </div>

      {/* Modals */}
      <Modal show={showEdit} onClose={() => setShowEdit(false)} title="Edit Project Details">
        <ProjectForm initialData={project} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} />
      </Modal>

      <Modal show={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-lg">
          <div className="flex flex-col gap-2">
            <label className="label">User Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="email" 
                required 
                value={addMemberEmail}
                onChange={(e) => setAddMemberEmail(e.target.value)}
                className="input !pl-10" 
                placeholder="colleague@company.com" 
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label">Access Level</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAddMemberRole('Member')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${addMemberRole === 'Member' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-neutral-100 dark:border-neutral-800'}`}
              >
                <p className="text-body-sm font-bold">Member</p>
                <p className="text-[10px] text-neutral-500 font-medium">Can view and edit tasks</p>
              </button>
              <button
                type="button"
                onClick={() => setAddMemberRole('Admin')}
                className={`p-3 rounded-xl border-2 transition-all text-left ${addMemberRole === 'Admin' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-neutral-100 dark:border-neutral-800'}`}
              >
                <p className="text-body-sm font-bold">Admin</p>
                <p className="text-[10px] text-neutral-500 font-medium">Full project control</p>
              </button>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addingMember} className="btn-primary flex-1">
              {addingMember ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
