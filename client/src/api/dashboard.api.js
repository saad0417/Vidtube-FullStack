import api from './axios';

export const dashboardApi = {
  getChannelStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getChannelVideos: async () => {
    const response = await api.get('/dashboard/videos');
    return response.data;
  },
};
