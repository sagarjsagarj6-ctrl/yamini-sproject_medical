import { Router } from 'express';
import User from '../models/user.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import MedicalHistoryRecord from '../models/medicalHistoryRecord.js';
import SymptomRecord from '../models/symptomRecord.js';
import RecoveryRecord from '../models/recoveryRecord.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { createRecord, findRecord, findRecords, newId } from '../services/recordStore.js';
import { approvedRelation, mayViewPatient } from '../services/authorization.js';
import { notifyUser, writeAudit } from '../services/auditService.js';
import { asyncHandler, publicUser } from '../utils/http.js';

const router = Router();
const historyCategories = ['DIAGNOSIS', 'HOSPITAL_VISIT', 'ALLERGY', 'SURGERY', 'CONDITION', 'OBSERVATION', 'TREATMENT'];
const recoveryStatuses = ['Under Treatment', 'Improving', 'Stable', 'Requires Reassessment', 'Recovered'];

router.get('/patients/:patientId/medical-history', authMiddleware, asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  if (!(await mayViewPatient(req.user, patientId))) return res.status(404).json({ message: 'Authorized patient record not found.' });
  const patient = await findRecord(User, { id: patientId, role: 'PATIENT' });
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });
  const history = await findRecords(MedicalHistoryRecord, { patientId }, { sort: { occurredAt: -1 }, limit: 200 });
  await writeAudit({ actorId: req.user.id, actorRole: req.user.role, action: 'MEDICAL_HISTORY_VIEWED', resourceType: 'MedicalHistoryRecord', resourceId: patientId, subjectPatientId: patientId });
  return res.json({
    patient: req.user.role === 'PATIENT' ? publicUser(patient) : { id: patient.id, name: patient.name },
    profileSummary: {
      primaryDisease: patient.primaryDisease, diseaseDescription: patient.diseaseDescription,
      allergies: patient.allergies, existingMedications: patient.existingMedications,
      previousMedicalHistory: patient.previousMedicalHistory, previousSurgeries: patient.previousSurgeries,
      existingHealthConditions: patient.existingHealthConditions
    },
    records: history
  });
}));

router.post('/medical-history', authMiddleware, asyncHandler(async (req, res) => {
  const patientId = req.user.role === 'PATIENT' ? req.user.id : String(req.body.patientId || '');
  if (!(await mayViewPatient(req.user, patientId))) return res.status(404).json({ message: 'Authorized patient record not found.' });
  const category = String(req.body.category || '').toUpperCase();
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!historyCategories.includes(category) || title.length < 2 || title.length > 160) return res.status(400).json({ message: 'Choose a history category and enter a title between 2 and 160 characters.' });
  const occurredAt = req.body.occurredAt ? new Date(req.body.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) return res.status(400).json({ message: 'Enter a valid event date.' });
  const relation = req.user.role === 'DOCTOR' ? await approvedRelation(req.user.id, patientId) : null;
  const record = await createRecord(MedicalHistoryRecord, {
    id: newId('history'), patientId, authorId: req.user.id, authorRole: req.user.role,
    relationId: relation?.id, category, title,
    details: String(req.body.details || '').trim().slice(0, 4000), occurredAt,
    source: req.user.role
  });
  await writeAudit({ actorId: req.user.id, actorRole: req.user.role, action: 'MEDICAL_HISTORY_ADDED', resourceType: 'MedicalHistoryRecord', resourceId: record.id, subjectPatientId: patientId });
  return res.status(201).json({ record, message: 'Medical history entry saved.' });
}));

router.get('/patients/:patientId/emergency', authMiddleware, asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  if (req.user.role === 'DOCTOR') {
    const doctor = await findRecord(User, { id: req.user.id, role: 'DOCTOR' });
    if (!doctor || doctor.verificationStatus !== 'VERIFIED' || !(await approvedRelation(req.user.id, patientId))) return res.status(404).json({ message: 'Authorized emergency record not found.' });
  } else if (req.user.id !== patientId) return res.status(404).json({ message: 'Emergency information not found.' });
  const patient = await findRecord(User, { id: patientId, role: 'PATIENT' });
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });
  await writeAudit({ actorId: req.user.id, actorRole: req.user.role, action: 'EMERGENCY_SUMMARY_ACCESSED', resourceType: 'EmergencySummary', resourceId: patientId, subjectPatientId: patientId });
  return res.json({ emergency: {
    patientId: patient.id, name: patient.name, emergencyContact: patient.emergencyContact,
    bloodGroup: patient.bloodGroup || null, allergies: patient.allergies || '',
    existingHealthConditions: patient.existingHealthConditions || '',
    currentMedications: patient.existingMedications || '', emergencyNotes: patient.emergencyNotes || ''
  } });
}));

router.get('/patients/:patientId/symptoms', authMiddleware, asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  if (!(await mayViewPatient(req.user, patientId))) return res.status(404).json({ message: 'Authorized patient record not found.' });
  const symptoms = await findRecords(SymptomRecord, { patientId }, { sort: { recordedAt: -1 }, limit: 200 });
  return res.json({ symptoms });
}));

router.post('/patient/symptom-logs', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const symptom = typeof req.body.symptom === 'string' ? req.body.symptom.trim() : '';
  const severity = Number(req.body.severity);
  const { measurement } = req.body;
  if (!symptom || symptom.length > 120) return res.status(400).json({ message: 'Enter a symptom using 1 to 120 characters.' });
  if (!Number.isInteger(severity) || severity < 1 || severity > 10) return res.status(400).json({ message: 'Symptom severity must be an integer from 1 to 10.' });
  if (measurement && (!measurement.label || !measurement.unit || !Number.isFinite(Number(measurement.value)))) return res.status(400).json({ message: 'Measurement needs a label, numeric value, and unit.' });
  const record = await createRecord(SymptomRecord, {
    id: newId('symptom'), patientId: req.user.id, symptom, severity,
    notes: String(req.body.notes || '').trim().slice(0, 500),
    measurement: measurement ? { label: String(measurement.label).trim().slice(0, 80), value: Number(measurement.value), unit: String(measurement.unit).trim().slice(0, 40) } : undefined,
    recordedAt: new Date()
  });
  const relationships = await findRecords(DoctorPatientRelation, { patientId: req.user.id, status: 'APPROVED' });
  for (const relation of relationships) await notifyUser({ userId: relation.doctorId, role: 'DOCTOR', category: 'SYMPTOM', title: 'Patient reported a symptom', message: `A connected patient reported ${symptom} (severity ${severity}/10).`, relatedResourceId: record.id });
  return res.status(201).json({ message: 'Symptom update saved.', log: { ...record, createdAt: record.recordedAt }, record });
}));

router.get('/patients/:patientId/recovery-assessments', authMiddleware, asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  if (!(await mayViewPatient(req.user, patientId))) return res.status(404).json({ message: 'Authorized patient record not found.' });
  const assessments = await findRecords(RecoveryRecord, { patientId }, { sort: { assessedAt: -1 }, limit: 200 });
  return res.json({ assessments });
}));

router.post('/patients/:patientId/recovery-assessments', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  const doctor = await findRecord(User, { id: req.user.id, role: 'DOCTOR' });
  const relation = await approvedRelation(req.user.id, patientId);
  if (!doctor || doctor.verificationStatus !== 'VERIFIED') return res.status(403).json({ message: 'Doctor verification is required to record a clinical assessment.' });
  if (!relation) return res.status(404).json({ message: 'Approved patient connection not found.' });
  const score = Number(req.body.score);
  const status = String(req.body.status || '');
  if (!Number.isInteger(score) || score < 0 || score > 100) return res.status(400).json({ message: 'Recovery score must be an integer from 0 to 100.' });
  if (!recoveryStatuses.includes(status)) return res.status(400).json({ message: 'Choose a valid recovery status.' });
  const nextAssessmentAt = req.body.nextAssessmentAt ? new Date(req.body.nextAssessmentAt) : undefined;
  if (nextAssessmentAt && Number.isNaN(nextAssessmentAt.getTime())) return res.status(400).json({ message: 'Enter a valid next assessment date.' });
  const assessment = await createRecord(RecoveryRecord, {
    id: newId('recovery'), patientId, doctorId: req.user.id, relationId: relation.id,
    score, status, clinicalAssessment: String(req.body.clinicalAssessment || '').trim().slice(0, 4000),
    followUpRecommendation: String(req.body.followUpRecommendation || '').trim().slice(0, 1000),
    nextAssessmentAt, assessedAt: new Date()
  });
  await notifyUser({ userId: patientId, role: 'PATIENT', category: 'RECOVERY', title: 'Recovery assessment updated', message: 'Your doctor added a recovery assessment. Review it with them if you have questions.', relatedResourceId: assessment.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: 'RECOVERY_ASSESSMENT_ADDED', resourceType: 'RecoveryRecord', resourceId: assessment.id, subjectPatientId: patientId });
  return res.status(201).json({ message: 'Recovery assessment saved.', assessment });
}));

export default router;
