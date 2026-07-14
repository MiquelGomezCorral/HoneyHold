import { z } from 'zod/v4';
import { TEXT_LIMITS } from './config.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.');
const positiveAmountSchema = z.union([z.string(), z.number()])
  .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, 'Enter an amount greater than zero.')
  .transform(Number);
const nonNegativeAmountSchema = z.union([z.string(), z.number()])
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, 'Target must be a non-negative number.')
  .transform(Number);
const accountIdSchema = (message: string) => z.union([z.string(), z.number()])
  .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, message)
  .transform(Number);
const transactionTypeSchema = z.enum(['income', 'expense'], 'Type must be income or expense.');
const conceptSchema = z.string().trim().min(1, 'Enter a concept.').max(TEXT_LIMITS.concept);
const limitedText = (max: number) => z.string().trim().max(max);

export const entryFormSchema = z.discriminatedUnion('type', [
  z.object({
    type: transactionTypeSchema,
    amount: positiveAmountSchema,
    txn_date: dateSchema,
    concept: conceptSchema,
    counterparty: limitedText(TEXT_LIMITS.counterparty),
    tag: limitedText(TEXT_LIMITS.tag),
    account_id: accountIdSchema('Pick an account.'),
    is_fixed: z.boolean(),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
    start_date: dateSchema,
  }),
  z.object({
    type: z.literal('transfer'),
    amount: positiveAmountSchema,
    txn_date: dateSchema,
    concept: conceptSchema,
    from_account_id: accountIdSchema('Pick both accounts.'),
    to_account_id: accountIdSchema('Pick both accounts.'),
  }).refine((value) => value.from_account_id !== value.to_account_id, {
    message: 'Pick two different accounts.',
    path: ['to_account_id'],
  }),
]);

export const inboxApprovalSchema = z.object({
  account_id: accountIdSchema('Pick an account before approving.'),
  type: transactionTypeSchema,
  amount: positiveAmountSchema,
  txn_date: dateSchema,
  concept: conceptSchema,
  counterparty: limitedText(TEXT_LIMITS.counterparty),
  tag: limitedText(TEXT_LIMITS.tag),
});

export const goalFormSchema = z.object({
  target_amount: nonNegativeAmountSchema,
});

export function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Check the highlighted fields.';
}
