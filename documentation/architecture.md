# MEDICO Architecture

## Initial repository assessment before this implementation

The application uses React 18, React Router, Tailwind CSS, Axios, Recharts, Express, Mongoose, bcrypt, and JWT. The frontend already has public landing, login/register, doctor and patient dashboards, doctor search, connection-code entry, basic symptom/adherence capture, recovery assessment entry, notifications, and an AI insights screen.

The API is currently concentrated in `server/server.js`. MongoDB is only used for users and a combined analytics-record collection; connections, appointments, prescriptions, reminders, notifications, and other records are process-local arrays. Dashboard counts and AI insights include fixed values. There is no persistent medicine catalog, prescription version history, appointment API, full medical-history API, emergency-information access audit, or reliable reminder worker.

## Target architecture

Keep the existing Vite/React/Tailwind client and REST API. Organize backend code by domain: models define persisted records; services own workflows and authorization checks; route modules expose REST endpoints; middleware handles authentication, role checks, validation, rate limits, and common errors. The API must not trust IDs, roles, or permissions supplied by a client.

### Domain records

| Record | Purpose and key relationships |
| --- | --- |
| User | Authentication identity, role, contact details, profile fields, and doctor verification state. |
| DoctorPatientRelation | Many-to-many relationship with status, method, timestamps, and permissions. |
| Medicine | Searchable catalog and manually entered medicines, marked as unverified when appropriate. |
| Prescription | Doctor, patient, approved relationship, diagnosis, dates, status, and multiple medicine instructions. |
| PrescriptionVersion | Immutable before/after snapshots for prescription edits and status changes. |
| MedicationSchedule | Patient-specific schedule derived from an authorized prescription. |
| MedicationReminder | Persisted scheduled occurrence, timezone, status, delivery state, and snooze time. |
| MedicationLog | One patient response per scheduled occurrence; unique occurrence index prevents duplicate logs. |
| MedicalHistoryRecord | Patient history, source, author, and timestamps; history is retained after disconnection. |
| Appointment | Patient/doctor, relationship, requested/confirmed time, status, and reminder metadata. |
| SymptomRecord / RecoveryRecord | Separate patient-reported symptoms and doctor-authored clinical assessments. |
| Notification | Recipient, category, content, read state, and delivery state. |
| AIInsight | Generated summary, evidence references, model metadata, and explicit AI labeling. |
| AuditLog | Sensitive access and change events with actor, subject, action, and timestamp. |

User IDs are stable strings shared by references. Every clinical route must enforce either patient ownership or an appropriate doctor relationship; a doctor may only see patients connected to that doctor. A patient can have several doctors and a doctor can have several patients. Disconnecting a relationship prevents new access through that relationship but does not erase historical records.

## API groups

All endpoints are under `/api` and require a verified bearer token unless explicitly public.

| Group | Main operations |
| --- | --- |
| `/auth` and `/profiles` | Register, login, current session, and owner-only profile updates. |
| `/doctors` and `/patients` | Doctor discovery, doctor verification workflow, connected-patient roster, and authorized patient records. |
| `/connections` | Search/code requests, doctor decisions, and relationship disconnection. |
| `/medicines` | Search catalog and doctor-only manual entries. |
| `/prescriptions` | Create, read, revise with immutable versions, and discontinue/complete. |
| `/medication` and `/reminders` | Patient medicine overview, persisted reminders, dose logs, snooze, and issue reporting. |
| `/medical-history` and `/emergency` | Owner/relationship-scoped history, emergency summary, and access auditing. |
| `/appointments` | Patient requests/cancellation and doctor decisions/scheduling/follow-up. |
| `/symptoms`, `/recovery`, `/analytics` | Symptom entries, doctor assessments, and calculations based on stored records. |
| `/ai` | Optional server-side AI summaries over authorized data; gracefully unavailable without configuration. |
| `/notifications` | Recipient-scoped list, read state, and persistent delivery metadata. |

## Security and operational boundaries

JWT signing requires `JWT_SECRET`; production startup fails if it is missing. Doctor accounts begin unverified and prescription creation is disabled until verification. AI, image storage, and browser push are optional integrations and must not block core workflows. The in-app reminder queue is persisted in MongoDB and recovered by a server worker; browser notifications require explicit browser permission. The process-local fallback is only for local development and is not durable across restarts.

