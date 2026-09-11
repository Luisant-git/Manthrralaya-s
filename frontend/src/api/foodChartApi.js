import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/food-chart`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const createFoodChart = async (data) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create food chart entry');
    }
    return await response.json();
};

export const getFoodChartsByConsultation = async (consultationId) => {
    const response = await fetch(`${API_URL}/consultation/${consultationId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch food charts');
    return await response.json();
};

export const getFoodChartsByPatient = async (patientId) => {
    const response = await fetch(`${API_URL}/patient/${patientId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch food charts');
    return await response.json();
};

export const updateFoodChart = async (id, data) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update food chart entry');
    }
    return await response.json();
};
