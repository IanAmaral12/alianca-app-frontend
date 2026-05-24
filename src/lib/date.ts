export function onlyDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 8);
}

export function formatDateInput(value: string) {
  const digits = onlyDigits(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isValidBrazilianDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return false;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function brazilianDateToIso(value: string) {
  if (!isValidBrazilianDate(value)) {
    return null;
  }

  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

export function isoDateToBrazilian(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function brazilianDateToIsoDateTime(value: string) {
  const isoDate = brazilianDateToIso(value);

  if (!isoDate) {
    return null;
  }

  return `${isoDate}T18:00:00.000Z`;
}