import type { TextareaAutosizeMeasureCoordinator } from './types.ts';

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
  coordinator: TextareaAutosizeMeasureCoordinator,
  body: HTMLElement,
): HTMLDivElement => {
  if (coordinator.container !== null) {
    return coordinator.container;
  }

  const container = body.ownerDocument.createElement('div');

  for (const [property, value] of Object.entries(
    TEXTAREA_MEASURE_CONTAINER_STYLE,
  )) {
    container.style.setProperty(property, value, 'important');
  }

  container.setAttribute('aria-hidden', 'true');
  body.appendChild(container);
  coordinator.container = container;

  return container;
};
