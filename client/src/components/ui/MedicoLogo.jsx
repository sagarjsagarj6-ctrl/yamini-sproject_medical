import { HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * MEDICO brand mark. Renders the heartbeat glyph inside a clinical badge.
 */
export default function MedicoLogo({ size = 'md', tone = 'dark', showWordmark = true, subtitle, to = '/' }) {
  const badge = size === 'sm' ? 'h-8 w-8 rounded-xl' : size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-[14px]';
  const icon = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';
  const word = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';

  const Wrapper = to ? Link : 'div';
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper {...wrapperProps} className="flex min-w-0 items-center gap-3" aria-label="MEDICO home">
      <span className={`relative flex ${badge} shrink-0 items-center justify-center bg-brand-gradient text-white shadow-glow`}>
        <span className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25" />
        <HeartPulse className={`${icon} animate-heartbeat`} strokeWidth={2.4} />
      </span>
      {showWordmark && (
        <span className="min-w-0 leading-none">
          <span className={`block ${word} font-extrabold tracking-[-.04em] ${tone === 'light' ? 'text-white' : 'text-slate-900'}`}>MEDICO</span>
          {subtitle && (
            <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] ${tone === 'light' ? 'text-emerald-200/80' : 'text-brand-700'}`}>
              {subtitle}
            </span>
          )}
        </span>
      )}
    </Wrapper>
  );
}
