import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import PatientAnalyticsCharts from './PatientAnalyticsCharts';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Panel from '../../components/ui/Panel';

export default function PatientAnalyticsPage() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/patient/analytics', { params: { period } }).then((response) => { setData(response.data); setError(''); }).catch((reason) => setError(reason.response?.data?.message || 'Analytics are unavailable.')); }, [period]);
  return <main className="p-5 sm:p-6"><div className="mx-auto max-w-6xl"><PageHeader eyebrow="Patient analytics" title="Care progress" description="Medication adherence, patient-reported symptoms, and doctor-recorded recovery are separate measures." icon={Activity} />
    <Panel title="Trend range" subtitle="Switch the window to compare how your care measures have moved." icon={Activity} action={
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">{[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${period === value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>
    }>
      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
      {data && <><div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Adherence" value={data.periodAdherence == null ? 0 : data.periodAdherence} suffix="%" icon={Activity} tone="brand" hint="Doses logged in range" />
        <StatCard label="Latest recovery score" value={data.latestRecoveryScore == null ? 0 : data.latestRecoveryScore} suffix="%" icon={Activity} tone="stable" hint="Doctor assessment" />
        <StatCard label="Treatment completion" value={data.treatmentCompletion == null ? 0 : data.treatmentCompletion} suffix="%" icon={Activity} tone="caution" hint="Prescriptions completed" />
      </div><div className="mt-5"><PatientAnalyticsCharts trend={data.trend || []} measurements={data.measurementTrend || []} /></div><p className="mt-4 text-xs text-slate-400">{data.adherenceDefinition}</p></>}
    </Panel>
  </div></main>;
}
