import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, HeartPulse, Stethoscope, Ruler } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

const TIP = {
  contentStyle: {
    borderRadius: '14px',
    border: '1px solid rgba(15, 23, 42, .08)',
    background: 'rgba(255, 255, 255, .96)',
    boxShadow: '0 18px 40px -24px rgba(15, 23, 42, .45)',
    fontSize: '12px',
    padding: '10px 12px'
  },
  labelStyle: { color: '#0f172a', fontWeight: 700, marginBottom: 4 },
  itemStyle: { color: '#475569' },
  cursor: { stroke: '#0a9187', strokeWidth: 1, strokeDasharray: '4 4' }
};

const AXIS = { fill: '#64748b', fontSize: 12 };
const GRID = { stroke: '#e2e8f0', strokeDasharray: '4 4' };

function Card({ icon: Icon, title, hint, children }) {
  return (
    <section className="surface-card panel-toplight rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function PatientAnalyticsCharts({ trend, measurements }) {
  const hasTrend = trend.some((point) => point.adherence !== null || point.recoveryScore !== null);
  const hasSymptoms = trend.some((point) => point.symptomSeverity !== null);

  return (
    <div className="space-y-6">
      <Card
        icon={Activity}
        title="Medication and recovery"
        hint="Separate measures: adherence uses your dose logs; recovery uses doctor-recorded assessments."
      >
        {hasTrend ? (
          <div className="h-64 w-full sm:h-72" aria-label="Medication adherence and clinician recovery trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid {...GRID} vertical={false} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  {...TIP}
                  formatter={(value, name) => [`${value}%`, name]}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.date ? new Date(payload[0].payload.date).toLocaleString() : ''}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="adherence" name="Medication adherence" stroke="#0a9187" strokeWidth={3} connectNulls={false} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#0a9187' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="recoveryScore" name="Doctor recovery assessment" stroke="#0f9d6e" strokeWidth={3} connectNulls={false} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#0f9d6e' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={HeartPulse}
            title="No records in this range"
            text="Log doses or ask your doctor to record an assessment to build your chart."
          />
        )}
      </Card>

      <Card
        icon={Stethoscope}
        title="Symptom progression"
        hint="Patient-reported severity, from 1 (mild) to 10 (severe)."
      >
        {hasSymptoms ? (
          <div className="h-56 w-full" aria-label="Patient reported symptom severity chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                <CartesianGrid {...GRID} vertical={false} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  {...TIP}
                  formatter={(value) => [`${value}/10`, 'Average severity']}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.date ? new Date(payload[0].payload.date).toLocaleString() : ''}
                />
                <Line type="monotone" dataKey="symptomSeverity" name="Average symptom severity" stroke="#d97706" strokeWidth={3} connectNulls={false} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#d97706' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={Stethoscope} title="No symptom entries" text="Symptom reports you log in this time range will appear here." />
        )}
      </Card>

      <Card icon={Ruler} title="Recent measurements" hint="Optional measurements attached to your symptom reports.">
        {measurements.length ? (
          <div className="mt-1 overflow-x-auto">
            <table className="clinical-table w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2 pr-4 font-semibold">Measurement</th>
                  <th className="pb-2 pr-4 font-semibold">Value</th>
                  <th className="pb-2 pr-4 font-semibold">Symptom</th>
                  <th className="pb-2 font-semibold">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {measurements.map((item, index) => (
                  <tr key={`${item.createdAt}-${index}`}>
                    <td className="py-3 pr-4 font-medium text-slate-800">{item.label}</td>
                    <td className="numeric py-3 pr-4 text-slate-700">{item.value} {item.unit}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.symptom}</td>
                    <td className="py-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Optional measurements you log will appear here.</p>
        )}
      </Card>
    </div>
  );
}
