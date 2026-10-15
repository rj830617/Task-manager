import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import mongoose, { Error as MongooseError } from 'mongoose';
import tasksRouter from './routes/tasks';
import { startScheduler } from './scheduler';

const app = express();
app.use(cors());
app.use(express.json());

// Used by hosting platforms (and uptime pingers) to check the service is alive
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/tasks', tasksRouter);

// Unknown routes -> JSON 404 instead of Express's default HTML page
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Centralised error handler: bad input -> 400, rest -> 500
const isBodyParseError = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { type?: unknown }).type === 'entity.parse.failed';

const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (isBodyParseError(err)) return res.status(400).json({ message: 'Malformed JSON body' });
  if (err instanceof MongooseError.ValidationError) {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path === '_id' ? 'id' : err.path}` });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskmanager')
  .then(() =>
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
      startScheduler();
    })
  )
  .catch((err: Error) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
