import { Router } from 'express';
import User from '../models/user.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import Prescription from '../models/prescription.js';
import MedicationLog from '../models/medicationLog.js';
import SymptomRecord from '../models/symptomRecord.js';
import RecoveryRecord from '../models/recoveryRecord.js';
import MedicationSchedule from '../models/medicationSchedule.js';
import AIInsight from '../models/aiInsight.js';
import { authMiddleware } from '../middleware/auth.js';
import { createRecord, findRecord, findRecords, newId } from '../services/recordStore.js';
import { generateAIText, generateRAGChatResponse } from '../services/aiService.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.post('/doctor/insights', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'DOCTOR') return res.status(403).json({ message: 'Doctor access required.' });
  if (req.body.confirmAIDataShare !== true) return res.status(400).json({ message: 'Confirm AI data sharing before requesting an insight.' });
  let patientIds;
  if (req.body.patientId) {
    const relation = await findRecord(DoctorPatientRelation, { doctorId: req.user.id, patientId: String(req.body.patientId), status: 'APPROVED' });
    if (!relation) return res.status(404).json({ message: 'Authorized patient relationship not found.' });
    patientIds = [relation.patientId];
  } else {
    const relations = await findRecords(DoctorPatientRelation, { doctorId: req.user.id, status: 'APPROVED' }, { limit: 100 });
    patientIds = relations.map((item) => item.patientId);
  }
  if (!patientIds.length) return res.status(400).json({ message: 'Connect with a patient before generating insights.' });
  const [patients, prescriptions, logs, symptoms, recovery] = await Promise.all([
    Promise.all(patientIds.map((id) => findRecord(User, { id, role: 'PATIENT' }))),
    findRecords(Prescription, { doctorId: req.user.id, patientId: { $in: patientIds } }, { sort: { prescribedAt: -1 }, limit: 100 }),
    findRecords(MedicationLog, { doctorId: req.user.id, patientId: { $in: patientIds } }, { sort: { loggedAt: -1 }, limit: 250 }),
    findRecords(SymptomRecord, { patientId: { $in: patientIds } }, { sort: { recordedAt: -1 }, limit: 250 }),
    findRecords(RecoveryRecord, { doctorId: req.user.id, patientId: { $in: patientIds } }, { sort: { assessedAt: -1 }, limit: 100 })
  ]);
  const context = {
    patients: patients.filter(Boolean).map((patient) => ({ id: patient.id, age: patient.age, primaryDisease: patient.primaryDisease, allergies: patient.allergies })),
    prescriptions: prescriptions.map((item) => ({ patientId: item.patientId, diagnosis: item.diagnosis, status: item.status, medicationNames: item.medications?.map((med) => med.medicineName) })),
    medicationLogs: logs.map((item) => ({ patientId: item.patientId, status: item.status, loggedAt: item.loggedAt })),
    symptoms: symptoms.map((item) => ({ patientId: item.patientId, symptom: item.symptom, severity: item.severity, recordedAt: item.recordedAt })),
    recoveryAssessments: recovery.map((item) => ({ patientId: item.patientId, status: item.status, score: item.score, assessedAt: item.assessedAt }))
  };
  const generated = await generateAIText({ role: 'DOCTOR', records: context });
  const insight = await createRecord(AIInsight, {
    id: newId('ai-insight'), requestedBy: req.user.id, role: 'DOCTOR',
    patientId: req.body.patientId || undefined, summary: generated.summary,
    evidence: ['Doctor-authorized prescriptions', 'Medication logs', 'Patient symptom reports', 'Doctor recovery assessments'].filter((_, index) => [prescriptions, logs, symptoms, recovery][index].length),
    model: generated.model, generatedAt: new Date()
  });
  return res.json({ ...insight, aiGenerated: true });
}));

router.post('/patient/insights', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'PATIENT') return res.status(403).json({ message: 'Patient access required.' });
  if (req.body.confirmAIDataShare !== true) return res.status(400).json({ message: 'Confirm AI data sharing before requesting an insight.' });
  const patientId = req.user.id;
  const [user, prescriptions, logs, symptoms, recovery] = await Promise.all([
    findRecord(User, { id: patientId, role: 'PATIENT' }),
    findRecords(Prescription, { patientId }, { sort: { prescribedAt: -1 }, limit: 50 }),
    findRecords(MedicationLog, { patientId }, { sort: { loggedAt: -1 }, limit: 100 }),
    findRecords(SymptomRecord, { patientId }, { sort: { recordedAt: -1 }, limit: 100 }),
    findRecords(RecoveryRecord, { patientId }, { sort: { assessedAt: -1 }, limit: 50 })
  ]);
  const generated = await generateAIText({ role: 'PATIENT', records: {
    healthSummary: { primaryDisease: user?.primaryDisease },
    prescriptions: prescriptions.map((item) => ({ diagnosis: item.diagnosis, status: item.status, medicationNames: item.medications?.map((med) => med.medicineName) })),
    medicationLogs: logs.map((item) => ({ status: item.status, loggedAt: item.loggedAt })),
    symptoms: symptoms.map((item) => ({ symptom: item.symptom, severity: item.severity, recordedAt: item.recordedAt })),
    recoveryAssessments: recovery.map((item) => ({ status: item.status, score: item.score, assessedAt: item.assessedAt }))
  } });
  const insight = await createRecord(AIInsight, {
    id: newId('ai-insight'), requestedBy: req.user.id, role: 'PATIENT', patientId,
    summary: generated.summary, evidence: ['Prescriptions', 'Medication logs', 'Symptom reports', 'Doctor recovery assessments'],
    model: generated.model, generatedAt: new Date()
  });
  return res.json({ ...insight, aiGenerated: true });
}));

router.get('/insights/recent', authMiddleware, asyncHandler(async (req, res) => {
  const insights = await findRecords(AIInsight, { requestedBy: req.user.id, role: req.user.role }, { sort: { generatedAt: -1 }, limit: 10 });
  return res.json({ insights });
}));

router.post('/ai/chat', authMiddleware, asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'Please provide a question or request for the medical agent.' });
  }

  if (req.user.role === 'PATIENT') {
    const patientId = req.user.id;
    const [patientUser, prescriptions, schedules, symptoms, recovery, relations, verifiedDoctors] = await Promise.all([
      findRecord(User, { id: patientId, role: 'PATIENT' }),
      findRecords(Prescription, { patientId }, { sort: { prescribedAt: -1 }, limit: 20 }),
      findRecords(MedicationSchedule, { patientId, status: 'ACTIVE' }, { limit: 50 }),
      findRecords(SymptomRecord, { patientId }, { sort: { recordedAt: -1 }, limit: 15 }),
      findRecords(RecoveryRecord, { patientId }, { sort: { assessedAt: -1 }, limit: 10 }),
      findRecords(DoctorPatientRelation, { patientId, status: 'APPROVED' }, { limit: 20 }),
      findRecords(User, { role: 'DOCTOR', isVerified: true }, { limit: 50 })
    ]);

    const doctorIds = relations.map((r) => r.doctorId);
    const connectedDoctors = (await Promise.all(doctorIds.map((id) => findRecord(User, { id, role: 'DOCTOR' })))).filter(Boolean);

    const contextData = {
      profile: {
        name: patientUser?.name,
        age: patientUser?.age,
        gender: patientUser?.gender,
        bloodGroup: patientUser?.bloodGroup,
        primaryDisease: patientUser?.primaryDisease,
        diseaseDescription: patientUser?.diseaseDescription,
        yearsSuffering: patientUser?.yearsSuffering,
        allergies: patientUser?.allergies,
        existingHealthConditions: patientUser?.existingHealthConditions,
        previousSurgeries: patientUser?.previousSurgeries,
        lifestyleInfo: patientUser?.lifestyleInfo
      },
      medicines: schedules.map((s) => ({
        medicineName: s.medicineName,
        dosage: `${s.dosage} ${s.dosageUnit}`,
        frequency: s.frequency,
        times: s.times,
        foodInstruction: s.foodInstruction,
        specialInstructions: s.specialInstructions
      })),
      symptoms: symptoms.map((s) => ({
        symptom: s.symptom,
        severity: s.severity,
        notes: s.notes,
        measurement: s.measurement,
        recordedAt: s.recordedAt
      })),
      recoveryScores: recovery.map((r) => ({
        score: r.score,
        status: r.status,
        clinicalNotes: r.clinicalNotes,
        assessedAt: r.assessedAt
      })),
      doctorNames: connectedDoctors.map((d) => d.name)
    };

    const availableDoctors = verifiedDoctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization || 'General Physician',
      hospitalName: d.hospitalName,
      experience: d.experience
    }));

    const response = await generateRAGChatResponse({
      role: 'PATIENT',
      message: message.trim(),
      history,
      contextData,
      availableDoctors
    });

    return res.json({
      reply: response.reply,
      isLiveAI: response.isLiveAI,
      model: response.model || 'internal-medical-rag',
      timestamp: new Date()
    });
  }

  if (req.user.role === 'DOCTOR') {
    const doctorId = req.user.id;
    const [relations, prescriptions, recovery, symptoms, doctorUser] = await Promise.all([
      findRecords(DoctorPatientRelation, { doctorId, status: 'APPROVED' }, { limit: 100 }),
      findRecords(Prescription, { doctorId }, { sort: { prescribedAt: -1 }, limit: 50 }),
      findRecords(RecoveryRecord, { doctorId }, { sort: { assessedAt: -1 }, limit: 50 }),
      findRecords(SymptomRecord, {}, { sort: { recordedAt: -1 }, limit: 100 }),
      findRecord(User, { id: doctorId, role: 'DOCTOR' })
    ]);

    const connectedPatientIds = relations.map((r) => r.patientId);
    const connectedSymptoms = symptoms.filter((s) => connectedPatientIds.includes(s.patientId));
    const highRiskSymptoms = connectedSymptoms.filter((s) => s.severity >= 8);

    const contextData = {
      doctorName: doctorUser?.name,
      specialization: doctorUser?.specialization,
      totalPatients: relations.length,
      completedTreatments: prescriptions.filter((p) => p.status === 'COMPLETED').length,
      patientsRequiringAttention: highRiskSymptoms.length,
      recentHighRiskSymptoms: highRiskSymptoms.slice(0, 10).map((s) => ({
        patientId: s.patientId,
        symptom: s.symptom,
        severity: s.severity,
        recordedAt: s.recordedAt
      }))
    };

    const response = await generateRAGChatResponse({
      role: 'DOCTOR',
      message: message.trim(),
      history,
      contextData
    });

    return res.json({
      reply: response.reply,
      isLiveAI: response.isLiveAI,
      model: response.model || 'internal-clinical-rag',
      timestamp: new Date()
    });
  }

  return res.status(403).json({ message: 'Unauthorized role.' });
}));

export default router;
