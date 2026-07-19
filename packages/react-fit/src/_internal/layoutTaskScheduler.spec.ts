import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLayoutTaskScheduler,
  type LayoutTask,
} from './layoutTaskScheduler.ts';

let microtaskCallbacks: VoidFunction[];

const runNextMicrotask = () => {
  const callback = microtaskCallbacks.shift();

  if (!callback) {
    throw new Error('没有待执行的微任务。');
  }

  callback();
};

beforeEach(() => {
  microtaskCallbacks = [];
  vi.stubGlobal(
    'queueMicrotask',
    vi.fn((callback: VoidFunction) => {
      microtaskCallbacks.push(callback);
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('layoutTaskScheduler', () => {
  it('在微任务中执行任务，并对等待中的同一个任务去重', () => {
    const scheduler = createLayoutTaskScheduler();
    const read = vi.fn();
    const write = vi.fn();
    const task = vi.fn(() => ({
      stages: [{ read, write }],
    }));

    scheduler.schedule(task);
    scheduler.schedule(task);
    scheduler.schedule(task);

    expect(task).not.toHaveBeenCalled();
    expect(queueMicrotask).toHaveBeenCalledTimes(1);

    runNextMicrotask();

    expect(task).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('按照全部 read、全部 write 的顺序执行不同任务的多个阶段', () => {
    const scheduler = createLayoutTaskScheduler();
    const calls: string[] = [];
    const firstTask = () => ({
      stages: [
        {
          read: () => calls.push('first read 1'),
          write: () => calls.push('first write 1'),
        },
        {
          read: () => calls.push('first read 2'),
          write: () => calls.push('first write 2'),
        },
      ],
      cleanup: () => calls.push('first cleanup'),
    });
    const secondTask = () => ({
      stages: [
        {
          read: () => calls.push('second read 1'),
          write: () => calls.push('second write 1'),
        },
      ],
      cleanup: () => calls.push('second cleanup'),
    });

    scheduler.schedule(firstTask);
    scheduler.schedule(secondTask);
    runNextMicrotask();

    expect(calls).toEqual([
      'first read 1',
      'second read 1',
      'first write 1',
      'second write 1',
      'second cleanup',
      'first read 2',
      'first write 2',
      'first cleanup',
    ]);
  });

  it('允许任务返回 undefined，并清理没有 stage 的任务', () => {
    const scheduler = createLayoutTaskScheduler();
    const emptyTask = vi.fn(() => undefined);
    const cleanup = vi.fn();
    const cleanupOnlyTask = vi.fn(() => ({
      stages: [],
      cleanup,
    }));

    scheduler.schedule(emptyTask);
    scheduler.schedule(cleanupOnlyTask);
    runNextMicrotask();

    expect(emptyTask).toHaveBeenCalledTimes(1);
    expect(cleanupOnlyTask).toHaveBeenCalledTimes(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('取消等待中的任务后不会创建或执行它的计划', () => {
    const scheduler = createLayoutTaskScheduler();
    const task = vi.fn(() => ({
      stages: [{ read: vi.fn() }],
    }));

    scheduler.schedule(task);
    scheduler.cancel(task);
    runNextMicrotask();

    expect(task).not.toHaveBeenCalled();
  });

  it('运行中的任务被取消后跳过剩余操作并执行一次 cleanup', () => {
    const scheduler = createLayoutTaskScheduler();
    const calls: string[] = [];
    const cleanup = vi.fn(() => calls.push('target cleanup'));
    const targetTask: LayoutTask = () => ({
      stages: [
        {
          read: () => calls.push('target read 1'),
          write: () => calls.push('target write 1'),
        },
        {
          read: () => calls.push('target read 2'),
          write: () => calls.push('target write 2'),
        },
      ],
      cleanup,
    });
    const cancelTask: LayoutTask = () => ({
      stages: [
        {
          read: () => {
            calls.push('cancel read');
            scheduler.cancel(targetTask);
          },
        },
      ],
    });

    scheduler.schedule(cancelTask);
    scheduler.schedule(targetTask);
    runNextMicrotask();

    expect(calls).toEqual(['cancel read', 'target cleanup']);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('任务运行时再次调度自己，会去重并进入下一个微任务批次', () => {
    const scheduler = createLayoutTaskScheduler();
    const calls: string[] = [];
    const task: LayoutTask = vi.fn(() => ({
      stages: [
        {
          read: () => {
            calls.push('read');

            if (calls.length === 1) {
              scheduler.schedule(task);
              scheduler.schedule(task);
            }
          },
        },
      ],
    }));

    scheduler.schedule(task);
    runNextMicrotask();

    expect(task).toHaveBeenCalledTimes(1);
    expect(microtaskCallbacks).toHaveLength(1);

    runNextMicrotask();

    expect(task).toHaveBeenCalledTimes(2);
    expect(calls).toEqual(['read', 'read']);
    expect(microtaskCallbacks).toHaveLength(0);
  });

  it('取消运行中的任务时，也会移除它已经等待的下一轮执行', () => {
    const scheduler = createLayoutTaskScheduler();
    const write = vi.fn();
    const cleanup = vi.fn();
    const task: LayoutTask = vi.fn(() => ({
      stages: [
        {
          read: () => {
            scheduler.schedule(task);
            scheduler.cancel(task);
          },
          write,
        },
      ],
      cleanup,
    }));

    scheduler.schedule(task);
    runNextMicrotask();

    expect(task).toHaveBeenCalledTimes(1);
    expect(write).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(microtaskCallbacks).toHaveLength(1);

    runNextMicrotask();

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('计划创建、read、write 或 cleanup 失败时隔离错误并继续其他任务', () => {
    const scheduler = createLayoutTaskScheduler();
    const reportError = vi.fn();
    const factoryError = new Error('创建计划失败');
    const readError = new Error('read 失败');
    const writeError = new Error('write 失败');
    const cleanupError = new Error('cleanup 失败');
    const skippedWrite = vi.fn();
    const readCleanup = vi.fn();
    const writeCleanup = vi.fn();
    const healthyRead = vi.fn();
    const healthyWrite = vi.fn();
    vi.stubGlobal('reportError', reportError);

    scheduler.schedule(() => {
      throw factoryError;
    });
    scheduler.schedule(() => ({
      stages: [
        {
          read: () => {
            throw readError;
          },
          write: skippedWrite,
        },
      ],
      cleanup: readCleanup,
    }));
    scheduler.schedule(() => ({
      stages: [
        {
          write: () => {
            throw writeError;
          },
        },
      ],
      cleanup: writeCleanup,
    }));
    scheduler.schedule(() => ({
      stages: [{ read: vi.fn(), write: vi.fn() }],
      cleanup: () => {
        throw cleanupError;
      },
    }));
    scheduler.schedule(() => ({
      stages: [{ read: healthyRead, write: healthyWrite }],
    }));
    runNextMicrotask();

    expect(reportError.mock.calls).toEqual([
      [factoryError],
      [readError],
      [writeError],
      [cleanupError],
    ]);
    expect(skippedWrite).not.toHaveBeenCalled();
    expect(readCleanup).toHaveBeenCalledTimes(1);
    expect(writeCleanup).toHaveBeenCalledTimes(1);
    expect(healthyRead).toHaveBeenCalledTimes(1);
    expect(healthyWrite).toHaveBeenCalledTimes(1);
  });
});
