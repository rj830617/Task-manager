import type { SelectHTMLAttributes } from 'react';
import { fieldClass } from './Input';
import type { Option } from '../../constants';

interface Props<T extends string> extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option<T>[];
  placeholder?: string; // adds an empty first option (used by filters)
}

export default function Select<T extends string>({ options, placeholder, className = '', ...props }: Props<T>) {
  return (
    <select className={`${fieldClass} ${className}`} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
