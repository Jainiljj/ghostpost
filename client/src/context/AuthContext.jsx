import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore existing session from stored token ONLY.
  useEffect(() => {
    const restoreSession = async () => {
      const storedAccessToken = localStorage.getItem("ghostpost_accessToken");

      if (!storedAccessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/users/me");
        setUser(response.data.data);
      } catch {
        // Token invalid/expired — try refresh
        const storedRefreshToken = localStorage.getItem("ghostpost_refreshToken");
        if (storedRefreshToken) {
          try {
            const refreshRes = await api.post("/auth/refresh", { token: storedRefreshToken });
            const { accessToken, refreshToken, user: userData } = refreshRes.data.data;
            localStorage.setItem("ghostpost_accessToken", accessToken);
            localStorage.setItem("ghostpost_refreshToken", refreshToken);
            setUser(userData);
          } catch {
            localStorage.removeItem("ghostpost_accessToken");
            localStorage.removeItem("ghostpost_refreshToken");
            setUser(null);
          }
        } else {
          localStorage.removeItem("ghostpost_accessToken");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    const handleInvalidSession = () => {
      localStorage.removeItem("ghostpost_accessToken");
      localStorage.removeItem("ghostpost_refreshToken");
      setUser(null);
    };

    window.addEventListener("ghostpost_session_invalid", handleInvalidSession);
    return () => window.removeEventListener("ghostpost_session_invalid", handleInvalidSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ghostpost_accessToken");
    localStorage.removeItem("ghostpost_refreshToken");
    api.post("/auth/logout").catch(() => {});
    setUser(null);
    window.location.href = "/login";
  }, []);

  const loginUser = async (emailOrUsername, password) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { emailOrUsername, password });
      const { accessToken, refreshToken, user: userData } = response.data.data;
      localStorage.setItem("ghostpost_accessToken", accessToken);
      localStorage.setItem("ghostpost_refreshToken", refreshToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (username, email, password, displayName) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", { username, email, password, displayName });
      const { accessToken, refreshToken, user: userData } = response.data.data;
      localStorage.setItem("ghostpost_accessToken", accessToken);
      localStorage.setItem("ghostpost_refreshToken", refreshToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || "Registration failed. Please try again.";
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update user context after profile edits
  const updateUserInContext = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const updateHomeLocationInContext = (homeLocation) => {
    setUser((prev) => (prev ? { ...prev, homeLocation } : null));
  };

  const removeHomeLocationInContext = () => {
    setUser((prev) => {
      if (!prev) return null;
      const copy = { ...prev };
      delete copy.homeLocation;
      return copy;
    });
  };

  // Dev-only role toggle
  const toggleRole = async () => {
    try {
      const res = await api.patch("/users/me/role");
      setUser((prev) => (prev ? { ...prev, role: res.data.data.role } : null));
      return res.data.data.role;
    } catch (error) {
      console.error("Failed to toggle role:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        loginUser,
        registerUser,
        updateUserInContext,
        updateHomeLocationInContext,
        removeHomeLocationInContext,
        toggleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
