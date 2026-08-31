import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminReports, resolveReport } from '../services/adminService';
import EmptyState from '../components/EmptyState';
import { ShieldCheck, AlertOctagon, XCircle, CheckCircle, ExternalLink, Shield } from 'lucide-react';
import { timeAgo } from '../utils/timeAgo';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [statusTab, setStatusTab] = useState('pending'); // pending, resolved, dismissed
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores reportId being processed

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminReports(statusTab);
      setReports(res.data);
    } catch (err) {
      console.error('Failed to load admin reports:', err);
      setError('Failed to retrieve moderation reports list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadReports();
    }
  }, [user, statusTab]);

  const handleResolve = async (reportId, resolveStatus, action) => {
    setActionLoading(reportId);
    try {
      await resolveReport(reportId, resolveStatus, action);
      // Remove from active list
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      console.error('Failed to resolve report:', err);
      alert('Action failed. Check console.');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { value: 'pending', label: 'Pending Review', icon: AlertOctagon },
    { value: 'resolved', label: 'Removed Content', icon: XCircle },
    { value: 'dismissed', label: 'Dismissed', icon: CheckCircle },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 py-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-slate-400 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200">
          Verifying credentials...
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col space-y-1">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-ghost-500" />
          <span>Moderator Panel</span>
        </h2>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
          Review reported discussions and keep GhostPost safe.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/60 p-1 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl w-full sm:w-fit select-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setStatusTab(t.value)}
              type="button"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusTab === t.value
                  ? 'bg-white dark:bg-zinc-800 text-ghost-500 dark:text-ghost-400 shadow-sm border border-slate-200/30'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-850 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="text-xs text-rose-500 font-semibold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-zinc-900 rounded-3xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          message="No reports in this category"
          description="GhostPost is clean! Thank you for maintaining the community."
          icon={ShieldCheck}
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-4 relative"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-extrabold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                  Reason: {report.reason}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Reported {timeAgo(report.createdAt)} · Target: {report.targetType}
                </span>
              </div>

              {report.description && (
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-850 italic">
                  Reporter Comment: "{report.description}"
                </p>
              )}

              {/* Reported Content Preview box */}
              <div className="border border-slate-100 dark:border-zinc-850 rounded-2xl p-4 bg-slate-50/50 dark:bg-zinc-950/20 space-y-2 text-left">
                {report.target ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-700 dark:text-zinc-300">
                        Author: {report.target.authorHandle}
                      </span>
                      {report.targetType === 'post' && (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {report.target.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed break-words font-medium">
                      {report.target.content}
                    </p>
                    {report.targetType === 'post' ? (
                      <button
                        onClick={() => navigate(`/post/${report.targetId}`)}
                        type="button"
                        className="text-[9px] font-bold text-ghost-500 hover:text-ghost-600 flex items-center gap-1 mt-1 transition-colors select-none"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Post Thread</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/post/${report.target.postId}`)}
                        type="button"
                        className="text-[9px] font-bold text-ghost-500 hover:text-ghost-600 flex items-center gap-1 mt-1 transition-colors select-none"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Thread context</span>
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-zinc-500 italic">
                    [Content already deleted or unavailable]
                  </p>
                )}
              </div>

              {/* Action buttons (only for pending) */}
              {report.status === 'pending' && (
                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-850">
                  <button
                    onClick={() => handleResolve(report._id, 'dismissed', 'keep')}
                    disabled={actionLoading === report._id}
                    type="button"
                    className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-all select-none"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => handleResolve(report._id, 'resolved', 'remove')}
                    disabled={actionLoading === report._id}
                    type="button"
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-extrabold transition-all shadow-md shadow-rose-500/10 select-none"
                  >
                    {actionLoading === report._id ? 'Processing...' : 'Remove Content'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
