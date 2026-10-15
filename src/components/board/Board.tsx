import { DragEndEvent, DndContext, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { saveTask } from '../../store/tasksSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { STATUS_OPTIONS } from '../../constants';
import type { Task, TaskStatus } from '../../types';
import TaskCard from '../TaskCard';

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'relative z-30 rotate-1 cursor-grabbing opacity-90 shadow-xl' : 'cursor-grab'}
    >
      <TaskCard task={task} />
    </div>
  );
}

function Column({ status, label, tasks }: { status: TaskStatus; label: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-48 flex-col gap-2 rounded-2xl p-3 transition ${
        isOver ? 'bg-indigo-100 dark:bg-indigo-950/60' : 'bg-slate-100 dark:bg-slate-900/60'
      }`}
    >
      <h2 className="flex items-center justify-between px-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {label}
        <span className="rounded-full bg-white px-2 text-xs dark:bg-slate-800">{tasks.length}</span>
      </h2>
      {tasks.map((t) => <DraggableCard key={t._id} task={t} />)}
      {tasks.length === 0 && <p className="py-6 text-center text-xs text-slate-400">Drop tasks here</p>}
    </section>
  );
}

export default function Board() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.tasks.items);
  // Mouse: a small distance lets card button clicks through. Touch: a short press-and-hold starts the
  // drag, so a normal swipe still scrolls the page on phones.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const task = items.find((t) => t._id === active.id);
    const status = over.id as TaskStatus;
    if (task && task.status !== status) {
      dispatch(saveTask({ id: task._id, data: { status }, silent: true }));
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATUS_OPTIONS.map((s) => (
          <Column key={s.value} status={s.value} label={s.label} tasks={items.filter((t) => t.status === s.value)} />
        ))}
      </div>
    </DndContext>
  );
}
