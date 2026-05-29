import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/auth`;

export const authApi = {
  login: async (data) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const result = await response.json();

    // Optional: store token
    if (result.access_token) {
      localStorage.setItem('access_token', result.access_token);
    }

    return result;
  },
};