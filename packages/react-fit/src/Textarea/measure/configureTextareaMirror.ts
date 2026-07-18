import type { PreparedTextareaAutosizeMeasure } from './types.ts';

const HIDDEN_TEXTAREA_STYLE = {
  display: 'block',
  height: '0',
  left: '0',
  'max-height': 'none',
  'min-height': '0',
  overflow: 'hidden',
  'pointer-events': 'none',
  position: 'absolute',
  resize: 'none',
  top: '0',
  visibility: 'hidden',
  'z-index': '-1000',
} as const;

export const configureTextareaMirror = (
  mirror: HTMLTextAreaElement,
  preparedMeasure: PreparedTextareaAutosizeMeasure,
) => {
  for (const sizingStyle of preparedMeasure.sizingStyles) {
    mirror.style.setProperty(sizingStyle.property, sizingStyle.value);
  }

  for (const [property, value] of Object.entries(HIDDEN_TEXTAREA_STYLE)) {
    mirror.style.setProperty(property, value, 'important');
  }

  mirror.setAttribute('aria-hidden', 'true');
  mirror.tabIndex = -1;
  mirror.readOnly = true;
  mirror.rows = 1;

  if (preparedMeasure.wrap === null) {
    mirror.removeAttribute('wrap');
  } else {
    mirror.setAttribute('wrap', preparedMeasure.wrap);
  }
};
