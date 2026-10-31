import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  requestedBy: { type: String, required: true, index: true },
  role: { type: String, enum: ['DOCTOR', 'PATIENT'], required: true },
  patientId: { type: String, index: true },
  summary: { type: String, required: true, maxlength: 6000 },
  evidence: { type: [String], default: [] },
  model: String,
  generatedAt: { type: Date, default: Date.now },
  disclaimer: { type: String, default: 'AI-generated information for review; not a diagnosis or prescription.' }
}, { timestamps: false });

export default mongoose.models.AIInsight || mongoose.model('AIInsight', aiInsightSchema);
