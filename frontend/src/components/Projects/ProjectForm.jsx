import { useState } from 'react';
import { Loader2, Calendar, Layout, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];
const STATUSES = ['Active', 'On Hold', 'Completed', 'Archived'];

export default function ProjectForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate ? initialData.startDate.slice(0, 10) : '',
    endDate: initialData?.endDate ? initialData.endDate.slice(0, 10) : '',
    status: initialData?.status || 'Active',
    color: initialData?.color || '#3b82f6',
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
    <form onSubmit={handleSubmit} className="space-y-lg">
      {error && (
        <div className="p-md bg-error-50 dark:bg-error-900/20 border border-error-100 dark:border-error-800 rounded-xl text-error-600 dark:text-error-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="label">Project Name</label>
        <div className="relative">
          <Layout size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            required
            className="input !pl-10 font-bold" 
            placeholder="e.g. Website Redesign" 
            minLength={3} 
            maxLength={100} 
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="label">Description</label>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{form.description.length}/500</span>
        </div>
        <textarea 
          name="description" 
          value={form.description} 
          onChange={handleChange}
          className="input min-h-[100px] resize-none text-body-sm" 
          placeholder="What's the goal of this project?"
          maxLength={500} 
        />
      </div>

      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-1.5">
          <label className="label">Start Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="date" 
              name="startDate" 
              value={form.startDate} 
              onChange={handleChange} 
              className="input !pl-10 font-bold" 
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label">Target End Date</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="date" 
              name="endDate" 
              value={form.endDate} 
              onChange={handleChange} 
              className="input !pl-10 font-bold" 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="label">Initial Status</label>
        <select 
          name="status" 
          value={form.status} 
          onChange={handleChange} 
          className="input cursor-pointer font-bold appearance-none bg-neutral-50 dark:bg-neutral-800"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <label className="label">Brand Color</label>
        <div className="flex gap-3 flex-wrap bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
          {COLORS.map(c => (
            <button 
              key={c} 
              type="button" 
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-8 h-8 rounded-full transition-all duration-300 ring-offset-2 dark:ring-offset-neutral-900 ${form.color === c ? 'ring-2 ring-primary-500 scale-110 shadow-lg' : 'hover:scale-105'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 shadow-lg shadow-primary-500/20">
          {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          <span className="font-bold">{initialData ? 'Update Project' : 'Create Project'}</span>
        </button>
      </div>
    </form>
  );
}
