import { useEffect, useState } from 'react';
import { ClipboardList, Search, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const emptyAssessment = { score: '', status: 'Improving', clinicalAssessment: '', followUpRecommendation: '', nextAssessmentAt: '' };

export default function PatientManagementPage({ queueOnly = false }) {
  const [patients, setPatients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [assessment, setAssessment] = useState(emptyAssessment);
  const [historyEntry, setHistoryEntry] = useState({ category: 'OBSERVATION', title: '', details: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [patientResponse, connectionResponse] = await Promise.all([api.get('/patients', { params: { q: query } }), api.get('/connections')]);
      setPatients(patientResponse.data.patients || []);
      setRequests((connectionResponse.data.connections || []).filter((item) => item.status === 'PENDING'));
    } catch (error) { setMessage(error.response?.data?.message || 'Could not load patient records.'); }
  };
  useEffect(() => { const timer = window.setTimeout(load, 150); return () => window.clearTimeout(timer); }, [query]);

  const openPatient = async (patient) => {
    setMessage('');
    try { const response = await api.get(`/patients/${patient.id}`); setSelected(response.data); }
    catch (error) { setMessage(error.response?.data?.message || 'Could not open this patient record.'); }
  };
  const decide = async (request, action) => {
    try { await api.patch(`/connections/${request.id}/decision`, { action }); await load(); setMessage(`Connection ${action}ed.`); }
    catch (error) { setMessage(error.response?.data?.message || 'Could not update the request.'); }
  };
  const saveAssessment = async (event) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      await api.post(`/patients/${selected.patient.id}/recovery-assessments`, { ...assessment, score: Number(assessment.score), nextAssessmentAt: assessment.nextAssessmentAt || undefined });
      setAssessment(emptyAssessment); setMessage('Clinical recovery assessment saved.'); await openPatient(selected.patient);
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save this assessment.'); }
    finally { setSaving(false); }
  };
  const saveHistory = async (event) => {
    event.preventDefault();
    try {
      await api.post('/medical-history', { patientId: selected.patient.id, ...historyEntry });
      setHistoryEntry({ category: 'OBSERVATION', title: '', details: '' }); setMessage('Clinical observation saved.'); await openPatient(selected.patient);
    } catch (error) { setMessage(error.response?.data?.message || 'Could not save this observation.'); }
  };

  return (
    <main className="p-5 sm:p-6"><div className="mx-auto max-w-7xl">
      <PageHeader eyebrow={queueOnly ? 'Doctor workspace' : 'Care team'} title={queueOnly ? 'Patient queue' : 'My patients'} description={queueOnly ? 'Review new connection requests. Patient records remain private until you approve a connection.' : 'Search connected patients and review their authorized health records.'} />
      {message && <p role="status" className="mb-4 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-800">{message}</p>}
      {queueOnly && <Panel eyebrow="Connections" title="Pending connection requests" icon={ShieldCheck} className="mb-6" bodyClassName="pt-4">
        <div className="space-y-3">
        {requests.map((request) => <article key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-soft"><div><p className="font-semibold text-slate-900">Patient request</p><p className="mt-1 text-xs text-slate-500">Method: {request.connectionMethod.replace('_', ' ').toLowerCase()} · {new Date(request.connectedAt).toLocaleDateString()}</p></div><div className="flex gap-2"><button type="button" onClick={() => decide(request, 'accept')} className="primary-btn min-h-9 px-3">Approve</button><button type="button" onClick={() => decide(request, 'reject')} className="secondary-btn min-h-9 px-3">Decline</button></div></article>)}
        {!requests.length && <EmptyState icon={ShieldCheck} title="No pending connection requests" text="New patient connection requests will appear here for review." />}
      </div></Panel>}
      {!queueOnly && <div className="grid gap-6 lg:grid-cols-[.65fr_1.35fr]">
        <section className="surface-card panel-toplight rounded-2xl p-5"><label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="form-input pl-10" placeholder="Search patient or condition" /></label><div className="mt-4 space-y-2">
          {patients.map((patient) => <button type="button" key={patient.id} onClick={() => openPatient(patient)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-300 ${selected?.patient?.id === patient.id ? 'border-brand-500 bg-brand-50 shadow-soft' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:bg-slate-50'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected?.patient?.id === patient.id ? 'bg-brand-gradient text-white' : 'bg-slate-100 text-slate-500'}`}><UserRound className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{patient.name}</span><span className="block truncate text-xs text-slate-500">{patient.primaryDisease || 'No primary disease recorded'}</span></span></button>)}
          {!patients.length && <EmptyState icon={UserRound} title="No connected patients" text="No connected patients match this search." />}
        </div></section>
        <section className="surface-card panel-toplight rounded-2xl p-5 sm:p-6">
          {!selected ? <EmptyState icon={Stethoscope} title="Choose a connected patient" text="Health history and clinical records are only available for patients connected to your account." /> : <>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-900">{selected.patient.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.patient.primaryDisease || 'No primary disease recorded'} · {selected.patient.age ? `${selected.patient.age} years` : 'Age not recorded'}</p></div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Approved connection</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{[['Allergies', selected.patient.allergies], ['Existing medication', selected.patient.existingMedications], ['Conditions', selected.patient.existingHealthConditions], ['Emergency contact', selected.patient.emergencyContact]].map(([label, value]) => <div key={label} className="vital-rail relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-700">{value || 'Not recorded'}</p></div>)}</div>
            <div className="mt-5"><h3 className="flex items-center gap-2 font-semibold text-slate-900"><ClipboardList className="h-4 w-4 text-brand-600" /> Recent symptoms</h3><div className="mt-2 space-y-2">{selected.symptoms?.slice(0, 5).map((item) => <p key={item.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600">{item.symptom} · severity {item.severity}/10 · {new Date(item.recordedAt).toLocaleDateString()}</p>)}{!selected.symptoms?.length && <p className="text-sm text-slate-500">No symptoms recorded.</p>}</div></div>
            <div className="mt-5"><h3 className="flex items-center gap-2 font-semibold text-slate-900"><Stethoscope className="h-4 w-4 text-brand-600" /> Prescription and medication history</h3><div className="mt-2 space-y-2">{selected.prescriptions?.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600"><span>{item.diagnosis || 'Treatment'} · {item.medications?.map((med) => med.medicineName).join(', ')}</span><StatusPill status={item.status} /></div>)}{!selected.prescriptions?.length && <p className="text-sm text-slate-500">No prescriptions available.</p>}</div></div>
            <div className="mt-5"><h3 className="font-semibold text-slate-900">Medical history</h3><div className="mt-2 space-y-2">{selected.medicalHistory?.slice(0, 8).map((item) => <p key={item.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600">{item.title} · {new Date(item.occurredAt).toLocaleDateString()}</p>)}{!selected.medicalHistory?.length && <p className="text-sm text-slate-500">No dated history records.</p>}</div></div>
            <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-2">
              <form onSubmit={saveAssessment} className="space-y-3"><h3 className="font-semibold text-slate-900">Record recovery assessment</h3><label className="block text-sm text-slate-600">Score (0–100)<input required type="number" min="0" max="100" value={assessment.score} onChange={(event) => setAssessment((current) => ({ ...current, score: event.target.value }))} className="form-input" /></label><label className="block text-sm text-slate-600">Status<select value={assessment.status} onChange={(event) => setAssessment((current) => ({ ...current, status: event.target.value }))} className="form-input">{['Under Treatment', 'Improving', 'Stable', 'Requires Reassessment', 'Recovered'].map((status) => <option key={status}>{status}</option>)}</select></label><label className="block text-sm text-slate-600">Clinical assessment<textarea maxLength="4000" value={assessment.clinicalAssessment} onChange={(event) => setAssessment((current) => ({ ...current, clinicalAssessment: event.target.value }))} className="form-input min-h-16" /></label><label className="block text-sm text-slate-600">Follow-up recommendation<input maxLength="1000" value={assessment.followUpRecommendation} onChange={(event) => setAssessment((current) => ({ ...current, followUpRecommendation: event.target.value }))} className="form-input" /></label><button disabled={saving} className="primary-btn disabled:opacity-50">{saving ? 'Saving…' : 'Save assessment'}</button></form>
              <form onSubmit={saveHistory} className="space-y-3"><h3 className="font-semibold text-slate-900">Add clinical observation</h3><label className="block text-sm text-slate-600">Category<select value={historyEntry.category} onChange={(event) => setHistoryEntry((current) => ({ ...current, category: event.target.value }))} className="form-input">{['OBSERVATION', 'DIAGNOSIS', 'CONDITION', 'TREATMENT', 'HOSPITAL_VISIT'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="block text-sm text-slate-600">Title<input required maxLength="160" value={historyEntry.title} onChange={(event) => setHistoryEntry((current) => ({ ...current, title: event.target.value }))} className="form-input" /></label><label className="block text-sm text-slate-600">Details<textarea maxLength="4000" value={historyEntry.details} onChange={(event) => setHistoryEntry((current) => ({ ...current, details: event.target.value }))} className="form-input min-h-16" /></label><button className="secondary-btn">Save observation</button></form>
            </div>
          </>}
        </section>
      </div>}
    </div></main>
  );
}
