import { useMemo, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { api } from '../../api/client.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useProfile } from '../../context/ProfileContext.jsx';
import { todayISO } from '../../lib/format.js';

const FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'];

// The one entry form for the whole app: navbar on desktop, the two big
// buttons on mobile. "Is fixed?" expands the recurrence definition; the
// backend then creates a rule and materializes the due occurrences.
export default function TransactionModal({ defaultType = 'expense', onClose }) {
  const { profileId, bump } = useProfile();
  const { data: accounts } = useFetch(`/profiles/${profileId}/accounts`, [profileId]);
  const { data: tags } = useFetch(`/profiles/${profileId}/tags`, [profileId]);

  const [form, setForm] = useState(() => ({
    type: defaultType,
    amount: '',
    txn_date: todayISO(),
    concept: '',
    counterparty: '',
    tag: '',
    account_id: '',
    is_fixed: false,
    frequency: 'monthly',
    start_date: todayISO(),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const accountId = useMemo(
    () => form.account_id || accounts?.[0]?.id || '',
    [form.account_id, accounts]
  );

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!(Number(form.amount) > 0)) return setError('Enter an amount greater than zero.');
    if (!form.concept.trim()) return setError('Enter a concept.');
    if (!accountId) return setError('Pick an account.');

    setSaving(true);
    try {
      await api.post('/transactions', {
        profile_id: profileId,
        account_id: Number(accountId),
        type: form.type,
        amount: Number(form.amount),
        txn_date: form.txn_date,
        concept: form.concept,
        counterparty: form.counterparty,
        tag: form.tag,
        is_fixed: form.is_fixed,
        recurrence: form.is_fixed
          ? { frequency: form.frequency, start_date: form.start_date }
          : null,
      });
      bump();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Add entry" onClose={onClose}>
      <form className="entry-form" onSubmit={submit}>
        <div className="seg full" role="group" aria-label="Entry type">
          <button type="button" className={form.type === 'expense' ? 'on' : ''} onClick={() => setForm((f) => ({ ...f, type: 'expense' }))}>
            Expense
          </button>
          <button type="button" className={form.type === 'income' ? 'on' : ''} onClick={() => setForm((f) => ({ ...f, type: 'income' }))}>
            Income
          </button>
        </div>

        <div className="grid2">
          <div className="field">
            <label htmlFor="tm-amount">Amount (€)</label>
            <input id="tm-amount" type="number" inputMode="decimal" step="0.01" min="0.01" value={form.amount} onChange={set('amount')} autoFocus required />
          </div>
          <div className="field">
            <label htmlFor="tm-date">Date</label>
            <input id="tm-date" type="date" value={form.txn_date} onChange={set('txn_date')} required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="tm-concept">Concept</label>
          <input id="tm-concept" type="text" value={form.concept} onChange={set('concept')} placeholder="Groceries at Mercadona" required />
        </div>

        <div className="grid2">
          <div className="field">
            <label htmlFor="tm-who">{form.type === 'income' ? 'Payer' : 'Payee'}</label>
            <input id="tm-who" type="text" value={form.counterparty} onChange={set('counterparty')} />
          </div>
          <div className="field">
            <label htmlFor="tm-tag">Tag</label>
            <input id="tm-tag" type="text" list="tm-tags" value={form.tag} onChange={set('tag')} placeholder="Pick or type a new one" />
            <datalist id="tm-tags">
              {(tags || []).map((t) => (
                <option key={t.id} value={t.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="field">
          <label htmlFor="tm-account">Account</label>
          <select id="tm-account" value={accountId} onChange={set('account_id')}>
            {(accounts || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <label className="switch-row">
          <span className="switch">
            <input type="checkbox" checked={form.is_fixed} onChange={set('is_fixed')} />
            <i />
          </span>
          <span>
            Is fixed?
            <small>Repeats automatically as a recurring entry</small>
          </span>
        </label>

        {form.is_fixed && (
          <div className="fixed-block">
            <div className="grid2">
              <div className="field">
                <label htmlFor="tm-freq">Frequency</label>
                <select id="tm-freq" value={form.frequency} onChange={set('frequency')}>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f[0].toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="tm-start">Starts on</label>
                <input id="tm-start" type="date" value={form.start_date} onChange={set('start_date')} required />
              </div>
            </div>
            <p className="hint">Past occurrences since the start date are added right away.</p>
          </div>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving…' : form.type === 'income' ? 'Add income' : 'Add expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
