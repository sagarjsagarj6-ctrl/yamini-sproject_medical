import { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';

const emptyForm = { medicineName: '', brandName: '', genericName: '', category: '', dosageForm: '', strengths: '', description: '', imageUrl: '' };

export default function MedicineCatalogPage() {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const response = await api.get('/medicines', { params: { q: query } }); setMedicines(response.data.medicines || []); }
    catch (error) { setMessage(error.response?.data?.message || 'Could not load the medicine catalog.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(load, 180); return () => window.clearTimeout(timer); }, [query]);

  const saveMedicine = async (event) => {
    event.preventDefault();
    setSaving(true); setMessage('');
    try {
      await api.post('/medicines', { ...form, strengths: form.strengths.split(',').map((value) => value.trim()).filter(Boolean) });
      setForm(emptyForm); setMessage('Medicine saved as an unverified manual reference.'); await load();
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save this medicine.'); }
    finally { setSaving(false); }
  };

  return (
    <main className="p-5 sm:p-6"><div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Doctor tools" title="Medicine database" description="Search existing references or add a manual medicine entry. Manual entries are clearly marked unverified." icon={BookOpen} />
      <Panel title="Catalog references" subtitle="Verified sources are marked green; manual entries stay flagged as unverified." icon={BookOpen}>
        <label className="relative block max-w-xl"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="form-input pl-10" placeholder="Search by medicine, brand, generic name, or category" /></label>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {medicines.map((medicine) => (
            <article key={medicine.id} className="hover-lift rounded-2xl border border-slate-200/80 bg-white/75 p-4 flex gap-3">
              {medicine.imageUrl && (
                <img
                  src={medicine.imageUrl}
                  alt={medicine.medicineName}
                  className="h-16 w-16 rounded-xl object-cover shrink-0 border border-slate-200"
                  loading="lazy"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900 truncate">{medicine.medicineName}</h2>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {[medicine.brandName, medicine.genericName].filter(Boolean).join(' · ') || medicine.dosageForm || 'Medicine reference'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      medicine.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {medicine.isVerified ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                    {medicine.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                {medicine.description && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">{medicine.description}</p>
                )}
                {medicine.strengths?.length > 0 && (
                  <p className="mt-2 text-[11px] text-slate-500">Strengths: {medicine.strengths.join(', ')}</p>
                )}
              </div>
            </article>
          ))}
          {!loading && medicines.length === 0 && <div className="sm:col-span-2 lg:col-span-3"><EmptyState icon={Search} title="No catalog items match" text="Add a manual reference below; it will be marked unverified." /></div>}
          {loading && <p className="p-4 text-sm text-slate-500">Loading medicines…</p>}
        </div>
      </Panel>
      <Panel className="mt-6" title="Add a manual medicine" subtitle="This is reference information, not clinical verification." icon={Plus}>
        <form onSubmit={saveMedicine} className="mt-1 grid gap-4 sm:grid-cols-2">
          {[
            ['medicineName', 'Medicine name', true], ['brandName', 'Brand name'], ['genericName', 'Generic name'], ['category', 'Category'], ['dosageForm', 'Dosage form'], ['strengths', 'Strengths (comma separated)'], ['imageUrl', 'Image URL']
          ].map(([name, label, required]) => <label key={name} className="text-sm font-medium text-slate-600">{label}<input required={required} maxLength="2048" value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} className="form-input" /></label>)}
          <label className="text-sm font-medium text-slate-600 sm:col-span-2">Description<textarea maxLength="2000" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="form-input min-h-20" /></label>
          {message && <p role="status" className="text-sm text-slate-600 sm:col-span-2">{message}</p>}
          <div className="sm:col-span-2"><button disabled={saving} className="primary-btn disabled:opacity-50">{saving ? 'Saving…' : 'Save unverified entry'}</button></div>
        </form>
      </Panel>
    </div></main>
  );
}
