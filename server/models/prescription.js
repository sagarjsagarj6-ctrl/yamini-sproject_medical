import mongoose from 'mongoose';

const prescribedMedicationSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  medicineId: String,
  medicineName: { type: String, required: true, trim: true, maxlength: 160 },
  imageUrl: { type: String, trim: true, maxlength: 2048 },
  dosage: { type: String, required: true, trim: true, maxlength: 80 },
  dosageUnit: { type: String, required: true, trim: true, maxlength: 40 },
  frequency: { type: String, required: true, trim: true, maxlength: 100 },
  times: { type: [String], default: [] },
  foodInstruction: { type: String, enum: ['BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'ANY'], default: 'ANY' },
  durationDays: { type: Number, min: 1, max: 365, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  timezone: { type: String, default: 'UTC' },
  specialInstructions: { type: String, trim: true, maxlength: 1000 }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  doctorId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  relationId: { type: String, required: true, index: true },
  diagnosis: { type: String, trim: true, maxlength: 500 },
  clinicalNotes: { type: String, trim: true, maxlength: 4000 },
  prescribedAt: { type: Date, default: Date.now },
  startDate: Date,
  endDate: Date,
  followUpDate: Date,
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'DISCONTINUED'], default: 'ACTIVE', index: true },
  versionNumber: { type: Number, default: 1, min: 1 },
  medications: { type: [prescribedMedicationSchema], validate: [(items) => items.length > 0, 'A prescription needs at least one medicine.'] }
}, { timestamps: true });

prescriptionSchema.index({ patientId: 1, prescribedAt: -1 });
prescriptionSchema.index({ doctorId: 1, prescribedAt: -1 });

export default mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
