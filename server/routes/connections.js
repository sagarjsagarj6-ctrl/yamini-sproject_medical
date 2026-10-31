import { Router } from 'express';
import User from '../models/user.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { createRecord, findRecord, findRecords, newId, updateRecord } from '../services/recordStore.js';
import { notifyUser, writeAudit } from '../services/auditService.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
const activeStatuses = ['PENDING', 'APPROVED'];

const openRelationship = async (doctorId, patientId) => {
  const rows = await findRecords(DoctorPatientRelation, { doctorId, patientId, status: { $in: activeStatuses } });
  return rows[0] || null;
};

const createRequest = async ({ doctor, patientId, method }) => {
  if (doctor.role !== 'DOCTOR' || doctor.verificationStatus !== 'VERIFIED') {
    const error = new Error('This doctor is not available for new connections.');
    error.statusCode = 403;
    throw error;
  }
  if (await openRelationship(doctor.id, patientId)) {
    const error = new Error('A pending or approved connection already exists.');
    error.statusCode = 409;
    throw error;
  }
  const relation = await createRecord(DoctorPatientRelation, {
    id: newId('relation'), doctorId: doctor.id, patientId, status: 'PENDING', connectionMethod: method,
    connectedAt: new Date(), permissions: ['view_prescriptions', 'view_history']
  });
  await notifyUser({ userId: doctor.id, role: 'DOCTOR', category: 'CONNECTION', title: 'New patient connection request', message: 'A patient requested to connect with you.', relatedResourceId: relation.id });
  await writeAudit({ actorId: patientId, actorRole: 'PATIENT', action: 'CONNECTION_REQUESTED', resourceType: 'DoctorPatientRelation', resourceId: relation.id });
  return relation;
};

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const filter = req.user.role === 'DOCTOR' ? { doctorId: req.user.id } : { patientId: req.user.id };
  const connections = await findRecords(DoctorPatientRelation, filter, { sort: { createdAt: -1 } });
  return res.json({ connections });
}));

router.post('/request', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const doctorId = typeof req.body.doctorId === 'string' ? req.body.doctorId : '';
  const doctor = await findRecord(User, { id: doctorId, role: 'DOCTOR' });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
  try {
    const relation = await createRequest({ doctor, patientId: req.user.id, method: 'DOCTOR_SEARCH' });
    return res.status(201).json({ message: 'Connection request sent.', relation });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
}));

router.post('/request-by-code', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!code) return res.status(400).json({ message: 'Enter a doctor connection code.' });
  const doctor = await findRecord(User, { role: 'DOCTOR', connectionCode: code });
  if (!doctor || doctor.verificationStatus !== 'VERIFIED') return res.status(400).json({ message: 'Connection code is invalid or the doctor is not verified.' });
  if (doctor.connectionCodeExpiresAt && new Date(doctor.connectionCodeExpiresAt) < new Date()) return res.status(400).json({ message: 'Connection code has expired. Ask the doctor for a new code.' });
  try {
    const relation = await createRequest({ doctor, patientId: req.user.id, method: 'UNIQUE_CODE' });
    return res.status(201).json({ message: 'Connection request sent. The doctor must approve it before your records are shared.', relation });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
}));

router.patch('/:id/decision', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const action = typeof req.body.action === 'string' ? req.body.action.toLowerCase() : '';
  if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'Action must be accept or reject.' });
  const relation = await findRecord(DoctorPatientRelation, { id: req.params.id, doctorId: req.user.id, status: 'PENDING' });
  if (!relation) return res.status(404).json({ message: 'Pending connection request not found.' });
  const changes = action === 'accept'
    ? { status: 'APPROVED', approvedAt: new Date() }
    : { status: 'REJECTED' };
  const updated = await updateRecord(DoctorPatientRelation, { id: relation.id }, changes);
  const patient = await findRecord(User, { id: relation.patientId, role: 'PATIENT' });
  if (patient) await notifyUser({ userId: patient.id, role: 'PATIENT', category: 'CONNECTION', title: `Connection ${action}ed`, message: action === 'accept' ? 'Your doctor connection request was accepted.' : 'Your doctor connection request was declined.', relatedResourceId: relation.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: `CONNECTION_${action.toUpperCase()}ED`, resourceType: 'DoctorPatientRelation', resourceId: relation.id, subjectPatientId: relation.patientId });
  return res.json({ message: `Connection ${action}ed.`, relation: updated });
}));

router.patch('/:id/disconnect', authMiddleware, asyncHandler(async (req, res) => {
  const relation = await findRecord(DoctorPatientRelation, { id: req.params.id, status: 'APPROVED' });
  if (!relation || ![relation.doctorId, relation.patientId].includes(req.user.id)) return res.status(404).json({ message: 'Approved connection not found.' });
  const updated = await updateRecord(DoctorPatientRelation, { id: relation.id }, { status: 'DISCONNECTED', disconnectedAt: new Date() });
  await writeAudit({ actorId: req.user.id, actorRole: req.user.role, action: 'CONNECTION_DISCONNECTED', resourceType: 'DoctorPatientRelation', resourceId: relation.id, subjectPatientId: relation.patientId });
  return res.json({ relation: updated, message: 'Connection disconnected. Historical care records have been retained.' });
}));

export default router;
