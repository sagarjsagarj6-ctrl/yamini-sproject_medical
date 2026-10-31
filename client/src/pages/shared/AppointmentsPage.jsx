import { useEffect, useState } from 'react';
import { CalendarDays, Check, X, Clock, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';
import StatusPill from '../../components/ui/StatusPill';

const localDateTime = (date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const STATUS_TONE = {
  REQUESTED: 'chip-caution',
  CONFIRMED: 'chip-info',
  COMPLETED: 'chip-stable',
  CANCELLED: 'chip-neutral',
  REJECTED: 'chip-critical'
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: '', scheduledAt: localDateTime(new Date(Date.now() + 2 * 86_400_000)), reason: '' });
  const [followUps, setFollowUps] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [appointmentResponse, dashboardResponse] = await Promise.all([
        api.get('/appointments'),
        isDoctor ? Promise.resolve({ data: {} }) : api.get('/patient/dashboard')
      ]);
      setAppointments(appointmentResponse.data.appointments || []);
      setDoctors(dashboardResponse.data.doctors || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not load appointments.');
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const request = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      await api.post('/appointments', { ...form, scheduledAt: new Date(form.scheduledAt).toISOString(), timezone });
      setMessage('Appointment request sent. Your doctor will confirm or decline it.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not request this appointment.');
    } finally {
      setSaving(false);
    }
  };

  const doctorAction = async (appointment, action) => {
    setMessage('');
    try {
      await api.patch(`/appointments/${appointment.id}`, {
        action,
        scheduledAt: action === 'accept' ? appointment.scheduledAt : undefined
      });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update this appointment.');
    }
  };

  const cancel = async (appointment) => {
    try {
      await api.patch(`/appointments/${appointment.id}`, { action: 'cancel' });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not cancel this appointment.');
    }
  };

  const scheduleFollowUp = async (appointment) => {
    const date = followUps[appointment.id];
    if (!date) {
      setMessage('Choose a follow-up date first.');
      return;
    }
    try {
      await api.post(`/appointments/${appointment.id}/follow-up`, {
        scheduledAt: new Date(date).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });
      await load();
      setMessage('Follow-up scheduled.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not schedule this follow-up.');
    }
  };

  const requestedCount = appointments.filter((item) => item.status === 'REQUESTED').length;

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Care coordination"
          title="Appointments"
          description={
            isDoctor
              ? 'Review appointment requests, confirm a time, and schedule follow-ups.'
              : 'Request time with a connected doctor and keep your appointment history in one place.'
          }
          icon={CalendarDays}
          meta={
            <span className="chip chip-info">
              <span className="live-dot" aria-hidden="true" />
              {requestedCount ? `${requestedCount} awaiting action` : `${appointments.length} scheduled`}
            </span>
          }
        />

        {!isDoctor && (
          <Panel title="Request an appointment" icon={CalendarDays} className="mb-6">
            {doctors.length ? (
              <form onSubmit={request} className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-600">
                  Connected doctor
                  <select
                    required
                    value={form.doctorId}
                    onChange={(event) => setForm((current) => ({ ...current, doctorId: event.target.value }))}
                    className="form-input mt-2"
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} · {doctor.specialization || 'Doctor'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-600">
                  Preferred time
                  <input
                    required
                    type="datetime-local"
                    min={localDateTime(new Date())}
                    value={form.scheduledAt}
                    onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                    className="form-input mt-2"
                  />
                </label>
                <label className="text-sm font-medium text-slate-600 sm:col-span-2">
                  Reason or notes
                  <textarea
                    maxLength={1000}
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    className="form-input mt-2 min-h-20"
                  />
                </label>
                <div className="sm:col-span-2">
                  <button disabled={saving} className="primary-btn disabled:opacity-50">
                    <Clock className="h-4 w-4" />
                    {saving ? 'Sending…' : 'Request appointment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                Connect with a doctor before requesting an appointment.
              </div>
            )}
          </Panel>
        )}

        {message && (
          <p role="status" className="mb-6 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {message}
          </p>
        )}

        <Panel title="Appointment history" icon={CalendarDays}>
          {appointments.length ? (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <article key={appointment.id} className="vital-rail rounded-2xl border border-slate-100 bg-white p-4" style={{ '--rail': 'var(--brand-600, #0a9187)' }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-brand-700" aria-hidden="true" />
                        <h3 className="font-semibold text-slate-900">
                          {isDoctor ? 'Patient appointment' : 'Appointment'}
                        </h3>
                        <StatusPill status={appointment.status} tone={STATUS_TONE[appointment.status]} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {appointment.scheduledAt ? new Date(appointment.scheduledAt).toLocaleString() : 'Time not set'}
                      </p>
                      {appointment.reason && <p className="mt-1 text-sm text-slate-500">{appointment.reason}</p>}
                      {appointment.doctorNotes && (
                        <p className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">{appointment.doctorNotes}</p>
                      )}
                    </div>

                    {isDoctor && appointment.status === 'REQUESTED' && (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => doctorAction(appointment, 'accept')} className="primary-btn min-h-9 px-3">
                          <Check className="h-4 w-4" /> Confirm
                        </button>
                        <button type="button" onClick={() => doctorAction(appointment, 'reject')} className="secondary-btn min-h-9 px-3">
                          <X className="h-4 w-4" /> Decline
                        </button>
                      </div>
                    )}

                    {isDoctor && appointment.status === 'CONFIRMED' && (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => doctorAction(appointment, 'complete')} className="secondary-btn min-h-9 px-3">
                          Mark complete
                        </button>
                        <div className="flex flex-wrap gap-2">
                          <input
                            aria-label="Follow-up time"
                            type="datetime-local"
                            min={localDateTime(new Date())}
                            value={followUps[appointment.id] || ''}
                            onChange={(event) => setFollowUps((current) => ({ ...current, [appointment.id]: event.target.value }))}
                            className="form-input mt-0 min-h-9 max-w-56 py-2"
                          />
                          <button type="button" onClick={() => scheduleFollowUp(appointment)} className="secondary-btn min-h-9 px-3">
                            Schedule follow-up
                          </button>
                        </div>
                      </div>
                    )}

                    {!isDoctor && ['REQUESTED', 'CONFIRMED'].includes(appointment.status) && (
                      <button type="button" onClick={() => cancel(appointment)} className="secondary-btn min-h-9 self-start px-3">
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No appointment history yet"
              text={isDoctor ? 'Appointment requests from connected patients will appear here.' : 'Request an appointment with a connected doctor to see it here.'}
            />
          )}
        </Panel>
      </div>
    </main>
  );
}
