import { flushSync } from 'react-dom';
import { createMicrotaskScheduler } from './createMicrotaskScheduler.ts';
import { reportTaskError } from './reportTaskError.ts';

/**
 * 一个布局任务阶段。
 *
 * 调度器会先执行当前阶段中所有任务的 `read`，再执行所有任务的
 * `write`，然后进入下一个阶段。
 */
export type LayoutTaskStage = {
  /**
   * 当前阶段的写操作会更新 React 外部 Store，需要与同阶段的其他写操作
   * 一起放入一次 flushSync。
   */
  flushSync?: boolean;
  read?: () => void;
  write?: () => void;
};

/**
 * 单次布局任务的执行计划。
 */
export type LayoutTaskPlan = {
  stages: readonly LayoutTaskStage[];

  /**
   * 任务完成、取消或执行失败后调用。
   *
   * `cleanup` 被视为写操作，并且最多执行一次。它应当可以安全处理任务只
   * 完成部分阶段的情况。
   */
  cleanup?: () => void;
};

/**
 * 创建单次执行计划的稳定任务函数。
 *
 * 返回 `undefined` 表示本次无需执行。调度器使用函数引用进行去重，因此
 * 调用方应当复用同一个函数，并在函数执行时读取最新状态。
 */
export type LayoutTask = () => LayoutTaskPlan | undefined;

export type LayoutTaskScheduler = {
  schedule: (task: LayoutTask) => void;
  cancel: (task: LayoutTask) => void;
};

type RunningLayoutTask = {
  task: LayoutTask;
  plan: LayoutTaskPlan | undefined;
  cancelled: boolean;
  failed: boolean;
  cleaned: boolean;
};

/**
 * 创建一个按 read/write 阶段批量执行布局任务的调度器。
 *
 * 同一个任务在等待执行时只会保留一次。任务执行期间再次调度，会在当前
 * 执行计划结束后进入下一批，避免把新任务插入已经开始的阶段。
 */
export const createLayoutTaskScheduler = (): LayoutTaskScheduler => {
  const pendingTasks = new Set<LayoutTask>();
  const runningTasks = new Map<LayoutTask, RunningLayoutTask>();

  const runOperation = (
    runningTask: RunningLayoutTask,
    operation: (() => void) | undefined,
  ) => {
    if (
      runningTask.cleaned
      || runningTask.cancelled
      || runningTask.failed
      || typeof operation === 'undefined'
    ) {
      return;
    }

    try {
      operation();
    } catch (error) {
      runningTask.failed = true;
      reportTaskError(error);
    }
  };

  const cleanupTask = (runningTask: RunningLayoutTask) => {
    if (runningTask.cleaned) {
      return;
    }

    runningTask.cleaned = true;
    const cleanup = runningTask.plan?.cleanup;

    if (typeof cleanup === 'undefined') {
      return;
    }

    try {
      cleanup();
    } catch (error) {
      reportTaskError(error);
    }
  };

  const flush = () => {
    const tasks = Array.from(pendingTasks);

    pendingTasks.clear();

    if (tasks.length === 0) {
      return;
    }

    const batch: RunningLayoutTask[] = [];

    for (const task of tasks) {
      const runningTask: RunningLayoutTask = {
        task,
        plan: undefined,
        cancelled: false,
        failed: false,
        cleaned: false,
      };

      runningTasks.set(task, runningTask);
      batch.push(runningTask);

      try {
        runningTask.plan = task();
      } catch (error) {
        runningTask.failed = true;
        reportTaskError(error);
      }
    }

    let stageCount = 0;

    for (const runningTask of batch) {
      stageCount = Math.max(
        stageCount,
        runningTask.plan?.stages.length || 0,
      );
    }

    for (let stageIndex = 0; stageIndex < stageCount; stageIndex += 1) {
      for (const runningTask of batch) {
        runOperation(
          runningTask,
          runningTask.plan?.stages[stageIndex]?.read,
        );
      }

      const write = () => {
        for (const runningTask of batch) {
          runOperation(
            runningTask,
            runningTask.plan?.stages[stageIndex]?.write,
          );
        }
      };
      const shouldFlushSync = batch.some((runningTask) => {
        return runningTask.plan?.stages[stageIndex]?.flushSync;
      });

      if (shouldFlushSync) {
        flushSync(write);
      } else {
        write();
      }

      for (const runningTask of batch) {
        const stages = runningTask.plan?.stages;
        const completed = typeof stages !== 'undefined'
          && stageIndex >= stages.length - 1;

        if (runningTask.cancelled || runningTask.failed || completed) {
          cleanupTask(runningTask);
        }
      }
    }

    for (const runningTask of batch) {
      cleanupTask(runningTask);
      runningTasks.delete(runningTask.task);
    }
  };

  const scheduleFlush = createMicrotaskScheduler(flush);

  const schedule = (task: LayoutTask) => {
    if (pendingTasks.has(task)) {
      return;
    }

    pendingTasks.add(task);
    scheduleFlush();
  };

  const cancel = (task: LayoutTask) => {
    pendingTasks.delete(task);

    const runningTask = runningTasks.get(task);

    if (typeof runningTask !== 'undefined') {
      runningTask.cancelled = true;
    }
  };

  return {
    schedule,
    cancel,
  };
};

export const layoutTaskScheduler = createLayoutTaskScheduler();
