import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/server.js';
import MedicationSchedule from '../server/models/medicationSchedule.js';
import MedicationReminder from '../server/models/medicationReminder.js';
import { createRecord, findRecords, newId } from '../server/services/recordStore.js';
import { dateOnly, ensureScheduleReminders } from '../server/services/scheduling.js';
import { DEMO_ACCOUNTS, seedDemoData } from '../server/demo/seedDemo.js';

let server;
let baseUrl;
let patient;
let patientToken;
let otherPatient;
let doctor;
let doctorToken;

const register = async (role, suffix) => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, name: `${role} ${suffix}`, email: `${role.toLowerCase()}-${suffix}@example.test`, password: 'Secure-test-password-42' })
  });
  return { response, data: await response.json() };
};

describe('MEDICO core workflows', () => {
  before(async () => {
    process.env.JWT_SECRET = 'medico-test-secret-that-is-long-and-unique';
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it('registers patient and doctor accounts, authenticates them, and rejects role misuse', async () => {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const patientResult = await register('PATIENT', stamp);
    assert.equal(patientResult.response.status, 201);
    assert.equal(patientResult.data.user.role, 'PATIENT');
    assert.equal('password' in patientResult.data.user, false);
    patient = patientResult.data.user;
    patientToken = patientResult.data.token;

    const secondPatient = await register('PATIENT', `${stamp}-other`);
    assert.equal(secondPatient.response.status, 201);
    otherPatient = secondPatient.data.user;

    const doctorResult = await register('DOCTOR', stamp);
    assert.equal(doctorResult.response.status, 201);
    doctor = doctorResult.data.user;
    doctorToken = doctorResult.data.token;
    assert.equal(doctor.verificationStatus, 'PENDING');

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: patient.email, password: 'Secure-test-password-42' })
    });
    assert.equal(login.status, 200);
    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: patient.email, password: 'wrong-password' })
    });
    assert.equal(badLogin.status, 401);

    const forbiddenDashboard = await fetch(`${baseUrl}/api/doctor/dashboard`, { headers: { Authorization: `Bearer ${patientToken}` } });
    assert.equal(forbiddenDashboard.status, 403);
    const unauthorized = await fetch(`${baseUrl}/api/patient/dashboard`);
    assert.equal(unauthorized.status, 401);
  });

  it('prevents access to another patient and blocks an unverified doctor from prescribing', async () => {
    const privateRecord = await fetch(`${baseUrl}/api/patients/${otherPatient.id}/emergency`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert.equal(privateRecord.status, 404);

    const prescription = await fetch(`${baseUrl}/api/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ patientId: patient.id, medications: [] })
    });
    assert.equal(prescription.status, 403);
  });

  it('returns an unavailable response for AI when credentials are missing', async () => {
    const response = await fetch(`${baseUrl}/api/patient/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ confirmAIDataShare: true })
    });
    assert.equal(response.status, 503);
  });

  it('generates medication reminders idempotently for the schedule horizon', async () => {
    const today = dateOnly(new Date());
    const end = new Date(`${today}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 2);
    const scheduleId = newId('schedule-test');
    const schedule = await createRecord(MedicationSchedule, {
      id: scheduleId, prescriptionId: newId('prescription-test'), medicationItemId: newId('item-test'),
      doctorId: doctor.id, patientId: patient.id, medicineName: 'Test medicine', dosage: '1', dosageUnit: 'tablet',
      imageUrl: 'https://example.test/test-medicine.png',
      frequency: 'Twice daily', times: ['08:00', '20:00'], timezone: 'UTC', foodInstruction: 'ANY',
      startDate: new Date(`${today}T00:00:00.000Z`), endDate: end, status: 'ACTIVE'
    });
    const first = await ensureScheduleReminders(schedule, { daysAhead: 4 });
    const second = await ensureScheduleReminders(schedule, { daysAhead: 4 });
    const persisted = await findRecords(MedicationReminder, { scheduleId });
    assert.equal(first.length, 6);
    assert.equal(second.length, 0);
    assert.equal(persisted.length, 6);
    assert.equal(persisted[0].imageUrl, 'https://example.test/test-medicine.png');
  });

  it('seeds the opt-in presentation scenario with a working demo login and image-backed countdown dose', async () => {
    process.env.DEMO_MODE = 'true';
    const seeded = await seedDemoData();
    assert.equal(seeded.doctor, DEMO_ACCOUNTS.doctor.email);
    assert.equal(seeded.patient, DEMO_ACCOUNTS.patient.email);

    const status = await fetch(`${baseUrl}/api/demo/status`).then((response) => response.json());
    assert.equal(status.enabled, true);
    assert.equal(status.accounts.patient.email, DEMO_ACCOUNTS.patient.email);
    assert.equal(status.accounts.doctors.length, 6);
    assert.equal(status.accounts.patients.length, 6);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEMO_ACCOUNTS.patient)
    });
    assert.equal(login.status, 200);
    const { token } = await login.json();
    const reminders = await fetch(`${baseUrl}/api/patient/reminders`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.json());
    const nextDemoDose = reminders.reminders.find((reminder) => reminder.imageUrl === '/demo-medicine.svg');
    assert.ok(nextDemoDose, 'demo patient should have a future medicine reminder with artwork');
    assert.ok(new Date(nextDemoDose.dueAt).getTime() > Date.now(), 'demo countdown should target a future dose');

    const doctorLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEMO_ACCOUNTS.doctor)
    });
    const doctorSession = await doctorLogin.json();
    const patientRoster = await fetch(`${baseUrl}/api/patients`, { headers: { Authorization: `Bearer ${doctorSession.token}` } }).then((response) => response.json());
    assert.equal(patientRoster.patients.length, 6, 'primary demo doctor should have the primary and five additional sample patients');
  });

  it('responds intelligently through the RAG medical agent for patients and doctors', async () => {
    const patientChat = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
      body: JSON.stringify({ message: 'Which doctor should I book an appointment with for chest and heart symptoms?' })
    });
    assert.equal(patientChat.status, 200);
    const patientData = await patientChat.json();
    assert.ok(patientData.reply);
    assert.ok(patientData.reply.includes('Cardiologist'));

    const doctorChat = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ message: 'Summarize clinical activity' })
    });
    assert.equal(doctorChat.status, 200);
    const doctorData = await doctorChat.json();
    assert.ok(doctorData.reply);
  });
});
