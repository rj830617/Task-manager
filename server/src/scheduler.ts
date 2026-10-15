import Task from './models/Task';
import { sendReminder } from './mailer';

const INTERVAL_MS = 30_000;
const RETRY_DELAY_MS = 5 * 60_000;

// Claims one due reminder at a time. findOneAndUpdate is atomic, so even if two server instances
// run this at once, each reminder is claimed (and emailed) exactly once.
async function claimNextDue() {
  return Task.findOneAndUpdate(
    { remindAt: { $lte: new Date() }, reminderSent: false, reminderEmail: { $ne: '' }, status: { $ne: 'done' } },
    { reminderSent: true },
    { new: true }
  );
}

async function tick(): Promise<void> {
  for (let task = await claimNextDue(); task; task = await claimNextDue()) {
    try {
      await sendReminder(task);
    } catch (err) {
      console.error(`Reminder for "${task.title}" failed, retrying in 5 minutes:`, (err as Error).message);
      await Task.updateOne({ _id: task._id }, { reminderSent: false, remindAt: new Date(Date.now() + RETRY_DELAY_MS) });
    }
  }
}

// Runs on startup too, so reminders that came due while the server was off are sent right away
export function startScheduler(): void {
  const run = () => tick().catch((err) => console.error('Scheduler error:', (err as Error).message));
  run();
  setInterval(run, INTERVAL_MS);
}
