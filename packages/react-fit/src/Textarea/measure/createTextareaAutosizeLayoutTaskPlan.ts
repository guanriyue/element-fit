import type { LayoutTaskPlan } from '../../_internal/layoutTaskScheduler.ts';
import { reportTaskError } from '../../_internal/reportTaskError.ts';
import { createTextareaMirrorPool } from './createTextareaMirrorPool.ts';
import { getTextareaMeasureContainer } from './getTextareaMeasureContainer.ts';
import { prepareTextareaAutosizeMeasure } from './prepareTextareaAutosizeMeasure.ts';
import {
  createTextareaAutosizeMeasureJob,
  readTextareaAutosizeMeasure,
} from './textareaAutosizeMeasureJob.ts';
import type {
  PreparedTextareaAutosizeMeasure,
  TextareaAutosizeMeasure,
  TextareaAutosizeMeasureJob,
  TextareaAutosizeMeasureListener,
  TextareaAutosizeMeasureRequest,
  TextareaAutosizeMeasureResources,
  TextareaMirrorPair,
} from './types.ts';

export type TextareaAutosizeLayoutTaskRequest = {
  request: TextareaAutosizeMeasureRequest;
  listener: TextareaAutosizeMeasureListener;
  cancelled: boolean;
  completed: boolean;
};

type PreparedRequest = {
  taskRequest: TextareaAutosizeLayoutTaskRequest;
  preparedMeasure: PreparedTextareaAutosizeMeasure;
};

type MeasureJob = {
  taskRequest: TextareaAutosizeLayoutTaskRequest;
  job: TextareaAutosizeMeasureJob;
};

type MeasuredResult = MeasureJob & {
  measure: TextareaAutosizeMeasure;
};

type OwnedMirrors = {
  textarea: HTMLTextAreaElement;
  mirrors: TextareaMirrorPair;
};

let resources: TextareaAutosizeMeasureResources | undefined;

const tryRemoveTextareaMeasureContainer = (
  measureResources: TextareaAutosizeMeasureResources,
) => {
  const { container } = measureResources;

  if (!container || container.childNodes.length > 0) {
    return;
  }

  container.remove();
  measureResources.container = null;
};

const getResources = (): TextareaAutosizeMeasureResources => {
  if (resources) {
    return resources;
  }

  let nextResources: TextareaAutosizeMeasureResources;
  const mirrorPool = createTextareaMirrorPool(() => {
    try {
      tryRemoveTextareaMeasureContainer(nextResources);
    } catch (error) {
      reportTaskError(error);
    }
  });

  nextResources = {
    container: null,
    mirrorPool,
  };
  resources = nextResources;
  return nextResources;
};

export const createTextareaAutosizeLayoutTaskPlan = (
  taskRequests: readonly TextareaAutosizeLayoutTaskRequest[],
): LayoutTaskPlan => {
  const measureResources = getResources();
  const preparedRequests: PreparedRequest[] = [];
  const failedRequests = new Set<TextareaAutosizeLayoutTaskRequest>();
  const jobs: MeasureJob[] = [];
  const measuredResults: MeasuredResult[] = [];
  const ownedMirrors: OwnedMirrors[] = [];

  const releaseMirrors = () => {
    for (const owned of ownedMirrors) {
      try {
        measureResources.mirrorPool.release(
          owned.textarea,
          owned.mirrors,
        );
      } catch (error) {
        reportTaskError(error);
      }
    }

    ownedMirrors.length = 0;

    try {
      tryRemoveTextareaMeasureContainer(measureResources);
    } catch (error) {
      reportTaskError(error);
    }
  };

  return {
    stages: [
      {
        read: () => {
          for (const taskRequest of taskRequests) {
            if (taskRequest.cancelled) {
              continue;
            }

            let preparedMeasure: PreparedTextareaAutosizeMeasure | null;

            try {
              preparedMeasure = prepareTextareaAutosizeMeasure(
                taskRequest.request,
              );
            } catch (error) {
              failedRequests.add(taskRequest);
              reportTaskError(error);
              continue;
            }

            if (!preparedMeasure) {
              failedRequests.add(taskRequest);
              continue;
            }

            preparedRequests.push({
              taskRequest,
              preparedMeasure,
            });
          }
        },
        write: () => {
          const firstPreparedRequest = preparedRequests[0];

          if (!firstPreparedRequest) {
            return;
          }

          const { body } = firstPreparedRequest.preparedMeasure;
          const fragment = body.ownerDocument.createDocumentFragment();

          for (const preparedRequest of preparedRequests) {
            const { taskRequest, preparedMeasure } = preparedRequest;

            if (taskRequest.cancelled) {
              continue;
            }

            try {
              const { textarea } = taskRequest.request;
              const retainedMirrors = measureResources.mirrorPool.acquire(
                textarea,
              );
              let owned: OwnedMirrors | undefined;

              if (retainedMirrors) {
                owned = {
                  textarea,
                  mirrors: retainedMirrors,
                };
                ownedMirrors.push(owned);
              }

              const preparedJob = createTextareaAutosizeMeasureJob(
                preparedMeasure,
                retainedMirrors,
              );
              const { job } = preparedJob;
              const mirrors = {
                mirror: job.mirror,
                rowMirror: job.rowMirror,
              };

              if (owned) {
                owned.mirrors = mirrors;
              } else {
                ownedMirrors.push({ textarea, mirrors });
              }

              for (const node of preparedJob.nodesToMount) {
                fragment.appendChild(node);
              }

              jobs.push({ taskRequest, job });
            } catch (error) {
              failedRequests.add(taskRequest);
              reportTaskError(error);
            }
          }

          if (fragment.childNodes.length === 0) {
            return;
          }

          try {
            const container = getTextareaMeasureContainer(
              measureResources,
              body,
            );

            container.appendChild(fragment);
          } catch (error) {
            reportTaskError(error);

            for (let index = jobs.length - 1; index >= 0; index -= 1) {
              const measureJob = jobs[index];

              if (!measureJob || measureJob.job.mirror.isConnected) {
                continue;
              }

              failedRequests.add(measureJob.taskRequest);
              jobs.splice(index, 1);
            }
          }
        },
      },
      {
        read: () => {
          for (const measureJob of jobs) {
            if (measureJob.taskRequest.cancelled) {
              continue;
            }

            try {
              measuredResults.push({
                ...measureJob,
                measure: readTextareaAutosizeMeasure(measureJob.job),
              });
            } catch (error) {
              failedRequests.add(measureJob.taskRequest);
              reportTaskError(error);
            }
          }
        },
        write: () => {
          for (const measuredResult of measuredResults) {
            const { taskRequest, job, measure } = measuredResult;

            if (taskRequest.cancelled) {
              continue;
            }

            taskRequest.completed = true;

            try {
              taskRequest.listener(measure, job.borderBoxInlineSize);
            } catch (error) {
              reportTaskError(error);
            }
          }

          for (const taskRequest of failedRequests) {
            if (taskRequest.cancelled) {
              continue;
            }

            taskRequest.completed = true;

            try {
              taskRequest.listener(null, 0);
            } catch (error) {
              reportTaskError(error);
            }
          }
        },
      },
    ],
    cleanup: releaseMirrors,
  };
};
