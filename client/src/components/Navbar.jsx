import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../context/GeolocationContext";
import ProfileAvatar from "./ProfileAvatar";
import { Search, Compass, LogOut, ShieldAlert, User, Sliders, Menu, X, Plus, Bookmark } from "lucide-react";

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const { coords, requestLocation } = useGeolocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-zinc-900 border-b border-slate-250/80 dark:border-zinc-850 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 select-none group shrink-0">
          <img
            src="/src/assets/ghost_logo.svg"
            alt="GhostPost Logo"
            className="w-7 h-7 group-hover:scale-105 transition-transform duration-200"
          />
          <span className="font-extrabold text-base tracking-normal text-ghost-500">GhostPost</span>
        </Link>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xl relative">
          <input
            type="text"
            placeholder="Search GhostPost..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-[#EDEFF1] dark:bg-zinc-800 border border-transparent rounded-full pl-10 pr-4 py-1.5 text-xs text-slate-800 dark:text-zinc-200 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:border-[#FF4500] dark:focus:bg-zinc-850 dark:focus:border-[#FF4500] transition-colors"
          />
          <Search className="absolute left-3.5 w-4 h-4 text-slate-500" />
        </form>

        {/* Actions Area */}
        <div className="flex items-center gap-3 shrink-0">

          {/* UNAUTHENTICATED STATE */}
          {!loading && !user && (
            <div className="flex items-center gap-1.5 select-none">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full border border-slate-200 dark:border-zinc-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#FF4500] hover:bg-[#FF4500]/90 rounded-full transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* AUTHENTICATED STATE */}
          {!loading && user && (
            <>
              {/* Geolocation badge */}
              {coords ? (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Location Active</span>
                </div>
              ) : (
                <button
                  onClick={requestLocation}
                  type="button"
                  className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-750 px-3 py-1 rounded-full border border-slate-200/50 dark:border-zinc-700/50 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share Location</span>
                </button>
              )}

              {/* Create Post Button */}
              <Link
                to="/create"
                className="flex items-center gap-1.5 bg-ghost-500 hover:bg-ghost-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all select-none"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Post</span>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  type="button"
                  aria-label="Open user menu"
                  className="flex items-center gap-1.5 p-1 rounded-full border border-slate-205 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                >
                  <ProfileAvatar user={user} size="sm" />
                  <span className="hidden lg:inline text-xs font-bold text-slate-700 dark:text-zinc-300 px-1">
                    @{user.username}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 space-y-1 animate-in fade-in duration-100">

                    {/* Profile header */}
                    <div className="p-3 border-b border-slate-100 dark:border-zinc-800 text-left flex items-center gap-3">
                      <ProfileAvatar user={user} size="md" />
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 block truncate">
                          {user.displayName || user.username}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 block truncate">
                          @{user.username}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/profile/${user.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all select-none"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all select-none"
                    >
                      <Sliders className="w-4 h-4 text-slate-500" />
                      <span>Settings</span>
                    </Link>

                    <Link
                      to="/bookmarks"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-all select-none"
                    >
                      <Bookmark className="w-4 h-4 text-slate-500" />
                      <span>Bookmarks</span>
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded hover:bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all select-none"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-550" />
                        <span>Mod Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      type="button"
                      className="w-full flex items-center gap-2.5 p-2 rounded hover:bg-red-500/10 text-xs font-semibold text-red-500 transition-all select-none text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Log Out</span>
                    </button>

                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
