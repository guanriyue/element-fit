import type { TextareaAutosizeMeasureResources } from './types.ts';

const TEXTAREA_MEASURE_CONTAINER_STYLE = {
  contain: 'strict',
  height: '0',
  left: '0',
  'pointer-events': 'none',
  position: 'fixed',
  top: '0',
  visibility: 'hidden',
  width: '0',
} as const;

export const getTextareaMeasureContainer = (
  resources: TextareaAutosizeMeasureResources,
  body: HTMLElement,
): HTMLDivElement => {
  if (resources.container !== null) {
    return resources.container;
  }

  const container = body.ownerDocument.createElement('div');

  for (const [property, value] of Object.entries(
    TEXTAREA_MEASURE_CONTAINER_STYLE,
  )) {
    container.style.setProperty(property, value, 'important');
  }

  container.setAttribute('aria-hidden', 'true');
  body.appendChild(container);
  resources.container = container;

  return container;
};
