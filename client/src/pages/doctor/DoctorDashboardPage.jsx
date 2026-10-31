import { useEffect, useState } from 'react';
import { Activity, Bell, BriefcaseMedical, Check, ClipboardList, FileText, MessageSquareText, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import Panel from '../../components/ui/Panel';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';
import MedicalAgentChat from '../../components/MedicalAgentChat';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [insights, setInsights] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [assessment, setAssessment] = useState({ patientId: '', score: '', status: 'Improving', clinicalAssessment: '', followUpRecommendation: '' });
  const [assessmentMessage, setAssessmentMessage] = useState('');
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [updatingPrescription, setUpdatingPrescription] = useState(null);

  useEffect(() => {
    if (!user) return;

    api.get('/doctor/dashboard').then((res) => {
      setStats(res.data.stats);
      setPatients(res.data.patients || []);
      setPrescriptions(res.data.recentPrescriptions || []);
    }).catch(() => {
      setStats({
        totalPatients: 0,
        activePatients: 0,
        completedTreatments: 0,
        pendingConnectionRequests: 0,
        todayAppointments: 0,
        upcomingFollowUps: 0,
        recentPrescriptions: 0,
        patientsRequiringAttention: 0
      });
    });

    api.get('/notifications').then((res) => {
      const items = res.data.notifications || [];
      setNotifications(items.slice(0, 3));
      setUnreadNotifications(items.filter((item) => !item.read).length);
    }).catch(() => {
      setNotifications([]);
      setUnreadNotifications(0);
    });

    api.get('/insights/recent').then((res) => setInsights(res.data.insights?.[0] || null)).catch(() => setInsights(null));
  }, [user]);

  const saveAssessment = async (event) => {
    event.preventDefault();
    setAssessmentMessage('');
    setSavingAssessment(true);
    try {
      await api.post(`/patients/${assessment.patientId}/recovery-assessments`, {
        score: Number(assessment.score),
        status: assessment.status,
        clinicalAssessment: assessment.clinicalAssessment,
        followUpRecommendation: assessment.followUpRecommendation
      });
      setAssessment({ patientId: '', score: '', status: 'Improving', clinicalAssessment: '', followUpRecommendation: '' });
      setAssessmentMessage('Recovery assessment saved and patient notified.');
    } catch (error) {
      setAssessmentMessage(error.response?.data?.message || 'Could not save this recovery assessment.');
    } finally {
      setSavingAssessment(false);
    }
  };

  const updatePrescription = async (prescription) => {
    const status = prescription.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
    setUpdatingPrescription(prescription.id);
    try {
      const response = await api.patch(`/prescriptions/${prescription.id}/status`, { status });
      setPrescriptions((current) => current.map((item) => item.id === prescription.id ? response.data.prescription : item));
      setStats((current) => ({
        ...current,
        completedTreatments: current.completedTreatments + (status === 'COMPLETED' ? 1 : -1)
      }));
    } catch (_error) {
      setAssessmentMessage('Could not update prescription status.');
    } finally {
      setUpdatingPrescription(null);
    }
  };

  return (
    <main className="min-w-0 p-5 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        {user?.verificationStatus !== 'VERIFIED' && <div role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Your doctor account is {user?.verificationStatus || 'not verified'}. Review your profile and submit medical registration details. Prescription and clinical assessment actions are enabled after verification. <Link to="/profile" className="ml-1 font-semibold underline">Open profile</Link></div>}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Doctor workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-900">Welcome back, {user?.name?.split(' ')[0] || 'Doctor'}.</h1>
            <p className="mt-2 text-sm text-slate-500">A live view of your patient care activity.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/notifications" className="secondary-btn"><Bell className="h-4 w-4" /> Notifications{unreadNotifications > 0 ? ` · ${unreadNotifications}` : ''}</Link>
            <Link to="/doctor/insights" className="primary-btn"><MessageSquareText className="h-4 w-4" /> View insights</Link>
          </div>
        </div>

        <div className="stagger-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Patients" value={stats?.totalPatients ?? 0} icon={Users} tone="brand" />
          <StatCard label="Active Patients" value={stats?.activePatients ?? 0} icon={Activity} tone="stable" />
          <StatCard label="Completed Treatments" value={stats?.completedTreatments ?? 0} icon={BriefcaseMedical} tone="info" />
          <StatCard label="Pending Requests" value={stats?.pendingConnectionRequests ?? 0} icon={Bell} tone="caution" />
        </div>

        {/* Clinical Intelligence Agent Chat Bar */}
        <section className="mt-8">
          <MedicalAgentChat role="DOCTOR" userName={user?.name} />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Panel
            title="Recent patients"
            eyebrow="Care network"
            icon={Users}
            action={<span className="text-xs font-medium text-slate-400">{patients.length} {patients.length === 1 ? 'patient' : 'patients'}</span>}
          >
            <div className="space-y-3">
              {patients.length ? patients.map((patient) => (
                <div key={patient.id} className="hover-lift flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Stethoscope className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{patient.name}</p>
                      {patient.primaryDisease && <p className="truncate text-sm text-slate-500">{patient.primaryDisease}</p>}
                    </div>
                  </div>
                </div>
              )) : <EmptyState icon={Users} title="No patient records yet" text="Patients appear here once a connection request is approved." />}
            </div>
          </Panel>

          <Panel title="Record recovery assessment" eyebrow="Clinical record" icon={ClipboardList} bodyClassName="pt-5">
            {patients.length && user?.verificationStatus === 'VERIFIED' ? (
              <form onSubmit={saveAssessment} className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-600">Patient
                  <select required value={assessment.patientId} onChange={(event) => setAssessment((current) => ({ ...current, patientId: event.target.value }))} className="form-input">
                    <option value="">Select connected patient</option>
                    {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-600">Recovery assessment (0-100)
                  <input required type="number" min="0" max="100" value={assessment.score} onChange={(event) => setAssessment((current) => ({ ...current, score: event.target.value }))} className="form-input" />
                </label>
                <label className="text-sm font-medium text-slate-600">Recovery status
                  <select value={assessment.status} onChange={(event) => setAssessment((current) => ({ ...current, status: event.target.value }))} className="form-input">
                    {['Under Treatment', 'Improving', 'Stable', 'Requires Reassessment', 'Recovered'].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-600">Follow-up recommendation
                  <input value={assessment.followUpRecommendation} onChange={(event) => setAssessment((current) => ({ ...current, followUpRecommendation: event.target.value }))} className="form-input" placeholder="Optional" />
                </label>
                <label className="text-sm font-medium text-slate-600 sm:col-span-2">Clinical assessment
                  <textarea value={assessment.clinicalAssessment} onChange={(event) => setAssessment((current) => ({ ...current, clinicalAssessment: event.target.value }))} className="form-input min-h-20" placeholder="Clinical notes" />
                </label>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <button disabled={savingAssessment} className="primary-btn disabled:opacity-50">{savingAssessment ? 'Saving…' : 'Save assessment'}</button>
                  {assessmentMessage && <p role="status" className="text-sm text-slate-600">{assessmentMessage}</p>}
                </div>
              </form>
            ) : <EmptyState icon={ClipboardList} title="No approved connections" text="An approved patient connection is needed before recording an assessment." />}
          </Panel>

          <Panel
            title="Treatment completion"
            eyebrow="Medication adherence"
            icon={FileText}
            action={<span className="text-sm text-slate-500">{stats?.completedTreatments ?? 0} completed</span>}
          >
            <div className="space-y-3">
              {prescriptions.length ? prescriptions.map((prescription) => (
                <div key={prescription.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-soft sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{prescription.medication}</p>
                    <p className="text-sm text-slate-500">{prescription.dosage} · {patients.find((patient) => patient.id === prescription.patientId)?.name || 'Patient'}</p>
                    <div className="mt-2"><StatusPill status={prescription.status || 'ACTIVE'} /></div>
                  </div>
                  <button type="button" disabled={updatingPrescription === prescription.id} onClick={() => updatePrescription(prescription)} className="secondary-btn shrink-0 gap-2 disabled:opacity-50"><Check className="h-4 w-4" />{prescription.status === 'COMPLETED' ? 'Reopen' : 'Mark completed'}</button>
                </div>
              )) : <EmptyState icon={FileText} title="No prescriptions to track" text="Issued prescriptions will appear here for completion status." />}
            </div>
          </Panel>

          <Panel title="Today’s focus" eyebrow="Schedule" icon={Activity}>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="vital-rail rounded-2xl border border-brand-100 bg-brand-50/70 p-4" style={{ '--rail': '#0a9187' }}><p className="font-semibold text-brand-700">Appointments</p><p className="mt-2">{stats?.todayAppointments ?? 0} on the schedule</p></div>
              <div className="vital-rail rounded-2xl border border-amber-100 bg-amber-50/70 p-4" style={{ '--rail': '#d97706' }}><p className="font-semibold text-amber-700">Follow-ups</p><p className="mt-2">{stats?.upcomingFollowUps ?? 0} upcoming reviews</p></div>
              <div className="vital-rail rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4" style={{ '--rail': '#0f9d6e' }}><p className="font-semibold text-emerald-700">Prescriptions</p><p className="mt-2">{stats?.recentPrescriptions ?? 0} issued recently</p></div>
            </div>
          </Panel>

          <Panel
            title="Clinical insight"
            eyebrow="AI summary"
            icon={MessageSquareText}
            tone="ai"
            action={<Link to="/doctor/insights" className="text-sm font-semibold text-brand-700 transition hover:text-brand-800">Details</Link>}
          >
            <p className="text-sm leading-6 text-slate-600">{insights?.summary || 'Insights will appear when patient activity is available.'}</p>
            {insights?.alerts?.[0] && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-800">{insights.alerts[0].title}</p><p className="mt-1 text-sm text-amber-700">{insights.alerts[0].description}</p></div>}
          </Panel>

          <Panel
            title="Recent notifications"
            eyebrow="Alerts"
            icon={Bell}
            action={<Link to="/notifications" className="text-sm font-semibold text-brand-700 transition hover:text-brand-800">View all</Link>}
          >
            <div className="space-y-1">
              {notifications.length ? notifications.map((item) => (
                <div key={item.id} className="border-b border-slate-100 py-3 last:border-0 last:pb-0"><p className="font-semibold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.message}</p></div>
              )) : <EmptyState icon={Bell} title="You’re all caught up" text="New alerts from your care network will appear here." />}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
