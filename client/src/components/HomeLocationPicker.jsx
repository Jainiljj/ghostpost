import React, { useState } from 'react';
import { Compass, MapPin, Globe, Check, AlertCircle } from 'lucide-react';
import { updateHomeLocation, removeHomeLocation } from '../services/userService';

const presets = [
  { name: 'Udaipur Center (Fatehsagar)', lat: 24.5854, lng: 73.7125 },
  { name: 'Jaipur (Pink City)', lat: 26.9124, lng: 75.7873 },
  { name: 'New Delhi (Connaught Place)', lat: 28.6304, lng: 77.2177 },
  { name: 'Mumbai (Marine Drive)', lat: 18.9432, lng: 72.8234 },
  { name: 'Bengaluru (Indiranagar)', lat: 12.9784, lng: 77.6408 },
];

const HomeLocationPicker = ({ initialLocation, onUpdate, onRemove }) => {
  const [lat, setLat] = useState(initialLocation?.coordinates ? initialLocation.coordinates[1] : '');
  const [lng, setLng] = useState(initialLocation?.coordinates ? initialLocation.coordinates[0] : '');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Please provide valid decimal coordinates');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError('Latitude must be -90 to 90, Longitude must be -180 to 180');
      return;
    }

    setLoading(true);
    try {
      const res = await updateHomeLocation(latitude, longitude);
      setSuccess(true);
      if (onUpdate) onUpdate(res.data.homeLocation);
      
      // Auto-hide success checkmark
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update Home location');
    } finally {
      setLoading(false);
    }
  };

  const handleGpsFetch = () => {
    setError('');
    setSuccess(false);
    
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      (err) => {
        setError('Location access was denied or unavailable.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePresetSelect = (preset) => {
    setLat(preset.lat.toFixed(6));
    setLng(preset.lng.toFixed(6));
    setError('');
    setSuccess(false);
  };

  const handleClear = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await removeHomeLocation();
      setLat('');
      setLng('');
      if (onRemove) onRemove();
    } catch (err) {
      setError('Failed to clear Home location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
      
      {/* Explanation */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-150">
          Where is Home?
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
          Your saved Home location is independent from your current GPS location and personalizes your Home feed. Your exact coordinates are never shown publicly.
        </p>
      </div>

      {initialLocation?.coordinates && (
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 p-3 rounded-2xl border border-emerald-500/20 text-xs font-semibold">
          <MapPin className="w-4 h-4 fill-emerald-500/10 shrink-0" />
          <span>
            Current Saved Home: {initialLocation.coordinates[1].toFixed(4)}° N, {initialLocation.coordinates[0].toFixed(4)}° E
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 p-3 rounded-2xl border border-rose-500/20 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Coordinate Picker Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="latitude" className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Latitude
            </label>
            <input
              type="number"
              id="latitude"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 24.5854"
              className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-ghost-500"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="longitude" className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Longitude
            </label>
            <input
              type="number"
              id="longitude"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. 73.7125"
              className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-ghost-500"
              required
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGpsFetch}
            disabled={gpsLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-semibold select-none transition-all active:scale-95 disabled:opacity-50"
          >
            <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>Use Current Location</span>
          </button>

          {initialLocation?.coordinates && (
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="px-3 py-2 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-semibold select-none transition-all active:scale-95"
            >
              Clear Saved
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 ml-auto px-4 py-2 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-xs font-bold shadow-md shadow-ghost-500/20 select-none transition-all active:scale-95"
          >
            {success ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>{loading ? 'Saving...' : 'Save Home Location'}</span>
            )}
          </button>
        </div>
      </form>

      {/* Presets List */}
      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
          Preset Locations (Useful for testing Udaipur seeds)
        </span>
        <div className="flex flex-col gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="flex items-center justify-between text-left p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-950/40 text-xs text-slate-600 dark:text-zinc-300 font-semibold group transition-all"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-ghost-500 transition-colors" />
                {preset.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {preset.lat.toFixed(2)}, {preset.lng.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HomeLocationPicker;
