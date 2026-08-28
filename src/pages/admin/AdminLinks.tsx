// src/pages/admin/AdminLinks.tsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy, ExternalLink, Eye, ToggleLeft, ToggleRight, Trash2, Check, AlertCircle, Link2 } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { createSafetyLink, getAllLinks, updateLinkStatus, deleteLink } from '../../services/linksService';
import { validateDestinationUrl } from '../../utils/tokenGenerator';
import type { SafetyLink } from '../../types';
import { formatDateTime } from '../../utils/tokenGenerator';

const BASE_URL = window.location.origin;

export function AdminLinks() {
  const [links, setLinks] = useState<SafetyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<SafetyLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    try {
      const data = await getAllLinks();
      setLinks(data);
    } catch (err) {
      console.error('Failed to load links:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) { setFormError('Link name is required.'); return; }
    const urlValidation = validateDestinationUrl(destinationUrl);
    if (!urlValidation.valid) { setFormError(urlValidation.error!); return; }

    setCreating(true);
    try {
      const link = await createSafetyLink(name.trim(), destinationUrl.trim());
      setCreatedLink(link);
      setLinks((prev) => [link, ...prev]);
      setName('');
      setDestinationUrl('');
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create link.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (token: string, id: string) => {
    const url = `${BASE_URL}/s/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (link: SafetyLink) => {
    setActionLoading(link.id);
    try {
      const newStatus = link.status === 'active' ? 'disabled' : 'active';
      await updateLinkStatus(link.id, newStatus);
      setLinks((prev) => prev.map((l) => l.id === link.id ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    setActionLoading(id);
    setDeleteConfirm(null);
    try {
      await deleteLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to delete link:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout title="Safety Links" subtitle="Manage and create unique safety links for trusted contacts">
      {/* Created success banner */}
      {createdLink && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Check size={18} /> Safety link created successfully!
          </div>
          <div style={{ width: '100%' }}>
            <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Share this URL with your trusted contact:</p>
            <div className="copy-url-box">
              <span className="copy-url-text">{`${BASE_URL}/s/${createdLink.token}`}</span>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleCopy(createdLink.token, createdLink.id)}
              >
                {copiedId === createdLink.id ? <Check size={14} /> : <Copy size={14} />}
                {copiedId === createdLink.id ? 'Copied!' : 'Copy'}
              </button>
              <a href={`/s/${createdLink.token}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setCreatedLink(null)}>Dismiss</button>
        </div>
      )}

      {/* Header row */}
      <div className="section-header">
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {links.length} link{links.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormError(null); }}>
          <Plus size={16} /> Create Safety Link
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-primary)' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>New Safety Link</h3>
          {formError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {formError}
            </div>
          )}
          <form onSubmit={handleCreate} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="link-name">Link Name</label>
              <input
                id="link-name"
                type="text"
                className="form-input"
                placeholder="e.g. Friend 1 – Sarah"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="link-destination">Destination URL</label>
              <input
                id="link-destination"
                type="url"
                className="form-input"
                placeholder="https://example.com/content"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Only HTTPS URLs are allowed.</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button id="create-link-submit" type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? <><div className="spinner" /> Creating…</> : <><Plus size={16} /> Generate Safety Link</>}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Links table */}
      {loading ? (
        <div className="page-loading"><div className="spinner" /> Loading links…</div>
      ) : links.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Link2 size={48} />
            <h3>No safety links yet</h3>
            <p>Create your first safety link to share with a trusted contact.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Create Safety Link
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Triggered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} style={{ opacity: actionLoading === link.id ? 0.5 : 1 }}>
                    <td>
                      <Link to={`/admin/links/${link.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {link.name}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                        /s/{link.token.substring(0, 12)}…
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${link.status}`}>{link.status}</span>
                    </td>
                    <td className="td-muted">{formatDateTime(link.created_at)}</td>
                    <td className="td-muted">{link.last_triggered_at ? formatDateTime(link.last_triggered_at) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        <Link to={`/admin/links/${link.id}`} className="btn btn-ghost btn-sm" title="View details">
                          <Eye size={14} />
                        </Link>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCopy(link.token, link.id)}
                          title="Copy link"
                        >
                          {copiedId === link.id ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                        </button>
                        <button
                          className={`btn btn-sm ${link.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(link)}
                          title={link.status === 'active' ? 'Disable link' : 'Enable link'}
                          disabled={actionLoading === link.id}
                        >
                          {link.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          {link.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(link.id)}
                          disabled={actionLoading === link.id}
                          title={deleteConfirm === link.id ? 'Click again to confirm deletion' : 'Delete link'}
                        >
                          <Trash2 size={14} />
                          {deleteConfirm === link.id ? 'Confirm?' : 'Delete'}
                        </button>
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
