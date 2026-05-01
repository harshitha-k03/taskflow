import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const COLORS = ['#2B8CDC', '#00D5B0', '#FFA200', '#FF3F6D', '#8b5cf6', '#ec4899', '#f97316', '#22c55e'];
const STATUSES = ['Active', 'On Hold', 'Completed', 'Archived'];

export default function ProjectForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate ? initialData.startDate.slice(0, 10) : '',
    endDate: initialData?.endDate ? initialData.endDate.slice(0, 10) : '',
    status: initialData?.status || 'Active',
    color: initialData?.color || '#2B8CDC',
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
        <label className="label">Project name <span style={{ color: '#FF3F6D' }}>*</span></label>
        <input name="name" value={form.name} onChange={handleChange} required
          className="input" placeholder="My Awesome Project" minLength={3} maxLength={100} />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange}
          className="input" style={{ resize: 'none' }} rows={3} placeholder="What is this project about?"
          maxLength={500} />
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(242,244,247,0.4)', textAlign: 'right' }}>
          {form.description.length}/500
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
        <select name="status" value={form.status} onChange={handleChange} className="input" style={{ cursor: 'pointer' }}>
          {STATUSES.map(s => <option key={s} value={s} style={{ background: '#111827' }}>{s}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="label">Color theme</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease',
                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                boxShadow: form.color === c ? `0 0 0 2px #0D1421, 0 0 0 4px ${c}` : 'none'
              }} 
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary btn-md" style={{ flex: 1 }}>Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary btn-md" style={{ flex: 1 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {initialData ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
