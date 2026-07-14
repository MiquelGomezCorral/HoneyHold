import SelectField from './SelectField.js';
import { useProfile } from '../context/ProfileContext.js';
import { useI18n } from '../i18n.js';
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
  label,
  placeholder,
  className,
}: AccountSelectProps) {
  const { profileId, profile } = useProfile();
  const { t } = useI18n();
  const groups = accounts.reduce<{ key: string; label: string; options: { value: number; label: string }[] }[]>((acc, account) => {
    const key = `${account.profile_id ?? 'none'}:${account.profile_name ?? t('common.accounts')}`;
    let group = acc.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        label: account.profile_id === profileId ? profile?.display_name || account.profile_name || t('common.accounts') : account.profile_name || t('common.accounts'),
        options: [],
      };
      acc.push(group);
    }
    group.options.push({ value: account.id, label: account.name });
    return acc;
  }, []);

  return (
    <SelectField id={id} label={label ?? t('common.account')} value={value} groups={groups} onChange={onChange} placeholder={placeholder} className={className} />
  );
}
