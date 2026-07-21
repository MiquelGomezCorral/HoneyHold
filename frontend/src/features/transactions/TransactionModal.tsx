import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import cn from 'classnames';
import Modal from '../../components/Modal.js';
import Button from '../../components/Button.js';
import Field from '../../components/Field.js';
import Icon from '../../components/Icon.js';
import NumberInput from '../../components/NumberInput.js';
import Toggle from '../../components/Toggle.js';
import AccountSelect from '../../components/AccountSelect.js';
import DateField from '../../components/DateField.js';
import SegmentedControl from '../../components/SegmentedControl.js';
import SelectField from '../../components/SelectField.js';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.js';
import { useI18n } from '../../i18n.js';
import { todayISO } from '../../lib/format.js';
import { TEXT_LIMITS } from '../../lib/config.js';
import { entryFormSchema, validationMessage } from '../../lib/validation.js';
import type { Account, EntryType, LedgerEntry } from '../../types.js';

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'];

const DARK_SELECTED_SURFACES = {
  expense: 'dark:bg-[#29415d]',
  income: 'dark:bg-[#31564a]',
  transfer: 'dark:bg-[#62552f]',
} as const;

const DARK_DATE_HOVER_SURFACES = {
  expense: 'dark:hover:bg-paper-blue',
  income: 'dark:hover:bg-paper-green',
  transfer: 'dark:hover:bg-paper-yellow',
} as const;

interface FormState {
  type: EntryType;
  amount: string;
  txn_date: string;
  concept: string;
  counterparty: string;
  tag: string;
  account_id: string;
  from_account_id: string;
  to_account_id: string;
  is_fixed: boolean;
  frequency: string;
  start_date: string;
}

interface Props {
  defaultType?: EntryType;
  entry?: LedgerEntry;
  onClose: () => void;
}

const blankForm = (type: EntryType): FormState => ({
  type,
  amount: '',
  txn_date: todayISO(),
  concept: '',
  counterparty: '',
  tag: '',
  account_id: '',
  from_account_id: '',
  to_account_id: '',
  is_fixed: false,
  frequency: 'monthly',
  start_date: todayISO(),
});

const formFromEntry = (entry: LedgerEntry): FormState => ({
  ...blankForm(entry.type),
  amount: String(entry.amount),
  txn_date: entry.txn_date,
  concept: entry.concept,
  tag: entry.tag_name || '',
  start_date: entry.txn_date,
  ...(entry.type === 'transfer'
    ? {
      from_account_id: String(entry.from_account_id),
      to_account_id: String(entry.to_account_id),
    }
    : {
      counterparty: entry.counterparty || '',
      account_id: entry.account_id ? String(entry.account_id) : '',
      is_fixed: entry.is_fixed === 1,
    }),
});

export default function TransactionModal({ defaultType = 'expense', entry, onClose }: Props) {
  const { profileId, bump } = useProfile();
  const { t } = useI18n();
  const { data: accounts } = useFetch<Account[]>(`/profiles/${profileId}/accounts?include_cross=1`, [profileId]);
  const { data: tags } = useFetch<{ id: number; name: string }[]>(`/profiles/${profileId}/tags`, [profileId]);
  const editing = !!entry;

  const [form, setForm] = useState<FormState>(() => entry ? formFromEntry(entry) : blankForm(defaultType));
  const [conceptEdited, setConceptEdited] = useState(editing || defaultType !== 'transfer');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  }

  const accountId = form.account_id || accounts?.[0]?.id || '';
  const fromAccountId = form.from_account_id || accounts?.[0]?.id || '';
  const toAccountId = form.to_account_id || accounts?.find((a) => String(a.id) !== String(fromAccountId))?.id || '';
  const fromAccount = accounts?.find((a) => String(a.id) === String(fromAccountId));
  const toAccount = accounts?.find((a) => String(a.id) === String(toAccountId));

  useEffect(() => {
    if (form.type !== 'transfer' || conceptEdited || !fromAccount || !toAccount) return;
    setForm((f) => ({ ...f, concept: t('entryModal.transferConcept', { from: fromAccount.name, to: toAccount.name }) }));
  }, [form.type, conceptEdited, fromAccount, toAccount, t]);

  const changeType = (type: EntryType) => {
    setConceptEdited(editing || type !== 'transfer' || !!form.concept.trim());
    setForm((f) => ({ ...f, type, is_fixed: type === 'transfer' ? false : f.is_fixed }));
  };

  function setConcept(e: ChangeEvent<HTMLInputElement>) {
    setConceptEdited(true);
    setForm((f) => ({ ...f, concept: e.target.value }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = entryFormSchema.safeParse({
      ...form,
      account_id: accountId,
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
    });
    if (!parsed.success) return setError(validationMessage(parsed.error, t));

    const values = parsed.data;

    setSaving(true);
    try {
      if (values.type === 'transfer') {
        const body = {
          type: values.type,
          profile_id: profileId,
          from_account_id: values.from_account_id,
          to_account_id: values.to_account_id,
          amount: values.amount,
          txn_date: values.txn_date,
          concept: values.concept,
        };
        if (entry) await api.put(entry.type === 'transfer' ? `/transfers/${entry.id}` : `/transactions/${entry.id}`, body);
        else await api.post(`/profiles/${profileId}/transfers`, body);
      } else {
        const body = {
          profile_id: profileId,
          account_id: values.account_id,
          type: values.type,
          amount: values.amount,
          txn_date: values.txn_date,
          concept: values.concept,
          counterparty: values.counterparty,
          tag: values.tag,
          is_fixed: values.is_fixed,
          recurrence: values.is_fixed
            ? { frequency: values.frequency, start_date: values.start_date }
            : null,
        };
        if (entry) await api.put(entry.type === 'transfer' ? `/transfers/${entry.id}` : `/transactions/${entry.id}`, body);
        else await api.post('/transactions', body);
      }
      bump();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const tagOptions = tags?.map((t) => ({ value: t.name, label: t.name })) ?? [];

  return (
    <Modal title={editing ? t('entryModal.editTitle') : t('entryModal.addTitle')} onClose={onClose} bgColor={form.type === 'income' ? 'Green' : form.type === 'transfer' ? 'Yellow' : 'Blue'}>
      <form
        className={cn('flex flex-col gap-4', {
          'dark:[&_input]:bg-paper-blue dark:[&_input]:border-[#29415d] dark:[&_select]:bg-paper-blue dark:[&_select]:border-[#29415d] dark:[&_[data-input-surface]]:bg-paper-blue dark:[&_[data-input-surface]]:border-[#29415d] dark:[&_[data-number-stepper]_button:hover]:bg-[#29415d] dark:[&_[data-number-stepper]_button:focus-visible]:bg-[#29415d]': form.type === 'expense',
          'dark:[&_input]:bg-paper-green dark:[&_input]:border-[#31564a] dark:[&_select]:bg-paper-green dark:[&_select]:border-[#31564a] dark:[&_[data-input-surface]]:bg-paper-green dark:[&_[data-input-surface]]:border-[#31564a] dark:[&_[data-number-stepper]_button:hover]:bg-[#31564a] dark:[&_[data-number-stepper]_button:focus-visible]:bg-[#31564a]': form.type === 'income',
          'dark:[&_input]:bg-paper-yellow dark:[&_input]:border-[#62552f] dark:[&_select]:bg-paper-yellow dark:[&_select]:border-[#62552f] dark:[&_[data-input-surface]]:bg-paper-yellow dark:[&_[data-input-surface]]:border-[#62552f] dark:[&_[data-number-stepper]_button:hover]:bg-[#62552f] dark:[&_[data-number-stepper]_button:focus-visible]:bg-[#62552f]': form.type === 'transfer',
        })}
        onSubmit={submit}
      >
        <SegmentedControl
          ariaLabel={t('entryModal.entryType')}
          items={[
            { value: 'expense', label: t('common.expense') },
            { value: 'income', label: t('common.income') },
            { value: 'transfer', label: t('common.transfer') },
          ]}
          value={form.type}
          onChange={changeType}
          full
          activeClassName={DARK_SELECTED_SURFACES[form.type]}
        />

        <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
          <Field label={t('common.amount')} htmlFor="tm-amount">
            <NumberInput id="tm-amount" inputMode="decimal" increment={5} min="0.01" value={form.amount} onChange={set('amount')} autoFocus required decreaseLabel={t('common.decrease')} increaseLabel={t('common.increase')} />
          </Field>
          <DateField id="tm-date" label={t('common.date')} value={form.txn_date} onChange={(v) => setForm((f) => ({ ...f, txn_date: v }))} darkPopupClassName={DARK_SELECTED_SURFACES[form.type]} darkHoverClassName={DARK_DATE_HOVER_SURFACES[form.type]} />
        </div>

        <Field label={t('common.concept')} htmlFor="tm-concept">
          <input id="tm-concept" type="text" value={form.concept} onChange={setConcept} maxLength={TEXT_LIMITS.concept} placeholder={form.type === 'transfer' ? t('entryModal.transferPlaceholder') : t('entryModal.conceptPlaceholder')} required />
        </Field>

        {form.type === 'transfer' ? (
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2.5 items-end max-sm:grid-cols-1">
            <AccountSelect
              id="tm-from-account"
              accounts={accounts ?? []}
              value={fromAccountId}
              label={t('common.from')}
              placeholder={t('entryModal.pickAccount')}
              onChange={(v) => setForm((f) => ({ ...f, from_account_id: v }))}
            />
            <Button
              variant="ghost"
              className="h-10 px-3 max-sm:w-full"
              onClick={() => setForm((f) => ({ ...f, from_account_id: String(toAccountId), to_account_id: String(fromAccountId) }))}
              aria-label={t('entryModal.swapTransferAccounts')}
            >
              <Icon src="arrows-left-right" type="black" className="h-5 w-5" title={t('entryModal.swapAccounts')} />
            </Button>
            <AccountSelect
              id="tm-to-account"
              accounts={accounts ?? []}
              value={toAccountId}
              label={t('common.to')}
              placeholder={t('entryModal.pickAccount')}
              onChange={(v) => setForm((f) => ({ ...f, to_account_id: v }))}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
              <Field label={form.type === 'income' ? t('entryModal.payer') : t('entryModal.payee')} htmlFor="tm-who">
                <input id="tm-who" type="text" value={form.counterparty} onChange={set('counterparty')} maxLength={TEXT_LIMITS.counterparty} />
              </Field>
              <SelectField
                id="tm-tag"
                label={t('common.tag')}
                value={form.tag}
                groups={[{ key: 'tags', options: tagOptions }]}
                onChange={(v) => setForm((f) => ({ ...f, tag: v.slice(0, TEXT_LIMITS.tag) }))}
              />
            </div>

            <AccountSelect
              id="tm-account"
              accounts={accounts ?? []}
              value={accountId}
              onChange={(v) => setForm((f) => ({ ...f, account_id: v }))}
            />

            <Toggle
              checked={form.is_fixed}
              onChange={(v) => setForm((f) => ({ ...f, is_fixed: v }))}
              label={(
                <span>
                  {t('entryModal.isFixed')}
                  <small className="block text-muted text-xs">{t('entryModal.fixedHelp')}</small>
                </span>
              )}
            />
          </>
        )}

        {form.type !== 'transfer' && form.is_fixed && (
          <div className="flex flex-col gap-3 pl-3.5 border-l-2 border-accent-soft">
            <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
              <Field label={t('entryModal.frequency')} htmlFor="tm-freq">
                <select id="tm-freq" value={form.frequency} onChange={set('frequency')}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{t(`entryModal.frequencies.${f}`)}</option>)}
                </select>
              </Field>
              <DateField id="tm-start" label={t('entryModal.startsOn')} value={form.start_date} onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} darkPopupClassName={DARK_SELECTED_SURFACES[form.type]} darkHoverClassName={DARK_DATE_HOVER_SURFACES[form.type]} />
            </div>
            <p className="m-0 text-xs text-muted">{t('entryModal.pastOccurrences')}</p>
          </div>
        )}

        {error && <p className="m-0 text-sm text-neg" role="alert">{error}</p>}

        <div className="flex justify-between gap-2.5 mt-1">
          <Button variant="danger-active" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('common.saving') : editing ? t('common.saveChanges') : form.type === 'income' ? t('common.addIncome') : form.type === 'transfer' ? t('common.addTransfer') : t('common.addExpense')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
