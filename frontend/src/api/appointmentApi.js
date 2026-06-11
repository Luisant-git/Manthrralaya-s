import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/appointments`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const createAppointment = async (appointmentData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(appointmentData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create appointment');
    }
    return await response.json();
};

export const updateAppointmentStatus = async (id, status) => {
    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return await response.json();
};

export const updateAppointment = async (id, appointmentData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(appointmentData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update appointment');
    }
    return await response.json();
};

export const getAppointmentsByDate = async (date) => {
    const response = await fetch(`${API_URL}/date?date=${date}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return await response.json();
};

export const getAllAppointments = async () => {
    const response = await fetch(API_URL, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return await response.json();
};

export const deleteAppointment = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete appointment');
    return true;
};