import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/auth`;

const post = async (path, body) => {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const authApi = {
  login: async (data) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    const result = await response.json();
    if (result.access_token) {
      localStorage.setItem('access_token', result.access_token);
    }
    return result;
  },

  adminRequestOtp: async (phone) => {
    const data = await post('/admin-forgot-pin/request-otp', { phone });
    if (data.debug_otp) {
      console.log('🔐 Admin OTP (dev):', data.debug_otp);
    }
    return data;
  },

  adminVerifyOtp: async (phone, otp) => {
    return await post('/admin-forgot-pin/verify-otp', { phone, otp });
  },

  adminResetPin: async (phone, otp, newPin) => {
    return await post('/admin-forgot-pin/reset', { phone, otp, newPin });
  },
};