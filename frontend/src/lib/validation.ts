import { z } from 'zod/v4';
import { TEXT_LIMITS } from './config.js';

export const entryFormSchema = z.object({
  concept: z.string().trim().min(1).max(TEXT_LIMITS.concept),
  counterparty: z.string().max(TEXT_LIMITS.counterparty),
  tag: z.string().max(TEXT_LIMITS.tag),
});

export type EntryFormData = z.infer<typeof entryFormSchema>;
