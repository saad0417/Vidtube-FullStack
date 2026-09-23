import api from './axios';

export const captchaApi = {
  getCaptcha: async () => {
    const response = await api.get('/captcha');
    return response.data;
  },
};
