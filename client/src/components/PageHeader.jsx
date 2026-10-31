import { Activity } from 'lucide-react';

/**
 * Clinical page header — eyebrow, title, description and an optional action slot.
 * Carries the ECG accent that anchors every workspace page.
 */
export default function PageHeader({ eyebrow, title, description, action, icon: Icon = Activity, tone = 'brand', meta }) {
  const toneStyles = {
    brand: 'border-brand-100 bg-brand-50 text-brand-700',
    info: 'border-sky-100 bg-sky-50 text-sky-700',
    stable: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    critical: 'border-rose-100 bg-rose-50 text-rose-700',
    ai: 'border-violet-100 bg-violet-50 text-violet-700'
  };

  return (
    <div className="surface-card panel-toplight relative mb-6 overflow-hidden rounded-[26px] p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 opacity-[.45]" aria-hidden="true">
        <div className="ecg-trace" />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${toneStyles[tone] || toneStyles.brand}`}>
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-.04em] text-slate-900 sm:text-3xl">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
            {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
