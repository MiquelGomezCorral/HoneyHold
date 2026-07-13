import SelectField from './SelectField.js';
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
  const { profileId, profile } = useProfile();
  const groups = accounts.reduce<{ key: string; label: string; options: { value: number; label: string }[] }[]>((acc, account) => {
    const key = `${account.profile_id ?? 'none'}:${account.profile_name ?? 'Accounts'}`;
    let group = acc.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        label: account.profile_id === profileId ? profile?.display_name || account.profile_name || 'Accounts' : account.profile_name || 'Accounts',
        options: [],
      };
      acc.push(group);
    }
    group.options.push({ value: account.id, label: account.name });
    return acc;
  }, []);

  return (
    <SelectField id={id} label={label} value={value} groups={groups} onChange={onChange} placeholder={placeholder} className={className} />
  );
}
