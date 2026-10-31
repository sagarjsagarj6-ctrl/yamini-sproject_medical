import mongoose from 'mongoose';

const patientAnalyticsRecordSchema = new mongoose.Schema({
  recordType: {
    type: String,
    enum: ['MEDICATION_LOG', 'RECOVERY_ASSESSMENT', 'SYMPTOM_LOG', 'PRESCRIPTION_STATUS'],
    required: true
  },
  patientId: { type: String, required: true, index: true },
  doctorId: String,
  reminderId: String,
  prescriptionId: String,
  medicationStatus: { type: String, enum: ['TAKEN', 'MISSED'] },
  treatmentStatus: { type: String, enum: ['ACTIVE', 'COMPLETED'] },
  score: { type: Number, min: 0, max: 100 },
  recoveryStatus: { type: String, enum: ['Under Treatment', 'Improving', 'Stable', 'Requires Reassessment', 'Recovered'] },
  clinicalAssessment: String,
  followUpRecommendation: String,
  symptom: String,
  severity: { type: Number, min: 1, max: 10 },
  notes: String,
  measurement: {
    label: String,
    value: Number,
    unit: String
  }
}, { timestamps: { createdAt: true, updatedAt: false } });

patientAnalyticsRecordSchema.index(
  { patientId: 1, reminderId: 1 },
  { unique: true, partialFilterExpression: { recordType: 'MEDICATION_LOG', reminderId: { $type: 'string' } } }
);
patientAnalyticsRecordSchema.index(
  { prescriptionId: 1 },
  { unique: true, partialFilterExpression: { recordType: 'PRESCRIPTION_STATUS', prescriptionId: { $type: 'string' } } }
);

export default mongoose.models.PatientAnalyticsRecord || mongoose.model('PatientAnalyticsRecord', patientAnalyticsRecordSchema);
