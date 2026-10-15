import { Trash2 } from 'lucide-react';
import { cancelDelete, removeTask } from '../store/tasksSlice';
import { useAppDispatch, useAppSelector } from '../store';
import Button from './common/Button';
import Modal from './common/Modal';

// Rendered once at the app root (not inside a card) so card drag handlers never see its clicks
export default function ConfirmDelete() {
  const dispatch = useAppDispatch();
  const task = useAppSelector((s) => s.tasks.deletingTask);
  if (!task) return null;

  return (
    <Modal title="Delete task?" onClose={() => dispatch(cancelDelete())}>
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950">
          <Trash2 size={18} />
        </div>
        <p className="min-w-0 break-words text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</span> will be permanently deleted. This cannot be undone.
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => dispatch(cancelDelete())}>Cancel</Button>
        <Button autoFocus className="!border-red-600 !bg-red-600 hover:!bg-red-500" onClick={() => dispatch(removeTask(task._id))}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
