import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/menu-permission`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const menuPermissionApi = {
    // Get permissions for the logged-in user's role
    getMyPermissions: async () => {
        const response = await fetch(`${API_URL}/my`, {
            headers: getAuthHeader()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch menu permissions');
        }
        return response.json();
    },

    // Get all roles' menu permissions (Admin)
    getAll: async () => {
        const response = await fetch(`${API_URL}/all`, {
            headers: getAuthHeader()
        });
        if (!response.ok) {
            throw new Error('Failed to fetch all menu permissions');
        }
        return response.json();
    },

    // Create/update menu permissions for a role (Admin)
    upsert: async (role, permissions) => {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ role, permissions })
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to update menu permissions');
        }
        return response.json();
    }
};