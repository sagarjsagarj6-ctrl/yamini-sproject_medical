import { useEffect, useState } from 'react';
import { ClipboardList, History, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';

const categories = ['DIAGNOSIS', 'HOSPITAL_VISIT', 'ALLERGY', 'SURGERY', 'CONDITION', 'OBSERVATION', 'TREATMENT'];

const categoryTone = {
  DIAGNOSIS: 'info', HOSPITAL_VISIT: 'caution', ALLERGY: 'critical', SURGERY: 'critical',
  CONDITION: 'brand', OBSERVATION: 'stable', TREATMENT: 'stable'
};

export default function MedicalHistoryPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ category: 'CONDITION', title: '', details: '', occurredAt: new Date().toISOString().slice(0, 10) });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const load = async () => { try { const response = await api.get(`/patients/${user.id}/medical-history`); setData(response.data); } catch (error) { setMessage(error.response?.data?.message || 'Could not load medical history.'); } };
  useEffect(() => { if (user?.id) load(); }, [user?.id]);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try { await api.post('/medical-history', form); setForm((current) => ({ ...current, title: '', details: '' })); setMessage('History entry saved.'); await load(); }
    catch (error) { setMessage(error.response?.data?.message || 'Could not save this entry.'); }
    finally { setSaving(false); }
  };
  return (
    <main className="p-5 sm:p-6"><div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Patient records" title="Medical history" description="Review the health information on your profile and add dated history records. Entries are kept even if a care-team connection ends." icon={History} />
      {data?.profileSummary && <Panel title="Profile health summary" subtitle="Baseline health details held on your profile." icon={ClipboardList}>
        <dl className="grid gap-4 sm:grid-cols-2">{Object.entries(data.profileSummary).filter(([, value]) => value).map(([key, value]) => <div key={key} className="vital-rail rounded-xl border border-slate-200/70 bg-white/70 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</dt><dd className="mt-1 text-sm text-slate-700">{value}</dd></div>)}</dl>{!Object.values(data.profileSummary).some(Boolean) && <p className="mt-2 text-sm text-slate-500">No health details are recorded on your profile yet.</p>}
      </Panel>}
      <Panel className="mt-6" title="Add a history entry" subtitle="Dated, categorized and attributed to the author." icon={Plus}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="form-input">{categories.map((category) => <option key={category} value={category}>{category.replace('_', ' ').toLowerCase()}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-600">Date<input type="date" value={form.occurredAt} onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))} className="form-input" /></label>
        <label className="text-sm font-medium text-slate-600 sm:col-span-2">Title<input required maxLength="160" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="form-input" placeholder="e.g. Seasonal allergy diagnosis" /></label>
        <label className="text-sm font-medium text-slate-600 sm:col-span-2">Details<textarea maxLength="4000" value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} className="form-input min-h-20" /></label>
        {message && <p role="status" className="text-sm text-slate-600 sm:col-span-2">{message}</p>}<div className="sm:col-span-2"><button disabled={saving} className="primary-btn disabled:opacity-50">{saving ? 'Saving…' : 'Save history entry'}</button></div>
      </form></Panel>
      <Panel className="mt-6" title="Recorded history" subtitle="Your longitudinal clinical record." icon={History}>
        <div className="space-y-3">
        {data?.records?.map((record) => <article key={record.id} className="vital-rail rounded-2xl border border-slate-200/80 bg-white/75 p-4" style={{ '--rail': categoryTone[record.category] === 'critical' ? '#e11d48' : categoryTone[record.category] === 'caution' ? '#d97706' : categoryTone[record.category] === 'info' ? '#0284c7' : categoryTone[record.category] === 'stable' ? '#0f9d6e' : '#0a9187' }}><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-900">{record.title}</h3><span className="text-xs text-slate-400">{new Date(record.occurredAt).toLocaleDateString()}</span></div><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700">{record.category.replace('_', ' ')}</p>{record.details && <p className="mt-2 text-sm leading-6 text-slate-600">{record.details}</p>}<p className="mt-2 text-xs text-slate-400">Recorded by {record.authorRole.toLowerCase()}</p></article>)}
        {!data?.records?.length && <EmptyState icon={History} title="No dated history records" text="Add your first entry to start building your clinical timeline." />}
      </div></Panel>
    </div></main>
  );
}
