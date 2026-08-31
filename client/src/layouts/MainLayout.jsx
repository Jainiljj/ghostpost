import React from 'react';
import Navbar from '../components/Navbar';
import { NavLink, Link } from 'react-router-dom';
import { Globe, MapPin, Home, Sliders, Shield, BookOpen, LogIn, UserPlus, Ghost } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const MainLayout = ({ children }) => {
  const { user, loading } = useAuth();

  const navItems = [
    { name: 'Global', path: '/', icon: Globe },
    { name: 'Nearby', path: '/nearby', icon: MapPin },
    { name: 'Home Circle', path: '/home', icon: Home, requireAuth: true },
    { name: 'Settings', path: '/settings', icon: Sliders, requireAuth: true },
  ];

  return (
    <div className="min-h-screen bg-[#DAE0E6] dark:bg-[#030303] transition-colors duration-200 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        
        {/* Left Navigation Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-2 sticky top-16">
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-550 uppercase tracking-widest pl-3 select-none">
            Feeds & Settings
          </span>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              if (item.requireAuth && !user) return null;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-200 text-[#1C1C1C] dark:bg-zinc-800 dark:text-white font-bold'
                        : 'text-slate-650 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-850 hover:text-[#1C1C1C] dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Center Content Column */}
        <section className="col-span-1 md:col-span-2 space-y-4">
          {children}
        </section>

        {/* Right Info Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-4 sticky top-16">

          {/* Unauthenticated CTA */}
          {!loading && !user && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-250/60 dark:border-zinc-850 rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
                <Ghost className="w-4 h-4 text-ghost-500" />
                <span>Join GhostPost</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                Sign up to post, vote, follow users, and save your location.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/signup"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#FF4500] hover:bg-[#FF4500]/90 text-white rounded-full text-xs font-bold transition-colors select-none"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Sign Up Free
                </Link>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 rounded-full text-xs font-bold transition-colors select-none border border-slate-200 dark:border-zinc-700"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Log In
                </Link>
              </div>
            </div>
          )}
          
          {/* Rules / Guidelines */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-250/60 dark:border-zinc-850 rounded-lg p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
              <BookOpen className="w-4 h-4 text-ghost-500" />
              <span>Ghost Rules</span>
            </h3>
            <ul className="text-[11px] text-slate-550 dark:text-zinc-400 space-y-2 leading-relaxed pl-1">
              <li className="flex gap-1.5">
                <span className="text-ghost-500 font-bold">•</span>
                <span>Speak freely, but respect other users. No hate speech.</span>
              </li>
              <li className="flex gap-1.5">
                <span className="text-ghost-500 font-bold">•</span>
                <span>Do not share personal information or coordinates of other users.</span>
              </li>
              <li className="flex gap-1.5">
                <span className="text-ghost-500 font-bold">•</span>
                <span>Tag your posts with correct flairs (e.g. Rant, Confession).</span>
              </li>
            </ul>
          </div>

          {/* Privacy Guarantee card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-250/60 dark:border-zinc-850 rounded-lg p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Location Privacy</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              We filter distances on our server and mask raw latitude/longitude points in all API responses. Your coordinates remain private.
            </p>
          </div>

        </aside>

      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex justify-around items-center h-14 z-40 px-2 py-1 shadow-md">
        {navItems.map((item) => {
          if (item.requireAuth && !user) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-ghost-500 font-bold'
                    : 'text-slate-400 dark:text-zinc-550 hover:text-slate-600 dark:hover:text-zinc-300'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-0.5 font-bold tracking-wider">{item.name.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MainLayout;
