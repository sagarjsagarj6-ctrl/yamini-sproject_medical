import mongoose from 'mongoose';

const medicationScheduleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  prescriptionId: { type: String, required: true, index: true },
  medicationItemId: { type: String, required: true },
  medicineId: String,
  doctorId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  medicineName: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true, maxlength: 2048 },
  dosage: { type: String, required: true, trim: true },
  dosageUnit: { type: String, required: true, trim: true },
  frequency: { type: String, required: true, trim: true },
  times: { type: [String], default: [] },
  timezone: { type: String, default: 'UTC' },
  foodInstruction: { type: String, default: 'ANY' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  specialInstructions: { type: String, trim: true },
  status: { type: String, enum: ['ACTIVE', 'DISCONTINUED', 'COMPLETED'], default: 'ACTIVE', index: true }
}, { timestamps: true });

medicationScheduleSchema.index({ patientId: 1, status: 1, startDate: 1, endDate: 1 });

export default mongoose.models.MedicationSchedule || mongoose.model('MedicationSchedule', medicationScheduleSchema);
