import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ClipboardList,
  HeartPulse,
  LineChart,
  MessageSquareText,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MedicoLogo from '../../components/ui/MedicoLogo';

const features = [
  {
    icon: Pill,
    tone: 'brand',
    title: 'Medication adherence',
    text: 'Every dose has a time, a status and a history — so patients and prescribers see the same picture.'
  },
  {
    icon: UsersRound,
    tone: 'info',
    title: 'Doctor–patient linkage',
    text: 'A verified connection code binds a care team together, with clear roles on both sides.'
  },
  {
    icon: LineChart,
    tone: 'stable',
    title: 'Recovery tracking',
    text: 'Clinical recovery assessments stay separate from adherence, so progress is judged correctly.'
  },
  {
    icon: Sparkles,
    tone: 'ai',
    title: 'AI-assisted summaries',
    text: 'Authorized care records can be summarised for review — with consent, and never a diagnosis.'
  }
];

const steps = [
  {
    icon: ClipboardList,
    number: '01',
    title: 'Set up a profile',
    text: 'Register as a patient or a doctor and complete your clinical profile.'
  },
  {
    icon: UsersRound,
    number: '02',
    title: 'Connect your care team',
    text: 'Share a connection code or search for an available doctor to link up.'
  },
  {
    icon: Activity,
    number: '03',
    title: 'Track the journey',
    text: 'Follow doses, appointments and recovery assessments from one clinical console.'
  }
];

const toneStyles = {
  brand: 'border-brand-100 bg-brand-50 text-brand-700',
  info: 'border-sky-100 bg-sky-50 text-sky-700',
  stable: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  ai: 'border-violet-100 bg-violet-50 text-violet-700'
};

export default function LandingPage() {
  return (
    <div className="app-grid min-h-screen overflow-hidden bg-transparent text-slate-900">
      {/* ---------- Header ---------- */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <MedicoLogo size="md" subtitle="Clinical console" />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Main navigation">
          <a className="transition-colors duration-200 hover:text-brand-700" href="#care-tools">Care tools</a>
          <a className="transition-colors duration-200 hover:text-brand-700" href="#how-it-works">How it works</a>
          <a className="transition-colors duration-200 hover:text-brand-700" href="#roles">Who it’s for</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-white sm:inline-flex">Log in</Link>
          <Link to="/register" className="primary-btn">Get started <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 md:pb-28 md:pt-16 lg:grid-cols-[.95fr_1.05fr] lg:gap-10 lg:px-10 lg:pt-20">
          <div className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full bg-brand-200/25 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />

          <div className="relative z-[1] max-w-2xl">
            <div className="mb-6 inline-flex animate-rise items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-brand-800 shadow-clinical backdrop-blur">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50">
                <HeartPulse className="h-3 w-3 animate-heartbeat" />
              </span>
              Built for real clinical workflows
            </div>

            <h1 className="max-w-xl text-[2.75rem] font-semibold leading-[1.06] tracking-[-.055em] text-slate-900 sm:text-6xl lg:text-[4.15rem]">
              Every dose.{' '}
              <span className="relative inline-block">
                <span className="relative z-[1] text-brand-700">Every vital.</span>
                <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded bg-brand-200/50" aria-hidden="true" />
              </span>{' '}
              One console.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              MEDICO is a clinical care platform that keeps medication adherence, recovery tracking,
              appointments and doctor–patient updates in one structured workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="primary-btn min-h-12 px-5">Create your account <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/register?role=doctor" className="secondary-btn min-h-12 px-5"><Stethoscope className="h-4 w-4" /> I’m a doctor</Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-700" /> Role-separated workspaces</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-700" /> Consent-gated AI summaries</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-brand-700" /> Metrics from real records</span>
            </div>
          </div>

          {/* Clinical monitor mock */}
          <div className="relative mx-auto w-full max-w-[600px] lg:ml-auto">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-300/25 blur-3xl" />
            <div className="animate-float relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-3 shadow-clinical-lg backdrop-blur-xl sm:p-5">
              <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white">
                {/* monitor header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-console-panel px-5 py-4 sm:px-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                      <HeartPulse className="h-5 w-5 animate-heartbeat" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Clinical console</p>
                      <p className="text-xs text-slate-400">Live patient workspace</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-brand-200">
                    <span className="live-dot" aria-hidden="true" /> Monitoring
                  </span>
                </div>

                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow">Today’s care plan</p>
                      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">One step at a time</h2>
                    </div>
                    <span className="rounded-2xl border border-brand-100 bg-brand-50 p-3 text-brand-700"><CalendarDays className="h-5 w-5" /></span>
                  </div>

                  {/* ECG trace */}
                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 px-3 pt-2">
                    <div className="ecg-trace" />
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="hover-lift flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 sm:p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm"><Pill className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">Dose reminder · 08:00</p>
                        <p className="mt-0.5 text-xs text-slate-500">A clear nudge at the right time</p>
                      </div>
                      <span className="chip chip-stable">Taken</span>
                    </div>
                    <div className="hover-lift flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 sm:p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm"><UsersRound className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">Care team update</p>
                        <p className="mt-0.5 text-xs text-slate-500">Shared in one secure place</p>
                      </div>
                      <span className="chip chip-info">Active</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                      <ShieldCheck className="h-4 w-4" /> Care, kept in view
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      Reminders and clinical progress sit side by side — without mixing adherence with recovery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 right-5 hidden animate-float items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 shadow-clinical sm:flex" style={{ animationDelay: '1.2s' }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Bell className="h-4 w-4" /></span>
              <div>
                <p className="text-xs font-semibold text-slate-800">Reminders on time</p>
                <p className="text-[11px] text-slate-500">A little more clarity, every day</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Vital strip ---------- */}
        <section className="border-y border-slate-200/70 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl gap-px bg-slate-200/70 px-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Activity, label: 'Adherence tracking', value: 'Dose-level', text: 'Taken, missed and late doses recorded per prescription.' },
              { icon: MessageSquareText, label: 'AI summaries', value: 'Consent-gated', text: 'Authorized records only, always reviewed by a person.' },
              { icon: Stethoscope, label: 'Clinical roles', value: 'Separated', text: 'Doctor and patient workspaces never leak each other’s data.' },
              { icon: ShieldCheck, label: 'Data handling', value: 'Server-side', text: 'AI credentials and secrets stay on the server, never in the client.' }
            ].map(({ icon: Icon, label, value, text }) => (
              <div key={label} className="group bg-white/80 px-5 py-7 transition-colors duration-300 hover:bg-white sm:px-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-900">{label}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section id="care-tools" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="max-w-xl">
            <p className="eyebrow">Made for everyday care</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-slate-900 sm:text-4xl">
              The clinical details that keep care moving.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Not a generic tracker — a structured record of treatment, adherence and recovery.
            </p>
          </div>

          <div className="stagger-grid mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, tone, title, text }) => (
              <article key={title} className="surface-card hover-lift group rounded-[24px] p-6">
                <span className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${toneStyles[tone]} transition-transform duration-300 group-hover:scale-105`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how-it-works" className="border-y border-slate-200/70 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:py-24 lg:grid-cols-[.85fr_1.15fr] lg:px-10">
            <div>
              <p className="eyebrow">Simple by design</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-slate-900 sm:text-4xl">
                Start with what matters to you.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Three steps, and the platform does the bookkeeping for the rest of the care plan.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {steps.map(({ icon: Icon, number, title, text }) => (
                <div key={number} className="surface-card hover-lift rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="numeric text-xs font-bold tracking-[.16em] text-brand-700">{number}</span>
                  </div>
                  <h3 className="mt-5 text-sm font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Roles ---------- */}
        <section id="roles" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow">Two workspaces</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-slate-900 sm:text-4xl">
              One platform, purpose-built for each side of care.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="surface-card overflow-hidden rounded-[28px]">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-brand-50/60 px-6 py-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">For patients</h3>
                  <p className="text-xs text-slate-500">Your treatment, in plain view</p>
                </div>
              </div>
              <ul className="space-y-3 p-6">
                {['Dose-by-dose medication adherence log', 'Upcoming and past appointments', 'Medical history and clinical records', 'Recovery assessments from your doctor', 'Emergency information ready to share'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="px-6 pb-6">
                <Link to="/register" className="primary-btn w-full">Create a patient account <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>

            <article className="surface-card overflow-hidden rounded-[28px]">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-sky-50/60 px-6 py-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-[0_10px_30px_rgba(2,132,199,.24)]">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">For doctors</h3>
                  <p className="text-xs text-slate-500">Your clinical workload, organised</p>
                </div>
              </div>
              <ul className="space-y-3 p-6">
                {['Patient queue and connected-patient roster', 'Prescribe and monitor medication schedules', 'Medicine database for quick prescribing', 'Adherence and recovery analytics', 'Consent-gated AI insight summaries'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="px-6 pb-6">
                <Link to="/register?role=doctor" className="secondary-btn w-full">Register as a doctor <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="px-5 pb-12 sm:px-8 lg:px-10">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[30px] bg-console-panel px-6 py-12 text-white shadow-console sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute inset-0 opacity-[.14]" aria-hidden="true">
              <div className="ecg-trace ecg-trace-light" />
            </div>
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">A clearer care routine</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
                  Make your next clinical step a little easier.
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Join patients and care teams already using MEDICO to keep treatment structured and visible.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link to="/register" className="primary-btn min-h-12 px-5">Get started <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-slate-200/70 bg-white/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <MedicoLogo size="sm" />
          <p className="text-center sm:text-left">Clinical coordination, structured for both sides of care.</p>
          <Link to="/login" className="inline-flex items-center font-semibold text-slate-600 transition-colors duration-200 hover:text-brand-700">
            Log in <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
