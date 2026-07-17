import { reportTaskError } from './reportTaskError.ts';

type ScheduledTask = () => void;

type BatchedDoubleRafScheduler = {
  schedule: (task: ScheduledTask) => void;
};

export const createBatchedDoubleRafScheduler = (): BatchedDoubleRafScheduler => {
  let pendingBatch: Set<ScheduledTask> | undefined;
  const scheduledTasks = new Set<ScheduledTask>();

  const flushBatch = (batch?: Set<ScheduledTask> | null): void => {
    if (!batch) {
      return;
    }

    for (const task of batch) {
      scheduledTasks.delete(task);

      try {
        task();
      } catch (error) {
        reportTaskError(error);
      }
    }
  };

  const schedule = (task: ScheduledTask): void => {
    if (typeof globalThis.requestAnimationFrame !== 'function') {
      task();
      return;
    }

    if (scheduledTasks.has(task)) {
      return;
    }

    scheduledTasks.add(task);
    let batch = pendingBatch;

    if (typeof batch === 'undefined') {
      batch = new Set();
      pendingBatch = batch;

      globalThis.requestAnimationFrame(() => {
        pendingBatch = undefined;

        globalThis.requestAnimationFrame(() => {
          flushBatch(batch);
        });
      });
    }

    batch.add(task);
  };

  return {
    schedule,
  };
};

export const batchedDoubleRafScheduler = createBatchedDoubleRafScheduler();
