import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Stethoscope, UserRoundPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MedicoLogo from '../../components/ui/MedicoLogo';

const initialFields = {
  role: 'PATIENT',
  name: '',
  email: '',
  phone: '',
  address: '',
  dob: '',
  password: '',
  gender: '',
  bloodGroup: '',
  emergencyContact: '',
  height: '',
  weight: '',
  primaryDisease: '',
  diseaseDescription: '',
  yearsSuffering: '',
  previousMedicalHistory: '',
  existingMedications: '',
  allergies: '',
  previousSurgeries: '',
  existingHealthConditions: '',
  lifestyleInfo: '',
  specialization: '',
  hospitalName: '',
  hospitalLocation: '',
  designation: '',
  degree: '',
  graduationYear: '',
  experience: '',
  medicalRegistrationNumber: '',
  profileImage: '',
  professionalDescription: '',
  consultationInfo: ''
};

const calculateAge = (value) => {
  if (!value) return '';
  const birth = new Date(`${value}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) years -= 1;
  return years >= 0 ? years : '';
};

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'doctor' ? 'DOCTOR' : 'PATIENT';
  const [form, setForm] = useState({ ...initialFields, role: defaultRole });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const isDoctor = useMemo(() => form.role === 'DOCTOR', [form.role]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...form,
        age: calculateAge(form.dob) || undefined
      };
      const res = await register(payload);
      if (res.user.role === 'DOCTOR') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
        <div className="surface-card overflow-hidden rounded-[30px] border border-white/80 shadow-clinical-lg">
        <div className="relative overflow-hidden bg-console-panel px-6 py-7 text-white sm:px-9 md:px-11">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[.14]" aria-hidden="true">
            <div className="ecg-trace ecg-trace-light" />
          </div>
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <MedicoLogo size="md" tone="light" showWordmark={false} to={null} />
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-brand-300">MEDICO clinical console</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Create your care profile</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Choose how you’ll use MEDICO. You can add your clinical details next.</p>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/[.06] p-3 text-brand-300 backdrop-blur sm:block"><HeartPulse className="h-6 w-6 animate-heartbeat" /></div>
          </div>
        </div>

        <div className="p-6 sm:p-9 md:p-11">

        <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
            {[{ value: 'PATIENT', title: 'I’m a patient', detail: 'Manage care and reminders', icon: UserRoundPlus }, { value: 'DOCTOR', title: 'I’m a doctor', detail: 'Coordinate patient care', icon: Stethoscope }].map(({ value, title, detail, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, role: value }))} aria-pressed={form.role === value} className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition duration-300 ${form.role === value ? 'border-brand-600 bg-brand-50 ring-4 ring-brand-50 shadow-clinical' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft'}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${form.role === value ? 'bg-brand-gradient text-white shadow-glow' : 'bg-slate-50 text-slate-500 group-hover:text-brand-600'}`}><Icon className="h-5 w-5" /></span>
                <span><span className="block text-sm font-semibold text-slate-800">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{detail}</span></span>
                {form.role === value && <span className="live-dot ml-auto" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="md:col-span-2"><div className="flex items-center gap-3"><span className="eyebrow">Core details</span><span className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" /></div></div>

          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" placeholder="Your full name" required />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="form-input" placeholder="name@example.com" required />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Mobile number</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="form-input" placeholder="9876543210" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Date of birth</label>
            <input type="date" name="dob" value={form.dob} onChange={handleChange} className="form-input" />
            {form.dob && <p className="mt-1 text-xs text-slate-500">Age: {calculateAge(form.dob) || 'Enter a valid date'}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="form-input">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="form-input" placeholder="Create a secure password" required />
          </div>

          {isDoctor ? (
            <>
              <div className="md:col-span-2"><div className="flex items-center gap-3"><span className="eyebrow">Professional details</span><span className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" /></div></div>
              <div>
                <label className="text-sm font-medium text-slate-700">Specialization</label>
                <input name="specialization" value={form.specialization} onChange={handleChange} className="form-input" placeholder="Cardiology" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Hospital name</label>
                <input name="hospitalName" value={form.hospitalName} onChange={handleChange} className="form-input" placeholder="Apollo Hospital" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Hospital location</label>
                <input name="hospitalLocation" value={form.hospitalLocation} onChange={handleChange} className="form-input" placeholder="Bengaluru" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Designation</label>
                <input name="designation" value={form.designation} onChange={handleChange} className="form-input" placeholder="Consultant" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Medical degree</label>
                <input name="degree" value={form.degree} onChange={handleChange} className="form-input" placeholder="MD Cardiology" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Graduation year</label>
                <input type="number" name="graduationYear" value={form.graduationYear} onChange={handleChange} className="form-input" placeholder="2015" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Years of experience</label>
                <input type="number" min="0" max="80" name="experience" value={form.experience} onChange={handleChange} className="form-input" placeholder="5" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Medical registration number</label>
                <input name="medicalRegistrationNumber" value={form.medicalRegistrationNumber} onChange={handleChange} className="form-input" placeholder="Required for verification" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Profile image URL</label>
                <input type="url" name="profileImage" value={form.profileImage} onChange={handleChange} className="form-input" placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Consultation information</label>
                <input name="consultationInfo" value={form.consultationInfo} onChange={handleChange} className="form-input" placeholder="Clinic hours or consultation details" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Professional description</label>
                <textarea maxLength="2000" name="professionalDescription" value={form.professionalDescription} onChange={handleChange} className="form-input min-h-20" placeholder="Areas of practice and professional background" />
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2"><div className="flex items-center gap-3"><span className="eyebrow">A little more about you</span><span className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" /></div></div>
              <div>
                <label className="text-sm font-medium text-slate-700">Blood group</label>
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="form-input">
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Address</label>
                <input name="address" value={form.address || ''} onChange={handleChange} className="form-input" placeholder="Current address" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Emergency contact</label>
                <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} className="form-input" placeholder="Name and phone" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Primary disease or concern</label>
                <input name="primaryDisease" value={form.primaryDisease} onChange={handleChange} className="form-input" placeholder="Optional" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Years with condition</label>
                <input type="number" min="0" max="120" name="yearsSuffering" value={form.yearsSuffering} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Height (cm)</label>
                <input type="number" min="0" max="300" name="height" value={form.height} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Weight (kg)</label>
                <input type="number" min="0" max="700" name="weight" value={form.weight} onChange={handleChange} className="form-input" />
              </div>
              {[
                ['diseaseDescription', 'Disease description'], ['previousMedicalHistory', 'Previous medical history'],
                ['existingMedications', 'Current medications'], ['allergies', 'Allergies'],
                ['previousSurgeries', 'Previous surgeries'], ['existingHealthConditions', 'Other health conditions'],
                ['lifestyleInfo', 'Lifestyle information']
              ].map(([name, label]) => <div key={name} className="md:col-span-2"><label className="text-sm font-medium text-slate-700">{label}<textarea maxLength="2000" name={name} value={form[name]} onChange={handleChange} className="form-input min-h-16" placeholder="Optional" /></label></div>)}
            </>
          )}

          {error && <div className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <div className="mt-1 flex flex-col-reverse gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
            <Link to="/login" className="text-sm font-medium text-brand-700 transition hover:text-brand-800">Already have an account? Log in</Link>
            <button type="submit" className="primary-btn min-h-12 px-5"><UserRoundPlus className="h-4 w-4" /> Create account</button>
          </div>
        </form>
        </div>
        </div>
      </div>
    </div>
  );
}
