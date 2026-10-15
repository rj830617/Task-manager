export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  reminderEmail: string;
  remindAt: string | null;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payload sent to the API; dueDate is 'YYYY-MM-DD' or '' to clear
export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  reminderEmail: string;
  remindAt: string; // ISO timestamp, or '' to clear
}

export interface TaskFilters {
  priority: TaskPriority | '';
  q: string;
}
