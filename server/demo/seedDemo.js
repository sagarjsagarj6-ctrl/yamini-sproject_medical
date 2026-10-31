import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import Medicine from '../models/medicine.js';
import Prescription from '../models/prescription.js';
import PrescriptionVersion from '../models/prescriptionVersion.js';
import MedicationSchedule from '../models/medicationSchedule.js';
import MedicationReminder from '../models/medicationReminder.js';
import MedicationLog from '../models/medicationLog.js';
import MedicalHistoryRecord from '../models/medicalHistoryRecord.js';
import SymptomRecord from '../models/symptomRecord.js';
import RecoveryRecord from '../models/recoveryRecord.js';
import Appointment from '../models/appointment.js';
import Notification from '../models/notification.js';
import { createRecord, deleteRecords, findRecord, updateRecord } from '../services/recordStore.js';
import { ensureScheduleReminders } from '../services/scheduling.js';
import { calculateAge } from '../utils/http.js';

const DAY = 86_400_000;
const TIME_ZONE = 'Asia/Kolkata';

const PRIMARY_DOCTOR = { name: 'Dr. Maya Demo', email: 'doctor.demo@example.test', password: 'DemoDoctor2026!' };
const PRIMARY_PATIENT = { name: 'Alex Morgan (Demo)', email: 'patient.demo@example.test', password: 'DemoPatient2026!' };

const EXTRA_CASES = [
  {
    key: 'respiratory',
    doctor: { name: 'Dr. Aarav Iyer (Demo)', email: 'doctor.respiratory@example.test', password: 'DemoDoctorResp2026!', specialization: 'Pulmonology', hospitalName: 'Demo Respiratory Center', connectionCode: 'MED-DEMO-LUNG-01', medicalRegistrationNumber: 'DEMO-LUNG-001' },
    patient: { name: 'Priya Nair (Demo)', email: 'patient.respiratory@example.test', password: 'DemoPatientResp2026!', primaryDisease: 'Respiratory tracking (demo)', bloodGroup: 'A+' },
    medicineName: 'DemoCare Respiratory Sample', diagnosis: 'Respiratory symptom monitoring (demo only)',
    symptom: 'Breathing comfort check', severity: 3, measurement: { label: 'Peak flow', value: 390, unit: 'L/min (synthetic)' },
    recoveryScore: 65, recoveryStatus: 'Improving', historyTitle: 'Respiratory monitoring started', appointmentOffset: 2
  },
  {
    key: 'glucose',
    doctor: { name: 'Dr. Nisha Kapoor (Demo)', email: 'doctor.glucose@example.test', password: 'DemoDoctorGlucose2026!', specialization: 'Endocrinology', hospitalName: 'Demo Metabolic Clinic', connectionCode: 'MED-DEMO-GLU-02', medicalRegistrationNumber: 'DEMO-GLU-002' },
    patient: { name: 'Rahul Verma (Demo)', email: 'patient.glucose@example.test', password: 'DemoPatientGlucose2026!', primaryDisease: 'Glucose trend review (demo)', bloodGroup: 'B+' },
    medicineName: 'DemoCare Glucose Sample', diagnosis: 'Glucose trend review (demo only)',
    symptom: 'Energy check-in', severity: 2, measurement: { label: 'Glucose', value: 108, unit: 'mg/dL (synthetic)' },
    recoveryScore: 71, recoveryStatus: 'Under Treatment', historyTitle: 'Glucose tracking started', appointmentOffset: 3
  },
  {
    key: 'mobility',
    doctor: { name: 'Dr. Kabir Shah (Demo)', email: 'doctor.mobility@example.test', password: 'DemoDoctorMobility2026!', specialization: 'Orthopedics', hospitalName: 'Demo Mobility Center', connectionCode: 'MED-DEMO-MOB-03', medicalRegistrationNumber: 'DEMO-MOB-003' },
    patient: { name: 'Meera Joshi (Demo)', email: 'patient.mobility@example.test', password: 'DemoPatientMobility2026!', primaryDisease: 'Mobility recovery (demo)', bloodGroup: 'AB+' },
    medicineName: 'DemoCare Mobility Sample', diagnosis: 'Mobility progress tracking (demo only)',
    symptom: 'Knee stiffness check-in', severity: 4, measurement: { label: 'Walking minutes', value: 18, unit: 'minutes (synthetic)' },
    recoveryScore: 82, recoveryStatus: 'Improving', historyTitle: 'Mobility recovery tracking started', appointmentOffset: 4
  },
  {
    key: 'headache',
    doctor: { name: 'Dr. Sara Khan (Demo)', email: 'doctor.headache@example.test', password: 'DemoDoctorHeadache2026!', specialization: 'Neurology', hospitalName: 'Demo Neurology Rooms', connectionCode: 'MED-DEMO-NEU-04', medicalRegistrationNumber: 'DEMO-NEU-004' },
    patient: { name: 'Vikram Rao (Demo)', email: 'patient.headache@example.test', password: 'DemoPatientHeadache2026!', primaryDisease: 'Headache pattern tracking (demo)', bloodGroup: 'O-' },
    medicineName: 'DemoCare Headache Sample', diagnosis: 'Headache pattern tracking (demo only)',
    symptom: 'Headache check-in', severity: 5, measurement: null,
    recoveryScore: 70, recoveryStatus: 'Stable', historyTitle: 'Headache pattern notes started', appointmentOffset: 5
  },
  {
    key: 'blood-pressure',
    doctor: { name: 'Dr. Rohan Das (Demo)', email: 'doctor.pressure@example.test', password: 'DemoDoctorPressure2026!', specialization: 'Cardiology', hospitalName: 'Demo Heart Clinic', connectionCode: 'MED-DEMO-HEART-05', medicalRegistrationNumber: 'DEMO-HEART-005' },
    patient: { name: 'Asha Menon (Demo)', email: 'patient.pressure@example.test', password: 'DemoPatientPressure2026!', primaryDisease: 'Blood pressure trend (demo)', bloodGroup: 'A-' },
    medicineName: 'DemoCare Pressure Sample', diagnosis: 'Blood pressure trend review (demo only)',
    symptom: 'Blood pressure check-in', severity: 2, measurement: { label: 'Systolic pressure', value: 124, unit: 'mmHg (synthetic)' },
    recoveryScore: 75, recoveryStatus: 'Improving', historyTitle: 'Blood pressure tracking started', appointmentOffset: 6
  }
];

export const DEMO_ACCOUNTS = Object.freeze({
  doctor: PRIMARY_DOCTOR,
  patient: PRIMARY_PATIENT,
  doctors: [PRIMARY_DOCTOR, ...EXTRA_CASES.map(({ doctor }) => doctor)],
  patients: [PRIMARY_PATIENT, ...EXTRA_CASES.map(({ patient }) => patient)]
});

const IDS = Object.freeze({
  doctor: 'demo-doctor-maya', patient: 'demo-patient-alex', relation: 'demo-relation-maya-alex',
  medicine: 'demo-medicine-example', prescription: 'demo-prescription-care-plan',
  schedule: 'demo-schedule-daily', history: 'demo-history-entry', symptom: 'demo-symptom-entry',
  recovery: 'demo-recovery-entry', appointment: 'demo-appointment-follow-up',
  doctorNotification: 'demo-notification-doctor', patientNotification: 'demo-notification-patient'
});

const caseIds = (key) => ({
  doctor: `demo-doctor-${key}`, patient: `demo-patient-${key}`, relation: `demo-relation-${key}`,
  coordinatorRelation: `demo-relation-maya-${key}`, medicine: `demo-medicine-${key}`,
  prescription: `demo-prescription-${key}`, schedule: `demo-schedule-${key}`,
  history: `demo-history-${key}`, symptom: `demo-symptom-${key}`,
  recovery: `demo-recovery-${key}`, appointment: `demo-appointment-${key}`,
  doctorNotification: `demo-notification-doctor-${key}`, patientNotification: `demo-notification-patient-${key}`
});

const addDays = (date, days) => new Date(date.getTime() + days * DAY);

const nextDemoDose = () => {
  const doseTime = new Date(Math.ceil((Date.now() + 2 * 60_000) / 60_000) * 60_000);
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(doseTime).map(({ type, value }) => [type, value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`
  };
};

const upsertDemoUser = async ({ id, role, email, password, ...profile }) => {
  const existing = await findRecord(User, { email });
  if (existing && existing.role !== role) throw new Error(`Demo email ${email} is already used by a different account role.`);
  const values = { role, email, password: await bcrypt.hash(password, 10), ...profile };
  if (existing) return updateRecord(User, { id: existing.id }, values);
  return createRecord(User, { id: id || IDS[role.toLowerCase()], ...values });
};

const clearScenario = async (ids) => {
  await deleteRecords(MedicationReminder, { scheduleId: ids.schedule });
  await deleteRecords(MedicationLog, { prescriptionId: ids.prescription });
  await deleteRecords(MedicationSchedule, { id: ids.schedule });
  await deleteRecords(PrescriptionVersion, { prescriptionId: ids.prescription });
  await deleteRecords(Prescription, { id: ids.prescription });
  await deleteRecords(MedicalHistoryRecord, { id: ids.history });
  await deleteRecords(SymptomRecord, { id: ids.symptom });
  await deleteRecords(RecoveryRecord, { id: ids.recovery });
  await deleteRecords(Appointment, { id: ids.appointment });
  await deleteRecords(Notification, { id: { $in: [ids.doctorNotification, ids.patientNotification] } });
  await deleteRecords(Medicine, { id: ids.medicine });
  await deleteRecords(DoctorPatientRelation, { id: { $in: [ids.relation, ids.coordinatorRelation].filter(Boolean) } });
};

const clearPreviousDemoScenario = async () => {
  await clearScenario(IDS);
  for (const scenario of EXTRA_CASES) await clearScenario(caseIds(scenario.key));
};

const seedAdditionalCase = async (scenario, primaryDoctor, dose) => {
  const ids = caseIds(scenario.key);
  const doctor = await upsertDemoUser({
    ...scenario.doctor, id: ids.doctor, role: 'DOCTOR',
    phone: '+91 90000 00010', gender: 'Prefer not to say',
    designation: 'Consultant (demo)', degree: 'Sample qualification', experience: 6,
    verificationStatus: 'VERIFIED',
    connectionCodeExpiresAt: new Date(Date.now() + 365 * DAY),
    professionalDescription: 'Synthetic demo profile. Not a real clinician.'
  });
  const dob = new Date('1992-08-20');
  const patient = await upsertDemoUser({
    ...scenario.patient, id: ids.patient, role: 'PATIENT',
    phone: '+91 90000 00020', gender: 'Prefer not to say', dob, age: calculateAge(dob),
    address: 'Demo address, India', emergencyContact: 'Demo contact · +91 90000 00030',
    diseaseDescription: `Synthetic presentation case: ${scenario.diagnosis}. Not a real patient or treatment plan.`,
    allergies: 'No allergies recorded in this demo profile.'
  });
  const connectedAt = addDays(new Date(), -10);
  const relation = await createRecord(DoctorPatientRelation, {
    id: ids.relation, doctorId: doctor.id, patientId: patient.id, status: 'APPROVED',
    connectionMethod: 'DOCTOR_SEARCH', connectedAt, approvedAt: connectedAt,
    permissions: ['view_prescriptions', 'view_history']
  });
  await createRecord(DoctorPatientRelation, {
    id: ids.coordinatorRelation, doctorId: primaryDoctor.id, patientId: patient.id,
    status: 'APPROVED', connectionMethod: 'UNIQUE_CODE', connectedAt, approvedAt: connectedAt,
    permissions: ['view_prescriptions', 'view_history']
  });
  const medicine = await createRecord(Medicine, {
    id: ids.medicine, medicineName: scenario.medicineName, brandName: 'DemoCare',
    genericName: 'Presentation sample', category: 'Demo data', dosageForm: 'Tablet',
    strengths: ['Sample only'], imageUrl: '/demo-medicine.svg',
    description: 'Synthetic presentation data; not a real medicine or clinical recommendation.',
    source: 'MANUAL', isVerified: false, createdBy: doctor.id
  });

  const startDate = new Date(`${dose.dateKey}T00:00:00.000Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 1);
  const endDate = addDays(startDate, 6);
  const medication = {
    itemId: `${scenario.key}-demo-medication-item`, medicineId: medicine.id,
    medicineName: medicine.medicineName, imageUrl: medicine.imageUrl,
    dosage: '1', dosageUnit: 'tablet', frequency: 'Once daily · demo only',
    times: [dose.time], foodInstruction: 'AFTER_FOOD', durationDays: 7,
    startDate, endDate, timezone: TIME_ZONE,
    specialInstructions: 'Synthetic presentation sample. Not medical advice.'
  };
  const prescription = await createRecord(Prescription, {
    id: ids.prescription, doctorId: doctor.id, patientId: patient.id, relationId: relation.id,
    diagnosis: scenario.diagnosis, clinicalNotes: 'Synthetic record for presentation only.',
    prescribedAt: addDays(new Date(), -1), startDate, endDate,
    followUpDate: addDays(new Date(), scenario.appointmentOffset), status: 'ACTIVE', versionNumber: 1,
    medications: [medication]
  });
  await createRecord(PrescriptionVersion, {
    id: `${ids.prescription}-version-1`, prescriptionId: prescription.id, version: 1,
    changedBy: doctor.id, changeType: 'CREATED', reason: 'Presentation demo setup',
    snapshot: JSON.parse(JSON.stringify(prescription))
  });
  const schedule = await createRecord(MedicationSchedule, {
    id: ids.schedule, prescriptionId: prescription.id, medicationItemId: medication.itemId,
    medicineId: medicine.id, doctorId: doctor.id, patientId: patient.id,
    medicineName: medicine.medicineName, imageUrl: medicine.imageUrl,
    dosage: medication.dosage, dosageUnit: medication.dosageUnit, frequency: medication.frequency,
    times: medication.times, timezone: TIME_ZONE, foodInstruction: medication.foodInstruction,
    startDate, endDate, specialInstructions: medication.specialInstructions, status: 'ACTIVE'
  });
  await ensureScheduleReminders(schedule, { daysAhead: 7 });
  await createRecord(MedicationLog, {
    id: `${ids.prescription}-log-taken`, reminderId: `${ids.prescription}-prior-reminder-taken`,
    scheduleId: schedule.id, prescriptionId: prescription.id, patientId: patient.id, doctorId: doctor.id,
    status: 'TAKEN', loggedAt: addDays(new Date(), -1)
  });
  await createRecord(MedicationLog, {
    id: `${ids.prescription}-log-missed`, reminderId: `${ids.prescription}-prior-reminder-missed`,
    scheduleId: schedule.id, prescriptionId: prescription.id, patientId: patient.id, doctorId: doctor.id,
    status: 'MISSED', loggedAt: addDays(new Date(), -2)
  });
  await createRecord(MedicalHistoryRecord, {
    id: ids.history, patientId: patient.id, authorId: patient.id, authorRole: 'PATIENT',
    relationId: relation.id, category: 'OBSERVATION', title: scenario.historyTitle,
    details: 'Synthetic sample history item for a product walkthrough.',
    occurredAt: addDays(new Date(), -10), source: 'PATIENT'
  });
  await createRecord(SymptomRecord, {
    id: ids.symptom, patientId: patient.id, symptom: scenario.symptom, severity: scenario.severity,
    notes: 'Synthetic example entry; not a real patient report.', measurement: scenario.measurement,
    recordedAt: addDays(new Date(), -1)
  });
  await createRecord(RecoveryRecord, {
    id: ids.recovery, patientId: patient.id, doctorId: doctor.id, relationId: relation.id,
    score: scenario.recoveryScore, status: scenario.recoveryStatus,
    clinicalAssessment: 'Synthetic recovery assessment for presentation only.',
    followUpRecommendation: 'Review this sample record during the walkthrough.',
    nextAssessmentAt: addDays(new Date(), scenario.appointmentOffset), assessedAt: addDays(new Date(), -1)
  });
  await createRecord(Appointment, {
    id: ids.appointment, doctorId: doctor.id, patientId: patient.id, relationId: relation.id,
    requestedAt: new Date(), scheduledAt: addDays(new Date(), scenario.appointmentOffset),
    timezone: TIME_ZONE, status: 'CONFIRMED', reason: `${scenario.diagnosis} follow-up`,
    doctorNotes: 'Synthetic appointment for presentation only.'
  });
  await createRecord(Notification, {
    id: ids.doctorNotification, userId: doctor.id, role: 'DOCTOR', category: 'SYMPTOM',
    title: 'Demo patient update', message: `${patient.name} has a synthetic case update.`, relatedResourceId: ids.symptom
  });
  await createRecord(Notification, {
    id: ids.patientNotification, userId: patient.id, role: 'PATIENT', category: 'APPOINTMENT',
    title: 'Demo appointment confirmed', message: 'Your sample follow-up appointment is confirmed.', relatedResourceId: ids.appointment
  });
};

export const seedDemoData = async () => {
  if (process.env.DEMO_MODE !== 'true' || process.env.NODE_ENV === 'production') {
    throw new Error('Demo data can only be seeded when DEMO_MODE=true outside production.');
  }

  await clearPreviousDemoScenario();
  const doctor = await upsertDemoUser({
    ...DEMO_ACCOUNTS.doctor, role: 'DOCTOR', name: 'Dr. Maya Demo',
    phone: '+91 90000 00001', gender: 'Female', specialization: 'Family medicine',
    hospitalName: 'MEDICO Demo Clinic', hospitalLocation: 'Pune, Maharashtra',
    designation: 'Consultant', degree: 'MBBS (sample profile)', experience: 8,
    medicalRegistrationNumber: 'DEMO-MED-0001', verificationStatus: 'VERIFIED',
    connectionCode: 'MED-DEMO-2026', connectionCodeExpiresAt: new Date(Date.now() + 365 * DAY),
    professionalDescription: 'Synthetic demo profile for product presentations. Not a real clinician.'
  });
  const patient = await upsertDemoUser({
    ...DEMO_ACCOUNTS.patient, role: 'PATIENT', name: 'Alex Morgan (Demo)',
    phone: '+91 90000 00002', gender: 'Prefer not to say', dob: new Date('1990-05-15'),
    age: calculateAge(new Date('1990-05-15')), bloodGroup: 'O+', address: 'Demo address, Pune',
    emergencyContact: 'Demo contact · +91 90000 00003', primaryDisease: 'Demo care plan',
    diseaseDescription: 'Synthetic data for presentation only. This is not a real patient or treatment plan.',
    allergies: 'No allergies recorded in this demo profile.',
    existingHealthConditions: 'Demo-only sample condition.'
  });

  const relation = await createRecord(DoctorPatientRelation, {
    id: IDS.relation, doctorId: doctor.id, patientId: patient.id, status: 'APPROVED',
    connectionMethod: 'DOCTOR_SEARCH', connectedAt: addDays(new Date(), -14),
    approvedAt: addDays(new Date(), -14), permissions: ['view_prescriptions', 'view_history']
  });
  const medicine = await createRecord(Medicine, {
    id: IDS.medicine, medicineName: 'DemoCare Example Tablet', brandName: 'DemoCare',
    genericName: 'Presentation sample', category: 'Demo data', dosageForm: 'Tablet',
    strengths: ['5 mg (sample)'], imageUrl: '/demo-medicine.svg',
    description: 'Synthetic presentation data. Not a real medicine or clinical recommendation.',
    source: 'MANUAL', isVerified: false, createdBy: doctor.id
  });

  const dose = nextDemoDose();
  const startDate = new Date(`${dose.dateKey}T00:00:00.000Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 1);
  const endDate = addDays(startDate, 6);
  const prescribedMedication = {
    itemId: 'demo-medication-item', medicineId: medicine.id, medicineName: medicine.medicineName,
    imageUrl: medicine.imageUrl, dosage: '1', dosageUnit: 'tablet', frequency: 'Once daily · demo only',
    times: [dose.time], foodInstruction: 'AFTER_FOOD', durationDays: 7,
    startDate, endDate, timezone: TIME_ZONE,
    specialInstructions: 'Presentation sample only. Do not use as medical advice.'
  };
  const prescription = await createRecord(Prescription, {
    id: IDS.prescription, doctorId: doctor.id, patientId: patient.id, relationId: relation.id,
    diagnosis: 'Demo care plan (sample data only)',
    clinicalNotes: 'Synthetic workflow record created for product presentation. Not a real prescription.',
    prescribedAt: addDays(new Date(), -1), startDate, endDate,
    followUpDate: addDays(new Date(), 2), status: 'ACTIVE', versionNumber: 1,
    medications: [prescribedMedication]
  });
  await createRecord(PrescriptionVersion, {
    id: 'demo-prescription-version-1', prescriptionId: prescription.id, version: 1,
    changedBy: doctor.id, changeType: 'CREATED', reason: 'Presentation demo setup',
    snapshot: JSON.parse(JSON.stringify(prescription))
  });
  const schedule = await createRecord(MedicationSchedule, {
    id: IDS.schedule, prescriptionId: prescription.id, medicationItemId: prescribedMedication.itemId,
    medicineId: medicine.id, doctorId: doctor.id, patientId: patient.id,
    medicineName: medicine.medicineName, imageUrl: medicine.imageUrl,
    dosage: prescribedMedication.dosage, dosageUnit: prescribedMedication.dosageUnit,
    frequency: prescribedMedication.frequency, times: prescribedMedication.times,
    timezone: TIME_ZONE, foodInstruction: prescribedMedication.foodInstruction,
    startDate, endDate, specialInstructions: prescribedMedication.specialInstructions, status: 'ACTIVE'
  });
  await ensureScheduleReminders(schedule, { daysAhead: 7 });

  await createRecord(MedicationLog, {
    id: 'demo-medication-log-taken', reminderId: 'demo-prior-reminder-taken',
    scheduleId: schedule.id, prescriptionId: prescription.id, patientId: patient.id, doctorId: doctor.id,
    status: 'TAKEN', loggedAt: addDays(new Date(), -1)
  });
  await createRecord(MedicationLog, {
    id: 'demo-medication-log-missed', reminderId: 'demo-prior-reminder-missed',
    scheduleId: schedule.id, prescriptionId: prescription.id, patientId: patient.id, doctorId: doctor.id,
    status: 'MISSED', loggedAt: addDays(new Date(), -2)
  });
  await createRecord(MedicalHistoryRecord, {
    id: IDS.history, patientId: patient.id, authorId: patient.id, authorRole: 'PATIENT',
    relationId: relation.id, category: 'OBSERVATION', title: 'Demo profile created',
    details: 'Synthetic example entry for demonstrating the medical history timeline.',
    occurredAt: addDays(new Date(), -14), source: 'PATIENT'
  });
  await createRecord(SymptomRecord, {
    id: IDS.symptom, patientId: patient.id, symptom: 'Demo symptom report', severity: 3,
    notes: 'Synthetic sample entry for the symptom trend chart.',
    measurement: { label: 'Temperature', value: 36.8, unit: '°C' }, recordedAt: addDays(new Date(), -1)
  });
  await createRecord(RecoveryRecord, {
    id: IDS.recovery, patientId: patient.id, doctorId: doctor.id, relationId: relation.id,
    score: 72, status: 'Improving',
    clinicalAssessment: 'Synthetic recovery assessment for a product walkthrough.',
    followUpRecommendation: 'Review the sample record during the demo.',
    nextAssessmentAt: addDays(new Date(), 2), assessedAt: addDays(new Date(), -1)
  });
  await createRecord(Appointment, {
    id: IDS.appointment, doctorId: doctor.id, patientId: patient.id, relationId: relation.id,
    requestedAt: new Date(), scheduledAt: addDays(new Date(), 2), timezone: TIME_ZONE,
    status: 'CONFIRMED', reason: 'Demo follow-up appointment',
    doctorNotes: 'Synthetic appointment for presentation only.'
  });
  await createRecord(Notification, {
    id: IDS.doctorNotification, userId: doctor.id, role: 'DOCTOR', category: 'SYMPTOM',
    title: 'Demo patient update', message: 'Alex Morgan (Demo) added a sample symptom report.',
    relatedResourceId: IDS.symptom
  });
  await createRecord(Notification, {
    id: IDS.patientNotification, userId: patient.id, role: 'PATIENT', category: 'APPOINTMENT',
    title: 'Demo appointment confirmed', message: 'Your sample follow-up appointment is confirmed.',
    relatedResourceId: IDS.appointment
  });

  for (const scenario of EXTRA_CASES) await seedAdditionalCase(scenario, doctor, dose);

  return { doctor: doctor.email, patient: patient.email, nextDoseTime: dose.time, timezone: TIME_ZONE };
};

export const getDemoAccounts = () => process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production' ? DEMO_ACCOUNTS : null;
