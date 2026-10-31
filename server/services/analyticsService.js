import User from '../models/user.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import Prescription from '../models/prescription.js';
import MedicationLog from '../models/medicationLog.js';
import SymptomRecord from '../models/symptomRecord.js';
import RecoveryRecord from '../models/recoveryRecord.js';
import { findRecord, findRecords } from './recordStore.js';

const DAY = 86_400_000;
const dateRange = (period = 'week') => {
  const now = new Date();
  const count = period === 'day' ? 24 : period === 'month' ? 30 : 7;
  const interval = period === 'day' ? 3_600_000 : DAY;
  const end = new Date(now);
  const start = new Date(now.getTime() - (count - 1) * interval);
  if (period !== 'day') start.setUTCHours(0, 0, 0, 0);
  else start.setUTCMinutes(0, 0, 0);
  return { now, start, end, count, interval, period };
};

const bucketLabel = (date, period) => period === 'day'
  ? date.toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'UTC' })
  : date.toLocaleDateString('en-US', { month: period === 'month' ? 'short' : undefined, day: 'numeric', timeZone: 'UTC' });

const inRange = (value, start, end) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= start && date <= end;
};

export const patientAnalytics = async (patientId, period = 'week') => {
  const range = dateRange(['day', 'week', 'month'].includes(period) ? period : 'week');
  const [logs, symptoms, recovery, prescriptions] = await Promise.all([
    findRecords(MedicationLog, { patientId }, { sort: { loggedAt: 1 }, limit: 10_000 }),
    findRecords(SymptomRecord, { patientId }, { sort: { recordedAt: 1 }, limit: 10_000 }),
    findRecords(RecoveryRecord, { patientId }, { sort: { assessedAt: 1 }, limit: 10_000 }),
    findRecords(Prescription, { patientId }, { sort: { prescribedAt: -1 }, limit: 1000 })
  ]);
  const dueLogs = logs.filter((item) => inRange(item.loggedAt, range.start, range.end));
  const periodLogs = dueLogs.filter((item) => new Date(item.loggedAt) <= range.now);
  const orderedRecovery = recovery.slice().sort((a, b) => new Date(a.assessedAt) - new Date(b.assessedAt));
  const trend = Array.from({ length: range.count }, (_, index) => {
    const from = new Date(range.start.getTime() + index * range.interval);
    const to = new Date(from.getTime() + range.interval);
    const bucketLogs = logs.filter((item) => inRange(item.loggedAt, from, new Date(to.getTime() - 1)));
    const bucketSymptoms = symptoms.filter((item) => inRange(item.recordedAt, from, new Date(to.getTime() - 1)));
    const bucketRecovery = orderedRecovery.filter((item) => inRange(item.assessedAt, from, new Date(to.getTime() - 1)));
    return {
      date: from.toISOString(), label: bucketLabel(from, range.period),
      adherence: bucketLogs.length ? Math.round((bucketLogs.filter((item) => item.status === 'TAKEN').length / bucketLogs.length) * 100) : null,
      loggedDoses: bucketLogs.length,
      symptomSeverity: bucketSymptoms.length ? Number((bucketSymptoms.reduce((total, item) => total + item.severity, 0) / bucketSymptoms.length).toFixed(1)) : null,
      symptomEntries: bucketSymptoms.length,
      recoveryScore: bucketRecovery.length ? bucketRecovery[bucketRecovery.length - 1].score : null,
      recoveryStatus: bucketRecovery.length ? bucketRecovery[bucketRecovery.length - 1].status : null
    };
  });
  const completed = prescriptions.filter((item) => item.status === 'COMPLETED').length;
  const measurements = symptoms.filter((item) => item.measurement).map((item) => ({ ...item.measurement, createdAt: item.recordedAt, symptom: item.symptom })).slice(-100);
  const recentSymptoms = symptoms.slice().sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)).slice(0, 5);
  return {
    period: range.period, trend,
    periodAdherence: periodLogs.length ? Math.round(periodLogs.filter((item) => item.status === 'TAKEN').length / periodLogs.length * 100) : null,
    overallAdherence: logs.length ? Math.round(logs.filter((item) => item.status === 'TAKEN').length / logs.length * 100) : null,
    adherenceDefinition: 'Taken logs divided by all logged doses. No logs means no adherence percentage is available.',
    latestRecoveryScore: orderedRecovery.length ? orderedRecovery[orderedRecovery.length - 1].score : null,
    latestRecoveryStatus: orderedRecovery.length ? orderedRecovery[orderedRecovery.length - 1].status : null,
    recoveryAssessmentCount: recovery.length, symptomEntryCount: symptoms.length,
    recentSymptoms, measurementTrend: measurements,
    treatmentCompletion: prescriptions.length ? Math.round(completed / prescriptions.length * 100) : null,
    prescriptions: { completed, active: prescriptions.filter((item) => item.status === 'ACTIVE').length, total: prescriptions.length },
    refreshedAt: new Date().toISOString()
  };
};

export const doctorAnalytics = async (doctorId, filters = {}) => {
  const relations = await findRecords(DoctorPatientRelation, { doctorId, status: 'APPROVED' }, { limit: 5000 });
  const relationIds = relations.map((item) => item.patientId);
  if (filters.patientId && !relationIds.includes(filters.patientId)) {
    const error = new Error('Patient is not connected to this doctor.');
    error.statusCode = 404;
    throw error;
  }
  let patients = (await Promise.all(relationIds.map((id) => findRecord(User, { id, role: 'PATIENT' })))).filter(Boolean);
  if (filters.patientId) patients = patients.filter((patient) => patient.id === filters.patientId);
  const disease = String(filters.disease || '').trim().toLowerCase();
  if (disease) patients = patients.filter((patient) => String(patient.primaryDisease || '').toLowerCase().includes(disease));
  const patientIds = patients.map((item) => item.id);
  let start = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * DAY);
  let end = filters.endDate ? new Date(filters.endDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    const error = new Error('Analytics dates are invalid.');
    error.statusCode = 400;
    throw error;
  }
  end.setUTCHours(23, 59, 59, 999);
  const [prescriptions, logs, recovery, symptoms] = await Promise.all([
    findRecords(Prescription, { doctorId, patientId: { $in: patientIds } }, { sort: { prescribedAt: -1 }, limit: 10_000 }),
    findRecords(MedicationLog, { doctorId, patientId: { $in: patientIds } }, { sort: { loggedAt: 1 }, limit: 25_000 }),
    findRecords(RecoveryRecord, { doctorId, patientId: { $in: patientIds } }, { sort: { assessedAt: 1 }, limit: 10_000 }),
    findRecords(SymptomRecord, { patientId: { $in: patientIds } }, { sort: { recordedAt: 1 }, limit: 25_000 })
  ]);
  const inSelectedRange = (record, field) => inRange(record[field], start, end);
  const filteredLogs = logs.filter((item) => inSelectedRange(item, 'loggedAt'));
  const filteredRecovery = recovery.filter((item) => inSelectedRange(item, 'assessedAt'));
  const filteredSymptoms = symptoms.filter((item) => inSelectedRange(item, 'recordedAt'));
  const diseaseCounts = new Map();
  for (const patient of patients) if (patient.primaryDisease) diseaseCounts.set(patient.primaryDisease, (diseaseCounts.get(patient.primaryDisease) || 0) + 1);
  const averageDuration = prescriptions.flatMap((item) => item.medications || []).map((item) => item.durationDays).filter(Number.isFinite);
  const progress = await Promise.all(patients.map(async (patient) => {
    const patientLogs = filteredLogs.filter((item) => item.patientId === patient.id);
    const patientAssessments = recovery.filter((item) => item.patientId === patient.id).sort((a, b) => new Date(a.assessedAt) - new Date(b.assessedAt));
    const patientPrescriptions = prescriptions.filter((item) => item.patientId === patient.id);
    return {
      patientId: patient.id, name: patient.name, disease: patient.primaryDisease || 'Not recorded',
      adherence: patientLogs.length ? Math.round(patientLogs.filter((item) => item.status === 'TAKEN').length / patientLogs.length * 100) : null,
      recoveryStatus: patientAssessments.at(-1)?.status || 'Not assessed',
      recoveryScore: patientAssessments.at(-1)?.score ?? null,
      activePrescriptions: patientPrescriptions.filter((item) => item.status === 'ACTIVE').length,
      completedPrescriptions: patientPrescriptions.filter((item) => item.status === 'COMPLETED').length
    };
  }));
  const trend = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  for (let i = 0; cursor <= end && i < 366; i += 1) {
    const next = new Date(cursor.getTime() + DAY);
    const dayLogs = filteredLogs.filter((item) => inRange(item.loggedAt, cursor, new Date(next.getTime() - 1)));
    const daySymptoms = filteredSymptoms.filter((item) => inRange(item.recordedAt, cursor, new Date(next.getTime() - 1)));
    const dayRecovery = filteredRecovery.filter((item) => inRange(item.assessedAt, cursor, new Date(next.getTime() - 1)));
    trend.push({
      date: cursor.toISOString(), label: bucketLabel(cursor, 'week'),
      adherence: dayLogs.length ? Math.round(dayLogs.filter((item) => item.status === 'TAKEN').length / dayLogs.length * 100) : null,
      symptomSeverity: daySymptoms.length ? Number((daySymptoms.reduce((sum, item) => sum + item.severity, 0) / daySymptoms.length).toFixed(1)) : null,
      recoveryScore: dayRecovery.length ? dayRecovery[dayRecovery.length - 1].score : null
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return {
    period: { startDate: start.toISOString(), endDate: end.toISOString() },
    stats: {
      totalDiagnosedPatients: patients.filter((patient) => patient.primaryDisease).length,
      activePatients: patients.length,
      completedTreatments: prescriptions.filter((item) => item.status === 'COMPLETED').length,
      activeTreatments: prescriptions.filter((item) => item.status === 'ACTIVE').length,
      recoveryAssessments: filteredRecovery.length,
      recoveryStatuses: Object.fromEntries([...new Set(filteredRecovery.map((item) => item.status))].map((status) => [status, filteredRecovery.filter((item) => item.status === status).length])),
      adherenceRate: filteredLogs.length ? Math.round(filteredLogs.filter((item) => item.status === 'TAKEN').length / filteredLogs.length * 100) : null,
      averageTreatmentDurationDays: averageDuration.length ? Math.round(averageDuration.reduce((sum, item) => sum + item, 0) / averageDuration.length) : null,
      followUpsRequired: recovery.filter((item) => item.status === 'Requires Reassessment' || (item.nextAssessmentAt && new Date(item.nextAssessmentAt) <= new Date())).length
    },
    diseaseDistribution: [...diseaseCounts].map(([diseaseName, count]) => ({ disease: diseaseName, count })),
    patientProgress: progress, trend,
    definitions: {
      adherenceRate: 'Taken medication logs divided by all taken and missed logs in the selected date range.',
      completedTreatments: 'Prescriptions explicitly marked completed by the prescribing doctor.',
      recovery: 'Only doctor-recorded assessments; symptom severity and adherence are shown separately.'
    }
  };
};

