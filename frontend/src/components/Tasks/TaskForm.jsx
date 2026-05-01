import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];

export default function TaskForm({ projectId, members = [], defaultStatus = 'To Do', initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignedTo: initialData?.assignedTo?._id || initialData?.assignedTo || '',
    priority: initialData?.priority || 'Medium',
    status: initialData?.status || defaultStatus,
    dueDate: initialData?.dueDate ? initialData.dueDate.slice(0, 10) : '',
    labels: initialData?.labels?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        ...form,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        project: projectId,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{
          padding: '12px 16px', background: 'rgba(195,40,77,0.1)', border: '1px solid rgba(195,40,77,0.3)',
          borderRadius: 12, color: '#FF3F6D', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="label">Task title <span style={{ color: '#FF3F6D' }}>*</span></label>
        <input name="title" value={form.title} onChange={handleChange} required
          className="input" placeholder="Describe the task…" minLength={3} maxLength={200} />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange}
          className="input" style={{ resize: 'none' }} rows={3} placeholder="Add more details…" maxLength={1000} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="label">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="input" style={{ cursor: 'pointer' }}>
            {STATUSES.map(s => <option key={s} value={s} style={{ background: '#111827' }}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className="input" style={{ cursor: 'pointer' }}>
            {PRIORITIES.map(p => <option key={p} value={p} style={{ background: '#111827' }}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="label">Assign to</label>
          <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="input" style={{ cursor: 'pointer' }}>
            <option value="" style={{ background: '#111827' }}>Unassigned</option>
            {members.map(m => <option key={m.user._id} value={m.user._id} style={{ background: '#111827' }}>{m.user.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Due date</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="input" />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Labels <span style={{ color: 'rgba(242,244,247,0.4)', fontWeight: 400 }}>(comma-separated)</span></label>
        <input name="labels" value={form.labels} onChange={handleChange}
          className="input" placeholder="bug, feature, design" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary btn-md" style={{ flex: 1 }}>Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary btn-md" style={{ flex: 1 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {initialData ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
