import type { ViewportProximity } from './getElementViewportProximity.ts';
import { isPositiveInteger } from './isPositiveInteger.ts';
import { reportTaskError } from './reportTaskError.ts';

export type ViewportPriorityTask = () => void;

export type ViewportPriorityTaskSchedulerOptions = {
  farTaskBatchSize?: number;
};

export type ViewportPriorityTaskScheduler = {
  schedule: (task: ViewportPriorityTask, proximity: ViewportProximity) => void;
  cancel: (task: ViewportPriorityTask) => void;
};

const DEFAULT_FAR_TASK_BATCH_SIZE = 100;

/**
 * 创建一个根据视窗接近程度编排任务的调度器。
 *
 * `near` 任务会在微任务中批量执行，`far` 任务会优先在浏览器空闲期分批执行。
 * 同一个任务只会存在于一个队列中，使用新的接近程度再次调度会迁移已有任务。
 *
 * @param options - 远视窗任务的批处理配置。
 * @returns 支持调度和取消任务的调度器。
 */
export const createViewportPriorityTaskScheduler = (
  options: ViewportPriorityTaskSchedulerOptions = {},
): ViewportPriorityTaskScheduler => {
  const { farTaskBatchSize = DEFAULT_FAR_TASK_BATCH_SIZE } = options;

  if (!isPositiveInteger(farTaskBatchSize)) {
    throw new RangeError('farTaskBatchSize must be a positive integer.');
  }

  const nearTasks = new Set<ViewportPriorityTask>();
  const farTasks = new Set<ViewportPriorityTask>();
  let nearFlushScheduled = false;
  let farFlushScheduled = false;

  const runTask = (task: ViewportPriorityTask) => {
    try {
      task();
    } catch (error) {
      reportTaskError(error);
    }
  };

  const flushNearTasks = () => {
    nearFlushScheduled = false;

    const tasks = Array.from(nearTasks);

    for (const task of tasks) {
      if (!nearTasks.delete(task)) {
        continue;
      }

      runTask(task);
    }
  };

  const scheduleFarFlush = () => {
    if (farFlushScheduled) {
      return;
    }

    farFlushScheduled = true;

    if (typeof globalThis.requestIdleCallback === 'function') {
      // 300ms 只用于避免页面持续繁忙时 far 任务无限饥饿，是兜底策略，
      // 不代表该值适合所有任务规模或页面负载。
      globalThis.requestIdleCallback(flushFarTasks, {
        timeout: 300,
      });
      return;
    }

    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => {
        flushFarTasks({
          didTimeout: true,
          timeRemaining: () => 0,
        });
      });
      return;
    }

    setTimeout(() => {
      flushFarTasks({
        didTimeout: true,
        timeRemaining: () => 0,
      });
    }, 0);
  };

  const flushFarTasks = (deadline: IdleDeadline) => {
    farFlushScheduled = false;
    let flushedTaskCount = 0;

    while (
      farTasks.size > 0 &&
      flushedTaskCount < farTaskBatchSize &&
      (flushedTaskCount === 0 || deadline.didTimeout || deadline.timeRemaining() > 1)
    ) {
      const taskResult = farTasks.values().next();

      if (taskResult.done) {
        break;
      }

      farTasks.delete(taskResult.value);
      runTask(taskResult.value);
      flushedTaskCount += 1;
    }

    if (farTasks.size > 0) {
      scheduleFarFlush();
    }
  };

  const schedule = (task: ViewportPriorityTask, proximity: ViewportProximity) => {
    if (proximity === 'near') {
      farTasks.delete(task);
      nearTasks.add(task);

      if (!nearFlushScheduled) {
        nearFlushScheduled = true;
        queueMicrotask(flushNearTasks);
      }

      return;
    }

    nearTasks.delete(task);
    farTasks.add(task);
    scheduleFarFlush();
  };

  const cancel = (task: ViewportPriorityTask) => {
    nearTasks.delete(task);
    farTasks.delete(task);
  };

  return {
    schedule,
    cancel,
  };
};

export const viewportPriorityTaskScheduler = createViewportPriorityTaskScheduler();
