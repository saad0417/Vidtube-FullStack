import api from './axios';

export const subscriptionApi = {
  toggleSubscription: async (channelId) => {
    const response = await api.post(`/subscription/c/${channelId}`);
    return response.data;
  },

  getUserChannelSubscribers: async (channelId) => {
    const response = await api.get(`/subscription/c/${channelId}`);
    return response.data;
  },

  getSubscribedChannels: async (subscriberId) => {
    const response = await api.get(`/subscription/u/${subscriberId}`);
    return response.data;
  },
};
