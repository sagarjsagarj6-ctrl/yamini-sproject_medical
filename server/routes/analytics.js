import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { patientAnalytics, doctorAnalytics } from '../services/analyticsService.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/patient/analytics', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'PATIENT') return res.status(403).json({ message: 'Patient access required.' });
  return res.json(await patientAnalytics(req.user.id, req.query.period));
}));

router.get('/doctor/analytics', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'DOCTOR') return res.status(403).json({ message: 'Doctor access required.' });
  const analytics = await doctorAnalytics(req.user.id, {
    patientId: req.query.patientId, disease: req.query.disease,
    startDate: req.query.startDate, endDate: req.query.endDate
  });
  return res.json(analytics);
}));

router.get('/analytics/summary', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role === 'PATIENT') return res.json(await patientAnalytics(req.user.id, req.query.period));
  return res.json(await doctorAnalytics(req.user.id, req.query));
}));

export default router;
