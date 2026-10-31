import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Filter, PieChart, Stethoscope, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';

const dateValue = (date) => date.toISOString().slice(0, 10);

const TIP = {
  contentStyle: {
    borderRadius: 14,
    border: '1px solid #dbe7ec',
    boxShadow: '0 18px 44px rgba(10, 40, 52, .14)',
    fontSize: 12,
    background: 'rgba(255,255,255,.96)'
  },
  labelStyle: { fontWeight: 700, color: '#0f2b38', marginBottom: 4 },
  itemStyle: { color: '#4a6a78' }
};

export default function DoctorAnalyticsPage() {
  const [filters, setFilters] = useState({ startDate: dateValue(new Date(Date.now() - 29 * 86_400_000)), endDate: dateValue(new Date()), disease: '' });
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const load = async () => { try { const response = await api.get('/doctor/analytics', { params: filters }); setData(response.data); setMessage(''); } catch (error) { setMessage(error.response?.data?.message || 'Could not load analytics.'); } };
  useEffect(() => { load(); }, []);
  const field = (name, label, type = 'text') => <label className="text-sm font-medium text-slate-600">{label}<input type={type} value={filters[name]} onChange={(event) => setFilters((current) => ({ ...current, [name]: event.target.value }))} className="form-input" /></label>;

  return (
    <main className="p-5 sm:p-6 md:p-8"><div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Doctor analytics"
        title="Patient progress"
        icon={TrendingUp}
        description="Metrics are calculated from connected-patient records. Adherence, patient symptoms, and doctor recovery assessments remain separate."
      />

      <Panel eyebrow="Filters" title="Analysis window" icon={Filter} className="mt-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {field('startDate', 'From', 'date')}
          {field('endDate', 'To', 'date')}
          {field('disease', 'Disease filter')}
          <div className="flex items-end"><button type="button" onClick={load} className="primary-btn w-full">Apply filters</button></div>
        </div>
      </Panel>

      {message && <p role="alert" className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}

      {data && <>
        <div className="stagger-grid mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Connected patients" value={data.stats.activePatients ?? 0} icon={Stethoscope} tone="brand" />
          <StatCard label="Diagnosed patients" value={data.stats.totalDiagnosedPatients ?? 0} icon={Activity} tone="info" />
          <StatCard label="Completed treatments" value={data.stats.completedTreatments ?? 0} icon={TrendingUp} tone="stable" />
          <StatCard label="Follow-ups required" value={data.stats.followUpsRequired ?? 0} icon={Filter} tone="caution" />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatCard label="Medication adherence" value={data.stats.adherenceRate == null ? 'No data' : data.stats.adherenceRate} suffix={data.stats.adherenceRate == null ? '' : '%'} icon={Activity} tone="stable" animate={false} />
          <StatCard label="Avg. treatment duration" value={data.stats.averageTreatmentDurationDays == null ? 'No data' : data.stats.averageTreatmentDurationDays} suffix={data.stats.averageTreatmentDurationDays == null ? '' : ' days'} icon={TrendingUp} tone="info" animate={false} />
          <StatCard label="Recovery assessments" value={data.stats.recoveryAssessments ?? 0} icon={Stethoscope} tone="brand" />
        </div>

        <Panel eyebrow="Trend" title="Daily care trend" icon={TrendingUp} className="mt-6" subtitle="Adherence is based on taken/missed logs. Recovery uses doctor-recorded scores.">
          <div className="h-72">
            {data.trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid stroke="#e4edf1" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fill: '#6b8797', fontSize: 11 }} minTickGap={24} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#6b8797', fontSize: 11 }} />
                  <Tooltip {...TIP} />
                  <Line dataKey="adherence" name="Medication adherence %" stroke="#0a9187" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls={false} />
                  <Line dataKey="recoveryScore" name="Doctor recovery score" stroke="#0f9d6e" strokeWidth={2.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState icon={TrendingUp} title="No records in this range" text="Adjust the date window or disease filter to widen the trend." />}
          </div>
        </Panel>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel eyebrow="Distribution" title="Disease distribution" icon={PieChart}>
            <div className="space-y-2">
              {data.diseaseDistribution.map((item) => (
                <div key={item.disease} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm transition hover:border-brand-100 hover:bg-brand-50/50">
                  <span className="font-medium text-slate-700">{item.disease}</span>
                  <strong className="numeric text-slate-900">{item.count}</strong>
                </div>
              ))}
              {!data.diseaseDistribution.length && <EmptyState icon={PieChart} title="No diagnoses recorded" />}
            </div>
          </Panel>

          <Panel eyebrow="Cohort" title="Patient progress" icon={Stethoscope}>
            <div className="overflow-x-auto">
              <table className="clinical-table w-full min-w-[480px] text-left text-sm">
                <thead><tr><th>Patient</th><th>Adherence</th><th>Recovery status</th><th>Active Rx</th></tr></thead>
                <tbody>
                  {data.patientProgress.map((item) => (
                    <tr key={item.patientId}>
                      <td className="py-2.5 pr-3 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2.5 pr-3 numeric">{item.adherence == null ? 'No data' : `${item.adherence}%`}</td>
                      <td className="py-2.5 pr-3 text-slate-600">{item.recoveryStatus}</td>
                      <td className="py-2.5 numeric">{item.activePrescriptions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.patientProgress.length && <EmptyState icon={Stethoscope} title="No connected patients match" text="Loosen the filters to see a wider patient cohort." />}
            </div>
          </Panel>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">{data.definitions?.adherenceRate} {data.definitions?.completedTreatments} {data.definitions?.recovery}</p>
      </>}
    </div></main>
  );
}
