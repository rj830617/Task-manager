import type { Task, TaskFilters, TaskInput } from './types';

const BASE = '/api/tasks';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || 'Request failed');
  return data as T;
}

export const getTasks = (params: Partial<TaskFilters> = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return request<Task[]>(`${BASE}${qs ? `?${qs}` : ''}`);
};
export const createTask = (task: TaskInput) => request<Task>(BASE, { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id: string, task: Partial<TaskInput>) =>
  request<Task>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(task) });
export const deleteTask = (id: string) => request<{ message: string }>(`${BASE}/${id}`, { method: 'DELETE' });
