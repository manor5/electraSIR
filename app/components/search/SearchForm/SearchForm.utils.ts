import { SearchResult } from '@/app/actions/searchActions';

export const getRelationText = (relationCode: string = ''): string => {
  const relationMap: { [key: string]: string } = {
    'த': 'தந்தை',
    'தா': 'தாத்தா',
    'f': 'தந்தை',
    'tha': 'தந்தை',
    'க': 'கணவர்',
    'h': 'கணவர்',
    'கா': 'கணவர்',
    'ka': 'கணவர்',
    'தய்': 'தாய்',
    'thay': 'தாய்',
    'm': 'தாய்',
    'ம': 'மனைவி',
    'ma': 'மனைவி',
    'அ': 'அண்ணன்',
    'an': 'அண்ணன்',
    'தம்': 'தம்பி',
    'tham': 'தம்பி',
    'அக்': 'அக்கா',
    'akka': 'அக்கா',
    'தங்': 'தங்கை',
    'thangai': 'தங்கை',
  };
  return relationMap[(relationCode || '').toLowerCase()] || relationCode || '';
};

export const getGenderText = (genderCode: string = ''): string => {
  const genderMap: { [key: string]: string } = {
    'ஆ': 'ஆண்',
    'aa': 'ஆண்',
    'aan': 'ஆண்',
    'பெ': 'பெண்',
    'pe': 'பெண்',
    'pen': 'பெண்',
    'm': 'ஆண்',
    'male': 'ஆண்',
    'f': 'பெண்',
    'female': 'பெண்',
  };
  return genderMap[(genderCode || '').toLowerCase()] || genderCode || '';
};

export const displayDoor = (door?: string | null) => {
  if (door === undefined || door === null) return '-';
  const d = String(door).trim();
  if (d === '' || d.toLowerCase() === 'null') return '-';
  return d;
};

export const displayEpic = (epic?: string | null) => {
  if (epic === undefined || epic === null) return '-';
  const e = String(epic).trim();
  if (e === '' || e.toLowerCase() === 'null') return '-';
  return e;
};

export const isDoorValid = (r?: SearchResult) => {
  if (!r) return false;
  const d = r.door_no;
  return !!(d && String(d).trim() !== '' && String(d).toLowerCase() !== 'null');
};
