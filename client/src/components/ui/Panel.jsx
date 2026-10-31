/**
 * Standard clinical panel — the surface every content block sits on.
 */
export default function Panel({ title, subtitle, eyebrow, icon: Icon, action, children, className = '', bodyClassName = '', tone }) {
  return (
    <section className={`surface-card panel-toplight overflow-hidden rounded-2xl ${className}`}>
      {(title || eyebrow || action) && (
        <header className="flex flex-col gap-3 border-b border-slate-100/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && (
              <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
                {Icon && (
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tone === 'ai' ? 'border-violet-100 bg-violet-50 text-violet-700' : 'border-brand-100 bg-brand-50 text-brand-700'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1.5 text-xs leading-5 text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`px-5 py-5 sm:px-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
