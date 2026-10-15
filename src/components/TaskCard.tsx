import { Bell, BellRing, Calendar, Pencil, Trash2 } from 'lucide-react';
import { requestDelete, saveTask, startEditing } from '../store/tasksSlice';
import { useAppDispatch } from '../store';
import { STATUS_OPTIONS } from '../constants';
import type { Task, TaskStatus } from '../types';
import Badge from './common/Badge';
import Button from './common/Button';
import Select from './common/Select';

interface Props {
  task: Task;
  showStatus?: boolean;
}

export default function TaskCard({ task, showStatus = false }: Props) {
  const dispatch = useAppDispatch();
  const overdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className={`min-w-0 break-words text-sm font-semibold ${task.status === 'done' ? 'text-slate-400 line-through' : ''}`}>{task.title}</h3>
        <Badge tone={task.priority}>{task.priority}</Badge>
      </div>
      {task.description && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-500 dark:text-slate-400">{task.description}</p>}
      {task.dueDate && (
        <p className={`mt-2 flex items-center gap-1 text-xs ${overdue ? 'font-medium text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
          <Calendar size={12} />
          {new Date(task.dueDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
          {overdue && ' · overdue'}
        </p>
      )}
      {task.remindAt && (
        <p className="mt-1 flex items-center gap-1 break-all text-xs text-slate-500 dark:text-slate-400">
          {task.reminderSent ? <BellRing size={12} className="shrink-0 text-emerald-500" /> : <Bell size={12} className="shrink-0" />}
          {task.reminderSent ? 'Reminder sent' : new Date(task.remindAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          {' → '}{task.reminderEmail}
        </p>
      )}
      <div className="mt-3 flex items-center gap-1">
        {showStatus && (
          <Select
            className="!w-auto"
            options={STATUS_OPTIONS}
            value={task.status}
            onChange={(e) => dispatch(saveTask({ id: task._id, data: { status: e.target.value as TaskStatus }, silent: true }))}
          />
        )}
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" aria-label="Edit task" onClick={() => dispatch(startEditing(task))}><Pencil size={14} /></Button>
          <Button variant="ghost" aria-label="Delete task" className="text-red-500" onClick={() => dispatch(requestDelete(task))}><Trash2 size={14} /></Button>
        </div>
      </div>
    </div>
  );
}
