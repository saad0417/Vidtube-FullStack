import api from './axios';

export const likeApi = {
  toggleVideoLike: async (videoId) => {
    const response = await api.post(`/like/toggle/v/${videoId}`);
    return response.data;
  },

  toggleCommentLike: async (commentId) => {
    const response = await api.post(`/like/toggle/c/${commentId}`);
    return response.data;
  },

  toggleTweetLike: async (tweetId) => {
    const response = await api.post(`/like/toggle/t/${tweetId}`);
    return response.data;
  },

  getLikedVideos: async () => {
    const response = await api.get('/like/videos');
    return response.data;
  },
};
