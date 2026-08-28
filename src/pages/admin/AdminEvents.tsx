// src/pages/admin/AdminEvents.tsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, Eye, MapPin } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getAllEvents } from '../../services/eventsService';
import { supabase } from '../../services/supabase';
import type { SafetyEvent } from '../../types';
import { formatDateTime, formatRelativeTime } from '../../utils/tokenGenerator';

export function AdminEvents() {
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('events-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'safety_events' },
        (payload) => {
          const evt = payload.new as SafetyEvent;
          setNewId(evt.id);
          setEvents((prev) => [evt, ...prev]);
          setTimeout(() => setNewId(null), 2500);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AdminLayout title="Safety Events" subtitle="All incoming safety events across all links">
      {loading ? (
        <div className="page-loading"><div className="spinner" /> Loading events…</div>
      ) : events.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Activity size={48} />
            <h3>No safety events yet</h3>
            <p>Events appear here when trusted contacts share their location through a safety link.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>All Events</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div className="realtime-dot" />
              <span>Live updates active</span>
            </div>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Accuracy</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className={event.id === newId ? 'new-event-flash' : ''}>
                    <td>
                      {event.safety_links ? (
                        <Link
                          to={`/admin/links/${event.link_id}`}
                          style={{ fontWeight: 600, color: 'var(--color-primary-light)', textDecoration: 'none' }}
                        >
                          {event.safety_links.name}
                        </Link>
                      ) : <span style={{ color: 'var(--text-muted)' }}>Unknown</span>}
                    </td>
                    <td className="td-muted">
                      <span title={formatDateTime(event.created_at)}>
                        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {formatRelativeTime(event.created_at)}
                      </span>
                    </td>
                    <td className="td-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {event.latitude && event.longitude
                        ? `${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)}`
                        : '—'}
                    </td>
                    <td className="td-muted">{event.accuracy ? `±${Math.round(event.accuracy)}m` : '—'}</td>
                    <td className="td-muted">{event.device_type ?? '—'}</td>
                    <td className="td-muted">{event.browser ?? '—'}</td>
                    <td className="td-muted">{event.operating_system ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link to={`/admin/events/${event.id}`} className="btn btn-ghost btn-sm">
                          <Eye size={13} /> View
                        </Link>
                        {event.latitude && event.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            title="Open in Google Maps"
                          >
                            <MapPin size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
