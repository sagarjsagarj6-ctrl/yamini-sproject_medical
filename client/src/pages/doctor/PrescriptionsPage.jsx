import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, AlertTriangle, History, Image as ImageIcon, Pill, Check, Utensils, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import StatusPill from '../../components/ui/StatusPill';
import EmptyState from '../../components/ui/EmptyState';

const MEDICINE_PRESETS = [
  { label: 'White Tablet', unit: 'tablet', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80' },
  { label: 'Blue/White Capsule', unit: 'capsule', url: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cough Syrup', unit: 'ml', url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80' },
  { label: 'Drops / Inhaler', unit: 'drops', url: 'https://images.unsplash.com/photo-1576073719676-aa95576db207?w=400&auto=format&fit=crop&q=80' },
  { label: 'Injection / Ampoule', unit: 'other', url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cream / Ointment', unit: 'other', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80' }
];

const newMedicine = () => ({
  medicineId: '',
  medicineName: '',
  imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
  dosage: '1',
  dosageUnit: 'tablet',
  frequency: 'Once daily',
  times: '08:00',
  foodInstruction: 'AFTER_FOOD',
  durationDays: 7,
  specialInstructions: ''
});

const today = () => new Date().toISOString().slice(0, 10);

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [versions, setVersions] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    patientId: '',
    diagnosis: '',
    clinicalNotes: '',
    startDate: today(),
    followUpDate: '',
    medications: [newMedicine()]
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [patientResponse, medicineResponse, prescriptionResponse] = await Promise.all([
        api.get('/patients'),
        api.get('/medicines'),
        api.get('/prescriptions')
      ]);
      setPatients(patientResponse.data.patients || []);
      setCatalog(medicineResponse.data.medicines || []);
      setPrescriptions(prescriptionResponse.data.prescriptions || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not load prescription data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateMedicine = (index, key, value) => {
    setForm((current) => ({
      ...current,
      medications: current.medications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const medications = form.medications.map((item) => ({
        ...item,
        times: item.times
          .split(',')
          .map((time) => time.trim())
          .filter(Boolean),
        durationDays: Number(item.durationDays)
      }));
      await api.post('/prescriptions', { ...form, medications, timezone });
      setForm({
        patientId: '',
        diagnosis: '',
        clinicalNotes: '',
        startDate: today(),
        followUpDate: '',
        medications: [newMedicine()]
      });
      setMessage('Prescription created. Patient dashboard cards and WhatsApp reminders are now active.');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not create this prescription.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (prescription, status) => {
    setMessage('');
    try {
      await api.patch(`/prescriptions/${prescription.id}/status`, { status });
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update the prescription.');
    }
  };

  const toggleVersions = async (id) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (versions[id]) return;
    try {
      const response = await api.get(`/prescriptions/${id}/versions`);
      setVersions((current) => ({ ...current, [id]: response.data.versions || [] }));
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not load prescription history.');
    }
  };

  const verified = user?.verificationStatus === 'VERIFIED';

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Doctor tools"
          title="Assign medication & Dosage"
          description="Decide patient medication, exact dosage, schedule, and medicine image. This will reflect as a card on the patient dashboard with automated WhatsApp reminders."
          icon={FileText}
        />

        {!verified && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your account is {user?.verificationStatus || 'not verified'}. Submit your medical registration details from Profile; prescribing is enabled after verification.
            </span>
          </div>
        )}

        <Panel
          title="New prescription"
          subtitle="Configure medication cards with images, food instructions, and reminder intervals."
          icon={FileText}
        >
          <form onSubmit={submit} className="mt-1 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600 sm:col-span-2">
              Connected patient
              <select
                required
                value={form.patientId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, patientId: event.target.value }))
                }
                className="form-input"
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                    {patient.primaryDisease ? ` · ${patient.primaryDisease}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-600">
              Diagnosis
              <input
                maxLength="500"
                value={form.diagnosis}
                onChange={(event) =>
                  setForm((current) => ({ ...current, diagnosis: event.target.value }))
                }
                className="form-input"
                placeholder="e.g. Hypertension, Acute Bronchitis"
              />
            </label>

            <label className="text-sm font-medium text-slate-600">
              Start date
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startDate: event.target.value }))
                }
                className="form-input"
              />
            </label>

            <label className="text-sm font-medium text-slate-600">
              Follow-up date
              <input
                type="date"
                value={form.followUpDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, followUpDate: event.target.value }))
                }
                className="form-input"
              />
            </label>

            <label className="text-sm font-medium text-slate-600 sm:col-span-2">
              Clinical notes
              <textarea
                maxLength="4000"
                value={form.clinicalNotes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, clinicalNotes: event.target.value }))
                }
                className="form-input min-h-20"
                placeholder="General clinical observations or advice..."
              />
            </label>

            {/* Medications List */}
            <div className="space-y-6 sm:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="text-base font-bold text-slate-900">
                  Prescribed Medicines & Dosage Cards ({form.medications.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Select an image preset or enter custom image URL
                </span>
              </div>

              {form.medications.map((medicine, index) => (
                <fieldset
                  key={index}
                  className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <legend className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 text-xs text-white">
                        {index + 1}
                      </span>
                      <span>Medicine Details & Visual Card</span>
                    </legend>
                    {form.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            medications: current.medications.filter(
                              (_, itemIndex) => itemIndex !== index
                            )
                          }))
                        }
                        aria-label={`Remove medicine ${index + 1}`}
                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-medium text-slate-600 sm:col-span-2 lg:col-span-3">
                      Catalog medicine (optional)
                      <select
                        value={medicine.medicineId}
                        onChange={(event) => {
                          const selected = catalog.find((item) => item.id === event.target.value);
                          updateMedicine(index, 'medicineId', selected?.id || '');
                          if (selected) {
                            updateMedicine(index, 'medicineName', selected.medicineName);
                            if (selected.imageUrl) updateMedicine(index, 'imageUrl', selected.imageUrl);
                            if (selected.dosageForm)
                              updateMedicine(index, 'dosageUnit', selected.dosageForm.toLowerCase());
                          }
                        }}
                        className="form-input"
                      >
                        <option value="">Manual entry</option>
                        {catalog.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.medicineName}
                            {item.source === 'MANUAL' ? ' · unverified' : ''}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-sm font-medium text-slate-600">
                      Medicine name
                      <input
                        required
                        maxLength="160"
                        value={medicine.medicineName}
                        onChange={(event) => updateMedicine(index, 'medicineName', event.target.value)}
                        className="form-input"
                        placeholder="e.g. Amoxicillin, Paracetamol"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-600">
                      Dosage (Amount)
                      <input
                        required
                        maxLength="80"
                        value={medicine.dosage}
                        onChange={(event) => updateMedicine(index, 'dosage', event.target.value)}
                        className="form-input"
                        placeholder="e.g. 500, 1, 10"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-600">
                      Dosage unit
                      <select
                        value={medicine.dosageUnit}
                        onChange={(event) => updateMedicine(index, 'dosageUnit', event.target.value)}
                        className="form-input"
                      >
                        {['tablet', 'capsule', 'ml', 'drops', 'mg', 'injection', 'other'].map(
                          (unit) => (
                            <option key={unit}>{unit}</option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="text-sm font-medium text-slate-600">
                      Frequency
                      <input
                        required
                        maxLength="100"
                        value={medicine.frequency}
                        onChange={(event) => updateMedicine(index, 'frequency', event.target.value)}
                        className="form-input"
                        placeholder="e.g. Twice daily, Every 8 hours"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-600">
                      Reminder times (24-hour, comma separated)
                      <input
                        required
                        value={medicine.times}
                        onChange={(event) => updateMedicine(index, 'times', event.target.value)}
                        className="form-input"
                        placeholder="08:00, 20:00"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-600">
                      Duration (days)
                      <input
                        required
                        type="number"
                        min="1"
                        max="365"
                        value={medicine.durationDays}
                        onChange={(event) =>
                          updateMedicine(index, 'durationDays', event.target.value)
                        }
                        className="form-input"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-600">
                      Food instruction
                      <select
                        value={medicine.foodInstruction}
                        onChange={(event) =>
                          updateMedicine(index, 'foodInstruction', event.target.value)
                        }
                        className="form-input"
                      >
                        <option value="AFTER_FOOD">After food (Recommended)</option>
                        <option value="BEFORE_FOOD">Before food (Empty stomach)</option>
                        <option value="WITH_FOOD">With food / meal</option>
                        <option value="ANY">Any time / flexible</option>
                      </select>
                    </label>

                    {/* Image Preset & URL Selector */}
                    <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Medicine Image Selection (Will reflect in Patient Dashboard Card)
                        </span>
                        <span className="text-[11px] text-slate-500">Pick preset or paste URL</span>
                      </div>

                      {/* Visual Presets */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                        {MEDICINE_PRESETS.map((preset) => {
                          const isSelected = medicine.imageUrl === preset.url;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                updateMedicine(index, 'imageUrl', preset.url);
                                if (preset.unit) updateMedicine(index, 'dosageUnit', preset.unit);
                              }}
                              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? 'border-brand-600 bg-brand-50 shadow-sm ring-2 ring-brand-600/30'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                              <span className="text-[10px] font-semibold text-slate-700 truncate w-full">
                                {preset.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Image URL Input */}
                      <label className="text-xs font-semibold text-slate-600 block">
                        Custom Image URL
                        <input
                          maxLength="2048"
                          value={medicine.imageUrl}
                          onChange={(event) => updateMedicine(index, 'imageUrl', event.target.value)}
                          className="form-input mt-1 text-xs"
                          placeholder="https://example.com/medicine-image.jpg"
                        />
                      </label>
                    </div>

                    <label className="text-sm font-medium text-slate-600 sm:col-span-2 lg:col-span-3">
                      Special instructions & Doctor's Guidance
                      <textarea
                        maxLength="1000"
                        value={medicine.specialInstructions}
                        onChange={(event) =>
                          updateMedicine(index, 'specialInstructions', event.target.value)
                        }
                        className="form-input min-h-16"
                        placeholder="e.g. Take with plenty of water. Do not skip doses."
                      />
                    </label>

                    {/* Live Preview Card */}
                    <div className="sm:col-span-2 lg:col-span-3 mt-2 rounded-2xl border border-brand-200/90 bg-gradient-to-r from-brand-50/50 via-white to-emerald-50/40 p-4">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-brand-800">
                        <Pill className="h-4 w-4" />
                        <span>Live Patient Dashboard Card Preview</span>
                      </div>
                      <div className="flex items-center gap-4 bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
                        <img
                          src={medicine.imageUrl}
                          alt="Medicine visual"
                          className="h-16 w-16 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 truncate">
                            {medicine.medicineName || 'Medicine Name'}
                          </h4>
                          <p className="text-xs text-brand-700 font-semibold">
                            Dosage: {medicine.dosage || '1'} {medicine.dosageUnit} · {medicine.frequency}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Food: {medicine.foodInstruction.replace('_', ' ')} · Times: {medicine.times}
                          </p>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <MessageCircle className="h-3 w-3" /> WhatsApp Ready
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>
              ))}
            </div>

            {message && (
              <p
                role="status"
                className={`text-sm sm:col-span-2 p-3 rounded-xl border ${
                  message.includes('created')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex flex-wrap gap-3 sm:col-span-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    medications: [...current.medications, newMedicine()]
                  }))
                }
                className="secondary-btn"
              >
                <Plus className="h-4 w-4" /> Add another medicine
              </button>
              <button
                disabled={!verified || !patients.length || saving}
                className="primary-btn disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Create prescription & Activate reminders'}
              </button>
            </div>
            {!patients.length && (
              <p className="text-xs text-slate-500 sm:col-span-2">
                An approved patient connection is required before prescribing.
              </p>
            )}
          </form>
        </Panel>

        {/* Prescription History Panel */}
        <Panel
          className="mt-6"
          title="Prescription history"
          subtitle="Versioned record of every prescription you have issued."
          icon={History}
        >
          <div className="mt-1 space-y-3">
            {prescriptions.map((prescription) => (
              <article
                key={prescription.id}
                className="vital-rail rounded-2xl border border-slate-200/80 bg-white/75 p-4 transition-shadow hover:shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {prescription.diagnosis || 'Prescription'} ·{' '}
                      {prescription.medications?.map((item) => item.medicineName).join(', ')}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {prescription.medications?.length || 0} medicines ·{' '}
                      {new Date(prescription.prescribedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={prescription.status} />
                    <button
                      type="button"
                      onClick={() => toggleVersions(prescription.id)}
                      className="secondary-btn min-h-9 px-3"
                    >
                      {expanded === prescription.id ? 'Hide history' : 'Version history'}
                    </button>
                    {prescription.status !== 'DISCONTINUED' && (
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            prescription,
                            prescription.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED'
                          )
                        }
                        className="secondary-btn min-h-9 px-3"
                      >
                        {prescription.status === 'COMPLETED' ? 'Reopen' : 'Mark completed'}
                      </button>
                    )}
                  </div>
                </div>
                {expanded === prescription.id && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                    {(versions[prescription.id] || []).map((version) => (
                      <div
                        key={version.id}
                        className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600"
                      >
                        <strong>Version {version.version}</strong> · {version.changeType} ·{' '}
                        {new Date(version.createdAt).toLocaleString()}
                        <p className="mt-1">{version.reason}</p>
                      </div>
                    ))}
                    {!versions[prescription.id]?.length && (
                      <p className="text-sm text-slate-500">No versions available.</p>
                    )}
                  </div>
                )}
              </article>
            ))}
            {!prescriptions.length && (
              <EmptyState
                icon={FileText}
                title="No prescriptions yet"
                text="Issued prescriptions will appear here with their full version history."
              />
            )}
          </div>
        </Panel>
      </div>
    </main>
  );
}
