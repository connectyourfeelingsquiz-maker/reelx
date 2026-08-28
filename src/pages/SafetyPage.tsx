// src/pages/SafetyPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { getLinkByToken } from '../services/linksService';
import { submitSafetyEvent } from '../services/eventsService';
import { getSafetyPageSettings, SAFETY_PAGE_DEFAULTS } from '../services/settingsService';
import { collectDeviceInfo } from '../utils/deviceInfo';
import type { SafetyLink, SafetyPageSettings, GeolocationState } from '../types';

type PageState =
  | 'loading'        // initial load (link + settings + geo request)
  | 'requesting_geo' // waiting for browser geo permission
  | 'ready'          // geo granted, show main page
  | 'submitting'     // sending event
  | 'success'        // event sent
  | 'denied'         // geo denied
  | 'geo_error'      // geo timeout/unavailable
  | 'invalid'        // bad token
  | 'disabled'       // link disabled
  | 'error';         // network error

function requestBrowserLocation(): Promise<GeolocationState> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ status: 'unsupported', latitude: null, longitude: null, accuracy: null, error: 'Geolocation is not supported by this browser.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: 'granted',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
        });
      },
      (err) => {
        let status: GeolocationState['status'] = 'error';
        let error = 'An unknown error occurred.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            status = 'denied';
            error = 'Location permission was denied.';
            break;
          case err.POSITION_UNAVAILABLE:
            status = 'unavailable';
            error = 'Your location is currently unavailable.';
            break;
          case err.TIMEOUT:
            status = 'timeout';
            error = 'Location request timed out.';
            break;
        }
        resolve({ status, latitude: null, longitude: null, accuracy: null, error });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export function SafetyPage() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [link, setLink] = useState<SafetyLink | null>(null);
  const [geo, setGeo] = useState<GeolocationState | null>(null);
  const [settings, setSettings] = useState<SafetyPageSettings>({ id: '', ...SAFETY_PAGE_DEFAULTS });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Helper to interpolate {link_name} in subtitle
  const interpolate = (text: string) => {
    return text.replace(/\{link_name\}/g, link?.name ?? '');
  };

  // STEP 1: Load link + settings, then IMMEDIATELY request geo
  useEffect(() => {
    if (!token) { setPageState('invalid'); return; }

    let cancelled = false;

    (async () => {
      try {
        // Load link and settings in parallel
        const [linkResult, settingsResult] = await Promise.all([
          getLinkByToken(token).catch(() => null),
          getSafetyPageSettings().catch(() => ({ id: '', ...SAFETY_PAGE_DEFAULTS })),
        ]);

        if (cancelled) return;
        setSettings(settingsResult);

        if (!linkResult) { setPageState('invalid'); return; }
        if (linkResult.status === 'disabled') { setPageState('disabled'); return; }

        setLink(linkResult);
        setPageState('requesting_geo');

        // IMMEDIATELY request browser geolocation
        const geoResult = await requestBrowserLocation();
        if (cancelled) return;
        setGeo(geoResult);

        if (geoResult.status === 'granted') {
          setPageState('ready');
        } else if (geoResult.status === 'denied') {
          setPageState('denied');
        } else {
          setPageState('geo_error');
        }
      } catch {
        if (!cancelled) setPageState('error');
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  // Retry geolocation
  const handleRetry = useCallback(async () => {
    setPageState('requesting_geo');
    const geoResult = await requestBrowserLocation();
    setGeo(geoResult);
    if (geoResult.status === 'granted') {
      setPageState('ready');
    } else if (geoResult.status === 'denied') {
      setPageState('denied');
    } else {
      setPageState('geo_error');
    }
  }, []);

  // STEP 2: User taps action button → submit event
  const handleSubmit = async () => {
    if (!link || !geo) return;
    setPageState('submitting');
    setSubmitError(null);

    const device = await collectDeviceInfo();

    try {
      await submitSafetyEvent(link.id, geo, device);
      setPageState('success');
    } catch (err) {
      console.error('Failed to submit safety event:', err);
      setSubmitError('There was a problem submitting your location. Please try again.');
      setPageState('ready');
    }
  };

  // ───── RENDER STATES ─────

  // LOADING
  if (pageState === 'loading' || pageState === 'requesting_geo') {
    return (
      <div className="safety-page">
        <div className="safety-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)' }}>
            <div className="safety-shield">
              <Shield size={36} color="#6366f1" />
            </div>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Checking your safety connection…</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {pageState === 'requesting_geo' ? 'Please allow location access when prompted.' : 'Loading…'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // INVALID TOKEN
  if (pageState === 'invalid') {
    return (
      <div className="safety-page">
        <div className="safety-container">
          <div style={{ textAlign: 'center' }}>
            <XCircle size={64} color="var(--color-danger)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
            <h1 className="safety-title">Link Not Found</h1>
            <p className="safety-subtitle">This safety link is invalid or does not exist. Please check the URL and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  // DISABLED
  if (pageState === 'disabled') {
    return (
      <div className="safety-page">
        <div className="safety-container">
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={64} color="var(--color-warning)" style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
            <h1 className="safety-title">Link Unavailable</h1>
            <p className="safety-subtitle">This safety link has been deactivated. Please contact the person who shared it with you.</p>
          </div>
        </div>
      </div>
    );
  }

  // NETWORK ERROR
  if (pageState === 'error') {
    return (
      <div className="safety-page">
        <div className="safety-container">
          <div style={{ textAlign: 'center' }}>
            <XCircle size={64} color="var(--color-danger)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
            <h1 className="safety-title">Something went wrong</h1>
            <p className="safety-subtitle">Unable to load this safety link. Please check your connection and try again.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // DENIED
  if (pageState === 'denied') {
    return (
      <div className="safety-page">
        <div className="safety-container">
          <div style={{ textAlign: 'center' }}>
            <XCircle size={64} color="var(--color-danger)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
            <h1 className="safety-title">{settings.permission_denied_message}</h1>
            <p className="safety-subtitle">
              Please allow location access in your browser settings, then tap the button below.
            </p>
            <button className="safety-btn" onClick={handleRetry} style={{ marginTop: '1.5rem' }}>
              <RefreshCw size={20} />
              {settings.retry_button_text}
            </button>
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
              <Shield size={12} />
              {settings.privacy_footer_text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // GEO ERROR (timeout / unavailable / unsupported)
  if (pageState === 'geo_error') {
    return (
      <div className="safety-page">
        <div className="safety-container">
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={64} color="var(--color-warning)" style={{ marginBottom: '1.5rem', opacity: 0.9 }} />
            <h1 className="safety-title">Location Unavailable</h1>
            <p className="safety-subtitle">
              {geo?.error ?? 'Could not determine your location. Please try again.'}
            </p>
            <button className="safety-btn" onClick={handleRetry} style={{ marginTop: '1.5rem' }}>
              <RefreshCw size={20} />
              {settings.retry_button_text}
            </button>
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
              <Shield size={12} />
              {settings.privacy_footer_text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS
  if (pageState === 'success') {
    return (
      <div className="safety-page">
        <div className="safety-container">
          <div className="safety-success">
            <div className="safety-success-icon">
              <CheckCircle size={36} />
            </div>
            <div className="safety-success-title">
              {settings.success_message}
            </div>
            <div className="safety-success-detail" style={{ textAlign: 'center' }}>
              {geo?.accuracy
                ? `Your location has been shared with your authorized safety contact. Accuracy: ±${Math.round(geo.accuracy)}m.`
                : 'Your location has been shared with your authorized safety contact.'}
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Stay safe. Help is on the way.
          </p>

          {link?.destination_url && (
            <div style={{ textAlign: 'center' }}>
              <a
                href={link.destination_url}
                className="btn btn-ghost"
                style={{ display: 'inline-flex', gap: '0.5rem' }}
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} /> {settings.continue_button_text}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // READY state — geo granted, show emergency page with admin-configured text
  return (
    <div className="safety-page">
      <div className="safety-container">
        <div className="safety-shield">
          <Shield size={36} color="#ef4444" />
        </div>

        <h1 className="safety-title">{settings.page_heading}</h1>
        <p className="safety-subtitle">
          {interpolate(settings.page_subtitle)}
          <br />
          <span style={{ fontSize: '0.9rem' }}>{settings.description}</span>
        </p>

        {submitError && (
          <div className="alert alert-error" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <XCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {submitError}
          </div>
        )}

        <button
          id="share-location-btn"
          className="safety-btn"
          onClick={handleSubmit}
          disabled={pageState === 'submitting'}
          aria-label="Share my location with my safety contact"
        >
          {pageState === 'submitting' ? (
            <>
              <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              Sharing Location…
            </>
          ) : (
            <>
              {settings.action_button_text}
            </>
          )}
        </button>

        <p className="safety-note">
          {settings.permission_help_text}
        </p>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
            <Shield size={12} />
            {settings.privacy_footer_text}
          </p>
        </div>
      </div>
    </div>
  );
}
