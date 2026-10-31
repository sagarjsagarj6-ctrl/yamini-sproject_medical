import { Router } from 'express';
import Medicine from '../models/medicine.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { createRecord, findRecords, newId } from '../services/recordStore.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim().toLowerCase();
  const dosageForm = String(req.query.dosageForm || '').trim().toLowerCase();
  let medicines = await findRecords(Medicine, {} , { sort: { medicineName: 1 }, limit: 500 });
  medicines = medicines.filter((item) => {
    const searchable = [item.medicineName, item.brandName, item.genericName, item.category, item.dosageForm].filter(Boolean).join(' ').toLowerCase();
    const visible = item.source !== 'MANUAL' || item.createdBy === req.user.id || item.isVerified;
    return visible && (!query || searchable.includes(query)) && (!category || String(item.category || '').toLowerCase().includes(category)) && (!dosageForm || String(item.dosageForm || '').toLowerCase().includes(dosageForm));
  });
  return res.json({ medicines, total: medicines.length });
}));

router.post('/', authMiddleware, authorizeRole('DOCTOR'), asyncHandler(async (req, res) => {
  const medicineName = typeof req.body.medicineName === 'string' ? req.body.medicineName.trim() : '';
  if (medicineName.length < 2 || medicineName.length > 160) return res.status(400).json({ message: 'Medicine name must be 2 to 160 characters.' });
  const strengths = Array.isArray(req.body.strengths) ? req.body.strengths.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 20) : [];
  const medicine = await createRecord(Medicine, {
    id: newId('medicine'), medicineName,
    brandName: String(req.body.brandName || '').trim().slice(0, 160),
    genericName: String(req.body.genericName || '').trim().slice(0, 160),
    category: String(req.body.category || '').trim().slice(0, 100),
    dosageForm: String(req.body.dosageForm || '').trim().slice(0, 80), strengths,
    imageUrl: String(req.body.imageUrl || '').trim().slice(0, 2048),
    description: String(req.body.description || '').trim().slice(0, 2000),
    source: 'MANUAL', isVerified: false, createdBy: req.user.id
  });
  return res.status(201).json({ medicine, message: 'Manual medicine entry saved as unverified reference information.' });
}));

export default router;
