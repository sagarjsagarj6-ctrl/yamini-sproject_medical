import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, LockKeyhole, Mail, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MedicoLogo from '../../components/ui/MedicoLogo';
import api from '../../services/api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [demoAccounts, setDemoAccounts] = useState(null);
  const [signingIn, setSigningIn] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let active = true;
    let attempt = 0;
    let retryTimer;
    const checkDemo = async () => {
      try {
        const { data } = await api.get('/demo/status');
        if (!active) return;
        if (data.enabled) setDemoAccounts(data.accounts);
        else if (attempt < 6) retryTimer = window.setTimeout(checkDemo, 1200);
      } catch {
        if (active && attempt < 6) retryTimer = window.setTimeout(checkDemo, 1200);
      }
      attempt += 1;
    };
    void checkDemo();
    return () => { active = false; window.clearTimeout(retryTimer); };
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const signIn = async (credentials) => {
    setError('');
    setSigningIn(true);
    try {
      const res = await login(credentials);
      if (res.user.role === 'DOCTOR') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn(form);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-5xl">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-700"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
        <div className="grid overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-clinical-lg backdrop-blur md:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-console-panel p-10 text-white md:flex md:min-h-[580px] md:flex-col md:justify-between lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-14 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-1/3 opacity-[.16]" aria-hidden="true">
            <div className="ecg-trace ecg-trace-light" />
          </div>

          <div className="relative">
            <MedicoLogo size="lg" tone="light" showWordmark={false} to={null} />
            <p className="relative mt-10 text-xs font-bold uppercase tracking-[0.2em] text-brand-300">MEDICO clinical console</p>
            <h1 className="relative mt-4 max-w-sm text-4xl font-semibold leading-tight tracking-[-.04em]">A clearer way to stay connected to care.</h1>
            <p className="relative mt-4 max-w-sm text-sm leading-6 text-slate-300">Dose schedules, recovery assessments, appointments and care-team updates — structured in one clinical workspace.</p>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/[.05] p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-brand-300" />
              <span className="font-semibold">Your care, in one place</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">Access treatment details and updates from the people involved in your care.</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
              <span className="live-dot" aria-hidden="true" /> Secure session
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-10 md:p-12 lg:p-14">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-900">Log in to MEDICO</h2>
            <p className="mt-2 text-sm text-slate-500">Enter your details to continue to your care space.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" required className="form-input pl-10" placeholder="name@example.com" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input type="password" name="password" value={form.password} onChange={handleChange} autoComplete="current-password" required className="form-input pl-10" placeholder="Enter your password" />
              </div>
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={signingIn} className="primary-btn min-h-12 w-full disabled:opacity-60">{signingIn ? 'Signing in…' : 'Log in'}</button>
          </form>

          {demoAccounts && <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4" aria-label="Presentation demo accounts">
            <p className="text-sm font-semibold text-slate-800">Presentation demo</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Open a prefilled workflow with synthetic sample data. Five additional patient and doctor cases are available below.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" disabled={signingIn} onClick={() => signIn(demoAccounts.patient)} className="secondary-btn min-h-10 justify-center disabled:opacity-60"><Play className="h-3.5 w-3.5" /> Patient demo</button>
              <button type="button" disabled={signingIn} onClick={() => signIn(demoAccounts.doctor)} className="secondary-btn min-h-10 justify-center disabled:opacity-60"><Play className="h-3.5 w-3.5" /> Doctor demo</button>
            </div>
            <details className="mt-3 rounded-xl border border-emerald-100 bg-white/70 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-brand-800">Open another demo case</summary>
              <div className="mt-3 space-y-3">
                <div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Patients</p><div className="grid gap-2 sm:grid-cols-2">{(demoAccounts.patients || []).slice(1).map((account) => <button key={account.email} type="button" disabled={signingIn} onClick={() => signIn(account)} className="secondary-btn min-h-9 justify-center text-xs disabled:opacity-60">{account.name}</button>)}</div></div>
                <div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Doctors</p><div className="grid gap-2 sm:grid-cols-2">{(demoAccounts.doctors || []).slice(1).map((account) => <button key={account.email} type="button" disabled={signingIn} onClick={() => signIn(account)} className="secondary-btn min-h-9 justify-center text-xs disabled:opacity-60">{account.name}</button>)}</div></div>
              </div>
            </details>
          </section>}

          <div className="mt-6 text-center text-sm text-slate-600">
            New to MEDICO? <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Create an account</Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
