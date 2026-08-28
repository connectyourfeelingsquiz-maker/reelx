// src/pages/admin/AdminEventDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, MapPin } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getEventById } from '../../services/eventsService';
import { LocationMap, MapPlaceholder } from '../../components/LocationMap';
import type { SafetyEvent } from '../../types';
import { formatDateTime } from '../../utils/tokenGenerator';

export function AdminEventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SafetyEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEventById(id)
      .then(setEvent)
      .catch(() => setError('Failed to load event.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout title="Event Details"><div className="page-loading"><div className="spinner" /> Loading…</div></AdminLayout>;
  if (error || !event) {
    return (
      <AdminLayout title="Event Details">
        <div className="alert alert-error"><AlertCircle size={16} /> {error ?? 'Event not found.'}</div>
        <Link to="/admin/events" className="btn btn-ghost" style={{ marginTop: '1rem' }}><ArrowLeft size={14} /> Back</Link>
      </AdminLayout>
    );
  }

  const netInfo = event.network_information;

  return (
    <AdminLayout title="Event Details" subtitle={formatDateTime(event.created_at)}>
      <Link to="/admin/events" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to Events
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Main event info */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Event Information</h3>
          <div className="info-row">
            <span className="info-label">Safety Link</span>
            <Link to={`/admin/links/${event.link_id}`} style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
              {event.safety_links?.name ?? event.link_id.substring(0, 8) + '…'}
            </Link>
          </div>
          <div className="info-row">
            <span className="info-label">Timestamp</span>
            <span className="info-value">{formatDateTime(event.created_at)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Permission</span>
            <span className="info-value">{event.permission_status}</span>
          </div>

          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.75rem' }}>Location</p>
          </div>

          {event.latitude && event.longitude ? (
            <>
              <div className="info-row">
                <span className="info-label">Latitude</span>
                <span className="info-value" style={{ fontFamily: 'monospace' }}>{event.latitude.toFixed(7)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Longitude</span>
                <span className="info-value" style={{ fontFamily: 'monospace' }}>{event.longitude.toFixed(7)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Accuracy</span>
                <span className="info-value">{event.accuracy ? `±${Math.round(event.accuracy)} meters` : 'Accuracy unavailable'}</span>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', gap: '0.5rem' }}
                >
                  <MapPin size={14} /> Open in Google Maps
                </a>
              </div>
            </>
          ) : (
            <div className="alert alert-info">Location data was not collected (permission denied or unavailable).</div>
          )}

          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.75rem' }}>Device</p>
          </div>

          <div className="info-row">
            <span className="info-label">Device Type</span>
            <span className="info-value">{event.device_type ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Browser</span>
            <span className="info-value">{event.browser ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">OS</span>
            <span className="info-value">{event.operating_system ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Battery</span>
            <span className="info-value">
              {event.battery_level !== null && event.battery_level !== undefined
                ? `${Math.round(event.battery_level * 100)}%`
                : '—'}
            </span>
          </div>

          {netInfo && (
            <>
              <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.75rem' }}>Network</p>
              </div>
              {typeof netInfo.effectiveType === 'string' && (
                <div className="info-row">
                  <span className="info-label">Connection</span>
                  <span className="info-value">{netInfo.effectiveType}</span>
                </div>
              )}
              {typeof netInfo.downlink === 'number' && (
                <div className="info-row">
                  <span className="info-label">Downlink</span>
                  <span className="info-value">{netInfo.downlink} Mbps</span>
                </div>
              )}
            </>
          )}

          {event.user_agent && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.5rem' }}>User Agent</p>
              <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                {event.user_agent}
              </p>
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {event.latitude && event.longitude ? (
            <>
              <LocationMap
                latitude={event.latitude}
                longitude={event.longitude}
                accuracy={event.accuracy}
                label={`Safety event – ${formatDateTime(event.created_at)}`}
              />
              <a
                href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', gap: '0.5rem', alignSelf: 'center' }}
              >
                <MapPin size={16} /> Open in Google Maps
              </a>
            </>
          ) : (
            <MapPlaceholder message="No location data for this event" />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
