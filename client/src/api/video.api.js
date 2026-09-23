import api from './axios';

export const videoApi = {
  getAllVideos: async (params = {}) => {
    const response = await api.get('/video', { params });
    return response.data;
  },

  getVideoById: async (videoId) => {
    const response = await api.get(`/video/${videoId}`);
    return response.data;
  },

  publishVideo: async (formData, onUploadProgress) => {
    const response = await api.post('/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data;
  },

  updateVideo: async (videoId, formData) => {
    const response = await api.patch(`/video/${videoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteVideo: async (videoId) => {
    const response = await api.delete(`/video/${videoId}`);
    return response.data;
  },

  togglePublishStatus: async (videoId) => {
    const response = await api.patch(`/video/toggle/publish/${videoId}`);
    return response.data;
  },
};
