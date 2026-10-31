import mongoose from 'mongoose';

const medicalHistoryRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  authorRole: { type: String, enum: ['PATIENT', 'DOCTOR'], required: true },
  relationId: String,
  category: { type: String, enum: ['DIAGNOSIS', 'HOSPITAL_VISIT', 'ALLERGY', 'SURGERY', 'CONDITION', 'OBSERVATION', 'TREATMENT'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  details: { type: String, trim: true, maxlength: 4000 },
  occurredAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['PATIENT', 'DOCTOR', 'IMPORTED'], default: 'PATIENT' }
}, { timestamps: true });

medicalHistoryRecordSchema.index({ patientId: 1, occurredAt: -1 });

export default mongoose.models.MedicalHistoryRecord || mongoose.model('MedicalHistoryRecord', medicalHistoryRecordSchema);
