import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createViewportPriorityTaskScheduler } from './viewportPriorityTaskScheduler.ts';

type IdleRequest = {
  callback: IdleRequestCallback;
  options?: IdleRequestOptions;
};

let microtaskCallbacks: VoidFunction[];
let idleRequests: IdleRequest[];
let frameCallbacks: FrameRequestCallback[];

const runMicrotasks = () => {
  const callbacks = microtaskCallbacks;
  microtaskCallbacks = [];

  for (const callback of callbacks) {
    callback();
  }
};

const runNextIdleCallback = (deadline: IdleDeadline) => {
  const request = idleRequests.shift();

  if (!request) {
    throw new Error('没有待执行的 Idle Callback。');
  }

  request.callback(deadline);
};

const runNextFrame = () => {
  const callbacks = frameCallbacks;
  frameCallbacks = [];

  for (const callback of callbacks) {
    callback(0);
  }
};

const createIdleDeadline = (
  timeRemaining: () => number = () => 50,
  didTimeout = false,
): IdleDeadline => {
  return {
    didTimeout,
    timeRemaining,
  };
};

beforeEach(() => {
  microtaskCallbacks = [];
  idleRequests = [];
  frameCallbacks = [];

  vi.stubGlobal(
    'queueMicrotask',
    vi.fn((callback: VoidFunction) => {
      microtaskCallbacks.push(callback);
    }),
  );
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((callback: IdleRequestCallback, options?: IdleRequestOptions) => {
      idleRequests.push({ callback, options });
      return idleRequests.length;
    }),
  );
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

describe('viewportPriorityTaskScheduler', () => {
  it('在同一个微任务批次中执行不同的 near 任务', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const firstTask = vi.fn();
    const secondTask = vi.fn();
    const thirdTask = vi.fn();

    scheduler.schedule(firstTask, 'near');
    scheduler.schedule(secondTask, 'near');
    scheduler.schedule(thirdTask, 'near');

    expect(queueMicrotask).toHaveBeenCalledTimes(1);
    runMicrotasks();

    expect(firstTask).toHaveBeenCalledTimes(1);
    expect(secondTask).toHaveBeenCalledTimes(1);
    expect(thirdTask).toHaveBeenCalledTimes(1);
  });

  it('同一个任务在相同优先级中只会加入一次', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const nearTask = vi.fn();
    const farTask = vi.fn();

    scheduler.schedule(nearTask, 'near');
    scheduler.schedule(nearTask, 'near');
    scheduler.schedule(farTask, 'far');
    scheduler.schedule(farTask, 'far');

    runMicrotasks();
    runNextIdleCallback(createIdleDeadline());

    expect(nearTask).toHaveBeenCalledTimes(1);
    expect(farTask).toHaveBeenCalledTimes(1);
  });

  it('任务从 far 迁移到 near 后只在 near 队列执行', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const task = vi.fn();

    scheduler.schedule(task, 'far');
    scheduler.schedule(task, 'near');

    runMicrotasks();
    expect(task).toHaveBeenCalledTimes(1);

    runNextIdleCallback(createIdleDeadline());
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('任务从 near 迁移到 far 后只在 far 队列执行', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const task = vi.fn();

    scheduler.schedule(task, 'near');
    scheduler.schedule(task, 'far');

    runMicrotasks();
    expect(task).not.toHaveBeenCalled();

    runNextIdleCallback(createIdleDeadline());
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('取消后不会执行已经进入调度队列的任务', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const nearTask = vi.fn();
    const farTask = vi.fn();

    scheduler.schedule(nearTask, 'near');
    scheduler.schedule(farTask, 'far');
    scheduler.cancel(nearTask);
    scheduler.cancel(farTask);

    runMicrotasks();
    runNextIdleCallback(createIdleDeadline());

    expect(nearTask).not.toHaveBeenCalled();
    expect(farTask).not.toHaveBeenCalled();
  });

  it('按照 farTaskBatchSize 分批执行 far 任务', () => {
    const scheduler = createViewportPriorityTaskScheduler({
      farTaskBatchSize: 2,
    });
    const firstTask = vi.fn();
    const secondTask = vi.fn();
    const thirdTask = vi.fn();

    scheduler.schedule(firstTask, 'far');
    scheduler.schedule(secondTask, 'far');
    scheduler.schedule(thirdTask, 'far');

    runNextIdleCallback(createIdleDeadline(() => 0, true));

    expect(firstTask).toHaveBeenCalledTimes(1);
    expect(secondTask).toHaveBeenCalledTimes(1);
    expect(thirdTask).not.toHaveBeenCalled();
    expect(idleRequests).toHaveLength(1);

    runNextIdleCallback(createIdleDeadline(() => 0, true));
    expect(thirdTask).toHaveBeenCalledTimes(1);
  });

  it('空闲时间不足时仍执行一个任务并把剩余任务留到下一批', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const firstTask = vi.fn();
    const secondTask = vi.fn();

    scheduler.schedule(firstTask, 'far');
    scheduler.schedule(secondTask, 'far');

    runNextIdleCallback(createIdleDeadline(() => 0));

    expect(firstTask).toHaveBeenCalledTimes(1);
    expect(secondTask).not.toHaveBeenCalled();
    expect(idleRequests).toHaveLength(1);
  });

  it('为 far 任务设置 300ms 的饥饿兜底 timeout', () => {
    const scheduler = createViewportPriorityTaskScheduler();

    scheduler.schedule(vi.fn(), 'far');

    expect(requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(idleRequests[0]?.options).toEqual({
      timeout: 300,
    });
  });

  it('单个任务抛出异常时仍继续执行同批次的其他任务', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const error = new Error('任务执行失败');
    const reportError = vi.fn();
    const secondTask = vi.fn();
    vi.stubGlobal('reportError', reportError);

    scheduler.schedule(() => {
      throw error;
    }, 'near');
    scheduler.schedule(secondTask, 'near');
    runMicrotasks();

    expect(reportError).toHaveBeenCalledWith(error);
    expect(secondTask).toHaveBeenCalledTimes(1);
  });

  it('不支持 requestIdleCallback 时使用 requestAnimationFrame 分批执行', () => {
    const scheduler = createViewportPriorityTaskScheduler();
    const task = vi.fn();
    vi.stubGlobal('requestIdleCallback', undefined);

    scheduler.schedule(task, 'far');

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    runNextFrame();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it.each([0, -1, 1.5, Number.NaN])('拒绝无效的 farTaskBatchSize：%s', (farTaskBatchSize) => {
    expect(() => {
      createViewportPriorityTaskScheduler({ farTaskBatchSize });
    }).toThrow(RangeError);
  });
});
