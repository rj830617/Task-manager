import { InferSchemaType, Schema, model } from 'mongoose';

export const STATUSES = ['todo', 'in-progress', 'done'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const taskSchema = new Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: STATUSES, default: 'todo' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    dueDate: { type: Date, default: null, cast: 'Due date is invalid' },
    // Email reminder: sent once by the scheduler when remindAt passes (see scheduler.ts)
    reminderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: '',
      validate: { validator: (v: string) => !v || EMAIL_RE.test(v), message: 'Reminder email is invalid' },
    },
    remindAt: { type: Date, default: null, cast: 'Reminder time is invalid' },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Lets the scheduler find due reminders without scanning every task
taskSchema.index({ remindAt: 1, reminderSent: 1 });

export type TaskDoc = InferSchemaType<typeof taskSchema>;
export default model('Task', taskSchema);
