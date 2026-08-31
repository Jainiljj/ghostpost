import api from '../lib/api';

export const createReport = async ({ targetType, targetId, reason, description }) => {
  const response = await api.post('/reports', {
    targetType,
    targetId,
    reason,
    description: description || undefined,
  });
  return response.data;
};
