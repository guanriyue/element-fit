import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBatchedDoubleRafScheduler } from './batchedDoubleRafScheduler.ts';

let frameCallbacks: FrameRequestCallback[];

const runNextFrame = () => {
  const callbacks = frameCallbacks;
  frameCallbacks = [];

  for (const callback of callbacks) {
    callback(0);
  }
};

beforeEach(() => {
  frameCallbacks = [];
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('batchedDoubleRafScheduler', () => {
  it('在共享的 double RAF 批次中执行不同任务', () => {
    const scheduler = createBatchedDoubleRafScheduler();
    const firstTask = vi.fn();
    const secondTask = vi.fn();

    scheduler.schedule(firstTask);
    scheduler.schedule(secondTask);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    runNextFrame();
    expect(firstTask).not.toHaveBeenCalled();
    expect(secondTask).not.toHaveBeenCalled();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    runNextFrame();
    expect(firstTask).toHaveBeenCalledTimes(1);
    expect(secondTask).toHaveBeenCalledTimes(1);
  });

  it('同一个任务在调度期间只会加入一次', () => {
    const scheduler = createBatchedDoubleRafScheduler();
    const task = vi.fn();

    scheduler.schedule(task);
    scheduler.schedule(task);
    scheduler.schedule(task);
    runNextFrame();
    runNextFrame();

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('第一帧结束后再次调度同一个任务也不会创建重复批次', () => {
    const scheduler = createBatchedDoubleRafScheduler();
    const task = vi.fn();

    scheduler.schedule(task);
    runNextFrame();
    scheduler.schedule(task);
    runNextFrame();

    expect(task).toHaveBeenCalledTimes(1);
    expect(frameCallbacks).toHaveLength(0);
  });

  it('任务执行时可以将自己调度到下一个批次并保持去重', () => {
    const scheduler = createBatchedDoubleRafScheduler();
    const task = vi.fn(() => {
      if (task.mock.calls.length === 1) {
        scheduler.schedule(task);
        scheduler.schedule(task);
      }
    });

    scheduler.schedule(task);
    runNextFrame();
    runNextFrame();
    expect(task).toHaveBeenCalledTimes(1);

    runNextFrame();
    runNextFrame();
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('单个任务抛出异常时仍会继续执行同批次的其他任务', () => {
    const scheduler = createBatchedDoubleRafScheduler();
    const error = new Error('任务执行失败');
    const reportError = vi.fn();
    const secondTask = vi.fn();
    vi.stubGlobal('reportError', reportError);

    scheduler.schedule(() => {
      throw error;
    });
    scheduler.schedule(secondTask);
    runNextFrame();
    runNextFrame();

    expect(reportError).toHaveBeenCalledWith(error);
    expect(secondTask).toHaveBeenCalledTimes(1);
  });

  it('运行环境没有 requestAnimationFrame 时同步执行任务', () => {
    const scheduler = createBatchedDoubleRafScheduler();
    const task = vi.fn();
    vi.stubGlobal('requestAnimationFrame', undefined);

    scheduler.schedule(task);
    scheduler.schedule(task);

    expect(task).toHaveBeenCalledTimes(2);
  });
});
