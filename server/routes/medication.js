import { Router } from 'express';
import User from '../models/user.js';
import Prescription from '../models/prescription.js';
import MedicationSchedule from '../models/medicationSchedule.js';
import MedicationReminder from '../models/medicationReminder.js';
import MedicationLog from '../models/medicationLog.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import Medicine from '../models/medicine.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { createRecord, findRecord, findRecords, newId, updateRecord } from '../services/recordStore.js';
import { notifyUser, writeAudit } from '../services/auditService.js';
import { asyncHandler } from '../utils/http.js';
import { buildNotificationText, buildWhatsAppReminderText, buildWhatsAppUrl, getDefaultMedicineImage, getFoodLabel } from '../utils/reminderText.js';

const router = Router();

router.get('/patient/medicines', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const schedules = await findRecords(MedicationSchedule, { patientId: req.user.id, status: 'ACTIVE' }, { sort: { startDate: 1 } });
  const prescriptionIds = [...new Set(schedules.map((schedule) => schedule.prescriptionId))];
  const prescriptions = await findRecords(Prescription, { id: { $in: prescriptionIds } });
  const prescriptionMap = new Map(prescriptions.map((prescription) => [prescription.id, prescription]));
  const medicineIds = schedules.map((schedule) => schedule.medicineId || prescriptionMap.get(schedule.prescriptionId)?.medications?.find((item) => item.itemId === schedule.medicationItemId)?.medicineId).filter(Boolean);
  const catalog = await findRecords(Medicine, { id: { $in: [...new Set(medicineIds)] } });
  const catalogMap = new Map(catalog.map((medicine) => [medicine.id, medicine]));
  const doctors = new Map();
  for (const schedule of schedules) {
    if (!doctors.has(schedule.doctorId)) doctors.set(schedule.doctorId, await findRecord(User, { id: schedule.doctorId, role: 'DOCTOR' }));
  }
  const medicines = schedules.map((schedule) => {
    const prescribed = prescriptionMap.get(schedule.prescriptionId)?.medications?.find((item) => item.itemId === schedule.medicationItemId);
    const catalogMedicine = catalogMap.get(schedule.medicineId || prescribed?.medicineId);
    return {
      ...schedule, imageUrl: schedule.imageUrl || prescribed?.imageUrl || catalogMedicine?.imageUrl,
      doctorName: doctors.get(schedule.doctorId)?.name || 'Care team', reminderTimes: schedule.times
    };
  });
  return res.json({ medicines });
}));

router.get('/patient/reminders', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const [patientUser, reminders] = await Promise.all([
    findRecord(User, { id: req.user.id }),
    findRecords(MedicationReminder, { patientId: req.user.id }, { sort: { notifyAt: 1 }, limit: 500 })
  ]);
  const doctorIds = [...new Set(reminders.map((r) => r.doctorId).filter(Boolean))];
  const doctorRecords = await Promise.all(doctorIds.map((id) => findRecord(User, { id, role: 'DOCTOR' })));
  const doctorMap = new Map(doctorRecords.filter(Boolean).map((d) => [d.id, d]));
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const enriched = reminders.map((item) => {
    const doctor = doctorMap.get(item.doctorId);
    const doctorName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Your Doctor';
    const foodInstruction = item.foodInstruction || 'ANY';
    const specialInstructions = item.specialInstructions || '';
    const imageUrl = item.imageUrl || getDefaultMedicineImage();

    const notificationText = buildNotificationText({
      medicineName: item.medicineName,
      dosage: item.dosage,
      foodInstruction,
      doctorName,
      specialInstructions
    });

    const whatsappText = buildWhatsAppReminderText({
      patientName: patientUser?.name || 'Patient',
      medicineName: item.medicineName,
      dosage: item.dosage,
      scheduledTime: item.scheduledFor,
      foodInstruction,
      doctorName,
      specialInstructions,
      clientUrl
    });

    const whatsappUrl = buildWhatsAppUrl(whatsappText, patientUser?.phone);

    return {
      ...item,
      dueAt: item.notifyAt || item.scheduledFor,
      message: `${item.medicineName} · ${item.dosage}`,
      imageUrl,
      foodInstruction,
      foodLabel: getFoodLabel(foodInstruction),
      specialInstructions,
      doctorName,
      notificationText,
      whatsappText,
      whatsappUrl
    };
  });

  return res.json({ reminders: enriched });
}));

router.get('/patient/medication-logs', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const logs = await findRecords(MedicationLog, { patientId: req.user.id }, { sort: { loggedAt: -1 }, limit: 250 });
  return res.json({ logs });
}));

router.post('/patient/medication-logs', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const { reminderId, status } = req.body;
  if (typeof reminderId !== 'string' || !['TAKEN', 'MISSED'].includes(status)) return res.status(400).json({ message: 'Choose a scheduled dose and a TAKEN or MISSED status.' });
  const reminder = await findRecord(MedicationReminder, { id: reminderId, patientId: req.user.id });
  if (!reminder) return res.status(404).json({ message: 'Scheduled dose not found.' });
  if (!['PENDING', 'SNOOZED'].includes(reminder.status)) return res.status(409).json({ message: 'This dose has already been logged or cancelled.' });
  const dueAt = new Date(reminder.snoozedUntil || reminder.scheduledFor);
  const graceMinutes = Math.max(15, Math.min(24 * 60, Number(process.env.MISSED_DOSE_GRACE_MINUTES) || 90));
  if (dueAt > new Date(Date.now() + 5 * 60_000) || Date.now() - dueAt.getTime() > graceMinutes * 60_000) return res.status(409).json({ message: 'This dose is outside its scheduled response window.' });
  const existing = await findRecord(MedicationLog, { reminderId });
  if (existing) return res.status(409).json({ message: 'This dose has already been logged.' });
  const updatedReminder = await updateRecord(MedicationReminder, { id: reminderId, patientId: req.user.id, status: { $in: ['PENDING', 'SNOOZED'] } }, { status });
  if (!updatedReminder) return res.status(409).json({ message: 'This dose changed while it was being logged. Refresh and try again.' });
  let log;
  try {
    log = await createRecord(MedicationLog, {
      id: newId('medlog'), reminderId, scheduleId: reminder.scheduleId, prescriptionId: reminder.prescriptionId,
      patientId: req.user.id, doctorId: reminder.doctorId, status, loggedAt: new Date()
    });
  } catch (error) {
    await updateRecord(MedicationReminder, { id: reminderId }, { status: 'PENDING' });
    if (error.code === 11000) return res.status(409).json({ message: 'This dose has already been logged.' });
    throw error;
  }
  if (status === 'MISSED') await notifyUser({ userId: reminder.doctorId, role: 'DOCTOR', category: 'FOLLOW_UP', title: 'Missed medication dose', message: 'A patient marked a scheduled dose as missed.', relatedResourceId: reminder.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'PATIENT', action: `MEDICATION_${status}`, resourceType: 'MedicationReminder', resourceId: reminder.id, subjectPatientId: req.user.id });
  return res.status(201).json({ message: 'Medication log saved.', log });
}));

router.patch('/reminders/:id/snooze', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const minutes = Number(req.body.minutes || 10);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 120) return res.status(400).json({ message: 'Snooze time must be from 5 to 120 minutes.' });
  const reminder = await findRecord(MedicationReminder, { id: req.params.id, patientId: req.user.id, status: { $in: ['PENDING', 'SNOOZED'] } });
  if (!reminder) return res.status(404).json({ message: 'Open medication reminder not found.' });
  const snoozedUntil = new Date(Date.now() + minutes * 60_000);
  const updated = await updateRecord(MedicationReminder, { id: reminder.id }, { status: 'SNOOZED', snoozedUntil, notifyAt: snoozedUntil, notificationSentAt: null });
  return res.json({ reminder: updated, message: `Reminder snoozed for ${minutes} minutes.` });
}));

router.post('/reminders/:id/report-issue', authMiddleware, authorizeRole('PATIENT'), asyncHandler(async (req, res) => {
  const reminder = await findRecord(MedicationReminder, { id: req.params.id, patientId: req.user.id });
  if (!reminder) return res.status(404).json({ message: 'Medication reminder not found.' });
  const note = String(req.body.note || '').trim().slice(0, 500);
  const doctor = await findRecord(User, { id: reminder.doctorId, role: 'DOCTOR' });
  if (doctor) await notifyUser({ userId: doctor.id, role: 'DOCTOR', category: 'MEDICATION', title: 'Patient reported a medication issue', message: note || `The patient reported an issue with ${reminder.medicineName}.`, relatedResourceId: reminder.id });
  await writeAudit({ actorId: req.user.id, actorRole: 'PATIENT', action: 'MEDICATION_ISSUE_REPORTED', resourceType: 'MedicationReminder', resourceId: reminder.id, subjectPatientId: req.user.id });
  return res.status(201).json({ message: 'Your care team was notified.' });
}));

export default router;
