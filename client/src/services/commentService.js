import api from '../lib/api';

export const getPostComments = async (postId) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data;
};

export const createComment = async (postId, content, parentCommentId = null) => {
  const response = await api.post(`/posts/${postId}/comments`, {
    content,
    parentCommentId,
  });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
};

export const voteComment = async (commentId, value) => {
  const response = await api.post(`/comments/${commentId}/vote`, { value });
  return response.data;
};
