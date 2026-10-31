import mongoose from 'mongoose';

const medicationReminderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  scheduleId: { type: String, required: true },
  prescriptionId: { type: String, required: true, index: true },
  medicationItemId: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  medicineName: { type: String, required: true },
  imageUrl: { type: String, trim: true, maxlength: 2048 },
  dosage: { type: String, required: true },
  foodInstruction: { type: String, default: 'ANY' },
  specialInstructions: { type: String, trim: true, maxlength: 1000 },
  scheduledFor: { type: Date, required: true, index: true },
  notifyAt: { type: Date, index: true },
  timezone: { type: String, default: 'UTC' },
  status: { type: String, enum: ['PENDING', 'TAKEN', 'MISSED', 'SNOOZED', 'CANCELLED'], default: 'PENDING', index: true },
  snoozedUntil: Date,
  deliveryStatus: { type: String, enum: ['QUEUED', 'DELIVERED', 'FAILED', 'NOT_CONFIGURED'], default: 'QUEUED' },
  deliveredAt: Date,
  notificationSentAt: Date
}, { timestamps: true });

medicationReminderSchema.index({ scheduleId: 1, scheduledFor: 1 }, { unique: true });
medicationReminderSchema.index({ patientId: 1, scheduledFor: 1, status: 1 });

export default mongoose.models.MedicationReminder || mongoose.model('MedicationReminder', medicationReminderSchema);
