import { fetchSlot } from '../services/enable-banking.service.js';

const SLOT_HOURS = [0, 8, 13, 18];
let running = false;

function atHour(date: Date, hour: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0, 0);
}

export function latestFetchSlot(now = new Date()): Date {
  for (const hour of [...SLOT_HOURS].reverse()) {
    const slot = atHour(now, hour);
    if (slot <= now) return slot;
  }
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return atHour(yesterday, SLOT_HOURS.at(-1)!);
}

export function nextFetchSlot(now = new Date()): Date {
  for (const hour of SLOT_HOURS) {
    const slot = atHour(now, hour);
    if (slot > now) return slot;
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return atHour(tomorrow, SLOT_HOURS[0]);
}

async function run(slot: Date) {
  if (running) return;
  running = true;
  try {
    await fetchSlot(slot);
  } catch (error) {
    console.warn('[enable-banking] run failed:', error instanceof Error ? error.message : error);
  } finally {
    running = false;
  }
}

export function scheduleEnableBankingFetches() {
  setTimeout(() => void run(latestFetchSlot()), 3000);

  const scheduleNext = () => {
    const next = nextFetchSlot();
    setTimeout(async () => {
      await run(next);
      scheduleNext();
    }, next.getTime() - Date.now());
  };

  scheduleNext();
}
