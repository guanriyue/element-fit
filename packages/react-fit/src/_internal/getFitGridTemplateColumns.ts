import { isUndefined } from './isUndefined.ts';

export const getFitGridTemplateColumns = (
  minItemWidth: string,
  minColumns: number | undefined,
  maxColumns: number | undefined,
  colGap: string,
): string => {
  if (!isUndefined(minColumns) && !isUndefined(maxColumns)) {
    const minColumnsLessOne = minColumns - 1;
    const maxColumnsLessOne = maxColumns - 1;

    return `repeat(auto-fit, minmax(min(calc((100% - ${colGap} * ${minColumnsLessOne}) / ${minColumns}), max(${minItemWidth}, calc((100% - ${colGap} * ${maxColumnsLessOne}) / ${maxColumns}))), 1fr))`;
  }

  if (!isUndefined(minColumns)) {
    const minColumnsLessOne = minColumns - 1;

    return `repeat(auto-fit, minmax(min(calc((100% - ${colGap} * ${minColumnsLessOne}) / ${minColumns}), ${minItemWidth}), 1fr))`;
  }

  if (!isUndefined(maxColumns)) {
    const maxColumnsLessOne = maxColumns - 1;

    return `repeat(auto-fit, minmax(max(${minItemWidth}, calc((100% - ${colGap} * ${maxColumnsLessOne}) / ${maxColumns})), 1fr))`;
  }

  return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
};
