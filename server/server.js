import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { connectDB } from './config/db.js';
import { rateLimit } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import connectionRoutes from './routes/connections.js';
import directoryRoutes from './routes/directory.js';
import dashboardRoutes from './routes/dashboards.js';
import medicineRoutes from './routes/medicines.js';
import prescriptionRoutes from './routes/prescriptions.js';
import medicationRoutes from './routes/medication.js';
import medicalRecordRoutes from './routes/medicalRecords.js';
import appointmentRoutes from './routes/appointments.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import aiInsightRoutes from './routes/aiInsights.js';
import { startReminderWorker, stopReminderWorker } from './jobs/reminderWorker.js';
import { startAppointmentReminderWorker, stopAppointmentReminderWorker } from './jobs/appointmentReminderWorker.js';
import { getDemoAccounts, seedDemoData } from './demo/seedDemo.js';

export const createApp = () => {
  const app = express();
  const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.secure && process.env.NODE_ENV === 'production') res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    next();
  });
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key']
  }));
  app.use(express.json({ limit: '7mb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }));

  app.get('/api/health', (_req, res) => res.json({
    status: 'ok',
    persistence: mongoose.connection.readyState === 1 ? 'mongodb' : 'memory-development-only'
  }));
  app.get('/api/demo/status', (_req, res) => {
    const accounts = getDemoAccounts();
    return res.json({ enabled: Boolean(accounts), ...(accounts ? { accounts } : {}) });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/connections', connectionRoutes);
  app.use('/api', directoryRoutes);
  app.use('/api', dashboardRoutes);
  app.use('/api/medicines', medicineRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api', medicationRoutes);
  app.use('/api', medicalRecordRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api', analyticsRoutes);
  app.use('/api', aiInsightRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));
  app.use((error, _req, res, _next) => {
    const status = error.code === 11000 ? 409
      : error.name === 'ValidationError' || error.name === 'CastError' ? 400
        : error.statusCode || error.status || 500;
    if (status >= 500) console.error('API request failed:', error.message);
    const message = status >= 500 ? 'The request could not be completed.'
      : status === 409 ? 'A record with these details already exists.'
        : error.message;
    return res.status(status).json({ message });
  });
  return app;
};

export const startServer = async () => {
  if (process.env.DEMO_MODE === 'true' && process.env.NODE_ENV === 'production') {
    throw new Error('Presentation demo mode is disabled in production.');
  }
  await connectDB();
  if (mongoose.connection.readyState === 1) {
    const models = mongoose.modelNames().map((name) => mongoose.model(name));
    await Promise.all(models.map((model) => model.init()));
  }
  if (process.env.DEMO_MODE === 'true') {
    const demo = await seedDemoData();
    console.log(`Presentation demo data ready for ${demo.doctor} and ${demo.patient}.`);
  }
  startReminderWorker();
  startAppointmentReminderWorker();
  const app = createApp();
  const port = Number(process.env.PORT) || 5000;
  const server = app.listen(port, () => {
    console.log(`MEDICO API listening on http://localhost:${port}`);
  });
  const shutdown = () => {
    stopReminderWorker();
    stopAppointmentReminderWorker();
    server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
};

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) startServer().catch((error) => {
  console.error('MEDICO failed to start:', error.message);
  process.exitCode = 1;
});

export default createApp;
