import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Pill,
  Search,
  Settings,
  ShieldAlert,
  UserRound,
  UsersRound,
  X
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MedicoLogo from './ui/MedicoLogo';

/**
 * MEDICO clinical console shell.
 * A deep surgical-navy rail with vitals-coded navigation, an ECG divider
 * and a glass vitals topbar — the frame every clinical workspace sits in.
 */
export default function PortalLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const seenNotificationIds = useRef(null);

  const isDoctor = user?.role === 'DOCTOR';
  const dashboardPath = isDoctor ? '/doctor/dashboard' : '/patient/dashboard';

  const navGroups = isDoctor
    ? [
      {
        label: 'Clinical',
        items: [
          { label: 'Dashboard', icon: LayoutDashboard, to: '/doctor/dashboard' },
          { label: 'Patient queue', icon: ClipboardList, to: '/doctor/patient-queue' },
          { label: 'My patients', icon: UsersRound, to: '/doctor/patients' }
        ]
      },
      {
        label: 'Treatment',
        items: [
          { label: 'Appointments', icon: CalendarDays, to: '/doctor/appointments' },
          { label: 'Assign medication', icon: Pill, to: '/doctor/prescriptions' },
          { label: 'Medicine database', icon: BookOpen, to: '/doctor/medicines' }
        ]
      },
      {
        label: 'Intelligence',
        items: [
          { label: 'Analytics', icon: BarChart3, to: '/doctor/analytics' },
          { label: 'AI insights', icon: MessageSquareText, to: '/doctor/insights' }
        ]
      },
      {
        label: 'Account',
        items: [
          { label: 'Profile', icon: UserRound, to: '/profile' },
          { label: 'Settings', icon: Settings, to: '/settings' },
          { label: 'Notifications', icon: Bell, to: '/notifications' }
        ]
      }
    ]
    : [
      {
        label: 'Clinical',
        items: [
          { label: 'Dashboard', icon: Activity, to: '/patient/dashboard' },
          { label: 'My medicines', icon: Pill, to: '/patient/medicines' },
          { label: 'Appointments', icon: CalendarDays, to: '/patient/appointments' }
        ]
      },
      {
        label: 'Care network',
        items: [
          { label: 'Find a doctor', icon: Search, to: '/patient/search-doctors' },
          { label: 'Connection code', icon: KeyRound, to: '/patient/connection-code' },
          { label: 'Medical history', icon: BookOpen, to: '/patient/history' }
        ]
      },
      {
        label: 'Intelligence',
        items: [
          { label: 'Analytics', icon: BarChart3, to: '/patient/analytics' },
          { label: 'AI explanations', icon: MessageSquareText, to: '/patient/ai-insights' }
        ]
      },
      {
        label: 'Account',
        items: [
          { label: 'Emergency info', icon: ShieldAlert, to: '/patient/emergency' },
          { label: 'Profile', icon: UserRound, to: '/profile' },
          { label: 'Settings', icon: Settings, to: '/settings' },
          { label: 'Notifications', icon: Bell, to: '/notifications' }
        ]
      }
    ];

  const visibleNavItems = !isDoctor && location.pathname === '/patient/dashboard'
    ? navGroups.flatMap((group) => group.items).filter((item) => item.to !== '/patient/search-doctors')
    : navGroups.flatMap((group) => group.items);

  useEffect(() => {
    let active = true;
    const pollNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        if (!active) return;
        const items = response.data.notifications || [];
        setUnreadNotifications(items.filter((item) => !item.read).length);
        const currentIds = new Set(items.map((item) => item.id));
        if (seenNotificationIds.current && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          for (const item of items) if (!seenNotificationIds.current.has(item.id)) new Notification(item.title, { body: item.message, tag: item.id });
        }
        seenNotificationIds.current = currentIds;
      } catch { if (active) setUnreadNotifications(0); }
    };
    pollNotifications();
    const timer = window.setInterval(pollNotifications, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderLinks = (mobile = false) => navGroups.map((group) => {
    const items = !isDoctor && location.pathname === '/patient/dashboard'
      ? group.items.filter((item) => item.to !== '/patient/search-doctors')
      : group.items;
    if (!items.length) return null;

    return (
      <div key={group.label} className="mb-5">
        {(mobile || !sidebarCollapsed) && (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400/70">{group.label}</p>
        )}
        <div className="space-y-1">
          {items.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={mobile ? () => setMobileNavOpen(false) : undefined}
                title={!mobile && sidebarCollapsed ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  active
                    ? 'bg-white/[.09] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]'
                    : 'text-slate-300/85 hover:bg-white/[.05] hover:text-white'
                } ${!mobile && sidebarCollapsed ? 'justify-center px-2' : ''}`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-400 shadow-[0_0_12px_rgba(60,201,182,.85)]" />
                )}
                <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${active ? 'text-brand-300' : 'text-slate-400 group-hover:text-brand-300'}`} />
                {(mobile || !sidebarCollapsed) && <span className="flex-1 truncate">{label}</span>}
                {active && (mobile || !sidebarCollapsed) && (
                  <span className="live-dot shrink-0" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  });

  const initials = user?.name?.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || (isDoctor ? 'DR' : 'PT');
  const currentLabel = visibleNavItems.find((item) => item.to.split('?')[0] === location.pathname)?.label
    || (isDoctor ? 'Doctor console' : 'Patient console');

  return (
    <div className="app-grid flex min-h-screen bg-transparent">
      {/* ---------- Desktop console rail ---------- */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-console-panel text-white shadow-console transition-[width] duration-300 ease-out md:flex ${
          sidebarCollapsed ? 'w-[84px] px-3 py-5' : 'w-[272px] px-4 py-6'
        }`}
      >
        {/* ECG texture */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden opacity-[.16]" aria-hidden="true">
          <div className="ecg-trace ecg-trace-light" />
        </div>

        <div className={`relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <MedicoLogo
            size={sidebarCollapsed ? 'sm' : 'md'}
            tone="light"
            showWordmark={!sidebarCollapsed}
            subtitle={isDoctor ? 'Doctor console' : 'Patient console'}
            to={dashboardPath}
          />
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(true)}
              className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-white/[.07] hover:text-white"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="relative mt-6 self-center rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-white/[.07] hover:text-white"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <nav aria-label="Main navigation" className="clinical-scroll relative mt-7 min-h-0 flex-1 overflow-y-auto pr-1">
          {renderLinks()}
        </nav>

        {!sidebarCollapsed && (
          <div className="relative mt-auto overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.04] p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-glow">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-console-900 bg-emerald-400" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{user?.name || (isDoctor ? 'Doctor' : 'Patient')}</span>
                <span className="block truncate text-xs text-slate-400">{isDoctor ? user?.specialization || 'Care team' : 'Patient account'}</span>
              </span>
            </div>
            <div className="mt-3 h-px bg-white/[.07]" />
            <p className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <span className="live-dot" aria-hidden="true" />
              Secure session · {isDoctor ? 'clinician' : 'patient'}
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Log out' : undefined}
          className={`relative mt-3 flex w-full items-center gap-3 rounded-xl border border-white/[.08] px-3 py-2.5 text-sm text-slate-300 transition-all duration-200 hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && 'Log out'}
        </button>
      </aside>

      {/* ---------- Mobile console drawer ---------- */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-console-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
          role="presentation"
        >
          <aside
            className="flex h-full w-[min(20rem,88vw)] flex-col bg-console-panel px-4 py-5 text-white shadow-console animate-rise"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex items-center justify-between">
              <MedicoLogo size="sm" tone="light" showWordmark subtitle={isDoctor ? 'Doctor console' : 'Patient console'} to={dashboardPath} />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[.07] hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="ecg-trace ecg-trace-light relative mt-4 opacity-25" aria-hidden="true" />

            <nav aria-label="Main navigation" className="clinical-scroll mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              {renderLinks(true)}
            </nav>

            <div className="mt-4 rounded-2xl border border-white/[.08] bg-white/[.04] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">{initials}</span>
                <span className="min-w-0 truncate text-sm font-semibold">{user?.name || (isDoctor ? 'Doctor' : 'Patient')}</span>
              </div>
              <button onClick={handleLogout} className="mt-4 flex items-center gap-2 text-sm text-slate-300 transition hover:text-rose-200">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ---------- Main column ---------- */}
      <div className="relative min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6 md:px-8">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-all duration-200 hover:border-brand-200 hover:text-brand-700 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          {location.pathname !== dashboardPath && (
            <Link
              to={dashboardPath}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}

          <div className="min-w-0">
            <p className="eyebrow truncate">MEDICO console</p>
            <p className="truncate text-sm font-semibold text-slate-800">{currentLabel}</p>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 lg:inline-flex">
              <span className="live-dot" aria-hidden="true" />
              Live sync
            </span>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white shadow-glow">
              {initials}
            </span>
            <span className="hidden max-w-40 truncate text-sm text-slate-600 sm:block">{user?.name}</span>

            <Link
              to="/notifications"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
              title="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_0_2px_white]">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </header>

        <div key={location.pathname} className="route-enter min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
