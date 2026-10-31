import { timingSafeEqual } from 'node:crypto';

export const requireAdminKey = (req, res, next) => {
  const configured = process.env.ADMIN_API_KEY;
  const supplied = req.get('x-admin-key') || '';
  if (!configured) return res.status(503).json({ message: 'Doctor verification is not configured. Set ADMIN_API_KEY first.' });
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(403).json({ message: 'Administrator access required.' });
  return next();
};
