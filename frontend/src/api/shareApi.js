import config from "../config.js";

const API_URL = `${config.API_BASE_URL}/shares`;

const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
});

export const createShare = async (shareData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(shareData),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create share');
    }
    return await response.json();
};

export const getSharesForDoctor = async (doctorId, from, to) => {
    const url = new URL(`${API_URL}/doctor/${doctorId}`, window.location.origin);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const response = await fetch(url.toString(), { headers: getAuthHeader() });
    if (!response.ok) throw new Error('Failed to fetch shares');
    return await response.json();
};
