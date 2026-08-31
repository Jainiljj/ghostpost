import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — Guards a route from unauthenticated access.
 *
 * Props:
 *  - children: the component to render if access is granted
 *  - requireAdmin: if true, also require user.role === 'admin'
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ghost-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
