import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Panel from '../../components/ui/Panel';
import EmptyState from '../../components/ui/EmptyState';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then((res) => setNotifications(res.data.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch (_error) {
      // Keep the displayed state unchanged if the update fails.
    }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <main className="p-5 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Notifications"
          title="Care updates"
          description="Reminders, care-plan changes and clinical updates from your connected care team."
          icon={Bell}
          meta={
            <span className="chip chip-info">
              <span className="live-dot" aria-hidden="true" />
              {loading ? 'Syncing' : unreadCount ? `${unreadCount} unread` : 'All read'}
            </span>
          }
        />

        <Panel
          title="Inbox"
          subtitle="Mark an update as read once you have reviewed it."
          icon={Bell}
          className="mb-6"
        >
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="surface-card rounded-[24px] p-5">
                  <div className="flex gap-4">
                    <div className="skeleton h-11 w-11 rounded-2xl" />
                    <div className="flex-1">
                      <div className="skeleton h-4 w-48" />
                      <div className="skeleton mt-2 h-3 w-full" />
                      <div className="skeleton mt-2 h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length ? (
            <div className="space-y-3">
              {notifications.map((item) => (
                <article
                  key={item.id}
                  className={`vital-rail rounded-[24px] border p-5 transition ${
                    item.read
                      ? 'border-slate-100 bg-white'
                      : 'border-brand-100 bg-brand-50/40'
                  }`}
                  style={{ '--rail': item.type === 'AI' ? 'var(--vital-info, #0284c7)' : 'var(--brand-600, #0a9187)' }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          item.type === 'AI'
                            ? 'border-violet-100 bg-violet-50 text-violet-700'
                            : 'border-brand-100 bg-brand-50 text-brand-700'
                        }`}
                      >
                        {item.type === 'AI' ? <Sparkles className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                          {!item.read && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                              <span className="live-dot" aria-hidden="true" />
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.message}</p>
                        <p className="mt-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {!item.read && (
                      <button onClick={() => markAsRead(item.id)} className="secondary-btn min-h-10 self-start">
                        <CheckCheck className="h-4 w-4" /> Mark read
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              text="Care updates will appear here when there's something new."
            />
          )}
        </Panel>
      </div>
    </main>
  );
}
