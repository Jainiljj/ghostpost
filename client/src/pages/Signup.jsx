import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const Signup = () => {
  const { user, loading, registerUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await registerUser(username, email, password, displayName);
    setSubmitting(false);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm flex flex-col gap-5">

        {/* Header */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-1.5 text-[#FF4500] font-extrabold text-lg">
            <img src="/src/assets/ghost_logo.svg" className="w-6 h-6" alt="GhostPost" />
            <span>GhostPost</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mt-2">Create Account</h1>
          <p className="text-[11px] text-slate-400 dark:text-zinc-550 leading-relaxed font-medium">
            Join the conversation. Your location stays private.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-550 border border-rose-100 dark:border-rose-900/30 text-xs px-3.5 py-2.5 rounded-md font-bold text-left">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johndoe"
                required
                className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-205 dark:border-zinc-800 rounded-md px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF4500] font-medium"
              />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-205 dark:border-zinc-800 rounded-md px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF4500] font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-205 dark:border-zinc-800 rounded-md px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF4500] font-medium"
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-205 dark:border-zinc-800 rounded-md px-3 py-2 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF4500] font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2 bg-[#FF4500] hover:bg-[#FF4500]/90 text-white rounded-full text-xs font-bold transition-colors select-none disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="flex flex-col gap-2 text-center text-xs pt-2 border-t border-slate-100 dark:border-zinc-800/40">
          <div className="text-slate-500 dark:text-zinc-400 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-[#FF4500] hover:underline font-bold">
              Log In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
