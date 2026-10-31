import mongoose from 'mongoose';

const relationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  doctorId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISCONNECTED'], default: 'PENDING', index: true },
  connectionMethod: { type: String, enum: ['DOCTOR_SEARCH', 'UNIQUE_CODE'], required: true },
  connectedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  disconnectedAt: Date,
  permissions: { type: [String], default: ['view_prescriptions'] }
}, { timestamps: true });

relationSchema.index({ doctorId: 1, patientId: 1, status: 1 });

export default mongoose.models.DoctorPatientRelation || mongoose.model('DoctorPatientRelation', relationSchema);
