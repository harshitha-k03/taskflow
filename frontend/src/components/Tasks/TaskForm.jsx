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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>}

      <div className="form-group">
        <label className="label">Task title <span className="text-red-400">*</span></label>
        <input name="title" value={form.title} onChange={handleChange} required
          className="input" placeholder="Describe the task…" minLength={3} maxLength={200} />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange}
          className="input resize-none" rows={3} placeholder="Add more details…" maxLength={1000} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="input">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className="input">
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Assign to</label>
          <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="input">
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Due date</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="input" />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Labels <span className="text-gray-500 font-normal">(comma-separated)</span></label>
        <input name="labels" value={form.labels} onChange={handleChange}
          className="input" placeholder="bug, feature, design" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {initialData ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
