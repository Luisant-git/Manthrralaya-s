import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/doctor-schedule`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const getDoctorSchedule = async (doctorId, from, to) => {
    const response = await fetch(`${API_URL}/${doctorId}?from=${from}&to=${to}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch doctor schedule');
    return await response.json();
};

export const saveDoctorSchedule = async (doctorId, days) => {
    const response = await fetch(`${API_URL}/week`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ doctorId, days })
    });
    if (!response.ok) {
        let message = 'Failed to save doctor schedule';
        try {
            const body = await response.json();
            if (body?.message) message = body.message;
        } catch (_) { /* ignore */ }
        throw new Error(message);
    }
    return await response.json();
};