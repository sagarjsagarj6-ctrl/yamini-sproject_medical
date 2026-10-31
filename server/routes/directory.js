import { Router } from 'express';
import User from '../models/user.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import MedicalHistoryRecord from '../models/medicalHistoryRecord.js';
import SymptomRecord from '../models/symptomRecord.js';
import RecoveryRecord from '../models/recoveryRecord.js';
import Prescription from '../models/prescription.js';
import MedicationLog from '../models/medicationLog.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { findRecord, findRecords } from '../services/recordStore.js';
import { approvedRelation } from '../services/authorization.js';
import { writeAudit } from '../services/auditService.js';
import { asyncHandler, publicUser } from '../utils/http.js';

const router = Router();
const patientSummary = (patient) => ({
  id: patient.id, name: patient.name, age: patient.age, gender: patient.gender,
  primaryDisease: patient.primaryDisease, bloodGroup: patient.bloodGroup
});

router.get('/doctors', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const specialization = String(req.query.specialization || '').trim().toLowerCase();
  const location = String(req.query.location || '').trim().toLowerCase();
  const hospital = String(req.query.hospital || '').trim().toLowerCase();
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  let doctors = await findRecords(User, { role: 'DOCTOR', verificationStatus: 'VERIFIED' }, { sort: { name: 1 } });
  doctors = doctors.filter((doctor) => {
    const all = [doctor.name, doctor.specialization, doctor.hospitalName, doctor.hospitalLocation, doctor.designation].filter(Boolean).join(' ').toLowerCase();
    return (!query || all.includes(query)) && (!specialization || String(doctor.specialization || '').toLowerCase().includes(specialization))
      && (!location || String(doctor.hospitalLocation || '').toLowerCase().includes(location))
      && (!hospital || String(doctor.hospitalName || '').toLowerCase().includes(hospital));
  });
  const total = doctors.length;
  doctors = doctors.slice((page - 1) * limit, page * limit).map((doctor) => {
    const safe = publicUser(doctor);
    delete safe.email;
    delete safe.phone;
    delete safe.medicalRegistrationNumber;
    return safe;
  });
  return res.json({ doctors, page, limit, total, pages: Math.ceil(total / limit) });
}));

router.get('/doctors/:id', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const doctor = await findRecord(User, { id: req.params.id, role: 'DOCTOR', verificationStatus: 'VERIFIED' });
  if (!doctor) return res.status(404).json({ message: 'Verified doctor not found.' });
  const safe = publicUser(doctor);
  delete safe.email;
  delete safe.phone;
  delete safe.medicalRegistrationNumber;
  return res.json({ doctor: safe });
}));

router.get('/patients', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const relations = await findRecords(DoctorPatientRelation, { doctorId: req.user.id, status: 'APPROVED' });
  const patients = await Promise.all(relations.map((relation) => findRecord(User, { id: relation.patientId, role: 'PATIENT' })));
  const query = String(req.query.q || '').trim().toLowerCase();
  const results = patients.filter(Boolean).filter((patient) => !query || [patient.name, patient.primaryDisease, patient.email].filter(Boolean).join(' ').toLowerCase().includes(query));
  const rows = results.map(patientSummary);
  return res.json({ patients: rows, total: rows.length });
}));

router.get('/patients/:id', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role === 'PATIENT' && req.user.id !== req.params.id) return res.status(403).json({ message: 'You can only view your own profile.' });
  if (req.user.role === 'DOCTOR' && !(await approvedRelation(req.user.id, req.params.id))) return res.status(404).json({ message: 'Approved patient relationship not found.' });
  const patient = await findRecord(User, { id: req.params.id, role: 'PATIENT' });
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });
  const history = await findRecords(MedicalHistoryRecord, { patientId: patient.id }, { sort: { occurredAt: -1 }, limit: 50 });
  const [symptoms, assessments, prescriptions, medicationLogs] = await Promise.all([
    findRecords(SymptomRecord, { patientId: patient.id }, { sort: { recordedAt: -1 }, limit: 20 }),
    findRecords(RecoveryRecord, { patientId: patient.id }, { sort: { assessedAt: -1 }, limit: 20 }),
    findRecords(Prescription, { patientId: patient.id }, { sort: { prescribedAt: -1 }, limit: 50 }),
    findRecords(MedicationLog, { patientId: patient.id }, { sort: { loggedAt: -1 }, limit: 100 })
  ]);
  await writeAudit({ actorId: req.user.id, actorRole: req.user.role, action: 'PATIENT_RECORD_VIEWED', resourceType: 'User', resourceId: patient.id, subjectPatientId: patient.id });
  return res.json({ patient: publicUser(patient), medicalHistory: history, symptoms, recoveryAssessments: assessments, prescriptions, medicationLogs });
}));

export default router;
