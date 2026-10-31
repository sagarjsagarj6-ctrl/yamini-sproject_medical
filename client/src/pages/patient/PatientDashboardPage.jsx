import { useEffect, useState } from 'react';
import {
  Activity,
  BellRing,
  HeartPulse,
  KeyRound,
  Pill,
  Users,
  Stethoscope,
  TrendingUp,
  ClipboardPlus,
  MessageCircle,
  Clock,
  Utensils,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

import PatientAnalyticsCharts from './PatientAnalyticsCharts';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Panel from '../../components/ui/Panel';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';
import MedicationCard from '../../components/MedicationCard';
import WhatsAppModal from '../../components/WhatsAppModal';
import MedicalAgentChat from '../../components/MedicalAgentChat';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loggingReminder, setLoggingReminder] = useState(null);
  const [reminderError, setReminderError] = useState('');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('week');
  const [medicationTab, setMedicationTab] = useState('reminders'); // 'reminders' | 'prescriptions'
  const [whatsAppData, setWhatsAppData] = useState(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const [symptomForm, setSymptomForm] = useState({
    symptom: '',
    severity: 5,
    notes: '',
    includeMeasurement: false,
    measurementLabel: '',
    measurementValue: '',
    measurementUnit: ''
  });
  const [symptomMessage, setSymptomMessage] = useState('');
  const [savingSymptom, setSavingSymptom] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/patient/dashboard');
      setStats(res.data.stats);
      setDoctors(res.data.doctors || []);
      setReminders(res.data.reminders || []);
      setActivePrescriptions(res.data.activePrescriptions || []);
    } catch {
      setStats({
        activeDoctors: 0,
        totalConnections: 0,
        upcomingReminders: 0,
        recoveryScore: 0,
        treatmentCompletion: 0
      });
      setDoctors([]);
      setReminders([]);
      setActivePrescriptions([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadDashboard();

    api
      .get('/notifications')
      .then((res) => setNotifications((res.data.notifications || []).slice(0, 4)))
      .catch(() => setNotifications([]));

    const loadAnalytics = () =>
      api
        .get('/patient/analytics', { params: { period: analyticsPeriod } })
        .then((res) => setAnalytics(res.data))
        .catch(() => setAnalytics(null));

    loadAnalytics();
    const refreshTimer = window.setInterval(loadAnalytics, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [user, analyticsPeriod]);

  const recordMedication = async (reminder, status) => {
    setLoggingReminder(reminder.id);
    setReminderError('');
    try {
      await api.post('/patient/medication-logs', { reminderId: reminder.id, status });
      const analyticsResponse = await api.get('/patient/analytics', {
        params: { period: analyticsPeriod }
      });
      await loadDashboard();
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      setReminderError(error.response?.data?.message || 'Could not save this medication update.');
    } finally {
      setLoggingReminder(null);
    }
  };

  const snoozeReminder = async (reminderId, minutes = 10) => {
    try {
      await api.patch(`/reminders/${reminderId}/snooze`, { minutes });
      await loadDashboard();
    } catch (error) {
      setReminderError(error.response?.data?.message || 'Could not snooze reminder.');
    }
  };

  const handleOpenWhatsApp = (item) => {
    setWhatsAppData({
      medicineName: item.medicineName,
      dosage: item.dosage,
      scheduledTime: item.dueAt || item.scheduledFor,
      foodLabel: item.foodLabel,
      doctorName: item.doctorName,
      specialInstructions: item.specialInstructions,
      imageUrl: item.imageUrl,
      whatsappText: item.whatsappText,
      whatsappUrl: item.whatsappUrl,
      patientPhone: user?.phone || ''
    });
    setIsWhatsAppOpen(true);
  };

  const submitSymptom = async (event) => {
    event.preventDefault();
    setSavingSymptom(true);
    setSymptomMessage('');
    if (
      symptomForm.includeMeasurement &&
      (!symptomForm.measurementLabel ||
        !symptomForm.measurementValue ||
        !symptomForm.measurementUnit)
    ) {
      setSymptomMessage('Complete all measurement fields or turn off the measurement option.');
      setSavingSymptom(false);
      return;
    }

    try {
      await api.post('/patient/symptom-logs', {
        symptom: symptomForm.symptom,
        severity: Number(symptomForm.severity),
        notes: symptomForm.notes,
        measurement: symptomForm.includeMeasurement
          ? {
              label: symptomForm.measurementLabel,
              value: Number(symptomForm.measurementValue),
              unit: symptomForm.measurementUnit
            }
          : null
      });
      setSymptomForm({
        symptom: '',
        severity: 5,
        notes: '',
        includeMeasurement: false,
        measurementLabel: '',
        measurementValue: '',
        measurementUnit: ''
      });
      setSymptomMessage('Symptom update saved.');
      const response = await api.get('/patient/analytics', { params: { period: analyticsPeriod } });
      setAnalytics(response.data);
    } catch (error) {
      setSymptomMessage(error.response?.data?.message || 'Could not save your symptom update.');
    } finally {
      setSavingSymptom(false);
    }
  };

  // Flatten active prescribed medicines from all active prescriptions
  const allPrescribedMedicines = activePrescriptions.flatMap((prescription) =>
    (prescription.medications || []).map((med) => ({
      ...med,
      prescriptionId: prescription.id,
      diagnosis: prescription.diagnosis,
      doctorName: prescription.doctorName,
      dosageFull: `${med.dosage} ${med.dosageUnit}`,
      startDate: prescription.startDate,
      endDate: prescription.endDate
    }))
  );

  return (
    <main className="min-w-0 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <PageHeader
          eyebrow="Patient workspace"
          title={`Hello, ${user?.name?.split(' ')[0] || 'Patient'}.`}
          description="Your care plan, medication schedule, WhatsApp reminders, and clinical updates — all on one console."
          icon={HeartPulse}
          tone="brand"
          action={
            <Link to="/patient/connection-code" className="secondary-btn min-h-11">
              <KeyRound className="h-4 w-4" /> Enter a doctor code
            </Link>
          }
        />

        {/* Top Summary Stats */}
        <div className="stagger-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Doctors"
            value={stats?.activeDoctors ?? 0}
            icon={Users}
            tone="brand"
            hint="Connected care team"
            animate
          />
          <StatCard
            label="Upcoming Reminders"
            value={stats?.upcomingReminders ?? 0}
            icon={BellRing}
            tone="info"
            hint="Scheduled doses due"
            animate
          />
          <StatCard
            label="Treatment Completion"
            value={stats?.treatmentCompletion ?? 0}
            suffix="%"
            icon={ClipboardPlus}
            tone="stable"
            hint="Across prescriptions"
            animate
          />
          <StatCard
            label="Recovery Score"
            value={stats?.recoveryScore ?? 0}
            suffix="%"
            icon={Activity}
            tone="caution"
            hint="Doctor assessment"
            animate
          />
        </div>

        {/* ========================================================================= */}
        {/* SMART MEDICAL RAG AGENT CHAT INPUT BAR                                   */}
        {/* ========================================================================= */}
        <section className="mt-8">
          <MedicalAgentChat role="PATIENT" userName={user?.name} />
        </section>

        {/* ========================================================================= */}
        {/* PRIMARY SECTION: MEDICATION CARDS & WHATSAPP REMINDER CENTER             */}
        {/* ========================================================================= */}
        <section className="mt-8">
          <div className="rounded-3xl border border-brand-200/90 bg-gradient-to-br from-white via-cyan-50/20 to-emerald-50/30 p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20">
                    <Pill className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Medication & Dosage Cards
                    </h2>
                    <p className="text-xs text-slate-500">
                      Reflecting medications, exact dosages, and visuals decided by your doctor.
                    </p>
                  </div>
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="tablist"
                  className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={medicationTab === 'reminders'}
                    onClick={() => setMedicationTab('reminders')}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      medicationTab === 'reminders'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    <span>Dose Reminders ({reminders.length})</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={medicationTab === 'prescriptions'}
                    onClick={() => setMedicationTab('prescriptions')}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      medicationTab === 'prescriptions'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardPlus className="h-3.5 w-3.5" />
                    <span>Doctor's Regimen ({allPrescribedMedicines.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error banner if any */}
            {reminderError && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-800"
              >
                {reminderError}
              </div>
            )}

            {/* Tab 1: Scheduled Dose Reminders as Cards */}
            {medicationTab === 'reminders' && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Upcoming Scheduled Doses
                  </p>
                  <span className="text-xs text-slate-500">
                    Click <strong>WhatsApp Reminder</strong> on any card to share or send alerts
                  </span>
                </div>

                {reminders.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {reminders.map((reminder) => (
                      <MedicationCard
                        key={reminder.id}
                        reminder={reminder}
                        onRecordMedication={recordMedication}
                        onSnooze={snoozeReminder}
                        onOpenWhatsApp={handleOpenWhatsApp}
                        isLogging={loggingReminder === reminder.id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Pill}
                    title="No scheduled doses right now"
                    text="Your upcoming medication cards will reflect here once your connected doctor prescribes a treatment."
                  />
                )}
              </div>
            )}

            {/* Tab 2: Doctor-Decided Medications & Prescriptions Shelf */}
            {medicationTab === 'prescriptions' && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Treatment Prescribed by Doctor
                  </p>
                  <Link
                    to="/patient/medicines"
                    className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    View Full Schedule & Countdown →
                  </Link>
                </div>

                {allPrescribedMedicines.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {allPrescribedMedicines.map((med, index) => (
                      <article
                        key={`${med.prescriptionId}-${index}`}
                        className="group overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          {/* Medicine Image */}
                          <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-brand-50 shadow-inner flex items-center justify-center">
                            {med.imageUrl ? (
                              <img
                                src={med.imageUrl}
                                alt={med.medicineName}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-brand-600">
                                <Pill className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          {/* Medicine Details */}
                          <div className="min-w-0 flex-1">
                            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-100">
                              Prescribed
                            </span>
                            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                              {med.medicineName}
                            </h3>
                            <p className="mt-1 text-xs font-semibold text-brand-700">
                              Dosage: {med.dosageFull}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Frequency: {med.frequency}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Prescribed by {med.doctorName}
                            </p>
                          </div>
                        </div>

                        {/* Timing and Food details */}
                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Times: {med.times?.length ? med.times.join(', ') : 'Daily'}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Utensils className="h-3.5 w-3.5 text-slate-400" />
                            <span>{med.foodLabel || 'Any time'}</span>
                          </div>

                          {med.specialInstructions && (
                            <p className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                              <strong>Note:</strong> {med.specialInstructions}
                            </p>
                          )}
                        </div>

                        {/* WhatsApp Action */}
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenWhatsApp({
                                medicineName: med.medicineName,
                                dosage: med.dosageFull,
                                scheduledTime: med.times?.[0] || 'Scheduled',
                                foodLabel: med.foodLabel,
                                doctorName: med.doctorName,
                                specialInstructions: med.specialInstructions,
                                imageUrl: med.imageUrl,
                                whatsappText: med.whatsappText,
                                whatsappUrl: med.whatsappUrl
                              })
                            }
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Share Regimen on WhatsApp</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={ClipboardPlus}
                    title="No active prescription regimens"
                    text="Your doctor's prescribed treatment cards with images and dosages will appear here."
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Analytics Section */}
        <Panel
          className="mt-8"
          eyebrow="Patient analytics"
          title="Care progress"
          subtitle="Adherence, symptom reports, and doctor assessment stay separate measures."
          icon={TrendingUp}
          action={
            <div className="flex flex-col gap-2 sm:items-end">
              <div
                role="group"
                aria-label="Analytics time range"
                className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
              >
                {[
                  ['day', 'Day'],
                  ['week', 'Week'],
                  ['month', 'Month']
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={analyticsPeriod === value}
                    onClick={() => setAnalyticsPeriod(value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      analyticsPeriod === value
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <span className="live-dot" aria-hidden="true" />
                Refreshes every 30 seconds ·{' '}
                {analytics?.refreshedAt
                  ? new Date(analytics.refreshedAt).toLocaleTimeString()
                  : 'waiting for data'}
              </p>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="vital-rail rounded-2xl bg-cyan-50/70 p-4">
              <p className="text-sm font-medium text-slate-600">Medication adherence</p>
              <p className="numeric mt-2 text-2xl font-semibold text-slate-900">
                {analytics?.periodAdherence == null ? 'No data' : `${analytics.periodAdherence}%`}
              </p>
              <p className="mt-1 text-xs text-slate-500">Based on logged doses in this period</p>
            </div>
            <div className="vital-rail rounded-2xl bg-emerald-50/70 p-4">
              <p className="text-sm font-medium text-slate-600">Doctor recovery assessment</p>
              <p className="numeric mt-2 text-2xl font-semibold text-slate-900">
                {analytics?.latestRecoveryScore == null
                  ? 'No assessment'
                  : `${analytics.latestRecoveryScore}%`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {analytics?.recoveryAssessmentCount || 0} recorded assessments
              </p>
            </div>
            <div className="vital-rail rounded-2xl bg-amber-50/70 p-4">
              <p className="text-sm font-medium text-slate-600">Treatment completion</p>
              <p className="numeric mt-2 text-2xl font-semibold text-slate-900">
                {analytics?.treatmentCompletion == null
                  ? 'No prescriptions'
                  : `${analytics.treatmentCompletion}%`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {analytics?.prescriptions?.completed || 0} of{' '}
                {analytics?.prescriptions?.total || 0} prescriptions completed
              </p>
            </div>
          </div>

          <div className="mt-5">
            <PatientAnalyticsCharts
              trend={analytics?.trend || []}
              measurements={analytics?.measurementTrend || []}
            />
          </div>

          <form
            onSubmit={submitSymptom}
            className="mt-5 rounded-2xl border border-slate-200/80 bg-white/70 p-4 sm:p-5"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-xl bg-brand-50 p-2 text-brand-700">
                <ClipboardPlus className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Record a symptom</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Your report is kept separate from medication adherence and your doctor’s recovery assessment.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                Symptom
                <input
                  required
                  maxLength="120"
                  value={symptomForm.symptom}
                  onChange={(event) =>
                    setSymptomForm((current) => ({ ...current, symptom: event.target.value }))
                  }
                  className="form-input"
                  placeholder="e.g. headache"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Severity: {symptomForm.severity}/10
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={symptomForm.severity}
                  onChange={(event) =>
                    setSymptomForm((current) => ({ ...current, severity: event.target.value }))
                  }
                  className="mt-3 block w-full accent-brand-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-600 sm:col-span-2">
                Notes
                <textarea
                  maxLength="500"
                  value={symptomForm.notes}
                  onChange={(event) =>
                    setSymptomForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  className="form-input min-h-20"
                  placeholder="Optional details"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={symptomForm.includeMeasurement}
                  onChange={(event) =>
                    setSymptomForm((current) => ({
                      ...current,
                      includeMeasurement: event.target.checked
                    }))
                  }
                />{' '}
                Add a relevant measurement
              </label>
              {symptomForm.includeMeasurement && (
                <>
                  <label className="text-sm font-medium text-slate-600">
                    Measurement name
                    <input
                      required
                      value={symptomForm.measurementLabel}
                      onChange={(event) =>
                        setSymptomForm((current) => ({
                          ...current,
                          measurementLabel: event.target.value
                        }))
                      }
                      className="form-input"
                      placeholder="Blood pressure"
                    />
                  </label>
                  <div className="grid grid-cols-[1fr_6rem] gap-3">
                    <label className="text-sm font-medium text-slate-600">
                      Value
                      <input
                        required
                        type="number"
                        step="any"
                        value={symptomForm.measurementValue}
                        onChange={(event) =>
                          setSymptomForm((current) => ({
                            ...current,
                            measurementValue: event.target.value
                          }))
                        }
                        className="form-input"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-600">
                      Unit
                      <input
                        required
                        value={symptomForm.measurementUnit}
                        onChange={(event) =>
                          setSymptomForm((current) => ({
                            ...current,
                            measurementUnit: event.target.value
                          }))
                        }
                        className="form-input"
                        placeholder="mmHg"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button disabled={savingSymptom} className="primary-btn disabled:opacity-50">
                {savingSymptom ? 'Saving…' : 'Save symptom update'}
              </button>
              {symptomMessage && (
                <p role="status" className="text-sm text-slate-600">
                  {symptomMessage}
                </p>
              )}
            </div>
          </form>
        </Panel>

        {/* Bottom Section: Connected Care Team & Recent Notifications */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Care Team */}
          <Panel
            title="Your care team"
            subtitle="Doctors you are actively connected with."
            icon={Stethoscope}
          >
            <div className="mt-1 space-y-4">
              {doctors.length ? (
                doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="hover-lift flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-sm">
                        {doctor.name?.charAt(0) || 'D'}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{doctor.name}</p>
                        <p className="text-sm text-slate-500">
                          {doctor.specialization || 'General Physician'} ·{' '}
                          {doctor.hospitalName || 'Clinic'}
                        </p>
                      </div>
                    </div>
                    <StatusPill status="ACTIVE" label="Connected" />
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Stethoscope}
                  title="No connected doctors yet"
                  text="Search for a doctor and request a connection to begin."
                  action={
                    <Link to="/patient/search-doctors" className="secondary-btn">
                      Find a doctor
                    </Link>
                  }
                />
              )}
            </div>
          </Panel>

          {/* Recent Notifications */}
          <Panel
            title="Recent notifications"
            subtitle="Medication alerts and clinical updates."
            icon={BellRing}
            action={
              <Link
                to="/notifications"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                View all →
              </Link>
            }
          >
            <div className="mt-1 space-y-3">
              {notifications.length ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-white/70 p-3.5 transition-colors hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 p-4 text-center">You’re all caught up.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        data={whatsAppData}
      />
    </main>
  );
}
