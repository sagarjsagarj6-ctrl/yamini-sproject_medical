import { useEffect, useState } from 'react';
import { BellRing, Clock3, Pill, MessageCircle } from 'lucide-react';
import api from '../../services/api';
import Panel from '../../components/ui/Panel';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';
import WhatsAppModal from '../../components/WhatsAppModal';

const foodLabel = (value) =>
  ({
    BEFORE_FOOD: 'Before food',
    AFTER_FOOD: 'After food',
    WITH_FOOD: 'With food',
    ANY: 'Any time'
  }[value] ||
  value ||
  'Any time');

const formatClock = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safeSeconds / 86_400);
  const hours = Math.floor((safeSeconds % 86_400) / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const seconds = safeSeconds % 60;
  return {
    days,
    clock: [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':')
  };
};

function MedicineArtwork({ imageUrl, name, className = 'h-24 w-24' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUrl]);
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-50 via-white to-emerald-100 ${className}`}
    >
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={`${name} medicine`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          aria-label={`${name} image unavailable`}
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-brand-700"
        >
          <Pill className="h-8 w-8" aria-hidden="true" />
          <span className="max-w-[90%] truncate text-[10px] font-semibold">
            {name || 'Medicine'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MedicineOverviewPage() {
  const [medicines, setMedicines] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const load = async () => {
    try {
      const [medicineResponse, reminderResponse] = await Promise.all([
        api.get('/patient/medicines'),
        api.get('/patient/reminders')
      ]);
      setMedicines(medicineResponse.data.medicines || []);
      setReminders(
        (reminderResponse.data.reminders || [])
          .filter((item) => ['PENDING', 'SNOOZED'].includes(item.status))
          .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
      );
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not load your medicine plan.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nextReminder =
    reminders.find((reminder) => new Date(reminder.dueAt).getTime() >= now) || reminders[0] || null;
  const nextDueAt = nextReminder ? new Date(nextReminder.dueAt).getTime() : null;
  const secondsUntilNext = Number.isFinite(nextDueAt)
    ? Math.max(0, Math.ceil((nextDueAt - now) / 1000))
    : null;
  const doseIsDue = secondsUntilNext === 0;
  const nextClock = Number.isFinite(secondsUntilNext) ? formatClock(secondsUntilNext) : null;

  const logDose = async (reminderId, status) => {
    setWorking(reminderId);
    setMessage('');
    try {
      await api.post('/patient/medication-logs', { reminderId, status });
      await load();
      setMessage(status === 'TAKEN' ? 'Dose recorded.' : 'Dose marked missed.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not record this dose.');
    } finally {
      setWorking(null);
    }
  };

  const snooze = async (reminderId) => {
    setWorking(reminderId);
    try {
      await api.patch(`/reminders/${reminderId}/snooze`, { minutes: 10 });
      await load();
      setMessage('Reminder snoozed for 10 minutes.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not snooze this reminder.');
    } finally {
      setWorking(null);
    }
  };

  const reportIssue = async (reminderId) => {
    setWorking(reminderId);
    try {
      await api.post(`/reminders/${reminderId}/report-issue`, {});
      setMessage('Your care team was notified.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not report this issue.');
    } finally {
      setWorking(null);
    }
  };

  const openWhatsAppModal = (item) => {
    setWhatsAppData({
      medicineName: item.medicineName,
      dosage: item.dosage,
      scheduledTime: item.dueAt || item.reminderTimes?.[0] || 'Scheduled',
      foodLabel: foodLabel(item.foodInstruction),
      doctorName: item.doctorName,
      specialInstructions: item.specialInstructions,
      imageUrl: item.imageUrl,
      whatsappText: item.whatsappText,
      whatsappUrl: item.whatsappUrl
    });
    setIsWhatsAppOpen(true);
  };

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {message && (
          <p
            role="status"
            className="mb-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm text-brand-800"
          >
            {message}
          </p>
        )}

        {/* Next Dosage Hero Card */}
        <Panel
          className="mb-6 overflow-hidden border-brand-100 bg-gradient-to-r from-white via-cyan-50/50 to-emerald-50/70"
          title="Next dosage"
          subtitle={
            nextReminder
              ? doseIsDue
                ? 'Your next scheduled dose is due now.'
                : 'Countdown to your next scheduled dose.'
              : 'The countdown starts when a doctor schedules your medication.'
          }
          icon={Clock3}
        >
          {nextReminder ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <MedicineArtwork
                  imageUrl={nextReminder.imageUrl}
                  name={nextReminder.medicineName}
                  className="h-20 w-20 sm:h-24 sm:w-24"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[.15em] text-brand-700">
                    {doseIsDue ? 'Dose due now' : 'Up next'}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                    {nextReminder.medicineName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {nextReminder.dosage} · {new Date(nextReminder.dueAt).toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => openWhatsAppModal(nextReminder)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp Reminder</span>
                  </button>
                </div>
              </div>

              <div
                className={`rounded-2xl px-5 py-4 text-center ${
                  doseIsDue ? 'bg-amber-100 text-amber-900' : 'bg-white text-brand-800 shadow-sm'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[.16em]">
                  {doseIsDue ? 'Time to take dose' : 'Countdown to next dose'}
                </p>
                <p
                  role="timer"
                  aria-label={
                    doseIsDue
                      ? 'Next dose is due now'
                      : `Time remaining: ${
                          nextClock?.days ? `${nextClock.days} days, ` : ''
                        }${nextClock?.clock}`
                  }
                  aria-live="off"
                  className="mt-1 whitespace-nowrap font-mono text-2xl font-bold tabular-nums tracking-wide sm:text-3xl"
                >
                  {doseIsDue ? (
                    '00:00:00'
                  ) : (
                    <>
                      {nextClock?.days > 0 && <span className="mr-2 text-base">{nextClock.days}d</span>}
                      {nextClock?.clock}
                    </>
                  )}
                </p>
                {doseIsDue && <p className="mt-1 text-xs font-semibold">Dose due now</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-3">
              <Clock3 className="h-5 w-5 shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-semibold text-slate-800">No dose scheduled yet</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Your live countdown will appear here after a doctor adds a scheduled medicine.
                </p>
              </div>
            </div>
          )}
        </Panel>

        {/* Current Treatment Shelf */}
        <Panel
          title="Current treatment"
          subtitle="Doses and medications exactly as decided by your doctor."
          icon={Pill}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {medicines.map((medicine) => (
              <article
                key={medicine.id}
                className="hover-lift vital-rail flex gap-4 rounded-3xl border border-slate-200/80 bg-white/75 p-5"
              >
                <MedicineArtwork imageUrl={medicine.imageUrl} name={medicine.medicineName} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-base">{medicine.medicineName}</h3>
                  <p className="mt-1 text-xs font-semibold text-brand-700">
                    {medicine.dosage} {medicine.dosageUnit} · {medicine.frequency}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {foodLabel(medicine.foodInstruction)} · {medicine.durationDays} days
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Reminder times:{' '}
                    {medicine.reminderTimes?.length
                      ? medicine.reminderTimes.join(', ')
                      : 'Not scheduled'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">Prescribed by {medicine.doctorName}</p>
                  {medicine.specialInstructions && (
                    <p className="mt-2.5 rounded-xl bg-brand-50/60 p-2.5 text-xs text-slate-600">
                      <strong>Doctor Note:</strong> {medicine.specialInstructions}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => openWhatsAppModal(medicine)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp Reminder</span>
                  </button>
                </div>
              </article>
            ))}
            {!medicines.length && (
              <div className="sm:col-span-2">
                <EmptyState
                  icon={Pill}
                  title="No active medicine schedule"
                  text="Ask a connected doctor if you expected a prescription."
                />
              </div>
            )}
          </div>
        </Panel>

        {/* Dose Queue */}
        <Panel
          className="mt-6"
          title="Dose queue"
          subtitle="Your next scheduled doses, in time order. Log a dose when its scheduled time arrives."
          icon={BellRing}
        >
          <div className="space-y-3">
            {(showAllReminders ? reminders : reminders.slice(0, 12)).map((reminder) => {
              const dueAtMs = new Date(reminder.dueAt).getTime();
              const responseWindowOpen = dueAtMs <= now + 5 * 60_000;
              const remainingClock = formatClock(Math.ceil((dueAtMs - now) / 1000));
              return (
                <article
                  key={reminder.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4 transition-shadow hover:shadow-soft sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <MedicineArtwork
                      imageUrl={reminder.imageUrl}
                      name={reminder.medicineName}
                      className="h-16 w-16 rounded-xl"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">
                        {reminder.medicineName} · {reminder.dosage}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        {new Date(reminder.dueAt).toLocaleString()}
                        <StatusPill status={reminder.status} />
                      </p>
                      {!responseWindowOpen && (
                        <p className="mt-1 font-mono text-xs font-semibold tabular-nums text-brand-700">
                          Countdown: {remainingClock.days > 0 && `${remainingClock.days}d `}
                          {remainingClock.clock}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openWhatsAppModal(reminder)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    {responseWindowOpen && (
                      <>
                        <button
                          type="button"
                          disabled={working === reminder.id}
                          onClick={() => logDose(reminder.id, 'TAKEN')}
                          className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
                        >
                          Taken
                        </button>
                        <button
                          type="button"
                          disabled={working === reminder.id}
                          onClick={() => logDose(reminder.id, 'MISSED')}
                          className="secondary-btn min-h-9 px-3"
                        >
                          Missed
                        </button>
                        <button
                          type="button"
                          disabled={working === reminder.id}
                          onClick={() => snooze(reminder.id)}
                          className="secondary-btn min-h-9 px-3"
                        >
                          Snooze 10m
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={working === reminder.id}
                      onClick={() => reportIssue(reminder.id)}
                      className="secondary-btn min-h-9 px-3"
                    >
                      Report issue
                    </button>
                  </div>
                </article>
              );
            })}
            {!reminders.length && (
              <EmptyState
                icon={BellRing}
                title="No upcoming doses"
                text="Scheduled doses from your active prescriptions appear here."
              />
            )}
          </div>
          {reminders.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAllReminders((current) => !current)}
              className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              {showAllReminders
                ? 'Show next 12 doses'
                : `Show all ${reminders.length} scheduled doses`}
            </button>
          )}
        </Panel>
      </div>

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        data={whatsAppData}
      />
    </main>
  );
}
