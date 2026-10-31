import { useEffect, useState } from 'react';
import { AlertTriangle, Bot, Sparkles, History, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';
import StatusPill from '../../components/ui/StatusPill';

export default function AIInsightsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [consent, setConsent] = useState(false);
  const [insights, setInsights] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRecent = async () => {
    try {
      const response = await api.get('/insights/recent');
      setInsights(response.data.insights || []);
    } catch {
      setInsights([]);
    }
  };

  useEffect(() => {
    loadRecent();
    if (isDoctor) {
      api
        .get('/patients')
        .then((response) => setPatients(response.data.patients || []))
        .catch(() => setPatients([]));
    }
  }, [user?.id]);

  const generate = async () => {
    if (!consent) {
      setError('Confirm before sending authorized care records to the configured AI provider.');
      return;
    }
    setLoading(true);
    setError('');
    setCurrent(null);
    try {
      const endpoint = isDoctor ? '/doctor/insights' : '/patient/insights';
      const response = await api.post(
        endpoint,
        isDoctor && patientId ? { patientId, confirmAIDataShare: true } : { confirmAIDataShare: true }
      );
      setCurrent(response.data);
      await loadRecent();
    } catch (reason) {
      setError(reason.response?.data?.message || 'AI insights are unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow={isDoctor ? 'Doctor tools' : 'Patient support'}
          title={isDoctor ? 'Clinical insights' : 'Care plan explanations'}
          description={
            isDoctor
              ? 'AI can summarize authorized patient activity for clinician review. It does not diagnose or prescribe.'
              : 'Ask for a plain-language summary of your recorded care plan. This is not medical advice.'
          }
          icon={Bot}
          tone="ai"
          meta={
            <span className="chip chip-ai">
              <span className="live-dot" aria-hidden="true" />
              Human review required
            </span>
          }
        />

        <Panel title="Generate a summary" icon={Sparkles} tone="ai" className="mb-6">
          {isDoctor && (
            <label className="mb-5 block max-w-lg text-sm font-medium text-slate-600">
              Patient scope
              <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className="form-input mt-2">
                <option value="">All connected patients</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 accent-amber-700"
            />
            <span>
              I understand relevant authorized care records will be sent to the AI provider configured by this application. AI output may be incomplete and must be
              reviewed by a person.
            </span>
          </label>

          <button
            type="button"
            disabled={loading || !consent}
            onClick={generate}
            className="primary-btn mt-5 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Generating…' : 'Generate AI summary'}
          </button>

          {error && (
            <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </Panel>

        {current && (
          <article className="surface-card panel-toplight mb-6 overflow-hidden rounded-[26px]">
            <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-700">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="eyebrow">AI-generated summary</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Generated {new Date(current.generatedAt).toLocaleString()} · {current.model}
                  </p>
                </div>
              </div>
              <StatusPill status="AI" label="Requires review" />
            </header>
            <div className="px-5 py-5 sm:px-6">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{current.summary}</p>
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {current.disclaimer || 'AI-generated information for review; not a diagnosis or prescription.'}
              </div>
            </div>
          </article>
        )}

        <Panel title="Recent generated summaries" icon={History} tone="ai">
          {insights.length ? (
            <div className="space-y-3">
              {insights.map((item) => (
                <article key={item.id} className="vital-rail rounded-2xl border border-slate-100 bg-slate-50/70 p-4" style={{ '--rail': 'var(--vital-info, #0284c7)' }}>
                  <p className="text-xs text-slate-400">{new Date(item.generatedAt).toLocaleString()}</p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.summary}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    AI-generated · requires review
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bot}
              title="No AI summaries yet"
              text="No AI summaries have been generated. Summaries require server-side AI configuration."
            />
          )}
        </Panel>
      </div>
    </main>
  );
}
