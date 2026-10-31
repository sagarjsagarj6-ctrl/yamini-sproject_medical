import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  medicineName: { type: String, required: true, trim: true, maxlength: 160 },
  brandName: { type: String, trim: true, maxlength: 160 },
  genericName: { type: String, trim: true, maxlength: 160 },
  category: { type: String, trim: true, maxlength: 100 },
  dosageForm: { type: String, trim: true, maxlength: 80 },
  strengths: { type: [String], default: [] },
  imageUrl: { type: String, trim: true, maxlength: 2048 },
  description: { type: String, trim: true, maxlength: 2000 },
  source: { type: String, enum: ['CATALOG', 'MANUAL'], default: 'MANUAL' },
  isVerified: { type: Boolean, default: false },
  createdBy: { type: String, index: true }
}, { timestamps: true });

medicineSchema.index({ medicineName: 'text', brandName: 'text', genericName: 'text', category: 'text' });

export default mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
