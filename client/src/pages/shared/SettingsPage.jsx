import { useState } from 'react';
import { BellRing, Check, ShieldCheck, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import StatusPill from '../../components/ui/StatusPill';

const PERMISSION_TONE = {
  granted: 'chip-stable',
  denied: 'chip-critical',
  default: 'chip-caution',
  unsupported: 'chip-neutral'
};

export default function SettingsPage() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('info');

  const requestPermission = async () => {
    setMessage('');
    if (!supported) {
      setTone('caution');
      setMessage('This browser does not support notifications. In-app reminders remain available.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setTone('stable');
        setMessage('Browser notifications enabled for this browser.');
      } else {
        setTone('caution');
        setMessage('Permission was not granted. You can still see reminders in MEDICO.');
      }
    } catch {
      setTone('critical');
      setMessage('Could not request notification permission.');
    }
  };

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Preferences"
          title="Settings"
          description="Control browser notifications for medication reminders and care updates."
          icon={BellRing}
        />

        <Panel
          title="Browser notifications"
          subtitle={`Current status: ${permission}`}
          icon={BellRing}
          action={<StatusPill status={permission.toUpperCase()} label={permission === 'granted' ? 'Enabled' : 'Not enabled'} tone={PERMISSION_TONE[permission]} />}
        >
          <p className="text-sm leading-6 text-slate-500">
            Allow notifications to receive reminders while MEDICO is open. The reminder schedule is stored on the server; closing this browser does not automatically
            mark doses as missed.
          </p>

          <button
            type="button"
            onClick={requestPermission}
            disabled={permission === 'granted'}
            className="primary-btn mt-5 disabled:opacity-50"
          >
            {permission === 'granted' ? (
              <>
                <Check className="h-4 w-4" /> Enabled
              </>
            ) : (
              <>
                <BellRing className="h-4 w-4" /> Enable notifications
              </>
            )}
          </button>

          {message && (
            <p
              role="status"
              className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                tone === 'stable'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : tone === 'critical'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{message}</span>
            </p>
          )}

          <p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Browser notification permission is specific to this device and browser. In-app notifications are still available if permission is declined.
          </p>
        </Panel>
      </div>
    </main>
  );
}
