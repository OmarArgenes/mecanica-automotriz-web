export function formatDate(value?: string): string {
  if (!value) {
    return '-';
  }

  const [year, month, day] = value.split('-');

  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatTime(value?: string): string {
  if (!value) {
    return '-';
  }

  return value.slice(0, 5);
}

export function formatDateAndTime(date?: string, time?: string): string {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  if (formattedDate === '-' && formattedTime === '-') {
    return '-';
  }

  if (formattedTime === '-') {
    return formattedDate;
  }

  return `${formattedDate} ${formattedTime}`;
}

export function formatTimestamp(value?: string, fallbackDate?: string): string {
  if (!value) {
    return formatDate(fallbackDate);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(',', '');
}
