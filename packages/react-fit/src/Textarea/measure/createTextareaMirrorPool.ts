import type {
  TextareaMirrorPair,
  TextareaMirrorPool,
} from './types.ts';

const TEXTAREA_MIRROR_RETENTION_MS = 200;

type RetainedTextareaMirrors = {
  textarea: HTMLTextAreaElement;
  mirrors: TextareaMirrorPair;
  expiresAt: number;
};

const removeTextareaMirrors = (
  mirrors: TextareaMirrorPair,
) => {
  if (mirrors.mirror.parentNode !== null) {
    mirrors.mirror.remove();
  }

  if (
    mirrors.rowMirror !== null
    && mirrors.rowMirror.parentNode !== null
  ) {
    mirrors.rowMirror.remove();
  }
};

export const createTextareaMirrorPool = (
  onEmpty: () => void,
): TextareaMirrorPool => {
  const retainedByTextarea = new Map<
    HTMLTextAreaElement,
    RetainedTextareaMirrors
  >();
  const retainedMirrors = new Set<RetainedTextareaMirrors>();
  let cleanupTimerId: number | null = null;
  let cleanupFrameId: number | null = null;

  const scheduleCleanup = () => {
    if (cleanupTimerId !== null || cleanupFrameId !== null) {
      return;
    }

    let earliestExpiration = Number.POSITIVE_INFINITY;

    for (const retained of retainedMirrors) {
      earliestExpiration = Math.min(
        earliestExpiration,
        retained.expiresAt,
      );
    }

    if (earliestExpiration === Number.POSITIVE_INFINITY) {
      return;
    }

    const delay = Math.max(0, earliestExpiration - performance.now());

    cleanupTimerId = window.setTimeout(() => {
      cleanupTimerId = null;
      cleanupFrameId = requestAnimationFrame(() => {
        cleanupFrameId = null;
        const now = performance.now();

        for (const retained of retainedMirrors) {
          if (retained.expiresAt > now) {
            continue;
          }

          const current = retainedByTextarea.get(retained.textarea);

          // acquire() removes the current record before this RAF runs, so a
          // mirror that became active again cannot be removed by stale cleanup.
          if (current !== retained) {
            retainedMirrors.delete(retained);
            continue;
          }

          retainedByTextarea.delete(retained.textarea);
          retainedMirrors.delete(retained);
          removeTextareaMirrors(retained.mirrors);
        }

        if (retainedMirrors.size === 0) {
          onEmpty();
        }

        scheduleCleanup();
      });
    }, delay);
  };

  return {
    acquire: (textarea) => {
      const retained = retainedByTextarea.get(textarea);

      if (typeof retained === 'undefined') {
        return null;
      }

      retainedByTextarea.delete(textarea);
      retainedMirrors.delete(retained);
      return retained.mirrors;
    },
    release: (textarea, mirrors) => {
      const previous = retainedByTextarea.get(textarea);

      if (typeof previous !== 'undefined') {
        retainedByTextarea.delete(textarea);
        retainedMirrors.delete(previous);
        removeTextareaMirrors(previous.mirrors);
      }

      const retained: RetainedTextareaMirrors = {
        textarea,
        mirrors,
        expiresAt: performance.now() + TEXTAREA_MIRROR_RETENTION_MS,
      };

      retainedByTextarea.set(textarea, retained);
      retainedMirrors.add(retained);
      scheduleCleanup();
    },
  };
};
