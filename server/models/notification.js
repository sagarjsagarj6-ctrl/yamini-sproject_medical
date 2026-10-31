import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['DOCTOR', 'PATIENT'], required: true },
  category: { type: String, enum: ['MEDICATION', 'APPOINTMENT', 'CONNECTION', 'SYMPTOM', 'RECOVERY', 'FOLLOW_UP', 'SYSTEM'], default: 'SYSTEM' },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  readAt: Date,
  deliveryStatus: { type: String, enum: ['IN_APP', 'QUEUED', 'SENT', 'FAILED', 'NOT_CONFIGURED'], default: 'IN_APP' },
  relatedResourceId: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: false, updatedAt: false } });

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
