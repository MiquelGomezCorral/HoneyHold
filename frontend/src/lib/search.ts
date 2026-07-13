export interface SearchField<T> {
  key: string;
  score: number;
  exactOnly?: boolean;
  text: (item: T) => string | string[];
}

interface SearchOptions {
  fuzzyDistance?: number;
  fuzzyWeight?: number;
}

const WORD_SPLIT_RE = /[^\p{L}\p{N}+#.-]+/u;

export function searchItems<T>(items: T[], query: string, fields: SearchField<T>[], options: SearchOptions = {}) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return items;

  const fuzzyDistance = options.fuzzyDistance ?? 1;
  const fuzzyWeight = options.fuzzyWeight ?? 0.1;

  return items
    .map((item, index) => ({ item, index, ...scoreItem(item, tokens, fields, fuzzyDistance, fuzzyWeight) }))
    .filter((result) => result.passes)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

function scoreItem<T>(item: T, tokens: string[], fields: SearchField<T>[], fuzzyDistance: number, fuzzyWeight: number) {
  const passed = new Array<boolean>(tokens.length).fill(false);
  let score = 0;

  tokens.forEach((token, tokenIndex) => {
    for (const field of fields) {
      const values = [field.text(item)].flat().map(normalizeText).filter(Boolean);
      if (values.some((value) => value.includes(token))) {
        score += field.score;
        passed[tokenIndex] = true;
        continue;
      }
      if (field.exactOnly) continue;
      if (values.some((value) => splitWords(value).some((word) => levenshtein(token, word, fuzzyDistance)))) {
        score += field.score * fuzzyWeight;
        passed[tokenIndex] = true;
      }
    }
  });

  return { score, passes: passed.every(Boolean) };
}

function tokenize(query: string) {
  return splitWords(normalizeText(query));
}

function splitWords(text: string) {
  return text.split(WORD_SPLIT_RE).filter(Boolean);
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function levenshtein(a: string, b: string, maxDistance: number) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > maxDistance) return false;
  if (maxDistance === 1) return levenshtein1(a, b);
  return levenshteinDP(a, b, maxDistance);
}

function levenshtein1(a: string, b: string) {
  if (a.length === b.length) {
    let diffs = 0;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i] && ++diffs > 1) return false;
    }
    return diffs === 1;
  }

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  let i = 0;
  let j = 0;
  let skipped = false;
  while (i < longer.length && j < shorter.length) {
    if (longer[i] !== shorter[j]) {
      if (skipped) return false;
      skipped = true;
      i += 1;
    } else {
      i += 1;
      j += 1;
    }
  }
  return true;
}

function levenshteinDP(a: string, b: string, maxDistance: number) {
  const prev = new Uint16Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    let prevDiag = prev[0];
    prev[0] = i;
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const entry = Math.min(prevDiag + cost, prev[j] + 1, prev[j - 1] + 1);
      prevDiag = prev[j];
      prev[j] = entry;
      if (entry < rowMin) rowMin = entry;
    }
    if (rowMin > maxDistance) return false;
  }
  return prev[b.length] <= maxDistance;
}
