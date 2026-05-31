import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/admin`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const userApi = {
    // Get all users by role (RECEPTIONIST, DOCTOR, ADMIN)
    getUsersByRole: async (role) => {
        try {
            console.log(`🟢 Calling API: ${API_URL}/${role}`);
            const response = await fetch(`${API_URL}/${role}`, {
                headers: getAuthHeader()
            });
            
            console.log(`🟢 Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`🔴 API Error ${response.status}:`, errorText);
                throw new Error(`Failed to fetch staff list: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`🟢 API Response for ${role}:`, result);
            return result;
        } catch (error) {
            console.error(`🔴 Error in getUsersByRole(${role}):`, error);
            throw error;
        }
    },

    // Create a new user with a specific role
    createUser: async (role, userData) => {
        const response = await fetch(`${API_URL}/${role}`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to create staff member');
        return result;
    },

    // Update doctor availability status
    updateDoctorStatus: async (doctorId, status) => {
        const response = await fetch(`${API_URL}/doctor/${doctorId}/status`, {
            method: 'PATCH',
            headers: getAuthHeader(),
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to update doctor status');
        return response.json();
    },

    // Update existing user details
    updateUser: async (userId, userData) => {
        const response = await fetch(`${API_URL}/user/${userId}`, {
            method: 'PATCH',
            headers: getAuthHeader(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to update staff member');
        return response.json();
    },

    // Reset staff PIN
    resetPin: async (userId, pin) => {
        const response = await fetch(`${API_URL}/user/${userId}/pin`, {
            method: 'PATCH',
            headers: getAuthHeader(),
            body: JSON.stringify({ pin })
        });
        if (!response.ok) throw new Error('Failed to reset PIN');
        return response.json();
    },

    // Toggle user active/inactive status
    updateStatus: async (userId, isActive) => {
        const response = await fetch(`${API_URL}/user/${userId}/status`, {
            method: 'PATCH',
            headers: getAuthHeader(),
            body: JSON.stringify({ isActive })
        });
        if (!response.ok) throw new Error('Failed to update status');
        return response.json();
    },

    // Delete user
    deleteUser: async (userId) => {
        const response = await fetch(`${API_URL}/user/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return response.json();
    }
};