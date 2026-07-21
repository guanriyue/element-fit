import {
  type LayoutTask,
  layoutTaskScheduler,
} from '../../_internal/layoutTaskScheduler.ts';
import {
  createTextareaAutosizeLayoutTaskPlan,
  type TextareaAutosizeLayoutTaskRequest,
} from './createTextareaAutosizeLayoutTaskPlan.ts';
import type { TextareaAutosizeMeasureListener } from './types.ts';

const pendingRequests = new Set<TextareaAutosizeLayoutTaskRequest>();

const textareaAutosizeLayoutTask: LayoutTask = () => {
  const taskRequests = Array.from(pendingRequests);

  pendingRequests.clear();

  if (taskRequests.length === 0) {
    return undefined;
  }

  return createTextareaAutosizeLayoutTaskPlan(taskRequests);
};

export const scheduleTextareaAutosizeMeasure = (
  textarea: HTMLTextAreaElement,
  minRows: number | undefined,
  maxRows: number | undefined,
  listener: TextareaAutosizeMeasureListener,
): (() => void) => {
  const taskRequest: TextareaAutosizeLayoutTaskRequest = {
    request: {
      textarea,
      minRows,
      maxRows,
    },
    listener,
    cancelled: false,
    completed: false,
  };

  pendingRequests.add(taskRequest);
  layoutTaskScheduler.schedule(textareaAutosizeLayoutTask);

  return () => {
    if (taskRequest.cancelled || taskRequest.completed) {
      return;
    }

    taskRequest.cancelled = true;
    pendingRequests.delete(taskRequest);
  };
};
