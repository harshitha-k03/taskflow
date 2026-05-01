import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Loader2, FolderKanban, Users, Calendar, MoreVertical, Trash2, Edit, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { setProjects, addProject, removeProject, updateProject } from '../store/projectSlice';
import * as projectApi from '../api/projects';
import Modal from '../components/Common/Modal';
import ProjectForm from '../components/Projects/ProjectForm';
import { format } from 'date-fns';

const STATUS_BADGE = {
  Active: 'bg-green-900/40 text-green-300',
  'On Hold': 'bg-yellow-900/40 text-yellow-300',
  Completed: 'bg-blue-900/40 text-blue-300',
  Archived: 'bg-gray-800 text-gray-400',
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
    if (!confirm(`Delete "${project.name}"? This will remove all tasks too.`)) return;
    try {
      await projectApi.deleteProject(project._id);
      dispatch(removeProject(project._id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary-400" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 card">
          <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No projects yet</h3>
          <p className="text-gray-400 text-sm mb-6">Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id}
              className="card p-5 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group relative">
              {/* Color bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{ background: project.color || '#6366f1' }} />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: `${project.color || '#6366f1'}30` }}>
                    <FolderKanban className="w-4 h-4" style={{ color: project.color || '#6366f1' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{project.name}</h3>
                    <span className={`badge text-xs ${STATUS_BADGE[project.status] || 'bg-gray-800 text-gray-400'}`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                {project.myRole === 'Admin' && (
                  <div className="relative">
                    <button onClick={(e) => { e.preventDefault(); setMenuOpen(menuOpen === project._id ? null : project._id); }}
                      className="btn-ghost p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen === project._id && (
                      <div className="absolute right-0 top-8 z-20 w-40 card shadow-xl border-gray-700 py-1 animate-fade-in">
                        <button onClick={() => { setEditProject(project); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => { handleDelete(project); setMenuOpen(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-800">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                {project.description || 'No description'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" /> {project.taskCount || 0} tasks
                </span>
                {project.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {format(new Date(project.endDate), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="badge bg-gray-800 text-gray-400">{project.myRole}</span>
              </div>

              <div className="flex gap-2">
                <Link to={`/projects/${project._id}`} className="btn-secondary flex-1 text-center text-xs py-1.5">
                  View Details
                </Link>
                <Link to={`/projects/${project._id}/board`} className="btn-primary flex-1 text-center text-xs py-1.5">
                  Open Board
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        <ProjectForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        <ProjectForm initialData={editProject} onSubmit={handleUpdate} onCancel={() => setEditProject(null)} />
      </Modal>

      {/* Close menu on outside click */}
      {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}

function CheckSquare({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
