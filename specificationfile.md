# MEDICO

## MASTER SOFTWARE DEVELOPMENT SPECIFICATION

You are an expert software engineering team responsible for architecting, developing, testing, and delivering a complete healthcare management platform called MEDICO.

You must operate as:

1. Senior Software Architect.
2. Senior MERN Stack Developer.
3. Frontend Engineer.
4. Backend Engineer.
5. Database Architect.
6. UI/UX Designer.
7. AI Integration Engineer.
8. Security Engineer.
9. QA and Testing Engineer.

Your objective is to build a complete, functional, secure, responsive, and professionally designed healthcare management platform.

This is not a simple CRUD application or a frontend demonstration.

Every important feature must have functional frontend, backend, database integration, authorization, and appropriate validation.

Do not prioritize generating code quickly over generating correct code.

---

# 1. PROJECT VISION

MEDICO is an AI-assisted healthcare management platform connecting doctors and patients.

The platform has two primary user roles:

* DOCTOR
* PATIENT

Doctors can manage multiple patients, examine their medical histories, prescribe medicines, schedule medication reminders, monitor treatment adherence, track recovery, and receive AI-assisted clinical insights.

Patients can connect with multiple doctors, maintain medical histories, access prescriptions, receive medication reminders, record medication consumption, report symptoms, and monitor recovery progress.

The platform should establish a continuous healthcare information system between doctors and patients.

Core workflow:

Patient Registration
→ Doctor Discovery
→ Doctor-Patient Connection
→ Medical History
→ Consultation / Assessment
→ Prescription
→ Medication Scheduling
→ Patient Reminders
→ Medication Tracking
→ Symptom Tracking
→ Recovery Assessment
→ Analytics
→ AI Insights
→ Doctor Follow-up

---

# 2. TECHNOLOGY STACK

Use the MERN stack.

FRONTEND:

* React.js
* React Router
* Tailwind CSS
* Axios
* Recharts
* Lucide React
* Context API or appropriate state management.

BACKEND:

* Node.js
* Express.js
* REST API architecture
* Mongoose
* JWT authentication
* bcrypt password hashing.

DATABASE:

* MongoDB.

ADDITIONAL TECHNOLOGIES:

* External AI API.
* Cloudinary or equivalent image storage.
* Web Push API / browser notifications.
* Node-cron or reliable background scheduling.
* Appropriate validation library.
* Testing framework.

Use modular architecture and maintain a clear separation between frontend, backend, database models, business logic, and external integrations.

Do not introduce unnecessary dependencies.

---

# 3. APPLICATION ARCHITECTURE

Organize the application into logical modules.

Recommended structure:

medico/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       │   ├── auth/
│       │   ├── doctor/
│       │   ├── patient/
│       │   └── public/
│       ├── hooks/
│       ├── context/
│       ├── services/
│       ├── utils/
│       └── App.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── jobs/
│   ├── validators/
│   ├── utils/
│   └── server.js
│
├── documentation/
├── .gitignore
└── README.md

Adapt this structure if the existing repository already follows a good architecture.

Do not unnecessarily restructure working code.

---

# 4. LANDING PAGE

Develop a professional healthcare SaaS landing page.

Include:

* MEDICO branding.
* Responsive navigation.
* Hero section.
* Platform introduction.
* Doctor features.
* Patient features.
* How it works.
* Benefits.
* Contact section.
* Footer.
* Login.
* Doctor registration.
* Patient registration.

Design requirements:

* Professional healthcare visual identity.
* Modern typography.
* Consistent spacing.
* Attractive cards.
* Responsive layouts.
* Clear navigation.
* Strong visual hierarchy.

Avoid generic template-like designs.

---

# 5. AUTHENTICATION AND ROLE MANAGEMENT

Implement two roles:

DOCTOR
PATIENT

Requirements:

* Registration.
* Login.
* Logout.
* Password hashing.
* JWT authentication.
* Protected routes.
* Role-based authorization.
* Profile management.
* Secure session handling.
* Input validation.
* Appropriate error messages.

Never trust role information supplied by the frontend.

Every sensitive backend operation must verify identity, role, and resource ownership.

Doctor and patient dashboards must remain separate.

---

# 6. PATIENT REGISTRATION

Create a comprehensive but user-friendly registration form.

Fields:

PERSONAL INFORMATION:

* Full name.
* Email.
* Mobile number.
* Date of birth.
* Automatically calculated age.
* Gender.
* Blood group.
* Address.
* Emergency contact.

HEALTH INFORMATION:

* Height.
* Weight.
* Primary disease.
* Disease description.
* Years suffering.
* Previous medical history.
* Existing medications.
* Allergies.
* Previous surgeries.
* Existing health conditions.
* Relevant lifestyle information, where appropriate.

Use:

* Dropdowns.
* Searchable dropdowns.
* Date pickers.
* Number inputs.
* Text areas.
* Conditional form fields.

Do not make every field mandatory.

Allow patients to update permitted profile information.

Validate all information on both frontend and backend.

---

# 7. DOCTOR REGISTRATION

Fields:

PERSONAL:

* Full name.
* Email.
* Mobile number.
* Date of birth.
* Age.
* Gender.
* Profile image.

PROFESSIONAL:

* Specialization.
* Hospital name.
* Hospital location.
* Designation.
* Medical degree.
* Graduation year.
* Experience.
* Medical registration number.
* Professional description.
* Consultation information.

Implement doctor verification.

Support medical registration credential submission and verification status.

Only verified doctors should receive prescription-creation privileges.

---

# 8. DOCTOR-PATIENT CONNECTION SYSTEM

This is a core architectural module.

Support two connection methods.

METHOD A: DOCTOR SEARCH

Patients can:

* Search doctors by name.
* Search by specialization.
* Search by hospital.
* Search by location.
* View doctor profiles.
* View professional details.
* Send connection requests.

Doctors can:

* Receive requests.
* Accept requests.
* Reject requests.
* View pending requests.
* Manage connected patients.

METHOD B: UNIQUE DOCTOR CONNECTION CODE

Generate a unique, secure doctor connection code.

Patients can enter the code to request a connection.

Validate:

* Code existence.
* Code validity.
* Doctor verification status.
* Duplicate relationships.
* Expiration, if applicable.

The doctor must approve the connection before access to protected medical records is granted.

RELATIONSHIP RULE:

One doctor can have multiple patients.

One patient can have multiple doctors.

Implement a dedicated DoctorPatientRelations collection.

Each relationship must maintain:

* Doctor ID.
* Patient ID.
* Relationship status.
* Connection method.
* Connection date.
* Approval date.
* Disconnection date.
* Relevant permissions.

Do not implement a one-to-one doctor-patient relationship.

Prescriptions and clinical records must reference the correct relationship.

Discontinuing a relationship must not delete historical prescriptions or medical records.

---

# 9. DOCTOR DASHBOARD

Create a professional dashboard with a collapsible sidebar.

SIDEBAR:

1. Dashboard.
2. Profile.
3. Patient Queue.
4. My Patients.
5. Appointments.
6. Assign Medication.
7. Medicine Database.
8. Analytics.
9. AI Insights.
10. Notifications.
11. Settings.
12. Logout.

DASHBOARD OVERVIEW:

Display:

* Total patients.
* Active patients.
* Completed treatments.
* Pending connection requests.
* Today's appointments.
* Upcoming follow-ups.
* Recent prescriptions.
* Patients requiring attention.

All dashboard statistics must come from actual database records.

---

# 10. PATIENT MANAGEMENT

Doctors must be able to:

* View connected patients.
* Search patients.
* Filter patients.
* Open patient profiles.
* View medical history.
* View allergies.
* View previous prescriptions.
* View medication adherence.
* View symptom history.
* View recovery assessments.
* Add clinical observations.
* Create follow-up appointments.

Implement strict relationship-based authorization.

A doctor must not access unrelated patients' private medical records.

---

# 11. MEDICINE DATABASE

Create a medicine database module.

Doctors must have two methods of adding medicines.

METHOD A: EXISTING MEDICINE DATABASE

Allow searching by:

* Medicine name.
* Brand name.
* Generic name.
* Category.
* Medicine type.

Medicine records should support:

* Medicine name.
* Brand.
* Generic name.
* Medicine image.
* Description.
* Category.
* Dosage form.
* Available strengths.
* Relevant medicine information.

METHOD B: MANUAL MEDICINE ENTRY

Allow doctors to enter a medicine manually when it is not available in the database.

Manual entries must support:

* Medicine name.
* Description.
* Medicine image, if available.
* Dosage form.
* Relevant information.

Do not automatically treat manually entered information as clinically verified.

Implement medicine search and reusable medicine cards.

Medicine information must be separated from patient-specific prescriptions.

---

# 12. PRESCRIPTION MANAGEMENT

Doctors can create prescriptions containing multiple medicines.

Each prescription must include:

* Doctor ID.
* Patient ID.
* Doctor-patient relationship ID.
* Diagnosis.
* Clinical notes.
* Prescription date.
* Start date.
* End date.
* Follow-up date.
* Status.

Each prescribed medication must contain:

* Medicine ID, if available.
* Medicine name.
* Dosage.
* Dosage unit.
* Frequency.
* Morning / Afternoon / Night.
* Specific reminder times.
* Before food / After food.
* Treatment duration.
* Start date.
* End date.
* Special instructions.

Support units such as:

* Tablet.
* Capsule.
* ml.
* Drops.
* Other appropriate units.

Display prescriptions using professional medicine cards.

Allow doctors to:

* Create prescriptions.
* Edit prescriptions.
* Discontinue prescriptions.
* Review previous prescriptions.
* Renew treatment where appropriate.

IMPORTANT:

Never overwrite historical prescription information.

Every modification must create an appropriate version or audit record.

Patients must only view and follow authorized prescriptions.

Patients must not modify prescribed dosages.

AI recommendations must never directly create or modify prescriptions.

Only an authorized doctor can approve a prescription.

---

# 13. PATIENT MEDICINE OVERVIEW

Create a dedicated medicine overview.

Each medicine card must display:

* Medicine image.
* Medicine name.
* Dosage.
* Morning / Afternoon / Night.
* Reminder time.
* Before food / After food.
* Duration.
* Prescribing doctor.
* Special instructions.

Example:

MEDICINE A

Dosage: 1 tablet
Schedule: Morning
Time: 8:00 AM
Food instruction: After breakfast
Duration: 7 days

Provide actions:

* Mark as Taken.
* Mark as Missed.
* Report an issue.

When a patient marks medicine as taken:

1. Verify the scheduled dose.
2. Record timestamp.
3. Create a medication log.
4. Prevent duplicate entries.
5. Update adherence statistics.
6. Reflect the result in the doctor's dashboard.
7. Update relevant analytics.

Never interpret a checkbox as proof of clinical recovery.

---

# 14. MEDICATION REMINDER ENGINE

Implement a reliable reminder system.

Features:

* Morning reminders.
* Afternoon reminders.
* Night reminders.
* Custom reminder times.
* Browser notifications.
* In-app notifications.
* Taken status.
* Missed status.
* Snooze.
* Notification history.
* Upcoming medicine list.

Patients must receive a notification one day before an upcoming treatment schedule where applicable.

Implement backend scheduling.

Do not depend exclusively on frontend setTimeout or browser timers.

Requirements:

* Timezone-aware scheduling.
* Duplicate reminder prevention.
* Persistent scheduling.
* Server restart recovery.
* Correct schedule updates.
* Reminder cancellation when treatment is discontinued.
* Appropriate notification delivery status.

Clearly explain browser notification permission requirements.

Do not mark a dose as missed merely because the browser was closed.

Use a configurable grace period and persistent backend scheduling.

---

# 15. MEDICAL HISTORY MANAGEMENT

Maintain a structured medical history.

Include:

* Previous diseases.
* Diagnoses.
* Hospital visits.
* Hospital information.
* Previous doctors.
* Allergies.
* Surgeries.
* Existing conditions.
* Previous prescriptions.
* Clinical observations.
* Treatment history.
* Recovery records.

PATIENT PROFILE:

Patients should be able to view their medical history.

Doctors should be able to view authorized patient history.

Maintain historical records even when doctor-patient relationships are discontinued.

---

# 16. APPOINTMENT MANAGEMENT

Implement a basic appointment module.

Patients should be able to:

* Request appointments.
* Select connected doctors.
* View available appointment information.
* View upcoming appointments.
* View appointment history.
* Cancel permitted appointments.

Doctors should be able to:

* View appointment requests.
* Accept or reject appointments.
* Schedule appointments.
* Update appointment status.
* Schedule follow-ups.

Support appointment reminders.

Do not assume real-time hospital scheduling integration unless separately configured.

---

# 17. SYMPTOM AND RECOVERY TRACKING

This module is extremely important.

Do not calculate recovery exclusively from medicine consumption.

Implement two complementary recording systems.

A. PATIENT-REPORTED SYMPTOMS

Patients should be able to record:

* Current symptoms.
* Symptom severity.
* Date and time.
* Changes compared with previous days.
* Optional notes.
* Relevant measurements, where appropriate.

Use simple structured inputs.

B. DOCTOR RECOVERY ASSESSMENT

Doctors should be able to record:

* Current clinical assessment.
* Recovery status.
* Symptom improvement.
* Treatment response.
* Relevant observations.
* Follow-up recommendation.
* Next assessment date.

Use configurable recovery statuses such as:

* Under Treatment.
* Improving.
* Stable.
* Requires Reassessment.
* Recovered.

Only authorized doctors should record or confirm clinical recovery status.

Maintain historical recovery assessments.

Never automatically mark a patient as recovered based on AI predictions.

---

# 18. DOCTOR ANALYTICS

Create a comprehensive analytics dashboard.

Display:

* Total diagnosed patients.
* Active patients.
* Completed treatments.
* Recovery statistics.
* Medication adherence.
* Disease distribution.
* Average treatment duration.
* Patient-wise progress.
* Follow-up requirements.

Provide:

* Daily trends.
* Weekly trends.
* Monthly trends.
* Date filters.
* Patient filters.
* Disease filters.

Use Recharts.

Every graph must use actual database records.

Clearly explain the calculation behind each metric.

Do not invent missing information.

---

# 19. PATIENT ANALYTICS

Create an analytics dashboard displaying:

* Medication adherence percentage.
* Daily medication completion.
* Weekly adherence.
* Monthly adherence.
* Symptom progression.
* Recovery assessments.
* Treatment completion.
* Relevant measurement trends.

Provide a medication-versus-recovery overview.

Keep these metrics separate:

1. Medication adherence.
2. Patient-reported symptoms.
3. Doctor-recorded recovery assessment.

Display their relationship without claiming that medication adherence alone proves recovery.

---

# 20. AI INTEGRATION

Integrate the external AI API through backend services.

Environment variables:

AI_API_KEY=
AI_MODEL=
AI_BASE_URL=

Never expose AI credentials in frontend code.

Create a reusable AI service.

AI must only receive authorized and relevant information.

DOCTOR-SIDE AI:

* Patient medical history summaries.
* Clinical record summaries.
* Medication information.
* Possible allergy warnings.
* Potential medication interaction warnings.
* Adherence analysis.
* Symptom progression analysis.
* Recovery trend summaries.
* Follow-up priority suggestions.
* Analytics explanations.

PATIENT-SIDE AI:

* Explain prescribed medicine information.
* Summarize medication schedules.
* Explain adherence statistics.
* Summarize recorded recovery trends.
* Identify missed-dose patterns.
* Generate questions for doctor consultations.

AI ANALYTICS:

Combine:

* Medication adherence.
* Patient-reported symptoms.
* Doctor recovery assessments.
* Relevant measurements.

Generate understandable, evidence-based insights.

AI SAFETY:

* Never independently prescribe medication.
* Never determine or modify prescribed dosage.
* Never recommend stopping medication.
* Never autonomously reduce medication.
* Never independently declare recovery.
* Never replace professional medical judgment.
* Flag insufficient data.
* Clearly distinguish AI-generated information from verified clinical records.
* Require doctor approval for clinical decisions.

If AI output is invalid, incomplete, or unavailable, the application must continue working without crashing.

Do not fabricate AI insights.

---

# 21. EMERGENCY MEDICAL INFORMATION

Implement an emergency medical information section.

Display relevant information such as:

* Patient name.
* Emergency contact.
* Blood group, if verified.
* Known allergies.
* Important existing conditions.
* Current medication information.
* Relevant emergency notes.

Provide controlled access.

Do not expose the complete medical profile publicly.

Implement appropriate access restrictions and audit sensitive access.

---

# 22. NOTIFICATION SYSTEM

Implement notifications for:

PATIENTS:

* Medication reminders.
* Upcoming treatments.
* Appointment reminders.
* Doctor updates.
* Relevant follow-ups.

DOCTORS:

* New patient requests.
* Accepted connections.
* Medication adherence updates.
* Patient-reported symptoms.
* Upcoming appointments.
* Follow-up requirements.

Provide:

* Notification list.
* Read/unread status.
* Notification timestamps.
* Notification categories.
* Appropriate delivery handling.

---

# 23. DATABASE ARCHITECTURE

Recommended MongoDB collections:

1. Users
2. DoctorProfiles
3. PatientProfiles
4. DoctorPatientRelations
5. MedicineCatalog
6. Prescriptions
7. PrescriptionVersions
8. MedicationSchedules
9. MedicationLogs
10. PatientMedicalHistory
11. SymptomRecords
12. RecoveryRecords
13. Appointments
14. Notifications
15. AIInsights
16. AuditLogs

Define appropriate references and indexes.

Important relationships:

Users → DoctorProfiles / PatientProfiles

DoctorProfiles ↔ PatientProfiles through DoctorPatientRelations

DoctorPatientRelations → Prescriptions

Prescriptions → MedicationSchedules

MedicationSchedules → MedicationLogs

PatientProfiles → MedicalHistory

PatientProfiles → SymptomRecords

PatientProfiles → RecoveryRecords

Prescriptions and recovery records must preserve their historical references.

Use proper validation, timestamps, indexes, and pagination.

Avoid unnecessary duplication of sensitive information.

---

# 24. SECURITY AND PRIVACY

Healthcare information is sensitive.

Implement:

* Password hashing.
* JWT verification.
* Role-based access.
* Object-level authorization.
* Input validation.
* Request sanitization.
* Rate limiting.
* Secure HTTP headers.
* CORS configuration.
* Environment variable protection.
* Audit logging.
* Secure file uploads.

Prevent:

* Unauthorized patient access.
* Unauthorized prescription modifications.
* Cross-doctor data access.
* Cross-patient data access.
* Insecure direct object references.
* Exposure of API credentials.
* Accidental disclosure of medical records.

All sensitive backend operations must verify authorization independently.

Do not store unnecessary sensitive information.

---

# 25. UI/UX DESIGN SYSTEM

Create a professional healthcare SaaS experience.

Design principles:

* Modern.
* Minimal.
* Professional.
* Clean.
* Responsive.
* Accessible.
* Consistent.

Include:

* Reusable components.
* Consistent buttons.
* Consistent typography.
* Sidebar navigation.
* Responsive dashboard layouts.
* Medicine cards.
* Patient cards.
* Professional charts.
* Loading indicators.
* Empty states.
* Error states.
* Success messages.
* Form validation feedback.

Doctor and patient interfaces should have distinct workflows while maintaining consistent branding.

Every interactive element must work.

No decorative buttons pretending to be functional features.

---

# 26. DEVELOPMENT EXECUTION PHASES

Follow this exact development workflow.

PHASE 1: CODEBASE AUDIT

Inspect all existing project files.

Identify:

* Current architecture.
* Dependencies.
* Existing features.
* Database setup.
* API structure.
* Incomplete implementations.
* Existing bugs.

Preserve working implementations.

PHASE 2: ARCHITECTURE DESIGN

Prepare:

* System architecture.
* Database schemas.
* API endpoints.
* Authentication flow.
* Authorization flow.
* Doctor-patient relationship design.
* Prescription workflow.
* Notification architecture.
* AI integration design.
* Frontend page structure.

PHASE 3: CORE BACKEND

Implement:

* Database connection.
* Authentication.
* Profiles.
* Doctor verification.
* Doctor-patient relationships.
* Medicine catalog.
* Prescription management.
* Medical history.

PHASE 4: FRONTEND

Implement:

* Landing page.
* Authentication pages.
* Doctor dashboard.
* Patient dashboard.
* Profile pages.
* Patient queue.
* Medicine management.
* Prescription pages.
* Analytics pages.
* Notification interfaces.

PHASE 5: INTEGRATION

Connect all frontend components with actual backend APIs.

Verify database persistence.

Verify authorization.

PHASE 6: ADVANCED FEATURES

Implement:

* Medication reminders.
* Medication logs.
* Symptom tracking.
* Recovery assessments.
* Appointment management.
* AI insights.
* Analytics.

PHASE 7: TESTING

Test all major workflows.

Test successful and unsuccessful scenarios.

Test security boundaries.

Test notification scheduling.

Test database relationships.

Test AI API failures.

PHASE 8: FINAL VALIDATION

Compare every implemented feature against this specification.

Fix incomplete functionality.

Do not mark features complete based only on frontend appearance.

---

# 27. TESTING REQUIREMENTS

Test the following workflows:

AUTHENTICATION:

* Doctor registration.
* Patient registration.
* Login.
* Logout.
* Unauthorized access.

CONNECTIONS:

* Doctor search.
* Unique code connection.
* Connection request.
* Doctor approval.
* Duplicate connection prevention.
* Relationship disconnection.

PRESCRIPTIONS:

* Medicine search.
* Manual medicine entry.
* Prescription creation.
* Multiple medicines.
* Prescription updates.
* Historical versions.

MEDICATION:

* Schedule creation.
* Reminder generation.
* Taken status.
* Missed status.
* Duplicate log prevention.
* Schedule changes.

RECOVERY:

* Patient symptom entry.
* Doctor assessment.
* Historical recovery tracking.
* Analytics calculations.

AI:

* Valid AI response.
* Invalid AI response.
* API failure.
* Missing API key.
* Unauthorized data access.
* Safety restrictions.

SECURITY:

* Patient accessing another patient's records.
* Doctor accessing an unrelated patient.
* Patient modifying prescriptions.
* Unverified doctor attempting prescription creation.

---

# 28. ENVIRONMENT VARIABLES

Create .env.example.

Backend:

PORT=
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=

AI_API_KEY=
AI_MODEL=
AI_BASE_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

Document all environment variables.

Never commit actual credentials.

---

# 29. ACCEPTANCE CRITERIA

The project is complete only when:

1. Landing page works.
2. Doctor registration works.
3. Patient registration works.
4. Authentication works.
5. Role-based access works.
6. Doctor verification works.
7. Doctor search works.
8. Unique connection code works.
9. Connection requests work.
10. Many-to-many relationships work.
11. Patient management works.
12. Medicine database works.
13. Manual medicine entry works.
14. Prescription creation works.
15. Prescription history is maintained.
16. Medication schedules work.
17. Patient medicine overview works.
18. Medication logging works.
19. Reminders work.
20. Medical history works.
21. Appointment management works.
22. Patient symptom tracking works.
23. Doctor recovery assessments work.
24. Doctor analytics work.
25. Patient analytics work.
26. AI integration works.
27. AI safety restrictions work.
28. Emergency medical information works.
29. Notification system works.
30. Security restrictions work.
31. Frontend and backend are integrated.
32. Database persistence works.
33. Important workflows are tested.

Maintain a requirement tracking checklist.

Each requirement must have:

* Implementation status.
* Relevant files.
* API endpoints.
* Database models.
* Testing status.

---

# 30. FINAL DELIVERY

Deliver:

* Complete source code.
* Functional frontend.
* Functional backend.
* MongoDB schemas.
* API documentation.
* .env.example.
* Installation instructions.
* Execution commands.
* Testing instructions.
* Architecture documentation.
* Known limitations.
* Requirement completion report.

Provide a final verification table.

Never claim a feature works without testing it.

Clearly identify any incomplete functionality.

---

# FINAL EXECUTION DIRECTIVE

Your primary responsibility is to deliver a complete MEDICO healthcare management platform.

Follow these principles:

1. Understand before implementing.
2. Inspect before modifying.
3. Design before coding.
4. Build modularly.
5. Integrate progressively.
6. Test continuously.
7. Protect medical information.
8. Maintain data integrity.
9. Follow clinical safety boundaries.
10. Verify before declaring completion.

Do not unnecessarily simplify complex requirements.

Do not replace required functionality with dummy data.

Do not leave unfinished placeholder components.

Do not create buttons without functionality.

Do not sacrifice backend correctness for frontend appearance.

Do not sacrifice usability for unnecessary technical complexity.

If a requirement is ambiguous and affects security, medical safety, or data integrity, document the ambiguity and ask for clarification.

For minor implementation decisions, use sound engineering judgment.

START NOW:

First perform PHASE 1: CODEBASE AUDIT.

Then present:

* Existing project assessment.
* Proposed architecture.
* Database design.
* API design.
* Development roadmap.
* Requirement checklist.

After that, proceed with implementation systematically.

Your final objective is a fully integrated, functional, secure, and professionally designed MEDICO application.
