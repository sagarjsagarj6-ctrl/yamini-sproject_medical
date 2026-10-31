# MEDICO API reference

The API base path is `/api`. Send the JWT returned by registration or login as `Authorization: Bearer <token>`. IDs in route paths are application record IDs. Protected endpoints enforce role and record ownership on the server.

## Authentication and profiles

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create a patient or doctor account |
| POST | `/auth/login` | Public | Authenticate and issue a seven-day JWT |
| GET | `/auth/me` | Authenticated | Load the current account |
| GET/PATCH | `/profiles/me` | Authenticated | Read or update permitted profile fields |
| POST | `/profiles/me/image` | Authenticated | Upload a consented JPEG, PNG, or WebP profile image |
| POST | `/profiles/doctor/verification` | Doctor | Submit registration credentials for review |
| POST | `/profiles/doctor/connection-code/rotate` | Verified doctor | Generate a new expiring connection code |
| PATCH | `/profiles/admin/doctors/:id/verification` | Admin key | Change doctor verification status |

## Connections and care teams

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/connections` | Authenticated | List the caller's relationships |
| POST | `/connections/request` | Patient | Request a connection with a listed doctor |
| POST | `/connections/request-by-code` | Patient | Request a connection using a doctor code |
| PATCH | `/connections/:id/decision` | Owning doctor | Accept or reject a pending request |
| PATCH | `/connections/:id/disconnect` | Relationship member | Disconnect while retaining historical records |
| GET | `/doctors`, `/doctors/:id` | Patient | Search verified doctors and view a profile |
| GET | `/patients`, `/patients/:id` | Doctor | List connected patients and view an authorized record |

## Prescriptions and medicines

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/medicines` | Doctor | Search or add a reusable medicine record |
| GET/POST | `/prescriptions` | Authenticated / verified doctor | List authorized prescriptions or create one |
| PATCH | `/prescriptions/:id` | Prescribing doctor | Revise fields or medicines and preserve a version |
| PATCH | `/prescriptions/:id/status` | Prescribing doctor | Activate, complete, or discontinue a prescription |
| GET | `/prescriptions/:id/versions` | Patient or prescribing doctor | View prescription history |
| GET | `/patient/medicines` | Patient | View active medication schedules |
| GET | `/patient/reminders`, `/patient/medication-logs` | Patient | View reminders and dose logs |
| POST | `/patient/medication-logs` | Patient | Record a scheduled dose as taken or missed |
| PATCH | `/reminders/:id/snooze` | Patient | Snooze an eligible reminder |
| POST | `/reminders/:id/report-issue` | Patient | Notify the care team about a dose issue |

## Medical records and appointments

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET/POST | `/patients/:patientId/medical-history`, `/medical-history` | Patient or connected doctor | Read or add history records |
| GET | `/patients/:patientId/emergency` | Patient or verified connected doctor | Read a restricted emergency summary; access is audited |
| GET | `/patients/:patientId/symptoms` | Patient or connected doctor | Read symptom history |
| POST | `/patient/symptom-logs` | Patient | Record a symptom and optional measurement |
| GET/POST | `/patients/:patientId/recovery-assessments` | Patient or doctor | Read assessments or add one as connected doctor |
| GET/POST | `/appointments` | Authenticated / patient | List appointments or request one |
| PATCH | `/appointments/:id` | Appointment participant | Accept, reject, reschedule, or cancel |
| POST | `/appointments/:id/follow-up` | Owning doctor | Schedule a follow-up appointment |

## Dashboards, analytics, AI, notifications

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/doctor/dashboard`, `/patient/dashboard` | Matching role | Load role-specific dashboard data |
| GET | `/doctor/analytics`, `/patient/analytics` | Matching role | Load analytics from recorded care data |
| POST | `/doctor/insights`, `/patient/insights` | Matching role + explicit consent | Generate optional provider-backed AI insights |
| GET | `/insights/recent` | Authenticated | List the caller's stored insights |
| GET | `/notifications` | Authenticated | List caller's notifications |
| PATCH | `/notifications/:id/read`, `/notifications/read-all` | Authenticated | Mark notifications read |
| GET | `/health` | Public | Report API and persistence mode |
| GET | `/demo/status` | Public, development demo only | Report demo mode and provide synthetic quick-login credentials; disabled in production |

## Responses and errors

Successful responses are JSON. Validation errors use `400`, unauthenticated requests use `401`, role or resource access denials use `403` or ownership-hiding `404`, duplicate conflicts use `409`, and unexpected server errors use a generic message. Provider credentials and internal error details are not returned to the browser.
