import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GeolocationProvider } from "./context/GeolocationContext";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import GlobalFeed from "./pages/GlobalFeed";
import NearbyFeed from "./pages/NearbyFeed";
import HomeFeed from "./pages/HomeFeed";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import Search from "./pages/Search";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GeolocationProvider>
          <MainLayout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<GlobalFeed />} />
              <Route path="/nearby" element={<NearbyFeed />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile/:username" element={<Profile />} />

              {/* Protected routes (require login) */}
              <Route path="/home" element={<ProtectedRoute><HomeFeed /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              {/* Admin only */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </MainLayout>
        </GeolocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
