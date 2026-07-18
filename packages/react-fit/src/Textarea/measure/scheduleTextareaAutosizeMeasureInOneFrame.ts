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
  TextareaAutosizeMeasureCoordinator,
  TextareaAutosizeMeasureJob,
  TextareaAutosizeMeasureListener,
  TextareaAutosizeMeasureRequest,
} from './types.ts';

type MeasuredTextareaAutosizeResult = {
  job: TextareaAutosizeMeasureJob;
  measure: TextareaAutosizeMeasure;
};

type RawTextareaStyleReadResult = {
  preparedMeasures: PreparedTextareaAutosizeMeasure[];
  failedRequests: TextareaAutosizeMeasureRequest[];
};

let coordinator: TextareaAutosizeMeasureCoordinator | null = null;

const tryRemoveTextareaMeasureContainer = (
  coordinator: TextareaAutosizeMeasureCoordinator,
) => {
  const container = coordinator.container;

  if (container === null || container.childNodes.length > 0) {
    return;
  }

  if (coordinator.pendingRawStyleRequests.size > 0) {
    return;
  }

  if (coordinator.frameId !== null) {
    return;
  }

  container.remove();
  coordinator.container = null;
};

const readRawTextareaStyles = (
  requests: TextareaAutosizeMeasureRequest[],
): RawTextareaStyleReadResult => {
  const preparedMeasures: PreparedTextareaAutosizeMeasure[] = [];
  const failedRequests: TextareaAutosizeMeasureRequest[] = [];

  for (const request of requests) {
    if (request.cancelled) {
      continue;
    }

    const preparedMeasure = prepareTextareaAutosizeMeasure(request);

    if (preparedMeasure === null) {
      failedRequests.push(request);
      continue;
    }

    preparedMeasures.push(preparedMeasure);
  }

  return {
    preparedMeasures,
    failedRequests,
  };
};

const insertMirrorTextareas = (
  coordinator: TextareaAutosizeMeasureCoordinator,
  preparedMeasures: PreparedTextareaAutosizeMeasure[],
): TextareaAutosizeMeasureJob[] => {
  const firstPreparedMeasure = preparedMeasures[0];

  if (typeof firstPreparedMeasure === 'undefined') {
    return [];
  }

  const container = getTextareaMeasureContainer(
    coordinator,
    firstPreparedMeasure.body,
  );
  const fragment = firstPreparedMeasure.body.ownerDocument
    .createDocumentFragment();
  const jobs: TextareaAutosizeMeasureJob[] = [];

  for (const preparedMeasure of preparedMeasures) {
    const request = preparedMeasure.request;

    if (request.cancelled) {
      continue;
    }

    const retainedMirrors = coordinator.mirrorPool.acquire(
      request.textarea,
    );
    const preparedJob = createTextareaAutosizeMeasureJob(
      preparedMeasure,
      retainedMirrors,
    );

    request.job = preparedJob.job;
    jobs.push(preparedJob.job);

    for (const node of preparedJob.nodesToMount) {
      fragment.appendChild(node);
    }
  }

  container.appendChild(fragment);
  return jobs;
};

const readMirrorTextareaSizes = (
  jobs: TextareaAutosizeMeasureJob[],
): MeasuredTextareaAutosizeResult[] => {
  const results: MeasuredTextareaAutosizeResult[] = [];

  for (const job of jobs) {
    if (job.request.cancelled) {
      continue;
    }

    results.push({
      job,
      measure: readTextareaAutosizeMeasure(job),
    });
  }

  return results;
};

const writeTextareaSizes = (
  results: MeasuredTextareaAutosizeResult[],
  failedRequests: TextareaAutosizeMeasureRequest[],
) => {
  for (const result of results) {
    const { job, measure } = result;
    const { request } = job;

    if (request.cancelled) {
      continue;
    }

    request.completed = true;
    request.listener(measure, job.borderBoxInlineSize);
  }

  for (const request of failedRequests) {
    if (request.cancelled) {
      continue;
    }

    request.completed = true;
    request.listener(null, 0);
  }
};

const releaseMirrorTextareas = (
  coordinator: TextareaAutosizeMeasureCoordinator,
  jobs: TextareaAutosizeMeasureJob[],
) => {
  for (const job of jobs) {
    coordinator.mirrorPool.release(job.request.textarea, {
      mirror: job.mirror,
      rowMirror: job.rowMirror,
    });
    job.request.job = null;
  }
};

const getCoordinator = (): TextareaAutosizeMeasureCoordinator => {
  if (coordinator !== null) {
    return coordinator;
  }

  let nextCoordinator: TextareaAutosizeMeasureCoordinator;
  const mirrorPool = createTextareaMirrorPool(() => {
    tryRemoveTextareaMeasureContainer(nextCoordinator);
  });

  nextCoordinator = {
    container: null,
    mirrorPool,
    frameId: null,
    pendingRawStyleRequests: new Set(),
    pendingMirrorSizeJobs: new Set(),
  };

  coordinator = nextCoordinator;
  return nextCoordinator;
};

const scheduleCoordinatorFrame = (
  coordinator: TextareaAutosizeMeasureCoordinator,
) => {
  if (coordinator.frameId !== null) {
    return;
  }

  coordinator.frameId = requestAnimationFrame(() => {
    coordinator.frameId = null;
    const requests = Array.from(
      coordinator.pendingRawStyleRequests,
    );

    coordinator.pendingRawStyleRequests.clear();

    // Keep every operation batched by phase. Reading the first mirror forces
    // one synchronous layout for all mirrors inserted earlier in this frame.
    const rawStyleResult = readRawTextareaStyles(requests);
    const jobs = insertMirrorTextareas(
      coordinator,
      rawStyleResult.preparedMeasures,
    );
    const measuredResults = readMirrorTextareaSizes(jobs);

    writeTextareaSizes(
      measuredResults,
      rawStyleResult.failedRequests,
    );
    releaseMirrorTextareas(coordinator, jobs);
    tryRemoveTextareaMeasureContainer(coordinator);
  });
};

export const scheduleTextareaAutosizeMeasureInOneFrame = (
  textarea: HTMLTextAreaElement,
  minRows: number | undefined,
  maxRows: number | undefined,
  listener: TextareaAutosizeMeasureListener,
): (() => void) | null => {
  if (typeof requestAnimationFrame !== 'function') {
    return null;
  }

  const coordinator = getCoordinator();
  const request: TextareaAutosizeMeasureRequest = {
    textarea,
    minRows,
    maxRows,
    listener,
    cancelled: false,
    completed: false,
    job: null,
  };

  coordinator.pendingRawStyleRequests.add(request);
  scheduleCoordinatorFrame(coordinator);

  return () => {
    if (request.cancelled || request.completed) {
      return;
    }

    request.cancelled = true;
    coordinator.pendingRawStyleRequests.delete(request);

    if (request.job !== null) {
      coordinator.mirrorPool.release(textarea, {
        mirror: request.job.mirror,
        rowMirror: request.job.rowMirror,
      });
      request.job = null;
    }
  };
};
