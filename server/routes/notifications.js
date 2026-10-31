import { Router } from 'express';
import Notification from '../models/notification.js';
import { authMiddleware } from '../middleware/auth.js';
import { findRecord, findRecords, updateRecord, updateRecords } from '../services/recordStore.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const notifications = await findRecords(Notification, { userId: req.user.id, role: req.user.role }, { sort: { createdAt: -1 }, limit: 250 });
  return res.json({ notifications: notifications.map((item) => ({ ...item, read: Boolean(item.readAt) })) });
}));

router.patch('/read-all', authMiddleware, asyncHandler(async (req, res) => {
  const readAt = new Date();
  const count = await updateRecords(Notification, { userId: req.user.id, role: req.user.role, readAt: null }, { readAt });
  return res.json({ updated: count });
}));

router.patch('/:id/read', authMiddleware, asyncHandler(async (req, res) => {
  const notification = await findRecord(Notification, { id: req.params.id, userId: req.user.id, role: req.user.role });
  if (!notification) return res.status(404).json({ message: 'Notification not found.' });
  const updated = notification.readAt ? notification : await updateRecord(Notification, { id: notification.id, userId: req.user.id }, { readAt: new Date() });
  return res.json({ message: 'Notification marked as read.', notification: { ...updated, read: true } });
}));

export default router;
