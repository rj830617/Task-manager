import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'sonner';
import * as api from '../api';
import type { Task, TaskFilters, TaskInput } from '../types';

interface TasksState {
  items: Task[];
  filters: TaskFilters;
  editingTask: Task | null;
  deletingTask: Task | null; // task awaiting delete confirmation
  formOpen: boolean;
  loading: boolean;
  error: string;
  latestRequestId: string | null;
}

// Thunks read the store through getState; this local type avoids a circular import with store/index.ts
type ThunkConfig = { state: { tasks: TasksState } };

export const fetchTasks = createAsyncThunk<Task[], void, ThunkConfig>('tasks/fetch', (_, { getState }) =>
  api.getTasks(getState().tasks.filters)
);

interface SaveArg {
  id?: string;
  data: Partial<TaskInput>;
  silent?: boolean;
}

// Updates are applied optimistically in the reducer (see saveTask.pending). On failure we toast and
// refetch, which restores the server's truth. A refetch after success keeps filters/sort consistent.
export const saveTask = createAsyncThunk<void, SaveArg, ThunkConfig>('tasks/save', async ({ id, data, silent }, { dispatch }) => {
  try {
    if (id) await api.updateTask(id, data);
    else await api.createTask(data as TaskInput);
    if (!silent) toast.success(id ? 'Task updated' : 'Task created');
  } catch (e) {
    toast.error((e as Error).message);
    dispatch(fetchTasks());
    throw e;
  }
  dispatch(fetchTasks());
});

export const removeTask = createAsyncThunk<void, string, ThunkConfig>('tasks/remove', async (id, { dispatch }) => {
  try {
    await api.deleteTask(id);
    toast.success('Task deleted');
  } catch (e) {
    toast.error((e as Error).message);
    dispatch(fetchTasks());
    throw e;
  }
  dispatch(fetchTasks());
});

const initialState: TasksState = {
  items: [],
  filters: { priority: '', q: '' },
  editingTask: null,
  deletingTask: null,
  formOpen: false,
  loading: true,
  error: '',
  latestRequestId: null,
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter: (state, { payload }: PayloadAction<Partial<TaskFilters>>) => {
      state.filters = { ...state.filters, ...payload };
    },
    openNewForm: (state) => {
      state.editingTask = null;
      state.formOpen = true;
    },
    startEditing: (state, { payload }: PayloadAction<Task>) => {
      state.editingTask = payload;
      state.formOpen = true;
    },
    closeForm: (state) => {
      state.editingTask = null;
      state.formOpen = false;
    },
    clearError: (state) => {
      state.error = '';
    },
    requestDelete: (state, { payload }: PayloadAction<Task>) => {
      state.deletingTask = payload;
    },
    cancelDelete: (state) => {
      state.deletingTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state, { meta }) => {
        state.latestRequestId = meta.requestId;
      })
      .addCase(fetchTasks.fulfilled, (state, { meta, payload }) => {
        // Ignore stale responses from superseded requests
        if (meta.requestId !== state.latestRequestId) return;
        state.items = payload;
        state.loading = false;
        state.error = '';
      })
      .addCase(fetchTasks.rejected, (state, { meta, error }) => {
        if (meta.requestId !== state.latestRequestId) return;
        state.loading = false;
        state.error = error.message ?? 'Failed to load tasks';
      })
      .addCase(saveTask.pending, (state, { meta }) => {
        const { id, data } = meta.arg;
        const task = id ? state.items.find((t) => t._id === id) : undefined;
        if (!task) return;
        const { dueDate, remindAt, ...rest } = data;
        Object.assign(task, rest);
        if (dueDate !== undefined) task.dueDate = dueDate === '' ? null : dueDate;
        if (remindAt !== undefined) task.remindAt = remindAt === '' ? null : remindAt;
      })
      .addCase(saveTask.fulfilled, (state) => {
        state.editingTask = null;
        state.formOpen = false;
      })
      .addCase(removeTask.pending, (state, { meta }) => {
        state.items = state.items.filter((t) => t._id !== meta.arg);
        state.deletingTask = null;
      });
  },
});

export const { setFilter, openNewForm, startEditing, closeForm, clearError, requestDelete, cancelDelete } = tasksSlice.actions;
export default tasksSlice.reducer;
