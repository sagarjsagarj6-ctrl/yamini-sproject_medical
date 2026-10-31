import { useState } from 'react';
import { Bell, CheckCircle2, ChevronDown, ChevronUp, Clock, Info, MessageCircle, Pill, Utensils, XCircle } from 'lucide-react';
import StatusPill from './ui/StatusPill';

export default function MedicationCard({
  reminder,
  onRecordMedication,
  onSnooze,
  onReportIssue,
  onOpenWhatsApp,
  isLogging = false
}) {
  const [imageError, setImageError] = useState(false);
  const [showNotificationText, setShowNotificationText] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const {
    id,
    medicineName = 'Medication',
    dosage = '',
    dueAt,
    status = 'PENDING',
    imageUrl,
    foodInstruction = 'ANY',
    foodLabel = 'Flexible timing',
    specialInstructions = '',
    doctorName = 'Care team',
    diagnosis = '',
    notificationText = '',
    whatsappText = '',
    whatsappUrl = ''
  } = reminder;

  const dueTime = dueAt ? new Date(dueAt) : new Date();
  const isPast = dueTime.getTime() < Date.now();
  const isDueNow = Math.abs(dueTime.getTime() - Date.now()) <= 30 * 60_000;
  const isLogged = ['TAKEN', 'MISSED'].includes(status);

  // Styling based on food instruction
  const getFoodStyle = (instruction) => {
    switch (instruction) {
      case 'BEFORE_FOOD':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'AFTER_FOOD':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'WITH_FOOD':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-4 sm:p-4.5 shadow-xs transition-all duration-300 hover:border-brand-300 hover:shadow-md">
      {/* Top Banner: Food instruction & Status */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getFoodStyle(
            foodInstruction
          )}`}
        >
          <Utensils className="h-3 w-3" />
          <span>{foodLabel}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {isDueNow && status === 'PENDING' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-700 animate-pulse">
              Due Now
            </span>
          )}
          <StatusPill status={status} />
        </div>
      </div>

      {/* Main Card Body: Image + Medicine Details */}
      <div className="mt-3 flex items-start gap-3">
        {/* Medicine Image Container */}
        <div className="relative flex-shrink-0">
          <div className="h-16 w-16 sm:h-18 sm:w-18 overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-brand-50 shadow-inner flex items-center justify-center">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={`${medicineName} medicine`}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-0.5 text-brand-600">
                <Pill className="h-7 w-7" />
                <span className="text-[9px] font-semibold text-slate-400">Medicine</span>
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand-700 shadow-xs border border-slate-100">
            <Pill className="h-2.5 w-2.5" />
          </span>
        </div>

        {/* Medicine & Dosage Details */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
            {medicineName}
          </h3>

          {/* Dosage Tag */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="inline-block rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 border border-brand-100">
              Dosage: {dosage}
            </span>
          </div>

          {/* Timing details */}
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>Scheduled: <strong className="text-slate-800">{dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </p>

          {/* Prescribing Doctor */}
          <p className="mt-0.5 text-[11px] text-slate-500 truncate">
            By <span className="font-semibold text-slate-700">{doctorName}</span>
            {diagnosis && <span className="text-slate-400"> · {diagnosis}</span>}
          </p>
        </div>
      </div>

      {/* Special Instructions from Doctor (if any) */}
      {specialInstructions && (
        <div className="mt-2.5 rounded-xl border border-brand-100/80 bg-brand-50/50 p-2 text-[11px] text-slate-700">
          <p className="flex items-start gap-1">
            <Info className="h-3 w-3 text-brand-700 shrink-0 mt-0.5" />
            <span><strong className="text-brand-900">Note:</strong> {specialInstructions}</span>
          </p>
        </div>
      )}

      {/* Expandable Notification Reminder Text */}
      <div className="mt-2.5 border-t border-slate-100 pt-2">
        <button
          type="button"
          onClick={() => setShowNotificationText((prev) => !prev)}
          className="flex w-full items-center justify-between text-[10px] font-semibold text-slate-500 hover:text-brand-700 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Bell className="h-3 w-3 text-brand-600" />
            <span>Notification Text Preview</span>
          </span>
          {showNotificationText ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showNotificationText && (
          <div className="mt-1.5 rounded-lg bg-slate-50 p-2 text-[10px] font-mono text-slate-700 border border-slate-200/60 animate-fade-in">
            {notificationText || `⏰ Time for ${medicineName} (${dosage}). ${foodLabel}. Prescribed by ${doctorName}.`}
          </div>
        )}
      </div>

      {/* Action Footer: WhatsApp + Taken/Missed/Snooze */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        {/* WhatsApp Reminder Button */}
        <button
          type="button"
          onClick={() => onOpenWhatsApp(reminder)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95"
          title="Share or send reminder on WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </button>

        {/* Dose Status Actions */}
        {isLogged ? (
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            {status === 'TAKEN' ? (
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Taken
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-700">
                <XCircle className="h-3.5 w-3.5" /> Missed
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Snooze Options */}
            <div className="relative">
              <button
                type="button"
                disabled={isLogging}
                onClick={() => setShowSnoozeOptions((prev) => !prev)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Snooze
              </button>

              {showSnoozeOptions && (
                <div className="absolute bottom-full right-0 mb-1 z-20 w-28 rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-fade-in">
                  {[10, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setShowSnoozeOptions(false);
                        onSnooze?.(id, mins);
                      }}
                      className="block w-full rounded-lg px-2 py-1 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-800"
                    >
                      + {mins}m
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Missed Button */}
            <button
              type="button"
              disabled={isLogging}
              onClick={() => onRecordMedication(reminder, 'MISSED')}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
            >
              Missed
            </button>

            {/* Taken Button */}
            <button
              type="button"
              disabled={isLogging}
              onClick={() => onRecordMedication(reminder, 'TAKEN')}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-700 disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>{isLogging ? '…' : 'Taken'}</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
