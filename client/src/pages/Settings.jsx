import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/userService';
import ProfileAvatar from '../components/ProfileAvatar';
import HomeLocationPicker from '../components/HomeLocationPicker';
import { User, Lock, MapPin, Save, Eye, EyeOff, Shield } from 'lucide-react';

const Settings = () => {
  const { user, updateUserInContext, updateHomeLocationInContext, removeHomeLocationInContext, toggleRole } = useAuth();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    headerImage: user?.headerImage || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileError('');
    setProfileSuccess('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await updateProfile(profileForm);
      updateUserInContext(res.data);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      await changePassword(passwordForm);
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputClass = 'w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-ghost-500 transition-all';
  const labelClass = 'block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1';

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col space-y-1">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
          Settings
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Manage your profile, account, and location.
        </p>
      </div>

      {/* Edit Profile Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-ghost-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-150">Edit Profile</h3>
        </div>

        {/* Avatar Preview */}
        <div className="flex items-center gap-4">
          <ProfileAvatar user={{ ...user, avatar: profileForm.avatar, username: profileForm.username || user?.username }} size="xl" />
          <div className="text-left">
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block">
              {profileForm.displayName || user?.username}
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500">
              @{profileForm.username || user?.username}
            </span>
          </div>
        </div>

        {profileError && (
          <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            {profileSuccess}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Display Name</label>
              <input name="displayName" value={profileForm.displayName} onChange={handleProfileChange}
                className={inputClass} placeholder="Your public name" maxLength={50} />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">@</span>
                <input name="username" value={profileForm.username} onChange={handleProfileChange}
                  className={`${inputClass} pl-7`} placeholder="username" maxLength={30} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Bio <span className="text-slate-300 dark:text-zinc-600 normal-case font-normal">({profileForm.bio.length}/160)</span></label>
            <textarea name="bio" value={profileForm.bio} onChange={handleProfileChange}
              className={`${inputClass} resize-none`} rows={3} placeholder="Tell the world about yourself..." maxLength={160} />
          </div>

          <div>
            <label className={labelClass}>Avatar URL</label>
            <input name="avatar" value={profileForm.avatar} onChange={handleProfileChange}
              className={inputClass} placeholder="https://example.com/avatar.jpg" type="url" />
          </div>

          <div>
            <label className={labelClass}>Header / Banner Image URL</label>
            <input name="headerImage" value={profileForm.headerImage} onChange={handleProfileChange}
              className={inputClass} placeholder="https://example.com/banner.jpg" type="url" />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={profileLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-xs font-bold shadow-md shadow-ghost-500/20 active:scale-95 transition-all disabled:opacity-50 select-none">
              <Save className="w-4 h-4" />
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-ghost-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-150">Change Password</h3>
        </div>

        {passwordError && (
          <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label className={labelClass}>
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <input
                  name={field}
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordForm[field]}
                  onChange={handlePasswordChange}
                  className={`${inputClass} pr-10`}
                  placeholder="••••••••"
                  required
                  minLength={field !== 'currentPassword' ? 6 : 1}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={passwordLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-ghost-500 hover:bg-ghost-600 text-white rounded-xl text-xs font-bold shadow-md shadow-ghost-500/20 active:scale-95 transition-all disabled:opacity-50 select-none">
              <Lock className="w-4 h-4" />
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Developer Role Toggle */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-ghost-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-150">Developer Options</h3>
        </div>
        <button
          onClick={toggleRole}
          type="button"
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border active:scale-95 transition-all select-none ${
            user?.role === 'admin'
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-350 border-slate-200/50 dark:border-zinc-700/50 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          {user?.role === 'admin' ? 'Disable Mod Mode' : 'Enable Mod Mode (Dev)'}
        </button>
      </div>

      {/* Home Location Picker */}
      <HomeLocationPicker
        initialLocation={user?.homeLocation}
        onUpdate={updateHomeLocationInContext}
        onRemove={removeHomeLocationInContext}
      />
    </div>
  );
};

export default Settings;
