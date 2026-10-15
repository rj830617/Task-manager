import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { KanbanSquare, List, Moon, Plus, Sun } from 'lucide-react';
import { fetchTasks, setFilter, clearError, openNewForm, closeForm } from './store/tasksSlice';
import { useAppDispatch, useAppSelector } from './store';
import { PRIORITY_OPTIONS } from './constants';
import type { TaskFilters } from './types';
import { useTheme } from './theme';
import Board from './components/board/Board';
import ConfirmDelete from './components/ConfirmDelete';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import Alert from './components/common/Alert';
import Button from './components/common/Button';
import Input from './components/common/Input';
import Modal from './components/common/Modal';
import Select from './components/common/Select';
import Skeleton from './components/common/Skeleton';

export default function App() {
  const dispatch = useAppDispatch();
  const { items, filters, editingTask, formOpen, loading, error } = useAppSelector((s) => s.tasks);
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useState<'board' | 'list'>('board');

  // Debounce so typing in search does not fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => dispatch(fetchTasks()), 250);
    return () => clearTimeout(t);
  }, [filters, dispatch]);

  const onFilter = <K extends keyof TaskFilters>(key: K) => (e: { target: { value: string } }) =>
    dispatch(setFilter({ [key]: e.target.value } as Partial<TaskFilters>));
  const done = items.filter((t) => t.status === 'done').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Toaster richColors position="bottom-right" theme={theme} />

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Manager</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{done} of {items.length} tasks done</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button onClick={() => dispatch(openNewForm())}><Plus size={16} /> New task</Button>
        </div>
      </header>

      <Alert message={error} onClose={() => dispatch(clearError())} />

      <div className="mb-5 flex flex-wrap gap-2">
        <Input className="min-w-48 flex-1" placeholder="Search tasks…" value={filters.q} onChange={onFilter('q')} />
        <Select className="!w-auto" placeholder="All priorities" options={PRIORITY_OPTIONS} value={filters.priority} onChange={onFilter('priority')} />
        <div className="flex gap-1">
          <Button variant={view === 'board' ? 'primary' : 'secondary'} onClick={() => setView('board')} aria-label="Board view"><KanbanSquare size={16} /></Button>
          <Button variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => setView('list')} aria-label="List view"><List size={16} /></Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : view === 'board' ? (
        <Board />
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-slate-400">No tasks found. Create your first one!</p>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {items.map((t) => <TaskCard key={t._id} task={t} showStatus />)}
        </div>
      )}

      <ConfirmDelete />

      {formOpen && (
        <Modal title={editingTask ? 'Edit task' : 'New task'} onClose={() => dispatch(closeForm())}>
          <TaskForm />
        </Modal>
      )}
    </div>
  );
}
