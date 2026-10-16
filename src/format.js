// форматування тривалості (хвилини) у людський вигляд
export function dur(min) {
  if (min == null || isNaN(min)) return '—';
  if (min < 1) return '<1 хв';
  if (min < 60) return `${Math.round(min)} хв`;
  if (min < 60 * 24) return `${(min / 60).toFixed(1).replace('.', ',')} год`;
  return `${(min / 1440).toFixed(1).replace('.', ',')} дн`;
}

// коротка тривалість для вузлів графа
export function durShort(min) {
  if (min == null || isNaN(min)) return '—';
  if (min < 60) return `${Math.round(min)}хв`;
  if (min < 60 * 24) return `${(min / 60).toFixed(1).replace('.', ',')}г`;
  return `${(min / 1440).toFixed(1).replace('.', ',')}д`;
}

// число з розділювачем тисяч (нерозривний пробіл)
export function num(n) {
  return Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ');
}

export function pct(x) {
  return `${Math.round(x * 100)}%`;
}

// колір теплової шкали: зелений → амбер → червоний (t у 0..1)
export function heat(t) {
  const g = [42, 214, 96], a = [245, 169, 46], r = [236, 30, 28];
  t = Math.max(0, Math.min(1, t));
  const lerp = (c0, c1, f) => c0.map((v, i) => Math.round(v + (c1[i] - v) * f));
  const c = t < 0.5 ? lerp(g, a, t / 0.5) : lerp(a, r, (t - 0.5) / 0.5);
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export const SEV = {
  high: { color: 'var(--red)', soft: 'var(--red-soft)', label: 'критичне' },
  medium: { color: 'var(--amber)', soft: 'var(--amber-soft)', label: 'помірне' },
  none: { color: 'var(--green)', soft: 'var(--green-soft)', label: 'у нормі' },
};

// дата у форматі «лип 2026»
export function monthLabel(iso) {
  if (!iso) return '';
  const m = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер',
    'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
  const d = new Date(iso);
  return `${m[d.getMonth()]} ${d.getFullYear()}`;
}
