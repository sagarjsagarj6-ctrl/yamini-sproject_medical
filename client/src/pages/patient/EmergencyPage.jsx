import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, HeartPulse, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';

const EMERGENCY_FIELDS = [
  { key: 'emergencyContact', label: 'Emergency contact', icon: PhoneCall, tone: 'critical' },
  { key: 'bloodGroup', label: 'Blood group', icon: HeartPulse, tone: 'critical' },
  { key: 'allergies', label: 'Known allergies', icon: ShieldAlert, tone: 'caution' },
  { key: 'existingHealthConditions', label: 'Existing conditions', icon: ShieldAlert, tone: 'caution' },
  { key: 'currentMedications', label: 'Current medications', icon: HeartPulse, tone: 'info' },
  { key: 'emergencyNotes', label: 'Emergency notes', icon: ShieldAlert, tone: 'brand' }
];

const RAIL = {
  critical: 'var(--vital-critical, #e11d48)',
  caution: 'var(--vital-caution, #d97706)',
  info: 'var(--vital-info, #0284c7)',
  brand: 'var(--brand-600, #0a9187)'
};

export default function EmergencyPage() {
  const { user } = useAuth();
  const [emergency, setEmergency] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get(`/patients/${user.id}/emergency`)
      .then((response) => {
        if (active) setEmergency(response.data.emergency);
      })
      .catch((reason) => {
        if (active) setError(reason.response?.data?.message || 'Could not load emergency information.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Private patient record"
          title="Emergency information"
          description="This summary is visible only to you and verified doctors who have an approved connection with you."
          icon={ShieldAlert}
          tone="critical"
          meta={
            <span className="chip chip-critical">
              <span className="live-dot" aria-hidden="true" />
              Restricted access
            </span>
          }
        />

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="surface-card rounded-[26px] p-6">
            <div className="skeleton h-5 w-56" />
            <div className="skeleton mt-4 h-4 w-full" />
            <div className="skeleton mt-2 h-4 w-4/5" />
          </div>
        )}

        {!loading && !emergency && !error && (
          <Panel title="Emergency summary" icon={ShieldAlert} tone="critical">
            <EmptyState
              icon={ShieldAlert}
              title="No emergency summary yet"
              text="Add your emergency contact, blood group, allergies and current medications so verified doctors can act quickly."
            />
          </Panel>
        )}

        {emergency && (
          <section className="surface-card panel-toplight rounded-[26px] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-700">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <p className="eyebrow">MEDICO emergency summary</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-.03em] text-slate-900">{emergency.name}</h2>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {EMERGENCY_FIELDS.map(({ key, label, icon: Icon, tone }) => (
                <div
                  key={key}
                  className="vital-rail rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-soft"
                  style={{ '--rail': RAIL[tone] }}
                >
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="mt-1.5 text-sm text-slate-700">{emergency[key] || 'Not recorded'}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Information is patient-entered unless marked otherwise. It is not a substitute for emergency services.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
