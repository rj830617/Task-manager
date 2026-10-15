import { X } from 'lucide-react';

interface Props {
  message: string;
  onClose?: () => void;
}

export default function Alert({ message, onClose }: Props) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 flex items-center justify-between rounded-lg bg-red-100 px-4 py-2.5 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
      )}
    </div>
  );
}
