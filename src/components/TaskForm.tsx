import { FormEvent, useState } from 'react';
import { saveTask, closeForm } from '../store/tasksSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../constants';
import type { TaskInput } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';

const toInputDate = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

// <input type="datetime-local"> works in local time without a zone: 'YYYY-MM-DDTHH:mm'
const toLocalInput = (d?: string | null) => {
  if (!d) return '';
  const date = new Date(d);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

// Form state keeps the local datetime string; it is converted to a UTC ISO string on submit
type FormState = Omit<TaskInput, 'remindAt'> & { remindAt: string };

export default function TaskForm() {
  const dispatch = useAppDispatch();
  const initial = useAppSelector((s) => s.tasks.editingTask);
  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'todo',
    priority: initial?.priority ?? 'medium',
    dueDate: toInputDate(initial?.dueDate),
    reminderEmail: initial?.reminderEmail ?? '',
    remindAt: toLocalInput(initial?.remindAt),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Typed per-field setter: value type follows the field it is bound to
  const set = <K extends keyof FormState>(key: K) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value as FormState[K] });

  const validate = (): string => {
    if (!form.title.trim()) return 'Title cannot be empty';
    if (Boolean(form.reminderEmail.trim()) !== Boolean(form.remindAt)) return 'A reminder needs both an email and a time';
    // Only block past times when the reminder is new or has been changed
    const changed = form.remindAt !== toLocalInput(initial?.remindAt);
    if (form.remindAt && changed && new Date(form.remindAt).getTime() <= Date.now()) return 'Reminder time must be in the future';
    return '';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;
    setSaving(true);
    const data: TaskInput = {
      ...form,
      title: form.title.trim(),
      reminderEmail: form.reminderEmail.trim(),
      remindAt: form.remindAt ? new Date(form.remindAt).toISOString() : '',
    };
    await dispatch(saveTask({ id: initial?._id, data })); // closes the modal on success
    setSaving(false);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <Input autoFocus placeholder="Title *" value={form.title} onChange={set('title')} maxLength={120} required />
      <Input multiline rows={3} placeholder="Description" value={form.description} onChange={set('description')} maxLength={1000} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
        <Select options={PRIORITY_OPTIONS} value={form.priority} onChange={set('priority')} />
        <Input type="date" value={form.dueDate} onChange={set('dueDate')} aria-label="Due date" />
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
        <legend className="px-1 text-xs font-medium text-slate-500 dark:text-slate-400">Email reminder (optional)</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input type="email" placeholder="name@example.com" value={form.reminderEmail} onChange={set('reminderEmail')} maxLength={254} aria-label="Reminder email" />
          <Input type="datetime-local" value={form.remindAt} onChange={set('remindAt')} aria-label="Reminder time" />
        </div>
      </fieldset>

      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => dispatch(closeForm())}>Cancel</Button>
        <Button type="submit" disabled={saving}>{initial ? 'Save changes' : 'Create task'}</Button>
      </div>
    </form>
  );
}
