import api from './axios';

export const authApi = {
  
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },

  register: async (formData) => {
    const response = await api.post('/users/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/users/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/current-user');
    return response.data;
  },

  updateAccountDetails: async (data) => {
    const response = await api.patch('/users/update-account-details', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/users/change-password', data);
    return response.data;
  },

  updateAvatar: async (formData) => {
    const response = await api.patch('/users/update-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateCoverImage: async (formData) => {
    const response = await api.patch('/users/update-cover-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  becomeCreator: async () => {
    const response = await api.post('/users/become-creator');
    return response.data;
  },

  getUserChannelProfile: async (username) => {
    const response = await api.get(`/users/ch/${username}`);
    return response.data;
  },

  getWatchHistory: async () => {
    const response = await api.get('/users/watch-history');
    return response.data;
  },
};
