import React, { createContext, useContext, useState, useEffect } from 'react';

const GeolocationContext = createContext(null);

export const GeolocationProvider = ({ children }) => {
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(10); // Default radius 10 km
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // prompt, granted, denied, unsupported

  // Check initial permission status on browser if supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionStatus(status.state);
        
        // Handle changes in permissions dynamically
        status.onchange = () => {
          setPermissionStatus(status.state);
          if (status.state === 'denied') {
            setCoords(null);
          }
        };
      });
    }
  }, []);

  const requestLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setPermissionStatus('unsupported');
        setError('Geolocation is not supported by your browser');
        reject(new Error('Unsupported'));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoords(newCoords);
          setPermissionStatus('granted');
          setLoading(false);
          resolve(newCoords);
        },
        (err) => {
          console.error('Error getting geolocation:', err);
          let errMsg = 'Failed to retrieve location';
          if (err.code === 1) {
            setPermissionStatus('denied');
            errMsg = 'Location access was denied';
          } else if (err.code === 2) {
            errMsg = 'Position unavailable';
          } else if (err.code === 3) {
            errMsg = 'Location request timed out';
          }
          setError(errMsg);
          setLoading(false);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // cache for 1 min
        }
      );
    });
  };

  const clearLocation = () => {
    setCoords(null);
    setError(null);
  };

  return (
    <GeolocationContext.Provider
      value={{
        coords,
        loading,
        error,
        radius,
        permissionStatus,
        setRadius,
        requestLocation,
        clearLocation,
      }}
    >
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = () => useContext(GeolocationContext);
