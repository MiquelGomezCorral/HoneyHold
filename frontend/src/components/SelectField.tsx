import Field from './Field.js';

interface SelectGroup {
  key: string;
  label?: string;
  options: { value: string | number; label: string }[];
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string | number;
  groups: SelectGroup[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SelectField({ id, label, value, groups, onChange, placeholder, className }: SelectFieldProps) {
  return (
    <Field label={label} htmlFor={id} className={className}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder != null && <option value="">{placeholder}</option>}
        {groups.map((group) => group.label ? (
          <optgroup key={group.key} label={group.label}>
            {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </optgroup>
        ) : (
          group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)
        ))}
      </select>
    </Field>
  );
}
