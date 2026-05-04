import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Loader2, FolderKanban, Calendar, MoreVertical, Trash2, Edit, CheckSquare, ChevronRight, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { setProjects, addProject, removeProject, updateProject } from '../store/projectSlice';
import * as projectApi from '../api/projects';
import Modal from '../components/Common/Modal';
import ProjectForm from '../components/Projects/ProjectForm';
import { format } from 'date-fns';
import { SkeletonProjectGrid } from '../components/Common/SkeletonCard';

const STATUS_CONFIG = {
  Active: { color: 'text-success-600', bg: 'bg-success-100', darkText: 'dark:text-success-400', darkBg: 'dark:bg-success-900/30' },
  'On Hold': { color: 'text-warning-600', bg: 'bg-warning-100', darkText: 'dark:text-warning-400', darkBg: 'dark:bg-warning-900/30' },
  Completed: { color: 'text-primary-600', bg: 'bg-primary-100', darkText: 'dark:text-primary-400', darkBg: 'dark:bg-primary-900/30' },
  Archived: { color: 'text-neutral-600', bg: 'bg-neutral-100', darkText: 'dark:text-neutral-400', darkBg: 'dark:bg-neutral-800' },
};

export default function Projects() {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector((s) => s.projects);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    projectApi.getProjects()
      .then((r) => dispatch(setProjects(r.data.projects)))
      .catch(console.error);
  }, [dispatch]);

  const handleCreate = async (data) => {
    try {
      const res = await projectApi.createProject(data);
      dispatch(addProject({ ...res.data.project, myRole: 'Admin', taskCount: 0 }));
      setShowCreate(false);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleUpdate = async (data) => {
    try {
      const res = await projectApi.updateProject(editProject._id, data);
      dispatch(updateProject(res.data.project));
      setEditProject(null);
      toast.success('Project updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This will remove all tasks too.`)) return;
    try {
      await projectApi.deleteProject(project._id);
      dispatch(removeProject(project._id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="page-enter max-w-7xl mx-auto flex flex-col gap-lg pb-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Projects</h1>
          <p className="text-body-sm text-neutral-500 mt-1 font-medium">
            Manage and track all your team's initiatives
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary shadow-lg shadow-primary-500/20">
          <Plus size={20} /> New Project
        </button>
      </div>

      {loading ? (
        <SkeletonProjectGrid />
      ) : projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center gap-6 bg-neutral-50 dark:bg-neutral-900/50 border-dashed">
          <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <FolderKanban size={40} className="text-neutral-400" />
          </div>
          <div>
            <h3 className="text-h3 font-bold">No projects found</h3>
            <p className="text-body-sm text-neutral-500 mt-2 max-w-xs">
              You haven't created any projects yet. Get started by creating your first one.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={20} /> Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {projects.map((project) => {
            const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.Archived;
            
            return (
              <div key={project._id} className="card group flex flex-col !p-0 overflow-hidden relative border-t-4" style={{ borderTopColor: project.color || '#3b82f6' }}>
                <div className="p-lg flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner" style={{ background: `${project.color || '#3b82f6'}15`, color: project.color || '#3b82f6' }}>
                      <FolderKanban size={24} />
                    </div>
                    
                    {project.myRole === 'Admin' && (
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.preventDefault(); setMenuOpen(menuOpen === project._id ? null : project._id); }}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-neutral-400 hover:text-neutral-600"
                        >
                          <MoreVertical size={18} />
                        </button>
                        {menuOpen === project._id && (
                          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-1 z-20 animate-scale-in">
                            <button 
                              onClick={() => { setEditProject(project); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-md transition-colors"
                            >
                              <Edit size={14} /> Edit Project
                            </button>
                            <button 
                              onClick={() => { handleDelete(project); setMenuOpen(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-md transition-colors"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Link to={`/projects/${project._id}`} className="block group/title">
                    <h3 className="text-h3 font-bold text-neutral-900 dark:text-neutral-50 group-hover/title:text-primary-600 dark:group-hover/title:text-primary-400 transition-colors truncate">
                      {project.name}
                    </h3>
                  </Link>

                  <div className="mt-2 mb-4">
                    <span className={`badge ${status.bg} ${status.color} ${status.darkBg} ${status.darkText}`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="text-body-sm text-neutral-500 line-clamp-2 mb-6 min-h-[40px]">
                    {project.description || 'No description provided for this project.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <CheckSquare size={16} className="text-primary-500" />
                      <span className="text-xs font-bold">{project.taskCount || 0} Tasks</span>
                    </div>
                    {project.endDate && (
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Calendar size={16} className="text-warning-500" />
                        <span className="text-xs font-bold">{format(new Date(project.endDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {(project.taskCount || 0) > 0 && (
                    <div className="mt-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Progress</span>
                        <span className="text-[10px] font-black text-primary-600 dark:text-primary-400">
                          {project.doneCount || 0}/{project.taskCount || 0}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round(((project.doneCount || 0) / (project.taskCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex border-t border-neutral-100 dark:border-neutral-800">
                  <Link to={`/projects/${project._id}`} className="flex-1 py-3 text-center text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-r border-neutral-100 dark:border-neutral-800 flex items-center justify-center gap-2">
                    <LayoutGrid size={14} /> Details
                  </Link>
                  <Link to={`/projects/${project._id}/board`} className="flex-1 py-3 text-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-center gap-2">
                    <ChevronRight size={14} /> View Board
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal show={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        <ProjectForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal show={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        <ProjectForm initialData={editProject} onSubmit={handleUpdate} onCancel={() => setEditProject(null)} />
      </Modal>

      {/* Close menu overlay */}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
