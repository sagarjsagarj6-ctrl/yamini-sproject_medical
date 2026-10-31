import Appointment from '../models/appointment.js';
import { findRecords, updateRecord } from '../services/recordStore.js';
import { notifyUser } from '../services/auditService.js';

let timer;
let running = false;

export const processAppointmentReminders = async (now = new Date()) => {
  const horizon = new Date(now.getTime() + 24 * 60 * 60_000);
  const appointments = await findRecords(Appointment, { status: 'CONFIRMED', reminderSentAt: null, scheduledAt: { $gte: now, $lte: horizon } }, { limit: 500 });
  for (const appointment of appointments) {
    const claimed = await updateRecord(Appointment, { id: appointment.id, reminderSentAt: null }, { reminderSentAt: now });
    if (!claimed) continue;
    await Promise.all([
      notifyUser({ userId: appointment.patientId, role: 'PATIENT', category: 'APPOINTMENT', title: 'Upcoming appointment', message: 'You have an appointment with your doctor within the next 24 hours.', relatedResourceId: appointment.id }),
      notifyUser({ userId: appointment.doctorId, role: 'DOCTOR', category: 'APPOINTMENT', title: 'Upcoming appointment', message: 'A patient appointment is scheduled within the next 24 hours.', relatedResourceId: appointment.id })
    ]);
  }
};

export const startAppointmentReminderWorker = () => {
  if (timer) return;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await processAppointmentReminders(); }
    catch (error) { console.error('Appointment reminder worker failed:', error.message); }
    finally { running = false; }
  };
  void tick();
  timer = setInterval(tick, 60_000);
  timer.unref?.();
};

export const stopAppointmentReminderWorker = () => {
  if (timer) clearInterval(timer);
  timer = undefined;
};
