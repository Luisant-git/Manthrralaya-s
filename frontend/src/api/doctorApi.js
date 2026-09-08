import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/admin/DOCTOR`;
const BASE_URL = `${config.API_BASE_URL}/admin`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const getDoctors = async () => {
    try {
        const response = await fetch(API_URL, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Failed to fetch doctors');
        const result = await response.json();
        
        const doctors = result.data.map(doc => ({
            id: doc.id,
            name: doc.user?.fullName || `Doctor ${doc.id}`,
            specialization: doc.specialization,
            status: doc.status,
            user: doc.user,
            designation: doc.specialization
        }));
        
        return doctors;
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
};

export const getDoctorsPatientStats = async (from, to) => {
    try {
        const fromParam = from || new Date().toISOString().split('T')[0];
        const toParam = to || fromParam;
        const response = await fetch(`${BASE_URL}/doctors/patient-stats?from=${fromParam}&to=${toParam}`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Failed to fetch doctor patient stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching doctor patient stats:', error);
        return { success: false, data: [] };
    }
};

export const getDoctorPatientDetail = async (doctorId, from, to) => {
    try {
        const fromParam = from || new Date().toISOString().split('T')[0];
        const toParam = to || fromParam;
        const response = await fetch(`${BASE_URL}/doctors/${doctorId}/patient-detail?from=${fromParam}&to=${toParam}`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Failed to fetch doctor patient detail');
        return await response.json();
    } catch (error) {
        console.error('Error fetching doctor patient detail:', error);
        return { success: false };
    }
};