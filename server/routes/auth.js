import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import User from '../models/user.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createRecord, findRecord, newId } from '../services/recordStore.js';
import { getJwtSecret } from '../config/security.js';
import { calculateAge, pick, publicUser, asyncHandler } from '../utils/http.js';

const router = Router();
const patientFields = ['phone', 'dob', 'gender', 'address', 'bloodGroup', 'emergencyContact', 'height', 'weight', 'primaryDisease', 'diseaseDescription', 'yearsSuffering', 'previousMedicalHistory', 'existingMedications', 'allergies', 'previousSurgeries', 'existingHealthConditions', 'lifestyleInfo'];
const doctorFields = ['phone', 'dob', 'gender', 'profileImage', 'specialization', 'hospitalName', 'hospitalLocation', 'designation', 'degree', 'graduationYear', 'experience', 'medicalRegistrationNumber', 'professionalDescription', 'consultationInfo'];

const makeDoctorCode = () => `MED-${randomBytes(5).toString('hex').toUpperCase()}`;
const issueToken = (user) => jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

router.post('/register', rateLimit({ windowMs: 15 * 60_000, max: 10 }), asyncHandler(async (req, res) => {
  const { role, name, email, password } = req.body;
  if (!['DOCTOR', 'PATIENT'].includes(role)) return res.status(400).json({ message: 'Choose a patient or doctor account.' });
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be 8 to 128 characters.' });

  const normalizedEmail = email.trim().toLowerCase();
  if (await findRecord(User, { email: normalizedEmail })) return res.status(409).json({ message: 'An account already uses this email.' });
  const dob = req.body.dob ? new Date(req.body.dob) : undefined;
  if (req.body.dob && (Number.isNaN(dob.getTime()) || dob > new Date())) return res.status(400).json({ message: 'Enter a valid date of birth.' });
  const allowedFields = role === 'DOCTOR' ? doctorFields : patientFields;
  const profile = pick(req.body, allowedFields);
  for (const key of ['height', 'weight', 'yearsSuffering', 'graduationYear', 'experience']) {
    if (profile[key] === '' || profile[key] === null) delete profile[key];
    else if (profile[key] !== undefined) {
      const value = Number(profile[key]);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ message: `${key} must be a non-negative number.` });
      profile[key] = value;
    }
  }
  const user = await createRecord(User, {
    id: newId(role.toLowerCase()), role, name: name.trim(), email: normalizedEmail,
    password: await bcrypt.hash(password, 12), ...profile,
    dob,
    age: calculateAge(dob),
    verificationStatus: role === 'DOCTOR' ? 'PENDING' : 'VERIFIED',
    ...(role === 'DOCTOR' ? { connectionCode: makeDoctorCode(), connectionCodeExpiresAt: new Date(Date.now() + 90 * 86400_000) } : {})
  });
  const cleanUser = { ...user };
  delete cleanUser.password;
  delete cleanUser.connectionCode;
  delete cleanUser.connectionCodeExpiresAt;
  return res.status(201).json({ token: issueToken(user), user: publicUser(cleanUser), message: role === 'DOCTOR' ? 'Account created. Prescription privileges will be available after verification.' : 'Account created.' });
}));

router.post('/login', rateLimit({ windowMs: 15 * 60_000, max: 12, message: 'Too many login attempts. Wait a few minutes and try again.' }), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return res.status(400).json({ message: 'Enter your email and password.' });
  let user;
  if (User.db.readyState === 1) user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password').lean();
  else user = await findRecord(User, { email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
  const cleanUser = { ...user };
  delete cleanUser.password;
  delete cleanUser.connectionCode;
  delete cleanUser.connectionCodeExpiresAt;
  return res.json({ token: issueToken(user), user: publicUser(cleanUser) });
}));

router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await findRecord(User, { id: req.user.id, role: req.user.role });
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  const cleanUser = { ...user };
  delete cleanUser.password;
  delete cleanUser.connectionCode;
  delete cleanUser.connectionCodeExpiresAt;
  return res.json({ user: publicUser(cleanUser) });
}));

export default router;
