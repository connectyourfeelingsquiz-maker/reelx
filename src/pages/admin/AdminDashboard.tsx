// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Activity, CheckCircle, XCircle, Zap, Clock, ArrowRight } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getDashboardStats, getAllEvents } from '../../services/eventsService';
import { supabase } from '../../services/supabase';
import type { DashboardStats, SafetyEvent } from '../../types';
import { formatRelativeTime, formatDateTime } from '../../utils/tokenGenerator';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEventId, setNewEventId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statsData, eventsData] = await Promise.all([
        getDashboardStats(),
        getAllEvents(),
      ]);
      setStats(statsData);
      setRecentEvents(eventsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'safety_events' },
        (payload) => {
          const newEvent = payload.new as SafetyEvent;
          setNewEventId(newEvent.id);
          setRecentEvents((prev) => [newEvent, ...prev].slice(0, 5));
          setStats((prev) =>
            prev ? { ...prev, totalEvents: prev.totalEvents + 1 } : prev
          );
          setTimeout(() => setNewEventId(null), 2000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="page-loading"><div className="spinner" /> Loading dashboard…</div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: 'Total Links', value: stats?.totalLinks ?? 0, icon: <Link2 size={22} />, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { label: 'Active Links', value: stats?.activeLinks ?? 0, icon: <CheckCircle size={22} />, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    { label: 'Disabled Links', value: stats?.disabledLinks ?? 0, icon: <XCircle size={22} />, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    { label: 'Safety Events', value: stats?.totalEvents ?? 0, icon: <Activity size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your safety network">
      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="card">
        <div className="card-header">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} color="var(--color-warning)" />
            Recent Safety Events
          </div>
          <Link to="/admin/events" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1rem' }}>
            <Activity size={40} />
            <h3>No events yet</h3>
            <p>Safety events will appear here when trusted contacts share their location.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Link</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Device</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={event.id} className={event.id === newEventId ? 'new-event-flash' : ''}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
                        {event.safety_links?.name ?? 'Unknown Link'}
                      </span>
                    </td>
                    <td className="td-muted">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Clock size={13} />
                        {formatRelativeTime(event.created_at)}
                      </div>
                    </td>
                    <td className="td-muted">
                      {event.latitude && event.longitude
                        ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="td-muted">{event.device_type ?? '—'} · {event.browser ?? '—'}</td>
                    <td>
                      <Link to={`/admin/events/${event.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="section-title" style={{ marginBottom: '1rem' }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/links" className="btn btn-primary">
            <Link2 size={16} /> Manage Safety Links
          </Link>
          <Link to="/admin/events" className="btn btn-ghost">
            <Activity size={16} /> View All Events
          </Link>
        </div>
      </div>

      {/* Last updated */}
      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <div className="realtime-dot" style={{ width: 6, height: 6 }} />
        Dashboard updates in real-time · Last loaded {formatDateTime(new Date().toISOString())}
      </p>
    </AdminLayout>
  );
}
