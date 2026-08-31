import api from '../lib/api';

export const getGlobalPosts = async (sort = 'hot', limit = 10, cursor = '') => {
  const response = await api.get('/posts/global', {
    params: { sort, limit, cursor: cursor || undefined },
  });
  return response.data;
};

export const getFollowingPosts = async (limit = 10, cursor = '') => {
  const response = await api.get('/posts/following', {
    params: { limit, cursor: cursor || undefined },
  });
  return response.data;
};

export const getNearbyPosts = async (lat, lng, radius = 10, page = 1, limit = 10) => {
  const response = await api.get('/posts/nearby', {
    params: { lat, lng, radius, page, limit },
  });
  return response.data;
};

export const getHomePosts = async (radius = 10, page = 1, limit = 10) => {
  const response = await api.get('/posts/home', {
    params: { radius, page, limit },
  });
  return response.data;
};

export const getUserPosts = async (username, page = 1, limit = 10) => {
  const response = await api.get(`/posts/user/${username}`, {
    params: { page, limit },
  });
  return response.data;
};

export const getUserReplies = async (username, page = 1, limit = 10) => {
  const response = await api.get(`/posts/user/${username}/replies`, {
    params: { page, limit },
  });
  return response.data;
};

export const getPostDetail = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

export const createPost = async ({ content, tag, imageUrl, latitude, longitude, repostOf, quoteContent }) => {
  const response = await api.post('/posts', {
    content,
    tag,
    imageUrl: imageUrl || undefined,
    latitude: latitude !== undefined ? latitude : undefined,
    longitude: longitude !== undefined ? longitude : undefined,
    repostOf: repostOf || undefined,
    quoteContent: quoteContent || undefined,
  });
  return response.data;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/posts/${id}`);
  return response.data;
};

export const votePost = async (id, value) => {
  const response = await api.post(`/posts/${id}/vote`, { value });
  return response.data;
};

export const removePostVote = async (id) => {
  const response = await api.delete(`/posts/${id}/vote`);
  return response.data;
};

export const searchPosts = async (q, tag = 'All', sort = 'newest', page = 1, limit = 10) => {
  const response = await api.get('/posts/search', {
    params: { q: q || undefined, tag: tag !== 'All' ? tag : undefined, sort, page, limit },
  });
  return response.data;
};
