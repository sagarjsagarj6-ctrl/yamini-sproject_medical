import AnimatedNumber from './AnimatedNumber';

/**
 * Clinical metric tile — the platform's standard KPI card.
 * Renders a vital-coded icon, an animated metric and an optional hint.
 */
export default function StatCard({
  label,
  value = 0,
  icon: Icon,
  hint,
  suffix = '',
  prefix = '',
  decimals = 0,
  tone = 'brand',
  unit,
  animate = true
}) {
  const tones = {
    brand: { icon: 'bg-brand-50 text-brand-700 border-brand-100', rail: '#0a9187' },
    stable: { icon: 'bg-emerald-50 text-emerald-700 border-emerald-100', rail: '#0f9d6e' },
    caution: { icon: 'bg-amber-50 text-amber-700 border-amber-100', rail: '#d97706' },
    critical: { icon: 'bg-rose-50 text-rose-700 border-rose-100', rail: '#e11d48' },
    info: { icon: 'bg-sky-50 text-sky-700 border-sky-100', rail: '#0284c7' },
    ai: { icon: 'bg-violet-50 text-violet-700 border-violet-100', rail: '#7c3aed' }
  };
  const t = tones[tone] || tones.brand;

  return (
    <div className="surface-card hover-lift vital-rail rounded-2xl p-5" style={{ '--rail': t.rail }}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${t.icon}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="number-glow mt-4 text-3xl font-semibold tracking-tight text-slate-900">
        {animate ? <AnimatedNumber value={value} suffix={suffix} prefix={prefix} decimals={decimals} /> : `${prefix}${value}${suffix}`}
      </p>
      {(hint || unit) && (
        <p className="mt-1.5 text-xs text-slate-500">
          {hint}
          {unit && <span className="ml-1 font-semibold text-brand-700">{unit}</span>}
        </p>
      )}
    </div>
  );
}
