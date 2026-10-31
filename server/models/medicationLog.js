import mongoose from 'mongoose';

const medicationLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reminderId: { type: String, required: true, unique: true },
  scheduleId: { type: String, required: true, index: true },
  prescriptionId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true, index: true },
  status: { type: String, enum: ['TAKEN', 'MISSED', 'ISSUE_REPORTED'], required: true },
  notes: { type: String, trim: true, maxlength: 500 },
  loggedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.MedicationLog || mongoose.model('MedicationLog', medicationLogSchema);
