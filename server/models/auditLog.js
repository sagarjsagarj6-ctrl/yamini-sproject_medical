import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  actorId: { type: String, required: true, index: true },
  actorRole: { type: String, enum: ['DOCTOR', 'PATIENT', 'ADMIN'], required: true },
  action: { type: String, required: true, maxlength: 120 },
  resourceType: { type: String, required: true, maxlength: 80 },
  resourceId: { type: String, required: true, maxlength: 160 },
  subjectPatientId: { type: String, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now }
}, { timestamps: false });

auditLogSchema.index({ subjectPatientId: 1, occurredAt: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
