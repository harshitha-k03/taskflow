import { useState } from 'react';
import { Loader2, Calendar, User as UserIcon, Tag, AlertCircle } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-lg">
      {error && (
        <div className="p-md bg-error-50 dark:bg-error-900/20 border border-error-100 dark:border-error-800 rounded-xl text-error-600 dark:text-error-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="label">Task Title</label>
        <input 
          name="title" 
          value={form.title} 
          onChange={handleChange} 
          required
          className="input font-bold" 
          placeholder="What needs to be done?" 
          minLength={3} 
          maxLength={200} 
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label">Description (Optional)</label>
        <textarea 
          name="description" 
          value={form.description} 
          onChange={handleChange}
          className="input min-h-[100px] resize-none text-body-sm" 
          placeholder="Add more context and details..." 
          maxLength={1000} 
        />
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-1.5">
          <label className="label">Status</label>
          <select 
            name="status" 
            value={form.status} 
            onChange={handleChange} 
            className="input cursor-pointer font-bold"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">Priority</label>
          <select 
            name="priority" 
            value={form.priority} 
            onChange={handleChange} 
            className="input cursor-pointer font-bold"
          >
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-1.5">
          <label className="label">Assignee</label>
          <div className="relative">
            <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select 
              name="assignedTo" 
              value={form.assignedTo} 
              onChange={handleChange} 
              className="input !pl-10 cursor-pointer font-bold appearance-none"
            >
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">Due Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="date" 
              name="dueDate" 
              value={form.dueDate} 
              onChange={handleChange} 
              className="input !pl-10 font-bold" 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label">Labels (Comma-separated)</label>
        <div className="relative">
          <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            name="labels" 
            value={form.labels} 
            onChange={handleChange}
            className="input !pl-10" 
            placeholder="bug, critical, research" 
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 shadow-lg shadow-primary-500/20">
          {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          <span className="font-bold">{initialData ? 'Update Task' : 'Create Task'}</span>
        </button>
      </div>
    </form>
  );
}
