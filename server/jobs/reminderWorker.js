import MedicationSchedule from '../models/medicationSchedule.js';
import MedicationReminder from '../models/medicationReminder.js';
import MedicationLog from '../models/medicationLog.js';
import { ensureScheduleReminders } from '../services/scheduling.js';
import { createRecord, findRecords, updateRecord } from '../services/recordStore.js';
import { notifyUser, writeAudit } from '../services/auditService.js';
import { buildNotificationText } from '../utils/reminderText.js';

let timer;
let running = false;

export const processMedicationReminders = async (now = new Date()) => {
  const schedules = await findRecords(MedicationSchedule, { status: 'ACTIVE' }, { limit: 1000 });
  for (const schedule of schedules) {
    if (new Date(schedule.endDate) < now) {
      await updateRecord(MedicationSchedule, { id: schedule.id, status: 'ACTIVE' }, { status: 'COMPLETED' });
      continue;
    }
    await ensureScheduleReminders(schedule, { daysAhead: 14, now });
  }

  const due = await findRecords(MedicationReminder, {
    status: { $in: ['PENDING', 'SNOOZED'] }, notificationSentAt: null, notifyAt: { $lte: now }
  }, { sort: { notifyAt: 1 }, limit: 1000 });
  for (const reminder of due) {
    const notificationMessage = buildNotificationText({
      medicineName: reminder.medicineName,
      dosage: reminder.dosage,
      foodInstruction: reminder.foodInstruction,
      specialInstructions: reminder.specialInstructions
    });
    await notifyUser({
      userId: reminder.patientId, role: 'PATIENT', category: 'MEDICATION', title: `Medication Reminder: ${reminder.medicineName}`,
      message: notificationMessage, relatedResourceId: reminder.id
    });
    await updateRecord(MedicationReminder, { id: reminder.id, notificationSentAt: null }, { notificationSentAt: now, deliveryStatus: 'IN_APP' });
  }

  const graceMinutes = Math.max(15, Math.min(24 * 60, Number(process.env.MISSED_DOSE_GRACE_MINUTES) || 90));
  const expiredAt = new Date(now.getTime() - graceMinutes * 60_000);
  const overdue = await findRecords(MedicationReminder, { status: { $in: ['PENDING', 'SNOOZED'] }, notifyAt: { $lte: expiredAt } }, { sort: { notifyAt: 1 }, limit: 1000 });
  for (const reminder of overdue) {
    const missed = await updateRecord(MedicationReminder, { id: reminder.id, status: { $in: ['PENDING', 'SNOOZED'] } }, { status: 'MISSED' });
    if (!missed) continue;
    try {
      await createRecord(MedicationLog, {
        id: `medlog-${reminder.id}`, reminderId: reminder.id, scheduleId: reminder.scheduleId,
        prescriptionId: reminder.prescriptionId, patientId: reminder.patientId, doctorId: reminder.doctorId,
        status: 'MISSED', loggedAt: reminder.scheduledFor
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    await notifyUser({ userId: reminder.doctorId, role: 'DOCTOR', category: 'FOLLOW_UP', title: 'Missed medication dose', message: 'A patient dose was not logged after the configured grace period.', relatedResourceId: reminder.id });
    await writeAudit({ actorId: 'system', actorRole: 'ADMIN', action: 'DOSE_MARKED_MISSED', resourceType: 'MedicationReminder', resourceId: reminder.id, subjectPatientId: reminder.patientId });
  }
};

export const startReminderWorker = () => {
  if (timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await processMedicationReminders(); }
    catch (error) { console.error('Medication reminder worker failed:', error.message); }
    finally { running = false; }
  };
  void tick();
  timer = setInterval(tick, 60_000);
  timer.unref?.();
};

export const stopReminderWorker = () => {
  if (timer) clearInterval(timer);
  timer = undefined;
};
