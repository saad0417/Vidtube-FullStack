import api from './axios';

export const playlistApi = {
  createPlaylist: async (data) => {
    const response = await api.post('/playlist/create-playlist', data);
    return response.data;
  },

  getUserPlaylists: async (userId) => {
    const response = await api.get(`/playlist/user/${userId}`);
    return response.data;
  },

  getPlaylistById: async (playlistId) => {
    const response = await api.get(`/playlist/${playlistId}`);
    return response.data;
  },

  updatePlaylist: async (playlistId, data) => {
    const response = await api.patch(`/playlist/${playlistId}`, data);
    return response.data;
  },

  deletePlaylist: async (playlistId) => {
    const response = await api.delete(`/playlist/${playlistId}`);
    return response.data;
  },

  addVideoToPlaylist: async (videoId, playlistId) => {
    const response = await api.patch(`/playlist/add/${videoId}/${playlistId}`);
    return response.data;
  },

  removeVideoFromPlaylist: async (videoId, playlistId) => {
    const response = await api.patch(`/playlist/remove/${videoId}/${playlistId}`);
    return response.data;
  },
};
