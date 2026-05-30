import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/admin/DOCTOR`;

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
        
        // Transform the data to match the expected format
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