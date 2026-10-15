import type { ButtonHTMLAttributes } from 'react';

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
  danger: 'bg-white text-red-600 hover:bg-red-50 border-red-200 dark:bg-slate-800 dark:border-red-900 dark:hover:bg-red-950',
  ghost: 'bg-transparent hover:bg-slate-200/70 border-transparent dark:hover:bg-slate-800',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
