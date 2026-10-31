import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import { findRecord } from './recordStore.js';

export const approvedRelation = (doctorId, patientId) => findRecord(DoctorPatientRelation, {
  doctorId, patientId, status: 'APPROVED'
});

export const mayViewPatient = async (actor, patientId) => {
  if (actor.role === 'PATIENT') return actor.id === patientId;
  if (actor.role !== 'DOCTOR') return false;
  return Boolean(await approvedRelation(actor.id, patientId));
};

