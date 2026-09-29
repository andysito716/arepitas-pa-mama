import { WeekInfo } from '../types/weekly';

const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES_SHORT_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Returns ISO week number and year
 */
export function getIsoWeekNumber(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

/**
 * Returns the Monday of a given ISO week
 */
export function getMondayOfIsoWeek(year: number, week: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay();
  const ISOweekStart = new Date(simple);
  if (dayOfWeek <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  return ISOweekStart;
}

export function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseYMDToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekInfo(dateOrWeekId?: string | Date): WeekInfo {
  let targetYear: number;
  let targetWeek: number;

  if (typeof dateOrWeekId === 'string' && dateOrWeekId.includes('-W')) {
    const parts = dateOrWeekId.split('-W');
    targetYear = parseInt(parts[0], 10);
    targetWeek = parseInt(parts[1], 10);
  } else {
    const d = dateOrWeekId instanceof Date 
      ? dateOrWeekId 
      : (dateOrWeekId ? parseYMDToDate(dateOrWeekId) : new Date());
    const iso = getIsoWeekNumber(d);
    targetYear = iso.year;
    targetWeek = iso.week;
  }

  const monday = getMondayOfIsoWeek(targetYear, targetWeek);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const days: WeekInfo['days'] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setUTCDate(monday.getUTCDate() + i);
    const ymd = formatDateToYMD(dayDate);
    const dayOfWeek = dayDate.getDay();
    const dayName = DAY_NAMES_ES[dayOfWeek];
    const shortDate = `${dayDate.getDate()} ${MONTH_NAMES_SHORT_ES[dayDate.getMonth()]}`;
    days.push({
      date: ymd,
      dayName,
      shortDate
    });
  }

  const startShort = `${monday.getUTCDate()} ${MONTH_NAMES_SHORT_ES[monday.getUTCMonth()]}`;
  const endShort = `${sunday.getUTCDate()} ${MONTH_NAMES_SHORT_ES[sunday.getUTCMonth()]}`;

  return {
    id: `${targetYear}-W${String(targetWeek).padStart(2, '0')}`,
    year: targetYear,
    weekNumber: targetWeek,
    startDate: formatDateToYMD(monday),
    endDate: formatDateToYMD(sunday),
    label: `Semana ${targetWeek} (${startShort} - ${endShort} ${targetYear})`,
    days
  };
}

export function getPreviousWeekId(currentWeekId: string): string {
  const [yearStr, weekStr] = currentWeekId.split('-W');
  let year = parseInt(yearStr, 10);
  let week = parseInt(weekStr, 10) - 1;
  if (week < 1) {
    year -= 1;
    week = 52;
  }
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function getNextWeekId(currentWeekId: string): string {
  const [yearStr, weekStr] = currentWeekId.split('-W');
  let year = parseInt(yearStr, 10);
  let week = parseInt(weekStr, 10) + 1;
  if (week > 52) {
    year += 1;
    week = 1;
  }
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount).replace('COP', '$').trim();
}

export function getDayNameForDate(dateStr: string): string {
  const d = parseYMDToDate(dateStr);
  return DAY_NAMES_ES[d.getDay()] || 'Hoy';
}
