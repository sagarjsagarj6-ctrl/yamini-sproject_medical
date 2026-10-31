import { useEffect, useMemo, useState } from 'react';
import { Search, Stethoscope, MapPin, Star, UserPlus, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';
import StatusPill from '../../components/ui/StatusPill';

export default function DoctorSearchPage() {
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    api.get('/doctors')
      .then((res) => setDoctors(res.data.doctors || []))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredDoctors = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return doctors;

    return doctors.filter((doctor) => {
      const searchable = [
        doctor.name,
        doctor.specialization,
        doctor.hospitalName,
        doctor.hospitalLocation,
        doctor.designation
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [doctors, query]);

  const requestDoctor = async (doctorId) => {
    setPending(doctorId);
    try {
      await api.post('/connections/request', { doctorId, connectionMethod: 'DOCTOR_SEARCH' });
      setStatus({ message: 'Connection request sent successfully.', success: true });
    } catch (error) {
      setStatus({ message: error.response?.data?.message || 'Could not send the request.', success: false });
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Your care team"
          title="Find a doctor"
          description="Search verified doctors by name, specialization, hospital or location, then send a connection request for approval."
          icon={Stethoscope}
          meta={
            <span className="chip chip-info">
              <span className="live-dot" aria-hidden="true" />
              {loading ? 'Syncing directory' : `${doctors.length} verified ${doctors.length === 1 ? 'doctor' : 'doctors'}`}
            </span>
          }
        />

        <Panel className="mb-8">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by doctor, specialization, hospital, or location"
              className="form-input pl-11"
            />
          </div>

          {status && (
            <div
              role="status"
              className={`mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                status.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {status.success ? <ShieldCheck className="h-4 w-4 shrink-0" /> : null}
              {status.message}
            </div>
          )}
        </Panel>

        <div className="stagger-grid grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            [0, 1, 2].map((key) => (
              <div key={key} className="surface-card rounded-[26px] p-5">
                <div className="flex items-center gap-4">
                  <div className="skeleton h-14 w-14 rounded-2xl" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32" />
                    <div className="skeleton mt-2 h-3 w-24" />
                  </div>
                </div>
                <div className="skeleton mt-5 h-3 w-full" />
                <div className="skeleton mt-2 h-3 w-4/5" />
                <div className="skeleton mt-5 h-10 w-full rounded-2xl" />
              </div>
            ))
          ) : filteredDoctors.length ? (
            filteredDoctors.map((doctor) => (
              <article key={doctor.id} className="surface-card hover-lift flex flex-col rounded-[26px] p-5">
                <div className="flex items-center gap-4">
                  {doctor.profileImage ? (
                    <img src={doctor.profileImage} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-100" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-semibold text-white"
                    >
                      {doctor.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'MD'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{doctor.name}</p>
                    <p className="truncate text-sm text-brand-700">{doctor.specialization || 'General physician'}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    <span className="truncate">{doctor.designation || 'Consultant'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    <span className="truncate">{doctor.hospitalLocation || 'Location not added'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    <span>{doctor.experience ? `${doctor.experience} years experience` : 'Experience not listed'}</span>
                  </div>
                </div>

                <div className="vital-rail mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-600">
                  {doctor.hospitalName || 'Practice details not added'}
                  {doctor.medicalRegistrationNumber ? ` · ${doctor.medicalRegistrationNumber}` : ''}
                </div>

                {doctor.medicalRegistrationNumber && (
                  <div className="mt-3">
                    <StatusPill status="APPROVED" label="Verified registration" />
                  </div>
                )}

                <button
                  onClick={() => requestDoctor(doctor.id)}
                  disabled={pending === doctor.id}
                  className="primary-btn mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  {pending === doctor.id ? 'Sending request…' : 'Request connection'}
                </button>
              </article>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                icon={Search}
                title="No doctors match your search"
                text="Try a different name, specialization, hospital or location, or clear the search to view the full directory."
                action={
                  query ? (
                    <button onClick={() => setQuery('')} className="secondary-btn">
                      Clear search
                    </button>
                  ) : null
                }
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
