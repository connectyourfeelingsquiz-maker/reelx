// src/pages/admin/AdminLinkDetail.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, ToggleLeft, ToggleRight, Trash2, Activity, ArrowLeft, AlertCircle, MapPin } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { getLinkById, updateLinkStatus, deleteLink } from '../../services/linksService';
import { getEventsByLinkId } from '../../services/eventsService';
import { LocationMap, MapPlaceholder } from '../../components/LocationMap';
import type { SafetyLink, SafetyEvent } from '../../types';
import { formatDateTime, formatRelativeTime } from '../../utils/tokenGenerator';

const BASE_URL = window.location.origin;

export function AdminLinkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [link, setLink] = useState<SafetyLink | null>(null);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [linkData, eventsData] = await Promise.all([
        getLinkById(id),
        getEventsByLinkId(id),
      ]);
      setLink(linkData);
      setEvents(eventsData);
    } catch (err) {
      setError('Failed to load link details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(`${BASE_URL}/s/${link.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async () => {
    if (!link) return;
    setActionLoading(true);
    try {
      const newStatus = link.status === 'active' ? 'disabled' : 'active';
      await updateLinkStatus(link.id, newStatus);
      setLink({ ...link, status: newStatus });
    } catch {
      setError('Failed to update link status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!link) return;
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setActionLoading(true);
    try {
      await deleteLink(link.id);
      navigate('/admin/links');
    } catch {
      setError('Failed to delete link.');
      setActionLoading(false);
    }
  };

  if (loading) {
    return <AdminLayout title="Link Details"><div className="page-loading"><div className="spinner" /> Loading…</div></AdminLayout>;
  }
  if (error || !link) {
    return (
      <AdminLayout title="Link Details">
        <div className="alert alert-error"><AlertCircle size={18} /> {error ?? 'Link not found.'}</div>
        <Link to="/admin/links" className="btn btn-ghost" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Links
        </Link>
      </AdminLayout>
    );
  }

  const safetyUrl = `${BASE_URL}/s/${link.token}`;
  const latestEvent = events[0];

  return (
    <AdminLayout title={link.name} subtitle="Safety Link Details">
      <Link to="/admin/links" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to Links
      </Link>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Link Info */}
        <div className="card">
          <div className="card-header">
            <h3>Link Information</h3>
            <span className={`badge badge-${link.status}`}>{link.status}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Name</span>
            <span className="info-value" style={{ fontWeight: 600 }}>{link.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className="info-value">{link.status === 'active' ? '✅ Active' : '❌ Disabled'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Destination</span>
            <a href={link.destination_url} target="_blank" rel="noopener noreferrer" className="info-value" style={{ color: 'var(--color-primary-light)' }}>
              {link.destination_url.substring(0, 50)}{link.destination_url.length > 50 ? '…' : ''}
            </a>
          </div>
          <div className="info-row">
            <span className="info-label">Created</span>
            <span className="info-value">{formatDateTime(link.created_at)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Last Triggered</span>
            <span className="info-value">{link.last_triggered_at ? formatDateTime(link.last_triggered_at) : 'Never'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Total Events</span>
            <span className="info-value" style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>{events.length}</span>
          </div>

          {/* Safety URL */}
          <div style={{ marginTop: '1.25rem' }}>
            <p className="info-label" style={{ marginBottom: '0.5rem' }}>Safety URL</p>
            <div className="copy-url-box">
              <span className="copy-url-text">{safetyUrl}</span>
              <button className="btn btn-primary btn-sm" onClick={handleCopy} id="copy-safety-url">
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
              <a href={`/s/${link.token}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${link.status === 'active' ? 'btn-warning' : 'btn-success'}`}
              onClick={handleToggle}
              disabled={actionLoading}
            >
              {link.status === 'active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
              {link.status === 'active' ? 'Disable Link' : 'Enable Link'}
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              <Trash2 size={15} />
              {deleteConfirm ? 'Confirm Delete?' : 'Delete Link'}
            </button>
          </div>
        </div>

        {/* Latest Event & Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {latestEvent ? (
            <>
              <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Latest Event</h3>
                <div className="info-row">
                  <span className="info-label">Time</span>
                  <span className="info-value">{formatRelativeTime(latestEvent.created_at)}</span>
                </div>
                {latestEvent.latitude && (
                  <div className="info-row">
                    <span className="info-label">Coordinates</span>
                    <span className="info-value" style={{ fontFamily: 'monospace' }}>
                      {latestEvent.latitude.toFixed(6)}, {latestEvent.longitude?.toFixed(6)}
                    </span>
                  </div>
                )}
                {latestEvent.accuracy && (
                  <div className="info-row">
                    <span className="info-label">Accuracy</span>
                    <span className="info-value">±{Math.round(latestEvent.accuracy)} meters</span>
                  </div>
                )}
                {latestEvent.latitude && latestEvent.longitude && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a
                      href={`https://www.google.com/maps?q=${latestEvent.latitude},${latestEvent.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', gap: '0.5rem' }}
                    >
                      <MapPin size={14} /> Open in Google Maps
                    </a>
                  </div>
                )}
                {latestEvent.battery_level !== null && (
                  <div className="info-row">
                    <span className="info-label">Battery</span>
                    <span className="info-value">{Math.round((latestEvent.battery_level ?? 0) * 100)}%</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Device</span>
                  <span className="info-value">{latestEvent.device_type ?? '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Browser</span>
                  <span className="info-value">{latestEvent.browser ?? '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">OS</span>
                  <span className="info-value">{latestEvent.operating_system ?? '—'}</span>
                </div>
                <Link to={`/admin/events/${latestEvent.id}`} className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }}>
                  View Full Event <ExternalLink size={13} />
                </Link>
              </div>

              {latestEvent.latitude && latestEvent.longitude ? (
                <LocationMap
                  latitude={latestEvent.latitude}
                  longitude={latestEvent.longitude}
                  accuracy={latestEvent.accuracy}
                  label={`${link.name} - ${formatRelativeTime(latestEvent.created_at)}`}
                />
              ) : (
                <MapPlaceholder message="Location data not available for this event" />
              )}
            </>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ padding: '2rem' }}>
                <Activity size={36} />
                <h3>No events yet</h3>
                <p>Safety events will appear here when the link is activated.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event History */}
      {events.length > 1 && (
        <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3>Event History ({events.length})</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Accuracy</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="td-muted">{formatDateTime(event.created_at)}</td>
                    <td className="td-muted" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {event.latitude ? `${event.latitude.toFixed(5)}, ${event.longitude?.toFixed(5)}` : '—'}
                    </td>
                    <td className="td-muted">{event.accuracy ? `±${Math.round(event.accuracy)}m` : '—'}</td>
                    <td className="td-muted">{event.device_type ?? '—'}</td>
                    <td className="td-muted">{event.browser ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link to={`/admin/events/${event.id}`} className="btn btn-ghost btn-sm">View</Link>
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
