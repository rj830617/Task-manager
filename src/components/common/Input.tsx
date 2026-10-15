import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900';

type Props =
  | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
  | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>);

export default function Input(props: Props) {
  if (props.multiline) {
    const { multiline: _m, className = '', ...rest } = props;
    return <textarea className={`${fieldClass} ${className}`} {...rest} />;
  }
  const { multiline: _m, className = '', ...rest } = props;
  return <input className={`${fieldClass} ${className}`} {...rest} />;
}
