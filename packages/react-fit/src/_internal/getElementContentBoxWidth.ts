import { getCSSPixelValue } from './getCSSPixelValue.ts';

/** 同步读取元素 content box 的水平宽度。 */
export const getElementContentBoxWidth = (element: Element): number => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return Math.max(
    0,
    rect.width
      - getCSSPixelValue(style, 'border-inline-start-width')
      - getCSSPixelValue(style, 'border-inline-end-width')
      - getCSSPixelValue(style, 'padding-inline-start')
      - getCSSPixelValue(style, 'padding-inline-end'),
  );
};
