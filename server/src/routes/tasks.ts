import { Router } from 'express';
import Task, { PRIORITIES, STATUSES } from '../models/Task';

const router = Router();

const FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'reminderEmail', 'remindAt'] as const;
const DATE_FIELDS: readonly string[] = ['dueDate', 'remindAt'];

// Whitelist fields so clients cannot set arbitrary properties (e.g. reminderSent); '' clears a date
const pick = (body: Record<string, unknown> = {}) => {
  const out: Record<string, unknown> = {};
  for (const k of FIELDS) {
    if (body[k] !== undefined) out[k] = DATE_FIELDS.includes(k) && body[k] === '' ? null : body[k];
  }
  return out;
};

// A reminder needs both an email and a time (or neither)
const reminderError = (out: Record<string, unknown>): string | null => {
  if (!('reminderEmail' in out) && !('remindAt' in out)) return null;
  return Boolean(out.reminderEmail) !== Boolean(out.remindAt) ? 'Reminder needs both an email and a time' : null;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/tasks?status=&priority=&q=
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, q } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (status) {
      if (!(STATUSES as readonly string[]).includes(status)) return res.status(400).json({ message: 'Invalid status filter' });
      filter.status = status;
    }
    if (priority) {
      if (!(PRIORITIES as readonly string[]).includes(priority)) return res.status(400).json({ message: 'Invalid priority filter' });
      filter.priority = priority;
    }
    if (q) filter.title = { $regex: escapeRegex(String(q)), $options: 'i' };
    res.json(await Task.find(filter).sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = pick(req.body);
    const error = reminderError(data);
    if (error) return res.status(400).json({ message: error });
    res.status(201).json(await Task.create(data));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = pick(req.body);
    const error = reminderError(data);
    if (error) return res.status(400).json({ message: error });

    // Changing the email or time re-arms the reminder so it is sent again
    if ('reminderEmail' in data || 'remindAt' in data) {
      const existing = await Task.findById(req.params.id).select('reminderEmail remindAt');
      if (!existing) return res.status(404).json({ message: 'Task not found' });
      const newEmail = String(data.reminderEmail ?? '').trim().toLowerCase();
      const newTime = data.remindAt ? new Date(String(data.remindAt)).getTime() : null;
      const oldTime = existing.remindAt ? existing.remindAt.getTime() : null;
      if (newEmail !== existing.reminderEmail || newTime !== oldTime) data.reminderSent = false;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
});

export default router;
