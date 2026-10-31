import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, Phone, Send, X } from 'lucide-react';

export default function WhatsAppModal({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');

  if (!isOpen || !data) return null;

  const {
    medicineName = 'Medication',
    dosage = '',
    scheduledTime = '',
    foodLabel = '',
    doctorName = 'Your Doctor',
    specialInstructions = '',
    whatsappText = '',
    whatsappUrl = '',
    patientPhone = ''
  } = data;

  const targetPhone = customPhone.trim() || patientPhone || '';
  const cleanPhone = targetPhone.replace(/[^\d+]/g, '').replace(/^\+/, '');

  const dynamicWhatsAppUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappText)}`
    : (whatsappUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = whatsappText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    window.open(dynamicWhatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 id="whatsapp-modal-title" className="text-base font-bold text-white">
                WhatsApp Medication Reminder
              </h3>
              <p className="text-xs text-emerald-100">
                Send dosage instructions directly via WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
          {/* Medication Summary Header */}
          <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={medicineName}
                className="h-16 w-16 rounded-xl object-cover shadow-sm border border-emerald-200/60"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <MessageCircle className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Scheduled Medication
              </span>
              <h4 className="truncate text-base font-bold text-slate-900">{medicineName}</h4>
              <p className="text-xs text-slate-600">
                {dosage} · {foodLabel || 'Any time'}
              </p>
              <p className="text-[11px] text-slate-500">
                Prescribed by <span className="font-semibold text-slate-700">{doctorName}</span>
              </p>
            </div>
          </div>

          {/* WhatsApp Message Preview Bubble */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                WhatsApp Message Preview
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy text</span>
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp Styled Chat Bubble */}
            <div className="relative rounded-2xl rounded-tl-sm border border-emerald-200/80 bg-[#e7f8ee] p-4 text-xs font-mono leading-relaxed text-slate-800 shadow-sm whitespace-pre-line">
              {whatsappText}
              <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                <span>{scheduledTime ? new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                <span className="text-emerald-600">✓✓</span>
              </div>
            </div>
          </div>

          {/* Optional Recipient Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Recipient Phone Number (Optional)
            </label>
            <div className="relative mt-1">
              <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder={patientPhone ? `Default: ${patientPhone}` : 'e.g. +1234567890 (or leave empty to choose in WhatsApp)'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Leave blank to select contact inside WhatsApp, or enter a caregiver/family phone number.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
