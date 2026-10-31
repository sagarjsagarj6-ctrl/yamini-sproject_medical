import { Router } from 'express';
import User from '../models/user.js';
import Appointment from '../models/appointment.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { createRecord, findRecord, findRecords, newId, updateRecord } from '../services/recordStore.js';
import { notifyUser, writeAudit } from '../services/auditService.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const filter = req.user.role === 'DOCTOR' ? { doctorId: req.user.id } : { patientId: req.user.id };
  const appointments = await findRecords(Appointment, filter, { sort: { scheduledAt: 1 }, limit: 250 });
  return res.json({ appointments });
}));

router.post('/', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const doctorId = String(req.body.doctorId || '');
  const relation = await findRecord(DoctorPatientRelation, { doctorId, patientId: req.user.id, status: 'APPROVED' });
  if (!relation) return res.status(404).json({ message: 'Connect with this doctor before requesting an appointment.' });
  const doctor = await findRecord(User, { id: doctorId, role: 'DOCTOR' });
  if (!doctor || doctor.verificationStatus !== 'VERIFIED') return res.status(403).json({ message: 'This doctor is not currently accepting appointments.' });
  const scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) return res.status(400).json({ message: 'Choose a future preferred appointment date and time.' });
  const appointment = await createRecord(Appointment, {
    id: newId('appointment'), doctorId, patientId: req.user.id, relationId: relation.id,
    requestedAt: new Date(), scheduledAt, timezone: String(req.body.timezone || 'UTC'),
    status: 'REQUESTED', reason: String(req.body.reason || '').trim().slice(0, 1000)
  });
  await notifyUser({ userId: doctorId, role: 'DOCTOR', category: 'APPOINTMENT', title: 'New appointment request', message: 'A connected patient requested an appointment time.', relatedResourceId: appointment.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'PATIENT', action: 'APPOINTMENT_REQUESTED', resourceType: 'Appointment', resourceId: appointment.id, subjectPatientId: req.user.id });
  return res.status(201).json({ appointment, message: 'Appointment request sent to your doctor.' });
}));

router.patch('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const appointment = await findRecord(Appointment, { id: req.params.id });
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
  if (req.user.role === 'PATIENT') {
    if (appointment.patientId !== req.user.id) return res.status(404).json({ message: 'Appointment not found.' });
    if (req.body.action !== 'cancel') return res.status(403).json({ message: 'Patients may only cancel their appointments.' });
    if (!['REQUESTED', 'CONFIRMED'].includes(appointment.status)) return res.status(409).json({ message: 'This appointment can no longer be cancelled.' });
    if (appointment.status === 'CONFIRMED' && appointment.scheduledAt && new Date(appointment.scheduledAt).getTime() - Date.now() < 2 * 60 * 60_000) return res.status(409).json({ message: 'Contact the clinic directly to change an appointment within two hours.' });
    const updated = await updateRecord(Appointment, { id: appointment.id }, { status: 'CANCELLED' });
    await notifyUser({ userId: appointment.doctorId, role: 'DOCTOR', category: 'APPOINTMENT', title: 'Appointment cancelled', message: 'A patient cancelled an appointment.', relatedResourceId: appointment.id });
    return res.json({ appointment: updated, message: 'Appointment cancelled.' });
  }

  if (appointment.doctorId !== req.user.id) return res.status(404).json({ message: 'Appointment not found.' });
  const action = String(req.body.action || '').toLowerCase();
  if (!['accept', 'reject', 'complete', 'reschedule'].includes(action)) return res.status(400).json({ message: 'Choose accept, reject, complete, or reschedule.' });
  const status = action === 'accept' || action === 'reschedule' ? 'CONFIRMED' : action === 'reject' ? 'REJECTED' : 'COMPLETED';
  const changes = { status, doctorNotes: String(req.body.doctorNotes || '').trim().slice(0, 1000) };
  if (req.body.scheduledAt !== undefined) {
    const date = new Date(req.body.scheduledAt);
    if (Number.isNaN(date.getTime()) || date <= new Date()) return res.status(400).json({ message: 'Choose a future appointment date and time.' });
    changes.scheduledAt = date;
    changes.reminderSentAt = null;
  }
  if ((action === 'accept' || action === 'reschedule') && !changes.scheduledAt && !appointment.scheduledAt) return res.status(400).json({ message: 'Choose a confirmed appointment date and time.' });
  const updated = await updateRecord(Appointment, { id: appointment.id, doctorId: req.user.id }, changes);
  const statusText = status.toLowerCase();
  await notifyUser({ userId: appointment.patientId, role: 'PATIENT', category: 'APPOINTMENT', title: 'Appointment updated', message: `Your appointment is ${statusText}.${updated.scheduledAt ? ` Scheduled for ${new Date(updated.scheduledAt).toLocaleString()}.` : ''}`, relatedResourceId: appointment.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: `APPOINTMENT_${status}`, resourceType: 'Appointment', resourceId: appointment.id, subjectPatientId: appointment.patientId });
  return res.json({ appointment: updated, message: `Appointment ${statusText}.` });
}));

router.post('/:id/follow-up', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const appointment = await findRecord(Appointment, { id: req.params.id, doctorId: req.user.id });
  if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
  const scheduledAt = new Date(req.body.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) return res.status(400).json({ message: 'Choose a future follow-up time.' });
  const relation = await findRecord(DoctorPatientRelation, { id: appointment.relationId, status: 'APPROVED' });
  if (!relation) return res.status(409).json({ message: 'Reconnect with the patient before scheduling a follow-up.' });
  const followUp = await createRecord(Appointment, {
    id: newId('appointment'), doctorId: appointment.doctorId, patientId: appointment.patientId,
    relationId: appointment.relationId, requestedAt: new Date(), scheduledAt,
    timezone: String(req.body.timezone || appointment.timezone || 'UTC'), status: 'CONFIRMED',
    reason: String(req.body.reason || 'Follow-up appointment').trim().slice(0, 1000), followUpFor: appointment.id
  });
  await notifyUser({ userId: appointment.patientId, role: 'PATIENT', category: 'FOLLOW_UP', title: 'Follow-up scheduled', message: 'Your doctor scheduled a follow-up appointment.', relatedResourceId: followUp.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: 'FOLLOW_UP_SCHEDULED', resourceType: 'Appointment', resourceId: followUp.id, subjectPatientId: appointment.patientId });
  return res.status(201).json({ appointment: followUp, message: 'Follow-up scheduled.' });
}));

export default router;
