import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/consultations`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const getAllConsultations = async () => {
    const response = await fetch(API_URL, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch consultations');
    return response.json();
};

export const getConsultationById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch consultation');
    return response.json();
};

export const getConsultationsByPatient = async (patientId) => {
    const response = await fetch(`${API_URL}/patient/${patientId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch patient consultations');
    return response.json();
};

export const getConsultationsByDoctor = async (doctorId) => {
    const response = await fetch(`${API_URL}/doctor/${doctorId}`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch doctor consultations');
    return response.json();
};

export const getPendingFollowups = async () => {
    const response = await fetch(`${API_URL}/followups/pending`, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch pending followups');
    return response.json();
};

export const createConsultation = async (consultationData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(consultationData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create consultation');
    }
    return response.json();
};

export const updateConsultation = async (id, consultationData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(consultationData)
    });
    if (!response.ok) throw new Error('Failed to update consultation');
    return response.json();
};

export const deleteConsultation = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete consultation');
    return true;
};