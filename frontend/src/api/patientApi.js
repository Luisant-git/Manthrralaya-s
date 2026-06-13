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
    const cleaned = phone ? phone.toString().replace(/\D/g, '') : '';
    const candidates = [];
    // 1) If input already has country code (starts with 91 and length>10), try with +
    if (cleaned.length > 10 && cleaned.startsWith('91')) candidates.push('+' + cleaned);
    // 2) If input is 10 digits, try +91 + last10
    if (cleaned.length === 10) candidates.push('+91' + cleaned);
    // 3) Try raw cleaned digits
    if (cleaned) candidates.push(cleaned);

    for (const candidate of candidates) {
        try {
            const url = `${API_URL}/phone/${encodeURIComponent(candidate)}`;
            console.debug('getPatientByPhone trying', candidate, url);
            const response = await fetch(url, { headers: getAuthHeader() });
            if (!response.ok) {
                if (response.status === 404) continue;
                console.warn('getPatientByPhone fetch failed for', candidate, response.status);
                continue;
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error fetching patient for', candidate, error);
            continue;
        }
    }

    // final attempt: try original input as-is
    try {
        const url = `${API_URL}/phone/${encodeURIComponent(phone)}`;
        console.debug('getPatientByPhone final attempt', phone, url);
        const response = await fetch(url, { headers: getAuthHeader() });
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to fetch patient');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching patient (final):', error);
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