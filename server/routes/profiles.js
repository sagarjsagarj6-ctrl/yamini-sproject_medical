import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import User from '../models/user.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { requireAdminKey } from '../middleware/adminKey.js';
import { findRecord, updateRecord } from '../services/recordStore.js';
import { notifyUser, writeAudit } from '../services/auditService.js';
import { uploadProfileImage } from '../services/cloudinaryService.js';
import { asyncHandler, calculateAge, pick, publicUser } from '../utils/http.js';

const router = Router();
const editableFields = {
  PATIENT: ['name', 'phone', 'dob', 'gender', 'address', 'bloodGroup', 'emergencyContact', 'height', 'weight', 'primaryDisease', 'diseaseDescription', 'yearsSuffering', 'previousMedicalHistory', 'existingMedications', 'allergies', 'previousSurgeries', 'existingHealthConditions', 'lifestyleInfo', 'emergencyNotes'],
  DOCTOR: ['name', 'phone', 'dob', 'gender', 'profileImage', 'specialization', 'hospitalName', 'hospitalLocation', 'designation', 'degree', 'graduationYear', 'experience', 'medicalRegistrationNumber', 'professionalDescription', 'consultationInfo']
};

router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await findRecord(User, { id: req.user.id, role: req.user.role });
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  return res.json({ profile: publicUser(user), ...(user.role === 'DOCTOR' ? { connectionCode: user.connectionCode, connectionCodeExpiresAt: user.connectionCodeExpiresAt } : {}) });
}));

router.patch('/me', authMiddleware, asyncHandler(async (req, res) => {
  const allowed = editableFields[req.user.role];
  const changes = pick(req.body, allowed);
  if (!Object.keys(changes).length) return res.status(400).json({ message: 'Provide at least one profile field to update.' });
  if (typeof changes.name === 'string' && (changes.name.trim().length < 2 || changes.name.trim().length > 100)) return res.status(400).json({ message: 'Name must be 2 to 100 characters.' });
  if (changes.dob !== undefined) {
    const date = new Date(changes.dob);
    if (Number.isNaN(date.getTime()) || date > new Date()) return res.status(400).json({ message: 'Enter a valid date of birth.' });
    changes.dob = date;
    changes.age = calculateAge(date);
  }
  for (const key of ['height', 'weight', 'yearsSuffering', 'graduationYear', 'experience']) {
    if (changes[key] === '' || changes[key] === null) delete changes[key];
    else if (changes[key] !== undefined && (!Number.isFinite(Number(changes[key])) || Number(changes[key]) < 0)) return res.status(400).json({ message: `${key} must be a non-negative number.` });
    else if (changes[key] !== undefined) changes[key] = Number(changes[key]);
  }
  if (changes.name !== undefined) changes.name = changes.name.trim();
  const updated = await updateRecord(User, { id: req.user.id }, changes);
  if (!updated) return res.status(404).json({ message: 'Account not found.' });
  await writeAudit({ actorId: req.user.id, actorRole: req.user.role, action: 'PROFILE_UPDATED', resourceType: 'User', resourceId: req.user.id });
  return res.json({ profile: publicUser(updated) });
}));

router.post('/me/image', authMiddleware, asyncHandler(async (req, res) => {
  const contentType = String(req.body.contentType || '');
  const encoded = String(req.body.data || '');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) return res.status(400).json({ message: 'Use a JPEG, PNG, or WebP image.' });
  if (!encoded || encoded.length > 6_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return res.status(400).json({ message: 'Image must be smaller than 4 MB.' });
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) return res.status(400).json({ message: 'Image must be smaller than 4 MB.' });
  const isPng = contentType === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = contentType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = contentType === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(isPng || isJpeg || isWebp)) return res.status(400).json({ message: 'Image content does not match its file type.' });
  const uploaded = await uploadProfileImage({ userId: req.user.id, bytes, contentType });
  const updated = await updateRecord(User, { id: req.user.id }, { profileImage: uploaded.url });
  await writeAudit({ actorId: req.user.id, actorRole: req.user.role, action: 'PROFILE_IMAGE_UPDATED', resourceType: 'User', resourceId: req.user.id });
  return res.json({ profileImage: updated.profileImage });
}));

router.post('/doctor/verification', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const registrationNumber = typeof req.body.medicalRegistrationNumber === 'string' ? req.body.medicalRegistrationNumber.trim() : '';
  if (registrationNumber.length < 4 || registrationNumber.length > 100) return res.status(400).json({ message: 'Enter a valid medical registration number.' });
  const updated = await updateRecord(User, { id: req.user.id }, { medicalRegistrationNumber: registrationNumber, verificationStatus: 'PENDING' });
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: 'VERIFICATION_SUBMITTED', resourceType: 'User', resourceId: req.user.id });
  return res.json({ verificationStatus: updated.verificationStatus, message: 'Verification request submitted for review.' });
}));

router.post('/doctor/connection-code/rotate', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const doctor = await findRecord(User, { id: req.user.id, role: 'DOCTOR', verificationStatus: 'VERIFIED' });
  if (!doctor) return res.status(403).json({ message: 'Verified doctor access is required to generate a connection code.' });
  let connectionCode;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    connectionCode = `MED-${randomBytes(5).toString('hex').toUpperCase()}`;
    if (!(await findRecord(User, { connectionCode }))) break;
  }
  const connectionCodeExpiresAt = new Date(Date.now() + 90 * 86_400_000);
  const updated = await updateRecord(User, { id: doctor.id }, { connectionCode, connectionCodeExpiresAt });
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: 'CONNECTION_CODE_ROTATED', resourceType: 'User', resourceId: doctor.id });
  return res.json({ connectionCode: updated.connectionCode, connectionCodeExpiresAt: updated.connectionCodeExpiresAt });
}));

router.patch('/admin/doctors/:id/verification', requireAdminKey, asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) return res.status(400).json({ message: 'Choose VERIFIED, REJECTED, or PENDING.' });
  const doctor = await findRecord(User, { id: req.params.id, role: 'DOCTOR' });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
  const changes = { verificationStatus: status, isVerified: status === 'VERIFIED', verificationNote: typeof note === 'string' ? note.trim().slice(0, 500) : '' };
  const updated = await updateRecord(User, { id: doctor.id }, changes);
  await writeAudit({ actorId: 'admin', actorRole: 'ADMIN', action: 'DOCTOR_VERIFICATION_CHANGED', resourceType: 'User', resourceId: doctor.id, metadata: { status } });
  await notifyUser({ userId: doctor.id, role: 'DOCTOR', category: 'SYSTEM', title: 'Verification status updated', message: `Your doctor verification is ${status.toLowerCase()}.${note ? ` ${String(note).trim().slice(0, 300)}` : ''}` });
  return res.json({ doctor: publicUser(updated) });
}));

export default router;
