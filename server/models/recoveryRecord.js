import mongoose from 'mongoose';

const recoveryRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, required: true, index: true },
  relationId: { type: String, required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  status: { type: String, enum: ['Under Treatment', 'Improving', 'Stable', 'Requires Reassessment', 'Recovered'], required: true },
  clinicalAssessment: { type: String, trim: true, maxlength: 4000 },
  followUpRecommendation: { type: String, trim: true, maxlength: 1000 },
  nextAssessmentAt: Date,
  assessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

recoveryRecordSchema.index({ patientId: 1, assessedAt: -1 });

export default mongoose.models.RecoveryRecord || mongoose.model('RecoveryRecord', recoveryRecordSchema);
