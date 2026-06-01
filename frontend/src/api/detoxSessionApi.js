import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/detox-sessions`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const getAllDetoxSessions = async () => {
    const response = await fetch(API_URL, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch detox sessions');
    return response.json();
};

export const getDetoxSessionById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch detox session');
    return response.json();
};

export const getDetoxSessionsByPatient = async (patientId) => {
    const response = await fetch(`${API_URL}/patient/${patientId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch patient detox sessions');
    return response.json();
};

export const getPatientDetoxProgress = async (patientId) => {
    const response = await fetch(`${API_URL}/patient/${patientId}/progress`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch patient detox progress');
    return response.json();
};

export const getDetoxSessionsByDoctor = async (doctorId) => {
    const response = await fetch(`${API_URL}/doctor/${doctorId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch doctor detox sessions');
    return response.json();
};

export const getUpcomingDetoxFollowups = async () => {
    const response = await fetch(`${API_URL}/followups/upcoming`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch upcoming followups');
    return response.json();
};

export const createDetoxSession = async (detoxData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(detoxData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create detox session');
    }
    return response.json();
};

export const updateDetoxSession = async (id, detoxData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(detoxData)
    });
    if (!response.ok) throw new Error('Failed to update detox session');
    return response.json();
};

export const deleteDetoxSession = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete detox session');
    return true;
};