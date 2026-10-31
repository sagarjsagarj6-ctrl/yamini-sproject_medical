import { useEffect, useRef, useState } from 'react';

/**
 * Counts up to a number when it changes — used for clinical metric tiles.
 */
export default function AnimatedNumber({ value = 0, duration = 900, suffix = '', prefix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return (
    <span className="numeric">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
