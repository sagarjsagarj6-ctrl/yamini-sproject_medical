import AuditLog from '../models/auditLog.js';
import Notification from '../models/notification.js';
import { createRecord, newId } from './recordStore.js';

export const writeAudit = async ({ actorId, actorRole, action, resourceType, resourceId, subjectPatientId, metadata }) => {
  await createRecord(AuditLog, {
    id: newId('audit'), actorId, actorRole, action, resourceType, resourceId,
    subjectPatientId, metadata: metadata || {}, occurredAt: new Date()
  });
};

export const notifyUser = async ({ userId, role, category = 'SYSTEM', title, message, relatedResourceId }) => createRecord(Notification, {
  id: newId('notification'), userId, role, category, title, message,
  relatedResourceId, readAt: null, deliveryStatus: 'IN_APP', createdAt: new Date()
});
