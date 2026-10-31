import { Router } from 'express';
import User from '../models/user.js';
import DoctorPatientRelation from '../models/doctorPatientRelation.js';
import Prescription from '../models/prescription.js';
import Appointment from '../models/appointment.js';
import MedicationReminder from '../models/medicationReminder.js';
import RecoveryRecord from '../models/recoveryRecord.js';
import SymptomRecord from '../models/symptomRecord.js';
import Notification from '../models/notification.js';
import { authMiddleware, authorizeRole } from '../middleware/auth.js';
import { findRecord, findRecords } from '../services/recordStore.js';
import { publicUser } from '../utils/http.js';
import { buildNotificationText, buildWhatsAppReminderText, buildWhatsAppUrl, getDefaultMedicineImage, getFoodLabel } from '../utils/reminderText.js';

const router = Router();

router.get('/doctor/dashboard', authMiddleware, authorizeRole('DOCTOR'), async (req, res, next) => {
  try {
    const [relations, prescriptions, appointments, recovery, symptoms, notifications] = await Promise.all([
      findRecords(DoctorPatientRelation, { doctorId: req.user.id }),
      findRecords(Prescription, { doctorId: req.user.id }, { sort: { prescribedAt: -1 }, limit: 10 }),
      findRecords(Appointment, { doctorId: req.user.id }, { sort: { scheduledAt: 1 } }),
      findRecords(RecoveryRecord, { doctorId: req.user.id }, { sort: { assessedAt: -1 } }),
      findRecords(SymptomRecord, { patientId: { $in: relations.filter((item) => item.status === 'APPROVED').map((item) => item.patientId) } }),
      findRecords(Notification, { userId: req.user.id }, { sort: { createdAt: -1 }, limit: 5 })
    ]);
    const approved = relations.filter((item) => item.status === 'APPROVED');
    const connectedPatients = (await Promise.all(approved.map((item) => findRecord(User, { id: item.patientId, role: 'PATIENT' })))).filter(Boolean);
    const latestSymptoms = new Map();
    for (const symptom of symptoms) {
      if (!approved.some((rel) => rel.patientId === symptom.patientId)) continue;
      const current = latestSymptoms.get(symptom.patientId);
      if (!current || new Date(symptom.recordedAt) > new Date(current.recordedAt)) latestSymptoms.set(symptom.patientId, symptom);
    }
    const patientsRequiringAttention = new Set([
      ...Array.from(latestSymptoms.values()).filter((item) => item.severity >= 8).map((item) => item.patientId),
      ...recovery.filter((item) => ['Requires Reassessment', 'Under Treatment'].includes(item.status)).map((item) => item.patientId)
    ]);
    const upcomingFollowUps = recovery.filter((item) => item.nextAssessmentAt && new Date(item.nextAssessmentAt) >= new Date()).length;
    const recentPrescriptions = prescriptions.map((item) => ({
      ...item,
      medication: item.medications?.map((med) => med.medicineName).join(', ') || '',
      dosage: item.medications?.map((med) => `${med.dosage} ${med.dosageUnit}`).join(', ') || ''
    }));
    return res.json({
      stats: {
        totalPatients: approved.length,
        activePatients: approved.length,
        completedTreatments: prescriptions.filter((item) => item.status === 'COMPLETED').length,
        pendingConnectionRequests: relations.filter((item) => item.status === 'PENDING').length,
        todayAppointments: appointments.filter((item) => item.scheduledAt && new Date(item.scheduledAt).toDateString() === new Date().toDateString() && ['REQUESTED', 'CONFIRMED'].includes(item.status)).length,
        upcomingFollowUps,
        recentPrescriptions: recentPrescriptions.length,
        patientsRequiringAttention: patientsRequiringAttention.size
      },
      patients: connectedPatients.map((patient) => ({ id: patient.id, name: patient.name, age: patient.age, primaryDisease: patient.primaryDisease })),
      appointments,
      recentPrescriptions,
      notifications
    });
  } catch (error) { return next(error); }
});

router.get('/patient/dashboard', authMiddleware, authorizeRole('PATIENT'), async (req, res, next) => {
  try {
    const [patientUser, relations, reminders, prescriptions] = await Promise.all([
      findRecord(User, { id: req.user.id }),
      findRecords(DoctorPatientRelation, { patientId: req.user.id }),
      findRecords(MedicationReminder, { patientId: req.user.id, status: { $in: ['PENDING', 'SNOOZED'] } }, { sort: { scheduledFor: 1 }, limit: 50 }),
      findRecords(Prescription, { patientId: req.user.id }, { sort: { prescribedAt: -1 }, limit: 50 })
    ]);
    const approved = relations.filter((item) => item.status === 'APPROVED');
    const doctorRecords = (await Promise.all(approved.map((relation) => findRecord(User, { id: relation.doctorId, role: 'DOCTOR' })))).filter(Boolean);
    const doctorMap = new Map(doctorRecords.map((doctor) => [doctor.id, doctor]));
    const doctors = doctorRecords.map((doctor) => {
      const safe = publicUser(doctor);
      delete safe.email;
      delete safe.phone;
      delete safe.medicalRegistrationNumber;
      return safe;
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Index prescription medication items for easy lookup
    const prescriptionMedMap = new Map();
    for (const prescription of prescriptions) {
      for (const med of prescription.medications || []) {
        prescriptionMedMap.set(med.itemId, { ...med, diagnosis: prescription.diagnosis, doctorId: prescription.doctorId });
      }
    }

    const upcoming = reminders.map((item) => {
      const medItem = prescriptionMedMap.get(item.medicationItemId);
      const doctor = doctorMap.get(item.doctorId);
      const doctorName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Your Doctor';
      const dosage = item.dosage || (medItem ? `${medItem.dosage} ${medItem.dosageUnit}` : '');
      const foodInstruction = item.foodInstruction || medItem?.foodInstruction || 'ANY';
      const specialInstructions = item.specialInstructions || medItem?.specialInstructions || '';
      const imageUrl = item.imageUrl || medItem?.imageUrl || getDefaultMedicineImage(medItem?.dosageUnit || '');

      const notificationText = buildNotificationText({
        medicineName: item.medicineName,
        dosage,
        foodInstruction,
        doctorName,
        specialInstructions
      });

      const whatsappText = buildWhatsAppReminderText({
        patientName: patientUser?.name || 'Patient',
        medicineName: item.medicineName,
        dosage,
        scheduledTime: item.scheduledFor,
        foodInstruction,
        doctorName,
        specialInstructions,
        clientUrl
      });

      const whatsappUrl = buildWhatsAppUrl(whatsappText, patientUser?.phone);

      return {
        ...item,
        dueAt: item.scheduledFor,
        message: `${item.medicineName} · ${dosage}`,
        dosage,
        imageUrl,
        foodInstruction,
        foodLabel: getFoodLabel(foodInstruction),
        specialInstructions,
        doctorName,
        diagnosis: medItem?.diagnosis || '',
        notificationText,
        whatsappText,
        whatsappUrl
      };
    });

    const activePrescriptions = prescriptions.filter((p) => p.status === 'ACTIVE').map((prescription) => {
      const doctor = doctorMap.get(prescription.doctorId);
      const doctorName = doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Your Doctor';
      return {
        ...prescription,
        doctorName,
        medications: (prescription.medications || []).map((med) => {
          const imageUrl = med.imageUrl || getDefaultMedicineImage(med.dosageUnit);
          const whatsappText = buildWhatsAppReminderText({
            patientName: patientUser?.name || 'Patient',
            medicineName: med.medicineName,
            dosage: `${med.dosage} ${med.dosageUnit}`,
            scheduledTime: (med.times || []).join(', '),
            foodInstruction: med.foodInstruction,
            doctorName,
            specialInstructions: med.specialInstructions,
            clientUrl
          });
          return {
            ...med,
            imageUrl,
            foodLabel: getFoodLabel(med.foodInstruction),
            whatsappText,
            whatsappUrl: buildWhatsAppUrl(whatsappText, patientUser?.phone)
          };
        })
      };
    });

    return res.json({
      stats: { activeDoctors: doctors.length, totalConnections: relations.length, upcomingReminders: upcoming.length },
      doctors,
      reminders: upcoming,
      prescriptions,
      activePrescriptions
    });
  } catch (error) { return next(error); }
});

export default router;
