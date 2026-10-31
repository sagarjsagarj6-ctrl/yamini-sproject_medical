import mongoose from 'mongoose';

const symptomRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  symptom: { type: String, required: true, trim: true, maxlength: 120 },
  severity: { type: Number, min: 1, max: 10, required: true },
  notes: { type: String, trim: true, maxlength: 500 },
  measurement: { label: String, value: Number, unit: String },
  recordedAt: { type: Date, default: Date.now }
}, { timestamps: true });

symptomRecordSchema.index({ patientId: 1, recordedAt: -1 });

export default mongoose.models.SymptomRecord || mongoose.model('SymptomRecord', symptomRecordSchema);
