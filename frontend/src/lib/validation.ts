import { z } from 'zod/v4';
import { TEXT_LIMITS } from './config.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.dateFormat');
const positiveAmountSchema = z.union([z.string(), z.number()])
  .transform((value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100)
  .refine((value) => Number.isFinite(value) && value > 0, 'validation.amountPositive');
const nonNegativeAmountSchema = z.union([z.string(), z.number()])
  .transform((value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100)
  .refine((value) => Number.isFinite(value) && value >= 0, 'validation.targetNonNegative');
const accountIdSchema = (message: string) => z.union([z.string(), z.number()])
  .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, message)
  .transform(Number);
const transactionTypeSchema = z.enum(['income', 'expense'], 'validation.typeIncomeExpense');
const conceptSchema = z.string().trim().min(1, 'validation.conceptRequired').max(TEXT_LIMITS.concept);
const limitedText = (max: number) => z.string().trim().max(max);

export const entryFormSchema = z.discriminatedUnion('type', [
  z.object({
    type: transactionTypeSchema,
    amount: positiveAmountSchema,
    txn_date: dateSchema,
    concept: conceptSchema,
    counterparty: limitedText(TEXT_LIMITS.counterparty),
    tag: limitedText(TEXT_LIMITS.tag),
    account_id: accountIdSchema('validation.pickAccount'),
    is_fixed: z.boolean(),
    frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
    start_date: dateSchema,
  }),
  z.object({
    type: z.literal('transfer'),
    amount: positiveAmountSchema,
    txn_date: dateSchema,
    concept: conceptSchema,
    from_account_id: accountIdSchema('validation.pickBothAccounts'),
    to_account_id: accountIdSchema('validation.pickBothAccounts'),
  }).refine((value) => value.from_account_id !== value.to_account_id, {
    message: 'validation.pickDifferentAccounts',
    path: ['to_account_id'],
  }),
]);

export const inboxApprovalSchema = z.object({
  account_id: accountIdSchema('validation.pickAccountBeforeApprove'),
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

export function validationMessage(error: z.ZodError, t?: (key: string) => string) {
  const message = error.issues[0]?.message ?? 'validation.checkFields';
  return t ? t(message) : message;
}
