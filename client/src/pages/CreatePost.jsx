import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../context/GeolocationContext';
import { MapPin, Compass, Image, Plus, X, AlertCircle } from 'lucide-react';

const tagsList = ['Confession', 'Event', 'Question', 'Rant', 'Discussion', 'News', 'Help', 'Meme', 'Other'];

const CreatePost = () => {
  const { user } = useAuth();
  const { requestLocation } = useGeolocation();
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [tag, setTag] = useState('Discussion');
  const [imageUrl, setImageUrl] = useState('');
  const [attachLocation, setAttachLocation] = useState(false);
  const [coords, setCoords] = useState(null);

  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLocationToggle = async (e) => {
    const checked = e.target.checked;
    setAttachLocation(checked);
    setError('');

    if (checked) {
      setGpsLoading(true);
      try {
        const GPScoords = await requestLocation();
        setCoords(GPScoords);
      } catch (err) {
        console.error('Failed to get location:', err);
        setError('Location permission denied or unavailable. Coordinates could not be attached.');
        setAttachLocation(false);
        setCoords(null);
      } finally {
        setGpsLoading(false);
      }
    } else {
      setCoords(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Post content is required');
      return;
    }

    setLoading(true);
    try {
      await createPost({
        content: content.trim(),
        tag,
        imageUrl: imageUrl.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      if (coords) {
        navigate('/nearby');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col space-y-1">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
          Compose Post
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Share what's on your mind.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 p-3 rounded-2xl border border-rose-500/20 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl p-6 space-y-5">

        {/* Tag selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Category / Flair
          </label>
          <div className="flex flex-wrap gap-1.5 select-none">
            {tagsList.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  tag === t
                    ? 'bg-ghost-500 text-white shadow-glow glow-primary'
                    : 'bg-slate-50 dark:bg-zinc-950/40 text-slate-550 dark:text-zinc-400 border border-slate-200/50 dark:border-zinc-850 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-1.5 relative">
          <label htmlFor="postContent" className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            What's on your mind?
          </label>
          <textarea
            id="postContent"
            rows="6"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something..."
            maxLength="1000"
            className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-850 rounded-2xl px-4 py-3.5 text-xs text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-ghost-500 resize-none leading-relaxed"
            required
          />
          <div className="absolute right-4 bottom-3 text-[9px] font-bold text-slate-400 select-none">
            {content.length}/1000
          </div>
        </div>

        {/* Image URL */}
        <div className="space-y-1.5">
          <label htmlFor="imageUrl" className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            <span>Image URL (Optional)</span>
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-ghost-500"
          />
        </div>

        {/* Geolocation */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-zinc-850">
          <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={attachLocation}
              onChange={handleLocationToggle}
              className="w-4 h-4 rounded text-ghost-500 focus:ring-ghost-500 border-slate-300 bg-slate-150 dark:bg-zinc-950 dark:border-zinc-800 focus:ring-offset-0"
            />
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-350 flex items-center gap-1.5">
              <Compass className={`w-4 h-4 ${attachLocation ? 'text-ghost-500 animate-spin' : 'text-slate-400'}`} />
              Attach current GPS location
            </span>
          </label>

          {gpsLoading && (
            <span className="text-[10px] text-slate-400 pl-6 font-medium">
              Obtaining browser coordinates...
            </span>
          )}
          {coords && !gpsLoading && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 dark:text-emerald-400 pl-6">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location Attached ({coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}° — privacy masked on server)</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-550 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all select-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || gpsLoading}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-ghost-500/20 active:scale-95 transition-all select-none disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Publishing...' : 'Publish Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
