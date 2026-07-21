import { readFileSync } from 'node:fs';

const config = Object.fromEntries(readFileSync(new URL('./protected-tags.conf', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));

export const PROTECTED_ONES = Object.values(config);
export const FALLBACK_TAG = config.fallback;
export const TRANSFER_TAG = config.transfer;
