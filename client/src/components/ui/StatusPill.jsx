/**
 * Status pill — maps clinical states to vitals-coded badges.
 */
const MAP = {
  STABLE: 'chip-stable',
  ACTIVE: 'chip-stable',
  COMPLETED: 'chip-stable',
  RECOVERED: 'chip-stable',
  APPROVED: 'chip-stable',
  TAKEN: 'chip-stable',
  CAUTION: 'chip-caution',
  PENDING: 'chip-caution',
  IMPROVING: 'chip-info',
  ACTIVE_PRESCRIPTION: 'chip-info',
  SCHEDULED: 'chip-info',
  CRITICAL: 'chip-critical',
  MISSED: 'chip-critical',
  REJECTED: 'chip-critical',
  DISCONTINUED: 'chip-critical',
  AI: 'chip-ai',
  GENERATED: 'chip-ai'
};

export default function StatusPill({ status, label, tone, dot = true }) {
  const text = label || String(status || '').replace(/_/g, ' ');
  const cls = tone || MAP[String(status || '').toUpperCase()] || 'chip-neutral';
  return (
    <span className={`chip ${cls} uppercase tracking-wide`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {text}
    </span>
  );
}
