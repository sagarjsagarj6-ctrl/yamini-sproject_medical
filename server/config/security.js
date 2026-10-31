import { randomBytes } from 'node:crypto';

let localSecret;

export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured before starting MEDICO in production.');
  }
  // A per-process development secret avoids a published default while keeping local setup simple.
  localSecret ||= randomBytes(48).toString('hex');
  return localSecret;
};
