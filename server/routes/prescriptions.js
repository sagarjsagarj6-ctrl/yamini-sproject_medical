import { Router } from 'express';
import User from '../models/user.js';
import Medicine from '../models/medicine.js';
import Prescription from '../models/prescription.js';
import PrescriptionVersion from '../models/prescriptionVersion.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import MedicationSchedule from '../models/medicationSchedule.js';
import MedicationReminder from '../models/medicationReminder.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { createRecord, findRecord, findRecords, newId, updateRecord, updateRecords } from '../services/recordStore.js';
import { ensureScheduleReminders, dateOnly, isValidTimeZone } from '../services/scheduling.js';
import { notifyUser, writeAudit } from '../services/auditService.js';
import { asyncHandler } from '../utils/http.js';
import { getDefaultMedicineImage } from '../utils/reminderText.js';

const router = Router();
const foodInstructions = ['BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'ANY'];
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const isVerifiedDoctor = async (doctorId) => {
  const doctor = await findRecord(User, { id: doctorId, role: 'DOCTOR' });
  return Boolean(doctor && doctor.verificationStatus === 'VERIFIED');
};

const normalizeMedications = async (raw, prescriptionStart, timezone) => {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 20) throw Object.assign(new Error('Add between 1 and 20 medicines.'), { statusCode: 400 });
  const medications = [];
  for (const item of raw) {
    const medicineName = String(item.medicineName || '').trim();
    const dosage = String(item.dosage || '').trim();
    const dosageUnit = String(item.dosageUnit || '').trim();
    const frequency = String(item.frequency || '').trim();
    const times = Array.isArray(item.times) ? [...new Set(item.times.filter((time) => typeof time === 'string' && timePattern.test(time)))].slice(0, 6) : [];
    const durationDays = Number(item.durationDays);
    if (medicineName.length < 2 || medicineName.length > 160 || !dosage || dosage.length > 80 || !dosageUnit || dosageUnit.length > 40 || !frequency || frequency.length > 100) {
      throw Object.assign(new Error('Each medicine needs a name, dosage, unit, and frequency.'), { statusCode: 400 });
    }
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) throw Object.assign(new Error('Medicine duration must be between 1 and 365 days.'), { statusCode: 400 });
    if (!times.length || (Array.isArray(item.times) && item.times.some((time) => !timePattern.test(time)))) throw Object.assign(new Error('Add at least one valid reminder time in 24-hour HH:mm format for every medicine.'), { statusCode: 400 });
    const foodInstruction = foodInstructions.includes(item.foodInstruction) ? item.foodInstruction : 'ANY';
    const startDate = dateOnly(item.startDate) || prescriptionStart;
    const endDate = dateOnly(item.endDate) || dateOnly(new Date(new Date(`${startDate}T00:00:00Z`).getTime() + (durationDays - 1) * 86_400_000));
    if (!endDate || endDate < startDate) throw Object.assign(new Error('Medicine end date must be on or after its start date.'), { statusCode: 400 });
    const medicine = item.medicineId ? await findRecord(Medicine, { id: item.medicineId }) : null;
    const imageUrl = String(item.imageUrl || medicine?.imageUrl || '').trim() || getDefaultMedicineImage(dosageUnit);
    medications.push({
      itemId: newId('meditem'), medicineId: medicine?.id,
      medicineName: medicine?.medicineName || medicineName, imageUrl, dosage, dosageUnit, frequency,
      times, foodInstruction, durationDays, startDate: new Date(`${startDate}T00:00:00Z`),
      endDate: new Date(`${endDate}T00:00:00Z`), timezone,
      specialInstructions: String(item.specialInstructions || '').trim().slice(0, 1000)
    });
  }
  return medications;
};

const makeSchedules = async (prescription) => {
  const schedules = [];
  for (const med of prescription.medications) {
    const schedule = await createRecord(MedicationSchedule, {
      id: newId('schedule'), prescriptionId: prescription.id, medicationItemId: med.itemId, medicineId: med.medicineId,
      doctorId: prescription.doctorId, patientId: prescription.patientId,
      medicineName: med.medicineName, imageUrl: med.imageUrl, dosage: med.dosage, dosageUnit: med.dosageUnit,
      frequency: med.frequency, times: med.times, timezone: med.timezone,
      foodInstruction: med.foodInstruction, startDate: med.startDate, endDate: med.endDate,
      specialInstructions: med.specialInstructions, status: 'ACTIVE'
    });
    schedules.push(schedule);
    await ensureScheduleReminders(schedule, { daysAhead: 14 });
  }
  return schedules;
};

const addVersion = (prescription, changedBy, changeType, reason) => createRecord(PrescriptionVersion, {
  id: newId('prescription-version'), prescriptionId: prescription.id,
  version: prescription.versionNumber || 1, changedBy, changeType,
  reason: String(reason || '').trim().slice(0, 500),
  snapshot: JSON.parse(JSON.stringify(prescription))
});

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  let filter;
  if (req.user.role === 'PATIENT') filter = { patientId: req.user.id };
  else filter = { doctorId: req.user.id };
  const prescriptions = await findRecords(Prescription, filter, { sort: { prescribedAt: -1 }, limit: 100 });
  return res.json({ prescriptions });
}));

router.get('/:id/versions', authMiddleware, asyncHandler(async (req, res) => {
  const prescription = await findRecord(Prescription, { id: req.params.id });
  if (!prescription) return res.status(404).json({ message: 'Prescription not found.' });
  if (req.user.id !== prescription.patientId && req.user.id !== prescription.doctorId) return res.status(404).json({ message: 'Prescription not found.' });
  const versions = await findRecords(PrescriptionVersion, { prescriptionId: prescription.id }, { sort: { version: 1 } });
  return res.json({ versions });
}));

router.post('/', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  if (!(await isVerifiedDoctor(req.user.id))) return res.status(403).json({ message: 'Doctor verification is required before prescribing.' });
  const patientId = typeof req.body.patientId === 'string' ? req.body.patientId : '';
  const relation = await findRecord(DoctorPatientRelation, { doctorId: req.user.id, patientId, status: 'APPROVED' });
  if (!relation) return res.status(404).json({ message: 'An approved doctor-patient connection is required.' });
  const patient = await findRecord(User, { id: patientId, role: 'PATIENT' });
  if (!patient) return res.status(404).json({ message: 'Patient not found.' });
  const timezone = String(req.body.timezone || 'UTC');
  if (!isValidTimeZone(timezone)) return res.status(400).json({ message: 'Choose a valid timezone.' });
  const startDate = dateOnly(req.body.startDate) || dateOnly(new Date());
  const endDate = dateOnly(req.body.endDate) || null;
  if (req.body.endDate && !endDate) return res.status(400).json({ message: 'Enter a valid prescription end date.' });
  const medications = await normalizeMedications(req.body.medications, startDate, timezone);
  const prescription = await createRecord(Prescription, {
    id: newId('prescription'), doctorId: req.user.id, patientId, relationId: relation.id,
    diagnosis: String(req.body.diagnosis || '').trim().slice(0, 500),
    clinicalNotes: String(req.body.clinicalNotes || req.body.notes || '').trim().slice(0, 4000),
    prescribedAt: new Date(), startDate: new Date(`${startDate}T00:00:00Z`),
    endDate: endDate ? new Date(`${endDate}T00:00:00Z`) : null,
    followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : undefined,
    status: 'ACTIVE', versionNumber: 1, medications
  });
  await addVersion(prescription, req.user.id, 'CREATED', 'Initial prescription');
  await makeSchedules(prescription);
  await notifyUser({ userId: patientId, role: 'PATIENT', category: 'MEDICATION', title: 'New prescription', message: 'Your doctor added a prescription to your care plan.', relatedResourceId: prescription.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: 'PRESCRIPTION_CREATED', resourceType: 'Prescription', resourceId: prescription.id, subjectPatientId: patientId });
  return res.status(201).json({ prescription, message: 'Prescription created and reminder schedule saved.' });
}));

router.patch('/:id', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  if (!(await isVerifiedDoctor(req.user.id))) return res.status(403).json({ message: 'Doctor verification is required to modify prescriptions.' });
  const prescription = await findRecord(Prescription, { id: req.params.id, doctorId: req.user.id });
  if (!prescription) return res.status(404).json({ message: 'Prescription not found.' });
  const changes = {};
  for (const field of ['diagnosis', 'clinicalNotes', 'followUpDate']) if (req.body[field] !== undefined) changes[field] = req.body[field];
  if (req.body.medications !== undefined) {
    const timezone = String(req.body.timezone || prescription.medications?.[0]?.timezone || 'UTC');
    if (!isValidTimeZone(timezone)) return res.status(400).json({ message: 'Choose a valid timezone.' });
    changes.medications = await normalizeMedications(req.body.medications, dateOnly(prescription.startDate), timezone);
  }
  if (!Object.keys(changes).length) return res.status(400).json({ message: 'Provide prescription fields to update.' });
  for (const field of ['diagnosis', 'clinicalNotes']) if (changes[field] !== undefined) changes[field] = String(changes[field]).trim();
  if (changes.followUpDate) {
    const date = new Date(changes.followUpDate);
    if (Number.isNaN(date.getTime())) return res.status(400).json({ message: 'Enter a valid follow-up date.' });
    changes.followUpDate = date;
  }
  const updated = await updateRecord(Prescription, { id: prescription.id }, { ...changes, versionNumber: (prescription.versionNumber || 1) + 1 });
  await addVersion(updated, req.user.id, 'UPDATED', req.body.reason || 'Prescription updated');
  if (changes.medications) {
    await updateRecords(MedicationSchedule, { prescriptionId: prescription.id, status: 'ACTIVE' }, { status: 'DISCONTINUED' });
    await updateRecords(MedicationReminder, { prescriptionId: prescription.id, status: { $in: ['PENDING', 'SNOOZED'] } }, { status: 'CANCELLED' });
    await makeSchedules(updated);
  }
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: 'PRESCRIPTION_UPDATED', resourceType: 'Prescription', resourceId: prescription.id, subjectPatientId: prescription.patientId });
  return res.json({ prescription: updated, message: 'Prescription updated. Previous versions are retained.' });
}));

router.patch('/:id/status', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  if (!(await isVerifiedDoctor(req.user.id))) return res.status(403).json({ message: 'Doctor verification is required to change prescription status.' });
  const status = String(req.body.status || '').toUpperCase();
  if (!['ACTIVE', 'COMPLETED', 'DISCONTINUED'].includes(status)) return res.status(400).json({ message: 'Status must be ACTIVE, COMPLETED, or DISCONTINUED.' });
  const prescription = await findRecord(Prescription, { id: req.params.id, doctorId: req.user.id });
  if (!prescription) return res.status(404).json({ message: 'Prescription not found.' });
  const updated = await updateRecord(Prescription, { id: prescription.id }, { status, versionNumber: (prescription.versionNumber || 1) + 1 });
  await addVersion(updated, req.user.id, 'STATUS_CHANGED', String(req.body.reason || `Status changed to ${status}`));
  if (status !== 'ACTIVE') {
    await updateRecords(MedicationSchedule, { prescriptionId: prescription.id, status: 'ACTIVE' }, { status });
    await updateRecords(MedicationReminder, { prescriptionId: prescription.id, status: { $in: ['PENDING', 'SNOOZED'] } }, { status: 'CANCELLED' });
  } else if (prescription.status !== 'ACTIVE') {
    await makeSchedules(updated);
  }
  await writeAudit({ actorId: req.user.id, actorRole: 'DOCTOR', action: `PRESCRIPTION_${status}`, resourceType: 'Prescription', resourceId: prescription.id, subjectPatientId: prescription.patientId });
  return res.json({ message: 'Prescription status updated.', prescription: updated });
}));

export default router;
