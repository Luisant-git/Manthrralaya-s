const BASE_URL = 'http://localhost:3000/appointments';

export const createAppointment = async (appointmentData) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create appointment');
  }
  return await response.json();
};

export const updateAppointmentStatus = async (id, status) => {
  const response = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update status');
  return await response.json();
};

export const getAppointmentsByDate = async (date) => {
  const response = await fetch(`${BASE_URL}/date?date=${date}`);
  if (!response.ok) throw new Error('Failed to fetch appointments');
  return await response.json();
};

export const deleteAppointment = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete appointment');
  return true;
};