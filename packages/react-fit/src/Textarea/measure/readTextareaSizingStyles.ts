import type { TextareaSizingStyle } from './types.ts';

const TEXTAREA_SIZING_STYLE_PROPERTIES = [
  'appearance',
  'border-bottom-width',
  'border-left-width',
  'border-right-width',
  'border-top-width',
  'box-sizing',
  'direction',
  'font-family',
  'font-feature-settings',
  'font-kerning',
  'font-optical-sizing',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-synthesis',
  'font-variant',
  'font-variation-settings',
  'font-weight',
  'hyphens',
  'letter-spacing',
  'line-break',
  'line-height',
  'overflow-wrap',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'scrollbar-gutter',
  'tab-size',
  'text-align',
  'text-indent',
  'text-orientation',
  'text-rendering',
  'text-transform',
  'text-wrap-mode',
  'unicode-bidi',
  'white-space',
  'white-space-collapse',
  'width',
  'word-break',
  'word-spacing',
  'writing-mode',
] as const;

export const readTextareaSizingStyles = (
  source: CSSStyleDeclaration,
): TextareaSizingStyle[] => {
  const sizingStyles: TextareaSizingStyle[] = [];

  for (const property of TEXTAREA_SIZING_STYLE_PROPERTIES) {
    const value = source.getPropertyValue(property);

    if (value.length === 0) {
      continue;
    }

    sizingStyles.push({ property, value });
  }

  return sizingStyles;
};
