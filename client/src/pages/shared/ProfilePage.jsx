import { useEffect, useState } from 'react';
import { Check, Copy, ShieldCheck, User, Camera, RefreshCw, IdCard, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import StatusPill from '../../components/ui/StatusPill';

const patientFields = [
  ['phone', 'Mobile number'], ['dob', 'Date of birth', 'date'], ['gender', 'Gender'], ['address', 'Address'],
  ['bloodGroup', 'Blood group'], ['emergencyContact', 'Emergency contact'], ['height', 'Height (cm)', 'number'],
  ['weight', 'Weight (kg)', 'number'], ['primaryDisease', 'Primary disease'], ['diseaseDescription', 'Disease description', 'textarea'],
  ['yearsSuffering', 'Years with condition', 'number'], ['previousMedicalHistory', 'Previous medical history', 'textarea'],
  ['existingMedications', 'Existing medications', 'textarea'], ['allergies', 'Allergies', 'textarea'],
  ['previousSurgeries', 'Previous surgeries', 'textarea'], ['existingHealthConditions', 'Other health conditions', 'textarea'],
  ['lifestyleInfo', 'Lifestyle information', 'textarea'], ['emergencyNotes', 'Emergency notes', 'textarea']
];
const doctorFields = [
  ['phone', 'Mobile number'], ['dob', 'Date of birth', 'date'], ['gender', 'Gender'],
  ['specialization', 'Specialization'], ['hospitalName', 'Hospital or clinic'], ['hospitalLocation', 'Location'],
  ['designation', 'Designation'], ['degree', 'Medical degree'], ['graduationYear', 'Graduation year', 'number'],
  ['experience', 'Years of experience', 'number'], ['medicalRegistrationNumber', 'Medical registration number'],
  ['professionalDescription', 'Professional description', 'textarea'], ['consultationInfo', 'Consultation information', 'textarea']
];
const formProfile = (profile) => ({ ...profile, dob: profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '' });

const VERIFICATION_TONE = {
  VERIFIED: 'chip-stable',
  PENDING: 'chip-caution',
  REJECTED: 'chip-critical'
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageConsent, setImageConsent] = useState(false);
  const isDoctor = user?.role === 'DOCTOR';
  const fields = isDoctor ? doctorFields : patientFields;

  useEffect(() => {
    api.get('/profiles/me').then((response) => {
      setProfile(response.data.profile);
      setForm(formProfile(response.data.profile || {}));
    }).catch((error) => setMessage(error.response?.data?.message || 'Could not load your profile.'));
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await api.patch('/profiles/me', form);
      setProfile((current) => ({ ...current, ...response.data.profile }));
      setUser((current) => ({ ...current, ...response.data.profile }));
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save your profile.');
    } finally { setSaving(false); }
  };

  const submitVerification = async () => {
    setMessage('');
    try {
      const response = await api.post('/profiles/doctor/verification', { medicalRegistrationNumber: form.medicalRegistrationNumber });
      setProfile((current) => ({ ...current, verificationStatus: response.data.verificationStatus }));
      setMessage(response.data.message);
    } catch (error) { setMessage(error.response?.data?.message || 'Could not submit verification.'); }
  };

  const rotateCode = async () => {
    setCodeMessage('');
    try {
      const response = await api.post('/profiles/doctor/connection-code/rotate');
      setProfile((current) => ({ ...current, connectionCode: response.data.connectionCode, connectionCodeExpiresAt: response.data.connectionCodeExpiresAt }));
      setCodeMessage('New connection code generated.');
    } catch (error) { setCodeMessage(error.response?.data?.message || 'Could not generate a connection code.'); }
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(profile.connectionCode); setCodeMessage('Connection code copied.'); }
    catch { setCodeMessage('Copy was blocked by the browser. Select the code to copy it.'); }
  };

  const uploadImage = async () => {
    if (!imageFile) { setMessage('Choose a profile image first.'); return; }
    if (!imageConsent) { setMessage('Confirm before uploading your image to the configured storage provider.'); return; }
    if (imageFile.size > 4 * 1024 * 1024) { setMessage('Image must be smaller than 4 MB.'); return; }
    setSaving(true); setMessage('');
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error('Could not read that image.'));
        reader.readAsDataURL(imageFile);
      });
      const response = await api.post('/profiles/me/image', { contentType: imageFile.type, data });
      setProfile((current) => ({ ...current, profileImage: response.data.profileImage }));
      setForm((current) => ({ ...current, profileImage: response.data.profileImage }));
      setUser((current) => ({ ...current, profileImage: response.data.profileImage }));
      setImageFile(null); setImageConsent(false); setMessage('Profile image uploaded.');
    } catch (error) { setMessage(error.response?.data?.message || error.message || 'Could not upload the image.'); }
    finally { setSaving(false); }
  };

  const renderField = ([name, label, type]) => (
    <label key={name} className="text-sm font-medium text-slate-600">
      {label}
      {type === 'textarea' ? (
        <textarea value={form[name] || ''} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} maxLength={name === 'emergencyNotes' ? 1000 : 4000} className="form-input mt-2 min-h-24" />
      ) : (
        <input type={type || 'text'} min={type === 'number' ? 0 : undefined} value={form[name] || ''} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} className="form-input mt-2" />
      )}
    </label>
  );

  if (!profile) {
    return (
      <main className="p-5 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="surface-card rounded-[26px] p-6">
            <div className="skeleton h-5 w-52" />
            <div className="skeleton mt-4 h-4 w-full" />
            <div className="skeleton mt-2 h-4 w-3/4" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Account"
          title="Your profile"
          description="Keep your contact and care details up to date. Only authorized members of your care team can view health information."
          icon={User}
          meta={
            isDoctor ? (
              <StatusPill
                status={profile.verificationStatus || 'PENDING'}
                label={profile.verificationStatus || 'Pending verification'}
                tone={VERIFICATION_TONE[profile.verificationStatus] || 'chip-caution'}
              />
            ) : null
          }
        />

        <form onSubmit={saveProfile}>
          <Panel title="Personal details" icon={User} className="mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">
                Full name
                <input
                  required
                  minLength="2"
                  maxLength="100"
                  value={form.name || ''}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="form-input mt-2"
                />
              </label>
              <div className="text-sm font-medium text-slate-600">
                Email address
                <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-normal text-slate-500">{profile.email}</p>
              </div>
            </div>

            <div className="vital-rail mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4" style={{ '--rail': 'var(--brand-600, #0a9187)' }}>
              <div className="flex flex-wrap items-center gap-4">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white" />
                ) : (
                  <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-semibold text-white">
                    {form.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'MD'}
                  </span>
                )}
                <label className="min-w-0 flex-1 text-sm font-medium text-slate-600">
                  Profile photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className="mt-2 block w-full text-sm text-slate-500"
                  />
                </label>
                <button type="button" onClick={uploadImage} disabled={saving || !imageFile || !imageConsent} className="secondary-btn disabled:opacity-50">
                  <Camera className="h-4 w-4" /> Upload photo
                </button>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <input type="checkbox" checked={imageConsent} onChange={(event) => setImageConsent(event.target.checked)} className="mt-0.5" />
                I agree to send this profile photo to the configured image-storage provider.
              </label>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="eyebrow">{isDoctor ? 'Professional details' : 'Health details'}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map(renderField)}</div>
            </div>

            {message && (
              <p role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {message}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <button disabled={saving} className="primary-btn disabled:opacity-50">
                <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save profile'}
              </button>
              {isDoctor && profile.verificationStatus !== 'VERIFIED' && (
                <button type="button" onClick={submitVerification} className="secondary-btn">
                  <ShieldCheck className="h-4 w-4" /> Submit for verification
                </button>
              )}
            </div>
          </Panel>
        </form>

        {isDoctor && (
          <Panel
            title="Doctor verification"
            subtitle="Prescription creation is enabled only after verification."
            icon={ShieldCheck}
            className="mb-6"
            action={
              <StatusPill
                status={profile.verificationStatus || 'PENDING'}
                label={profile.verificationStatus || 'Pending'}
                tone={VERIFICATION_TONE[profile.verificationStatus] || 'chip-caution'}
              />
            }
          >
            {profile.verificationStatus === 'VERIFIED' ? (
              <div className="vital-rail rounded-2xl border border-brand-100 bg-brand-50/60 p-4" style={{ '--rail': 'var(--brand-600, #0a9187)' }}>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <IdCard className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  Patient connection code
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="rounded-lg border border-brand-100 bg-white px-3 py-2 font-mono text-sm tracking-[0.15em] text-brand-800">
                    {profile.connectionCode || 'No code yet'}
                  </code>
                  {profile.connectionCode && (
                    <button type="button" onClick={copyCode} className="secondary-btn min-h-9">
                      <Copy className="h-4 w-4" /> Copy
                    </button>
                  )}
                  <button type="button" onClick={rotateCode} className="secondary-btn min-h-9">
                    <RefreshCw className="h-4 w-4" /> Generate new code
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {profile.connectionCodeExpiresAt ? `Expires ${new Date(profile.connectionCodeExpiresAt).toLocaleDateString()}.` : 'Codes expire after 90 days.'}
                </p>
                {codeMessage && (
                  <p role="status" className="mt-2 text-xs text-slate-600">
                    {codeMessage}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-500">
                Submit your medical registration number for verification. Until it is approved you can edit your profile but cannot create prescriptions.
              </p>
            )}
          </Panel>
        )}
      </div>
    </main>
  );
}
