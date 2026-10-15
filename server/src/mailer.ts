import nodemailer, { Transporter } from 'nodemailer';

interface ReminderTask {
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  reminderEmail: string;
}

let transportPromise: Promise<Transporter> | null = null;

async function createTransport(): Promise<Transporter> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST) {
    const port = Number(SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  // No SMTP configured: use a throwaway Ethereal inbox so the feature works in development.
  // Emails are not delivered to real addresses; a preview URL is logged instead.
  const account = await nodemailer.createTestAccount();
  console.log('SMTP_HOST not set - using Ethereal test inbox (emails are previewed, not delivered)');
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
}

const getTransport = () => (transportPromise ??= createTransport());

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export async function sendReminder(task: ReminderTask): Promise<void> {
  const transport = await getTransport();
  const due = task.dueDate ? `Due: ${task.dueDate.toDateString()}` : '';
  const text = [`Reminder: ${task.title}`, task.description ?? '', due].filter(Boolean).join('\n\n');
  const html = `<h2>Reminder: ${escapeHtml(task.title)}</h2>${
    task.description ? `<p>${escapeHtml(task.description)}</p>` : ''
  }${due ? `<p><b>${escapeHtml(due)}</b></p>` : ''}`;

  const info = await transport.sendMail({
    from: process.env.MAIL_FROM || '"Task Manager" <no-reply@taskmanager.local>',
    to: task.reminderEmail,
    subject: `Reminder: ${task.title}`,
    text,
    html,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  console.log(`Reminder sent to ${task.reminderEmail}${preview ? ` - preview: ${preview}` : ''}`);
}
