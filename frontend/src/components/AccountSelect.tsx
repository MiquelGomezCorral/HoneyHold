import Field from './Field.js';
import { useProfile } from '../context/ProfileContext.js';
import type { Account } from '../types.js';

interface AccountSelectProps {
  id: string;
  accounts: Account[];
  value: string | number;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function AccountSelect({
  id,
  accounts,
  value,
  onChange,
  label = 'Account',
  placeholder,
  className,
}: AccountSelectProps) {
  const { profileId } = useProfile();
  const groups = accounts.reduce<{ key: string; label: string; accounts: Account[] }[]>((acc, account) => {
    const key = `${account.profile_id ?? 'none'}:${account.profile_name ?? 'Accounts'}`;
    let group = acc.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        label: account.profile_id === profileId ? 'Current profile' : account.profile_name || 'Accounts',
        accounts: [],
      };
      acc.push(group);
    }
    group.accounts.push(account);
    return acc;
  }, []);

  return (
    <Field label={label} htmlFor={id} className={className}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder != null && <option value="">{placeholder}</option>}
        {groups.map((group) => (
          <optgroup key={group.key} label={group.label}>
            {group.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </Field>
  );
}
