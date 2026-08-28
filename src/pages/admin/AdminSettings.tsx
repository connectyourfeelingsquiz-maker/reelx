// src/pages/admin/AdminSettings.tsx
import { useState, useEffect } from 'react';
import { Shield, AlertCircle, Check, Save, FileText } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getSafetyPageSettings, updateSafetyPageSettings, SAFETY_PAGE_DEFAULTS } from '../../services/settingsService';
import type { SafetyPageSettings } from '../../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AdminSettings() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Safety Page Content Editor state
  const [settings, setSettings] = useState<Omit<SafetyPageSettings, 'id'>>({ ...SAFETY_PAGE_DEFAULTS });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getSafetyPageSettings()
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = data;
        setSettings(rest);
      })
      .catch(() => { /* use defaults */ })
      .finally(() => setSettingsLoading(false));
  }, []);

  const copyEmail = async () => {
    if (user?.email) {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSettingsChange = (field: keyof Omit<SafetyPageSettings, 'id'>, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    if (saveStatus === 'saved' || saveStatus === 'error') setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError(null);
    try {
      await updateSafetyPageSettings(settings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('error');
      setSaveError('Error saving changes. Please try again.');
    }
  };

  const renderInput = (label: string, field: keyof Omit<SafetyPageSettings, 'id'>, multiline = false) => (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          className="input"
          value={settings[field]}
          onChange={(e) => handleSettingsChange(field, e.target.value)}
          rows={3}
          style={{ resize: 'vertical', minHeight: '5rem' }}
        />
      ) : (
        <input
          type="text"
          className="input"
          value={settings[field]}
          onChange={(e) => handleSettingsChange(field, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <AdminLayout title="Settings" subtitle="Account, security, and safety page configuration">
      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Account Info */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Account Information</h3>
          <div className="info-row">
            <span className="info-label">Email</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="info-value">{user?.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={copyEmail}>
                {copied ? <Check size={13} /> : null} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="info-row">
            <span className="info-label">Role</span>
            <span className="info-value"><span className="badge badge-active">Admin</span></span>
          </div>
          <div className="info-row">
            <span className="info-label">User ID</span>
            <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{user?.id}</span>
          </div>
        </div>

        {/* Safety Page Content Editor */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: '8px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}>
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Safety Page Content</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Customize the public safety page text</p>
            </div>
          </div>

          {settingsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', padding: '2rem 0' }}>
              <div className="spinner" /> Loading settings…
            </div>
          ) : (
            <>
              {renderInput('Page Heading', 'page_heading')}
              {renderInput('Page Subtitle', 'page_subtitle')}
              <div className="alert alert-info" style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>Use <code style={{ background: 'var(--bg-input)', padding: '1px 4px', borderRadius: 3 }}>{'{link_name}'}</code> in the subtitle to show the link's name dynamically.</span>
              </div>
              {renderInput('Description', 'description', true)}
              {renderInput('Main Action Button Text', 'action_button_text')}
              {renderInput('Permission / Help Text', 'permission_help_text', true)}
              {renderInput('Privacy Footer Text', 'privacy_footer_text', true)}
              {renderInput('Success Message', 'success_message')}
              {renderInput('Permission Denied Message', 'permission_denied_message')}
              {renderInput('Retry Button Text', 'retry_button_text')}
              {renderInput('Continue Button Text', 'continue_button_text')}

              {saveError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {saveError}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                style={{ width: '100%' }}
              >
                {saveStatus === 'saving' ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving…</>
                ) : saveStatus === 'saved' ? (
                  <><Check size={16} /> Saved successfully</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </>
          )}
        </div>

        {/* Security Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '8px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <Shield size={18} />
            </div>
            <h3>Security</h3>
          </div>

          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>To change your password:</strong> Use the Supabase Auth dashboard or click "Forgot Password" on the login page. Never share your password.
            </div>
          </div>

          <div className="info-row">
            <span className="info-label">Session</span>
            <span className="info-value" style={{ color: 'var(--color-success)' }}>✅ Active</span>
          </div>
          <div className="info-row">
            <span className="info-label">Auth Provider</span>
            <span className="info-value">Supabase Auth (Email/Password)</span>
          </div>
          <div className="info-row">
            <span className="info-label">Admin Route Protection</span>
            <span className="info-value" style={{ color: 'var(--color-success)' }}>✅ Enabled</span>
          </div>
          <div className="info-row">
            <span className="info-label">Row Level Security</span>
            <span className="info-value" style={{ color: 'var(--color-success)' }}>✅ Enabled on all tables</span>
          </div>
          <div className="info-row">
            <span className="info-label">Audit Logging</span>
            <span className="info-value" style={{ color: 'var(--color-success)' }}>✅ All admin actions logged</span>
          </div>
        </div>

        {/* Data Privacy Notice */}
        <div className="card" style={{ borderColor: 'rgba(34,197,94,0.25)' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Privacy Statement</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            This platform collects location data <strong>only</strong> when a trusted contact explicitly
            activates a safety link and grants browser permission. Location is not collected
            automatically, continuously, or without user consent. All safety events are only
            visible to the authorized administrator (you). Refer to{' '}
            <code style={{ fontSize: '0.8rem', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>
              docs/security-threat-model.md
            </code>{' '}
            for full security documentation.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
