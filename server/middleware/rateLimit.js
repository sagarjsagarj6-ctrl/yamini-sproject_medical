const buckets = new Map();

export const rateLimit = ({ windowMs = 60_000, max = 60, message = 'Too many requests. Please try again shortly.' } = {}) => (req, res, next) => {
  const key = `${req.ip}:${req.baseUrl}${req.path}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return next();
  }
  current.count += 1;
  if (current.count > max) {
    res.set('Retry-After', String(Math.ceil((current.expiresAt - now) / 1000)));
    return res.status(429).json({ message });
  }
  return next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.expiresAt <= now) buckets.delete(key);
}, 5 * 60_000).unref();
