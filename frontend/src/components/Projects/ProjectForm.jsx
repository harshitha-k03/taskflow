import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#06b6d4'];
const STATUSES = ['Active', 'On Hold', 'Completed', 'Archived'];

export default function ProjectForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate ? initialData.startDate.slice(0, 10) : '',
    endDate: initialData?.endDate ? initialData.endDate.slice(0, 10) : '',
    status: initialData?.status || 'Active',
    color: initialData?.color || '#6366f1',
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
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">{error}</div>
      )}

      <div className="form-group">
        <label className="label">Project name <span className="text-red-400">*</span></label>
        <input name="name" value={form.name} onChange={handleChange} required
          className="input" placeholder="My Awesome Project" minLength={3} maxLength={100} />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange}
          className="input resize-none" rows={3} placeholder="What is this project about?"
          maxLength={500} />
        <p className="text-xs text-gray-500 text-right">{form.description.length}/500</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="label">Start date</label>
          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className="input" />
        </div>
        <div className="form-group">
          <label className="label">End date</label>
          <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className="input" />
        </div>
      </div>

      <div className="form-group">
        <label className="label">Status</label>
        <select name="status" value={form.status} onChange={handleChange} className="input">
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-gray-900' : 'hover:scale-110'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {initialData ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
