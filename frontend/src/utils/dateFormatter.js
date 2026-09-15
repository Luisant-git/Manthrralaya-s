export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Return as-is if it's already a formatted string or invalid
    return dateStr;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatTimeAMPM = (timeStr) => {
  if (!timeStr) return '09:00 AM';
  if (timeStr === 'FN') return 'Forenoon';
  if (timeStr === 'AN') return 'Afternoon';
  if (!timeStr.includes(':')) return timeStr;
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) return timeStr;
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${minutes} ${ampm}`;
};
