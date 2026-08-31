import api from '../lib/api';

export const getMe = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateHomeLocation = async (latitude, longitude) => {
  const response = await api.patch('/users/me/home', { latitude, longitude });
  return response.data;
};

export const removeHomeLocation = async () => {
  const response = await api.delete('/users/me/home');
  return response.data;
};

export const toggleUserRole = async () => {
  const response = await api.patch('/users/me/role');
  return response.data;
};

// GET /api/users/:username — public profile
export const getUserProfile = async (username) => {
  const response = await api.get(`/users/${username}`);
  return response.data;
};

// PATCH /api/users/me — update own profile fields
export const updateProfile = async ({ displayName, bio, avatar, headerImage, username }) => {
  const response = await api.patch('/users/me', {
    displayName,
    bio,
    avatar,
    headerImage,
    username,
  });
  return response.data;
};

// PATCH /api/users/me/password — change password
export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const response = await api.patch('/users/me/password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return response.data;
};

// POST /api/users/:id/follow
export const followUser = async (userId) => {
  const response = await api.post(`/users/${userId}/follow`);
  return response.data;
};

// POST /api/users/:id/unfollow
export const unfollowUser = async (userId) => {
  const response = await api.post(`/users/${userId}/unfollow`);
  return response.data;
};

// GET /api/users/me/bookmarks
export const getBookmarks = async (page = 1, limit = 10) => {
  const response = await api.get('/users/me/bookmarks', { params: { page, limit } });
  return response.data;
};

// POST /api/users/me/bookmarks/:postId
export const bookmarkPost = async (postId) => {
  const response = await api.post(`/users/me/bookmarks/${postId}`);
  return response.data;
};

// DELETE /api/users/me/bookmarks/:postId
export const unbookmarkPost = async (postId) => {
  const response = await api.delete(`/users/me/bookmarks/${postId}`);
  return response.data;
};
