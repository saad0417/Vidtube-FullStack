import api from './axios';

export const commentApi = {
  getVideoComments: async (videoId, params = {}) => {
    const response = await api.get(`/comment/${videoId}`, { params });
    return response.data;
  },

  addComment: async (videoId, content) => {
    const response = await api.post(`/comment/${videoId}`, { content });
    return response.data;
  },

  updateComment: async (commentId, content) => {
    const response = await api.patch(`/comment/c/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comment/c/${commentId}`);
    return response.data;
  },
};
