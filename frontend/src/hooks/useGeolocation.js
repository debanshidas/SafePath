import { useState, useEffect, useCallback } from 'react';

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
      },
      (err) => {
        setError(getErrorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
    );
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    setWatching(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
      },
      (err) => {
        setError(getErrorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, ...options }
    );

    return watchId;
  }, []);

  const stopWatching = useCallback((watchId) => {
    if (watchId !== null && watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }
    setWatching(false);
  }, []);

  return { position, error, watching, getCurrentPosition, startWatching, stopWatching };
}

function getErrorMessage(err) {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location permission denied. Please enable location access in your browser settings.';
    case err.POSITION_UNAVAILABLE:
      return 'Location information is unavailable.';
    case err.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'An unknown error occurred while getting your location.';
  }
}
