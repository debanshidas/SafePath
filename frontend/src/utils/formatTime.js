// Check-in times arrive either as a UTC ISO instant (from the API) or as an
// already-formatted local string (from the offline store). Render both.
export function formatCheckInTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
