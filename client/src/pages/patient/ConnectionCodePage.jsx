import { useState } from 'react';
import { KeyRound, ShieldCheck, Info, Send } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';

export default function ConnectionCodePage() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/connections/request-by-code', { code });
      setMessage('Your request has been submitted and is awaiting doctor approval.');
      setSuccess(true);
      setCode('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'The connection code was invalid.');
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Connect with your care team"
          title="Enter a connection code"
          description="Doctors share a one-time code with you. Submit it here to request an approved patient–doctor connection."
          icon={KeyRound}
        />

        <Panel
          title="Connection code"
          subtitle="Codes are case-insensitive and may contain dashes."
          icon={KeyRound}
          action={
            <span className="chip chip-stable">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Approval required
            </span>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="connection-code" className="text-sm font-medium text-slate-700">
                Enter doctor connection code
              </label>
              <input
                id="connection-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. DOC-7C8A-21"
                className="form-input mt-2 font-mono uppercase tracking-[0.2em]"
                required
                autoCapitalize="characters"
                autoComplete="off"
              />
            </div>

            {message && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                  success
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {success ? (
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>{message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              Verified doctors only can approve new connections.
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="primary-btn min-h-11 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {submitting ? 'Submitting…' : 'Submit code'}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </main>
  );
}
