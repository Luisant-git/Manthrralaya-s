import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/patients`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

// Helper to format phone number
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    let cleaned = phone.toString().replace(/\D/g, '');
    // Add +91 if not present and length is 10
    if (cleaned.length === 10) {
        cleaned = '+91' + cleaned;
    }
    return cleaned;
};

export const getPatientByPhone = async (phone) => {
    const formattedPhone = formatPhoneNumber(phone);
    try {
        const response = await fetch(`${API_URL}/phone/${encodeURIComponent(formattedPhone)}`, {
            headers: getAuthHeader()
        });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to fetch patient');
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error fetching patient:', error);
        return null;
    }
};

export const createPatient = async (patientData) => {
    const formattedData = {
        ...patientData,
        phone: formatPhoneNumber(patientData.phone),
        whatsapp: patientData.whatsapp ? formatPhoneNumber(patientData.whatsapp) : undefined
    };
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(formattedData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create patient');
    }
    return response.json();
};

export const getAllPatients = async () => {
    const response = await fetch(API_URL, {
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
};

export const updatePatient = async (id, patientData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(patientData)
    });
    if (!response.ok) throw new Error('Failed to update patient');
    return response.json();
};

export const deletePatient = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete patient');
    return response.json();
};