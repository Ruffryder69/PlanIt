export type HolidayMap = { [date: string]: string };

export const BUNDESLAENDER = [
  { id: 'BW', name: 'Baden-Württemberg' },
  { id: 'BY', name: 'Bayern' },
  { id: 'BE', name: 'Berlin' },
  { id: 'BB', name: 'Brandenburg' },
  { id: 'HB', name: 'Bremen' },
  { id: 'HH', name: 'Hamburg' },
  { id: 'HE', name: 'Hessen' },
  { id: 'MV', name: 'Mecklenburg-Vorpommern' },
  { id: 'NI', name: 'Niedersachsen' },
  { id: 'NW', name: 'Nordrhein-Westfalen' },
  { id: 'RP', name: 'Rheinland-Pfalz' },
  { id: 'SL', name: 'Saarland' },
  { id: 'SN', name: 'Sachsen' },
  { id: 'ST', name: 'Sachsen-Anhalt' },
  { id: 'SH', name: 'Schleswig-Holstein' },
  { id: 'TH', name: 'Thüringen' },
];

export function getHolidays(year: number, bundesland: string): HolidayMap {
  const holidays: HolidayMap = {};

  const add = (month: number, day: number, name: string) => {
    const key = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    holidays[key] = name;
  };

  // Ostern berechnen (Gaußsche Formel)
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, easterMonth - 1, easterDay);

  const addEasterOffset = (offset: number, name: string) => {
    const d = new Date(easter);
    d.setDate(d.getDate() + offset);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    holidays[key] = name;
  };

  // Bundesweite Feiertage
  add(1, 1, 'Neujahr');
  addEasterOffset(-2, 'Karfreitag');
  addEasterOffset(0, 'Ostersonntag');
  addEasterOffset(1, 'Ostermontag');
  add(5, 1, 'Tag der Arbeit');
  addEasterOffset(39, 'Christi Himmelfahrt');
  addEasterOffset(49, 'Pfingstsonntag');
  addEasterOffset(50, 'Pfingstmontag');
  add(10, 3, 'Tag der Deutschen Einheit');
  add(12, 25, '1. Weihnachtstag');
  add(12, 26, '2. Weihnachtstag');

  // Bundesland-spezifisch
  if (['BW','BY','ST'].includes(bundesland)) add(1, 6, 'Heilige Drei Könige');
  if (['BW','BY','HE','NW','RP','SL'].includes(bundesland)) addEasterOffset(60, 'Fronleichnam');
  if (['BY','SL'].includes(bundesland)) add(8, 15, 'Mariä Himmelfahrt');
  if (['BB','MV','SN','ST','TH'].includes(bundesland)) add(10, 31, 'Reformationstag');
  if (['BW','BY','NW','RP','SL'].includes(bundesland)) add(11, 1, 'Allerheiligen');
  if (bundesland === 'SN') add(11, 20, 'Buß- und Bettag');

  return holidays;
}