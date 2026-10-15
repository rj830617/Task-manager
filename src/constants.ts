import type { TaskPriority, TaskStatus } from './types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const STATUS_OPTIONS: Option<TaskStatus>[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export const PRIORITY_OPTIONS: Option<TaskPriority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
