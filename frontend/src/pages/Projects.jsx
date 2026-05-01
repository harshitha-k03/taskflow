import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Loader2, FolderKanban, Calendar, MoreVertical, Trash2, Edit, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { setProjects, addProject, removeProject, updateProject } from '../store/projectSlice';
import * as projectApi from '../api/projects';
import Modal from '../components/Common/Modal';
import ProjectForm from '../components/Projects/ProjectForm';
import { format } from 'date-fns';

const STATUS_BADGE = {
  Active: { bg: 'rgba(0,213,176,0.15)', color: '#00D5B0', border: 'rgba(0,213,176,0.25)' },
  'On Hold': { bg: 'rgba(255,162,0,0.15)', color: '#FFA200', border: 'rgba(255,162,0,0.25)' },
  Completed: { bg: 'rgba(43,140,220,0.15)', color: '#2B8CDC', border: 'rgba(43,140,220,0.25)' },
  Archived: { bg: 'rgba(255,255,255,0.06)', color: '#B1B4BA', border: 'rgba(255,255,255,0.1)' },
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
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="animate-enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p style={{ color: '#B1B4BA', fontSize: 14, margin: '4px 0 0' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-md">
          <Plus size={18} /> New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={32} color="#00D5B0" className="animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card animate-enter stagger-1" style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FolderKanban size={48} color="#B1B4BA" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#F2F4F7', margin: '0 0 8px 0' }}>No projects yet</h3>
          <p style={{ fontSize: 14, color: '#B1B4BA', margin: '0 0 24px 0' }}>Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-md">
            <Plus size={18} /> Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {projects.map((project, i) => {
            const statusStyle = STATUS_BADGE[project.status] || STATUS_BADGE.Archived;
            const delayClass = `stagger-${(i % 5) + 1}`;
            
            return (
              <div key={project._id} className={`card animate-enter ${delayClass}`} style={{ 
                padding: 24, position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                
                {/* Color Top Bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: project.color || '#2B8CDC' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${project.color || '#2B8CDC'}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FolderKanban size={20} color={project.color || '#2B8CDC'} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#F2F4F7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.name}
                      </h3>
                      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, marginTop: 4 }}>
                        {project.status}
                      </div>
                    </div>
                  </div>

                  {project.myRole === 'Admin' && (
                    <div style={{ position: 'relative' }}>
                      <button onClick={(e) => { e.preventDefault(); setMenuOpen(menuOpen === project._id ? null : project._id); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#B1B4BA', borderRadius: 6, outline: 'none' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <MoreVertical size={18} />
                      </button>
                      {menuOpen === project._id && (
                        <div className="animate-slide-down card" style={{
                          position: 'absolute', right: 0, top: 32, zIndex: 20, width: 140, padding: 4,
                          boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
                        }}>
                          <button onClick={() => { setEditProject(project); setMenuOpen(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#F2F4F7', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => { handleDelete(project); setMenuOpen(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: '#FF3F6D', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,63,109,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <p className="line-clamp-2" style={{ margin: '0 0 20px 0', fontSize: 14, color: '#B1B4BA', lineHeight: 1.5, minHeight: 42 }}>
                  {project.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B1B4BA', fontSize: 13, fontWeight: 500 }}>
                    <CheckSquare size={14} /> {project.taskCount || 0} tasks
                  </div>
                  {project.endDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B1B4BA', fontSize: 13, fontWeight: 500 }}>
                      <Calendar size={14} /> {format(new Date(project.endDate), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                  <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    Details
                  </Link>
                  <Link to={`/projects/${project._id}/board`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    Board
                  </Link>
                </div>
              </div>
            );
          })}
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

      {/* Close menu overlay */}
      {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
