import Field from './Field.js';
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
  return (
    <Field label={label} htmlFor={id} className={className}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder != null && <option value="">{placeholder}</option>}
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
    </Field>
  );
}
