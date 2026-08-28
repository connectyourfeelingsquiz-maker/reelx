// src/hooks/useGeolocation.ts

import { useCallback, useRef, useState } from 'react';
import type { GeolocationState } from '../types';

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: 'idle',
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const requestLocation = useCallback((): Promise<GeolocationState> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const result: GeolocationState = {
          status: 'unsupported',
          latitude: null,
          longitude: null,
          accuracy: null,
          error: 'Geolocation is not supported by this browser.',
        };
        setState(result);
        resolve(result);
        return;
      }

      setState((prev) => ({ ...prev, status: 'loading', error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result: GeolocationState = {
            status: 'granted',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
          };
          setState(result);
          resolve(result);
        },
        (err) => {
          let status: GeolocationState['status'] = 'error';
          let error = 'An unknown error occurred.';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              status = 'denied';
              error = 'Location permission was denied. Please allow location access and try again.';
              break;
            case err.POSITION_UNAVAILABLE:
              status = 'unavailable';
              error = 'Your location is currently unavailable. Please try again.';
              break;
            case err.TIMEOUT:
              status = 'timeout';
              error = 'Location request timed out. Please try again.';
              break;
          }

          const result: GeolocationState = {
            status,
            latitude: null,
            longitude: null,
            accuracy: null,
            error,
          };
          setState(result);
          resolve(result);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const reset = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState({
      status: 'idle',
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
    });
  }, []);

  return { state, requestLocation, reset };
}
