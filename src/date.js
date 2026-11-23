export function getDateContext(now = new Date(), timeZone = 'Asia/Jakarta') {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const dayName = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  })
    .format(now)
    .toUpperCase();

  return { dateStr, dayName };
}

export function isWithinDateRange(dateStr, startIso, endIso, timeZone = 'Asia/Jakarta') {
  if (!startIso || !endIso) {
    return true;
  }

  const startDate = getDateContext(new Date(startIso), timeZone).dateStr;
  const endDate = getDateContext(new Date(endIso), timeZone).dateStr;

  return dateStr >= startDate && dateStr <= endDate;
}
