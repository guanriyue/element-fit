import { getCSSPixelValue } from '../../_internal/getCSSPixelValue.ts';
import { readTextareaSizingStyles } from './readTextareaSizingStyles.ts';
import type {
  PreparedTextareaAutosizeMeasure,
  TextareaAutosizeMeasureRequest,
} from './types.ts';

export const prepareTextareaAutosizeMeasure = (
  request: TextareaAutosizeMeasureRequest,
): PreparedTextareaAutosizeMeasure | null => {
  const { textarea } = request;
  const document = textarea.ownerDocument;
  const view = document.defaultView;
  const body = document.body;

  if (view === null || body === null) {
    return null;
  }

  const textareaRect = textarea.getBoundingClientRect();

  if (textareaRect.width === 0) {
    return null;
  }

  const computedStyle = view.getComputedStyle(textarea);
  const paddingBlockSize =
    getCSSPixelValue(computedStyle, 'padding-top')
    + getCSSPixelValue(computedStyle, 'padding-bottom');
  const borderBlockSize =
    getCSSPixelValue(computedStyle, 'border-top-width')
    + getCSSPixelValue(computedStyle, 'border-bottom-width');

  const wrap = textarea.getAttribute('wrap');
  const sourceValue = textarea.value.length > 0
    ? textarea.value
    : textarea.placeholder;
  let measurementValue = sourceValue.length > 0 ? sourceValue : 'x';

  if (measurementValue.endsWith('\n')) {
    measurementValue += ' ';
  }

  const needsRowHeight =
    typeof request.minRows !== 'undefined'
    || typeof request.maxRows !== 'undefined';

  return {
    request,
    body,
    sizingStyles: readTextareaSizingStyles(computedStyle),
    wrap,
    measurementValue,
    needsRowHeight,
    borderBoxInlineSize: textareaRect.width,
    paddingBlockSize,
    borderBlockSize,
    boxSizing: computedStyle.boxSizing,
  };
};
