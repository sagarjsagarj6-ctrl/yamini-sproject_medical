import MedicationReminder from '../models/medicationReminder.js';
import { createRecord, findRecords } from './recordStore.js';
import { newId } from './recordStore.js';

const localParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

export const isValidTimeZone = (value) => {
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }).format(); return true; }
  catch { return false; }
};

export const dateOnly = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const dateOnlyDate = (key) => new Date(`${key}T00:00:00.000Z`);
const dateKeyFromParts = (parts) => `${parts.year}-${parts.month}-${parts.day}`;

const localDateTimeToUtc = (dateKey, time, timeZone) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const targetLocalAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let candidate = targetLocalAsUtc;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const parts = localParts(new Date(candidate), timeZone);
    const observed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    const delta = targetLocalAsUtc - observed;
    if (delta === 0) return new Date(candidate);
    candidate += delta;
  }
  const parts = localParts(new Date(candidate), timeZone);
  if (Number(parts.year) !== year || Number(parts.month) !== month || Number(parts.day) !== day || Number(parts.hour) !== hour || Number(parts.minute) !== minute) return null;
  return new Date(candidate);
};

const addDays = (dateKey, amount) => {
  const date = dateOnlyDate(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateOnly(date);
};

export const buildOccurrence = ({ dateKey, time, timeZone }) => localDateTimeToUtc(dateKey, time, timeZone);

export const ensureScheduleReminders = async (schedule, { daysAhead = 14, now = new Date() } = {}) => {
  const timeZone = schedule.timezone || 'UTC';
  const today = dateKeyFromParts(localParts(now, timeZone));
  const start = dateOnly(schedule.startDate);
  const end = dateOnly(schedule.endDate);
  const firstDay = today > start ? today : start;
  const lastDay = addDays(today, daysAhead);
  const through = end < lastDay ? end : lastDay;
  const created = [];
  const rangeStart = localDateTimeToUtc(firstDay, '00:00', timeZone);
  const rangeEnd = localDateTimeToUtc(addDays(through, 1), '00:00', timeZone);
  const existing = await findRecords(MedicationReminder, {
    scheduleId: schedule.id,
    scheduledFor: { $gte: rangeStart, $lt: rangeEnd }
  });
  const existingTimes = new Set(existing.map((reminder) => new Date(reminder.scheduledFor).getTime()));
  let cursor = firstDay;
  while (cursor <= through) {
    for (const time of schedule.times || []) {
      const scheduledFor = localDateTimeToUtc(cursor, time, timeZone);
      if (!scheduledFor) continue;
      if (existingTimes.has(scheduledFor.getTime())) continue;
      try {
        created.push(await createRecord(MedicationReminder, {
          id: newId('reminder'), scheduleId: schedule.id, prescriptionId: schedule.prescriptionId,
          medicationItemId: schedule.medicationItemId, doctorId: schedule.doctorId, patientId: schedule.patientId,
          medicineName: schedule.medicineName, imageUrl: schedule.imageUrl, dosage: `${schedule.dosage} ${schedule.dosageUnit}`,
          foodInstruction: schedule.foodInstruction || 'ANY',
          specialInstructions: schedule.specialInstructions || '',
          scheduledFor, notifyAt: scheduledFor, timezone: timeZone, status: 'PENDING', deliveryStatus: 'QUEUED'
        }));
        existingTimes.add(scheduledFor.getTime());
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return created;
};

export const toLocalDateKey = (date, timeZone) => dateKeyFromParts(localParts(date, timeZone));

