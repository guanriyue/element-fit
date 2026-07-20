export const LINE_CLAMP_MUTATION_OPTIONS = {
  subtree: true,
  childList: true,
  characterData: true,
} satisfies MutationObserverInit;

export type LineClampMeasureParams = {
  root: HTMLSpanElement;
  contentStartOffset: number;
  contentEndOffset: number;
  lines: number;
  rootContentBoxWidth: number;
};

export type RootContentBoxSize = {
  width: number;
  height: number;
};

export type ContentOffsets = {
  start: number;
  end: number;
};

export type OverflowMeasurement = {
  width: number;
  overflow: boolean;
};

export const canReuseOverflowMeasurement = (
  measurement: OverflowMeasurement | undefined,
  width: number,
): boolean => {
  if (!measurement) {
    return false;
  }

  // For unchanged content and lines, overflow remains true as width gets
  // smaller, while a fitting result remains false as width gets larger.
  return measurement.overflow ? width <= measurement.width : width >= measurement.width;
};

export const getContentOffsets = (
  root: HTMLSpanElement,
  spacer: HTMLSpanElement | null,
  suffix: HTMLSpanElement | null,
): ContentOffsets => {
  const childNodes = Array.from(root.childNodes);
  const end = childNodes.length;

  // Float layout requires Spacer and Suffix to precede the content.
  if (spacer !== null && spacer.parentNode === root) {
    const boundary = suffix !== null ? suffix : spacer;
    const boundaryIndex = childNodes.indexOf(boundary);

    if (boundaryIndex >= 0) {
      return {
        start: boundaryIndex + 1,
        end,
      };
    }
  }

  if (suffix === null || suffix.parentNode !== root) {
    return {
      start: 0,
      end,
    };
  }

  const suffixIndex = childNodes.indexOf(suffix);

  if (suffixIndex < 0) {
    return {
      start: 0,
      end,
    };
  }

  // Expanded layout places Suffix after the content in normal inline order.
  return {
    start: 0,
    end: suffixIndex,
  };
};

export const getRootContentBoxSize = (root: HTMLElement): RootContentBoxSize => {
  const view = root.ownerDocument.defaultView;
  const style = view ? view.getComputedStyle(root) : getComputedStyle(root);
  const paddingInlineStart = Number.parseFloat(style.paddingInlineStart) || 0;
  const paddingInlineEnd = Number.parseFloat(style.paddingInlineEnd) || 0;
  const paddingBlockStart = Number.parseFloat(style.paddingBlockStart) || 0;
  const paddingBlockEnd = Number.parseFloat(style.paddingBlockEnd) || 0;

  return {
    width: Math.max(0, root.clientWidth - paddingInlineStart - paddingInlineEnd),
    height: Math.max(0, root.clientHeight - paddingBlockStart - paddingBlockEnd),
  };
};

export const getEntryContentBoxSize = (entry: ResizeObserverEntry): RootContentBoxSize => {
  const contentBoxSize = entry.contentBoxSize[0];

  if (typeof contentBoxSize !== 'undefined') {
    return {
      width: contentBoxSize.inlineSize,
      height: contentBoxSize.blockSize,
    };
  }

  return {
    width: entry.contentRect.width,
    height: entry.contentRect.height,
  };
};
