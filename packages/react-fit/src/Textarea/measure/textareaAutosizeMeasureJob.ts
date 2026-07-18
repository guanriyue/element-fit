import { configureTextareaMirror } from './configureTextareaMirror.ts';
import type {
  PreparedTextareaAutosizeMeasure,
  TextareaAutosizeMeasure,
  TextareaAutosizeMeasureJob,
  TextareaMirrorPair,
} from './types.ts';

const toCSSHeight = (
  scrollHeight: number,
  boxSizing: string,
  paddingBlockSize: number,
  borderBlockSize: number,
): number => {
  if (boxSizing === 'border-box') {
    return scrollHeight + borderBlockSize;
  }

  return Math.max(0, scrollHeight - paddingBlockSize);
};

export const createTextareaAutosizeMeasureJob = (
  preparedMeasure: PreparedTextareaAutosizeMeasure,
  retainedMirrors: TextareaMirrorPair | null,
): {
  job: TextareaAutosizeMeasureJob;
  nodesToMount: HTMLTextAreaElement[];
} => {
  const document = preparedMeasure.request.textarea.ownerDocument;
  const mirror = retainedMirrors === null
    ? document.createElement('textarea')
    : retainedMirrors.mirror;
  const nodesToMount = retainedMirrors === null ? [mirror] : [];

  configureTextareaMirror(mirror, preparedMeasure);
  mirror.value = preparedMeasure.measurementValue;

  let rowMirror = retainedMirrors === null
    ? null
    : retainedMirrors.rowMirror;

  if (preparedMeasure.needsRowHeight && rowMirror === null) {
    rowMirror = mirror.cloneNode(false) as HTMLTextAreaElement;
    nodesToMount.push(rowMirror);
  }

  if (preparedMeasure.needsRowHeight && rowMirror !== null) {
    rowMirror.style.cssText = mirror.style.cssText;

    const wrap = mirror.getAttribute('wrap');

    if (wrap === null) {
      rowMirror.removeAttribute('wrap');
    } else {
      rowMirror.setAttribute('wrap', wrap);
    }

    rowMirror.value = 'x';
  }

  const job: TextareaAutosizeMeasureJob = {
    request: preparedMeasure.request,
    mirror,
    rowMirror,
    borderBoxInlineSize: preparedMeasure.borderBoxInlineSize,
    paddingBlockSize: preparedMeasure.paddingBlockSize,
    borderBlockSize: preparedMeasure.borderBlockSize,
    boxSizing: preparedMeasure.boxSizing,
  };

  return {
    job,
    nodesToMount,
  };
};

export const readTextareaAutosizeMeasure = (
  job: TextareaAutosizeMeasureJob,
): TextareaAutosizeMeasure => {
  const { minRows, maxRows } = job.request;
  const naturalHeight = toCSSHeight(
    job.mirror.scrollHeight,
    job.boxSizing,
    job.paddingBlockSize,
    job.borderBlockSize,
  );
  let minHeight = 0;
  let maxHeight = Number.POSITIVE_INFINITY;

  const needsRowHeight =
    typeof minRows !== 'undefined'
    || typeof maxRows !== 'undefined';

  if (needsRowHeight && job.rowMirror !== null) {
    const rowHeight = Math.max(
      0,
      job.rowMirror.scrollHeight - job.paddingBlockSize,
    );

    if (typeof minRows !== 'undefined') {
      minHeight = toCSSHeight(
        rowHeight * minRows + job.paddingBlockSize,
        job.boxSizing,
        job.paddingBlockSize,
        job.borderBlockSize,
      );
    }

    if (typeof maxRows !== 'undefined') {
      maxHeight = toCSSHeight(
        rowHeight * maxRows + job.paddingBlockSize,
        job.boxSizing,
        job.paddingBlockSize,
        job.borderBlockSize,
      );
    }
  }

  return {
    height: Math.min(maxHeight, Math.max(minHeight, naturalHeight)),
    overflowY: naturalHeight > maxHeight ? 'auto' : 'hidden',
  };
};
