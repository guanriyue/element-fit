import { measureLineRects } from './measureLineRects';
import { createLineClampStore, type LineClampMeasureParams, type LineClampStore } from './store';

const applyMeasureRootStyle = (measureRoot: HTMLDivElement, width: number) => {
  measureRoot.style.position = 'fixed';
  measureRoot.style.top = '0';
  measureRoot.style.left = '0';
  measureRoot.style.display = 'block';
  measureRoot.style.boxSizing = 'content-box';
  measureRoot.style.width = `${width}px`;
  measureRoot.style.height = 'auto';
  measureRoot.style.minHeight = '0';
  measureRoot.style.maxHeight = 'none';
  measureRoot.style.margin = '0';
  measureRoot.style.padding = '0';
  measureRoot.style.border = '0';
  measureRoot.style.overflow = 'visible';
  measureRoot.style.visibility = 'hidden';
  measureRoot.style.opacity = '0';
  measureRoot.style.pointerEvents = 'none';
  measureRoot.style.zIndex = '-2147483648';
};

const measureCloneOverflow = (params: LineClampMeasureParams): boolean => {
  const {
    root,
    contentStartOffset,
    contentEndOffset,
    lines,
    rootContentBoxWidth,
  } = params;
  const document = root.ownerDocument;
  const measureRoot = document.createElement('div');
  const contentNodes = Array.from(root.childNodes).slice(
    contentStartOffset,
    contentEndOffset,
  );

  // Clone only content nodes. Including Spacer or Suffix would make the
  // measurement depend on the currently rendered collapsed/expanded UI.
  applyMeasureRootStyle(measureRoot, rootContentBoxWidth);
  measureRoot.setAttribute('aria-hidden', 'true');
  measureRoot.setAttribute('inert', '');

  for (const contentNode of contentNodes) {
    measureRoot.appendChild(contentNode.cloneNode(true));
  }

  root.appendChild(measureRoot);

  try {
    return measureLineRects(
      measureRoot,
      0,
      measureRoot.childNodes.length,
    ).length > lines;
  } finally {
    measureRoot.remove();
  }
};

export const createLineClampCloneStore = (
  initialLines: number | undefined,
): LineClampStore => {
  return createLineClampStore(initialLines, measureCloneOverflow);
};
