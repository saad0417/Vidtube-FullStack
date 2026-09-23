import api from './axios';

export const tweetApi = {
  getAllTweets: async () => {
    const response = await api.get('/tweet');
    return response.data;
  },

  createTweet: async (content) => {
    const response = await api.post('/tweet/create-tweet', { content });
    return response.data;
  },

  getUserTweets: async (userId) => {
    const response = await api.get(`/tweet/user/${userId}`);
    return response.data;
  },

  updateTweet: async (tweetId, content) => {
    const response = await api.patch(`/tweet/${tweetId}`, { content });
    return response.data;
  },

  deleteTweet: async (tweetId) => {
    const response = await api.delete(`/tweet/${tweetId}`);
    return response.data;
  },
};
