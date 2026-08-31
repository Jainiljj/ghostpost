import api from '../lib/api';

export const getAdminReports = async (status = 'pending', page = 1, limit = 20) => {
  const response = await api.get('/admin/reports', {
    params: { status, page, limit },
  });
  return response.data;
};

export const resolveReport = async (reportId, status, action) => {
  const response = await api.patch(`/admin/reports/${reportId}`, {
    status, // 'resolved' or 'dismissed'
    action, // 'remove' or 'keep'
  });
  return response.data;
};
