import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  doctorId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  relationId: { type: String, required: true, index: true },
  requestedAt: { type: Date, default: Date.now },
  scheduledAt: Date,
  timezone: { type: String, default: 'UTC' },
  status: { type: String, enum: ['REQUESTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'], default: 'REQUESTED', index: true },
  reason: { type: String, trim: true, maxlength: 1000 },
  doctorNotes: { type: String, trim: true, maxlength: 1000 },
  followUpFor: String,
  reminderSentAt: Date
}, { timestamps: true });

appointmentSchema.index({ doctorId: 1, scheduledAt: 1 });
appointmentSchema.index({ patientId: 1, scheduledAt: 1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
