# Task Manager (MERN + TypeScript)

A task manager with a drag-and-drop Kanban board, search and filters, dark mode, and email reminders.
Built with MongoDB, Express, React and Node, written in TypeScript on both the client and the server.

## Features

- Create, edit and delete tasks (title, description, status, priority, due date)
- Kanban board: drag a card between **To do / In progress / Done**, or switch to a list view
- Search by title and filter by priority (done on the server, with a debounced client)
- Email reminders: set an email address and a time on a task and the server emails you when it is due
- Optimistic updates with toast messages; a failed change is rolled back to the server's state
- Delete confirmation popup, loading skeletons, light/dark theme, responsive layout (phone to desktop)

## Tech stack

| Layer | Tools |
|---|---|
| Client | React 18, Vite, TypeScript, Redux Toolkit, Tailwind CSS, @dnd-kit, sonner, lucide-react |
| Server | Node, Express 4, TypeScript, Mongoose 8, Nodemailer |
| Database | MongoDB |

## Project structure

```
developertask/
├── client/                  React app (Vite)
│   └── src/
│       ├── components/      TaskCard, TaskForm, ConfirmDelete, board/Board, common/* (Button, Input, Select, Modal, ...)
│       ├── store/           Redux Toolkit store and tasks slice (async thunks, optimistic updates)
│       ├── api.ts           typed fetch wrapper
│       └── types.ts         shared Task types
└── server/                  Express API
    └── src/
        ├── models/Task.ts   Mongoose schema and validation
        ├── routes/tasks.ts  REST routes
        ├── mailer.ts        Nodemailer (SMTP or Ethereal test inbox)
        ├── scheduler.ts     reminder scheduler
        └── index.ts         app setup and central error handler
```

## Getting started

**Prerequisites:** Node 18 or newer, and MongoDB running on `localhost:27017` (or set `MONGO_URI`).

```bash
# 1. Install dependencies (run inside each folder)
cd server && npm install
cd ../client && npm install

# 2. Configure the server
cd ../server
cp .env.example .env        # then edit .env if needed

# 3. Run (two terminals)
cd server && npm run dev    # API on http://localhost:5000
cd client && npm run dev    # UI  on http://localhost:5173
```

Open http://localhost:5173. The client proxies `/api` to the server, so no CORS setup is needed in development.

Other scripts: `npm run build` and `npm run typecheck` in either folder; `npm start` in `server/` runs the built output.

## Environment variables (`server/.env`)

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/taskmanager` |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server for reminders | empty (uses Ethereal test inbox) |
| `SMTP_USER`, `SMTP_PASS` | SMTP login (Gmail needs an **App Password**) | empty |
| `MAIL_FROM` | "From" header, e.g. `"Task Manager" <you@gmail.com>` | `no-reply@taskmanager.local` |

Never commit `.env` (it is in `.gitignore`).

## Email reminders

1. Open a task, fill in **Email reminder** (address and date/time), and save.
2. The server checks every 30 seconds for reminders that are due, claims each one atomically (so it is sent only once) and emails it.
3. The card shows the scheduled time, then "Reminder sent" once delivered.

Behaviour: changing the email or time re-arms the reminder; done tasks are skipped; a failed send retries after 5 minutes; reminders that came due while the server was off are sent at the next startup.

**Development without SMTP:** if `SMTP_HOST` is empty, a free Ethereal test inbox is used. Nothing is delivered to a real address, but the server console prints a preview link for each email.

**Real delivery with Gmail:** turn on 2-Step Verification, create an App Password at https://myaccount.google.com/apppasswords, then set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`. Restart the server after editing `.env`.

## API

Base path: `/api/tasks`. Errors return `{ "message": "..." }` with a 400, 404 or 500 status.

| Method | Route | Description |
|---|---|---|
| GET | `/api/tasks?status=&priority=&q=` | List tasks, newest first. Filters are validated; `q` searches the title. |
| POST | `/api/tasks` | Create a task. `title` is required. |
| PUT | `/api/tasks/:id` | Partial update. |
| DELETE | `/api/tasks/:id` | Delete a task. |

Task fields: `title` (max 120), `description` (max 1000), `status` (`todo` / `in-progress` / `done`), `priority` (`low` / `medium` / `high`), `dueDate`, `reminderEmail`, `remindAt`, `reminderSent` (read-only).

## Validation and error handling

- Rules live in the Mongoose schema (required title, length limits, allowed values, valid dates and email).
- Routes accept only known fields, so clients cannot set `reminderSent` or other internals; search text is regex-escaped.
- A reminder needs both an email and a time (or neither).
- One central handler maps malformed JSON, validation errors and bad ids to 400, missing tasks and unknown routes to 404, and everything else to 500.
- The client shows server messages as toasts, shows a dismissible alert when loading fails, and has an error boundary for render crashes.

## Submission notes

### Three most important decisions
1. **One `status` field drives the whole app.** The model has a single status per task instead of a separate "completed" flag and separate lists. The board columns, the list view, the "x of y done" counter and drag-and-drop are all views of that one field, and moving a card is one small update. There is no duplicated state to get out of sync.
2. **The server owns validation.** Rules are defined once in the schema. The API whitelists fields, escapes search input and returns one consistent error shape with correct status codes, and the UI shows those messages as-is. Filtering and search also run on the server, so the browser never has to hold or scan the full list.
3. **Optimistic UI that corrects itself.** Drags and deletes show instantly. If the server rejects a change, the user sees an error and the app reloads the server's list. Out-of-date responses are ignored so a slow search cannot overwrite a newer one. TypeScript types shared across the store, API layer and components keep the data shapes from drifting apart.

### Three things deliberately not implemented
1. **Authentication and per-user tasks.** It adds a large security area (password hashing, tokens, ownership checks on every route). I chose a polished, correct core over a half-secured login. Consequence: anyone can enter any reminder address.
2. **Real-time collaboration and conflict resolution.** Syncing between users needs websockets and a plan for simultaneous edits, which is a bigger design problem than the task itself.
3. **Subtasks and recurring tasks.** Each changes the data model (nesting, schedules), so I kept one clean model first.

### One limitation to fix with one more day
Search uses a case-insensitive regex on the title, which cannot use an index, so MongoDB scans every task on each search. That is fine for hundreds of tasks and slow at hundreds of thousands. With one more day I would add a compound index on status and creation date, a text index for search, and cursor-based pagination, plus automated API tests. (Only the reminder fields currently have an index.)

### Other known limitations
- Reminders send only while the server is running, using an in-process timer.
- Dragging a card between columns is saved, but the order of cards inside a column is not (they sort by creation time).
- No automated tests yet.
