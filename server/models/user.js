import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  role: { type: String, enum: ['DOCTOR', 'PATIENT'], required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, trim: true, maxlength: 30 },
  dob: Date,
  gender: { type: String, trim: true, maxlength: 40 },
  profileImage: { type: String, trim: true, maxlength: 2048 },
  specialization: { type: String, trim: true, maxlength: 100 },
  hospitalName: { type: String, trim: true, maxlength: 160 },
  hospitalLocation: { type: String, trim: true, maxlength: 160 },
  designation: { type: String, trim: true, maxlength: 120 },
  degree: { type: String, trim: true, maxlength: 120 },
  graduationYear: Number,
  experience: Number,
  medicalRegistrationNumber: { type: String, trim: true, maxlength: 100 },
  professionalDescription: { type: String, trim: true, maxlength: 2000 },
  consultationInfo: { type: String, trim: true, maxlength: 500 },
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  connectionCode: { type: String, unique: true, sparse: true, index: true },
  connectionCodeExpiresAt: Date,
  address: { type: String, trim: true, maxlength: 500 },
  bloodGroup: { type: String, trim: true, maxlength: 8 },
  emergencyContact: { type: String, trim: true, maxlength: 80 },
  height: Number,
  weight: Number,
  primaryDisease: { type: String, trim: true, maxlength: 160 },
  diseaseDescription: { type: String, trim: true, maxlength: 2000 },
  yearsSuffering: Number,
  previousMedicalHistory: { type: String, trim: true, maxlength: 4000 },
  existingMedications: { type: String, trim: true, maxlength: 2000 },
  allergies: { type: String, trim: true, maxlength: 2000 },
  previousSurgeries: { type: String, trim: true, maxlength: 2000 },
  existingHealthConditions: { type: String, trim: true, maxlength: 2000 },
  lifestyleInfo: { type: String, trim: true, maxlength: 2000 },
  emergencyNotes: { type: String, trim: true, maxlength: 1000 }
}, { timestamps: true, strict: false });

userSchema.index({ role: 1, name: 1 });
userSchema.index({ role: 1, specialization: 1, hospitalName: 1, hospitalLocation: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
