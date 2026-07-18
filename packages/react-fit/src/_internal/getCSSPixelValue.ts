export const getCSSPixelValue = (
  style: CSSStyleDeclaration,
  property: string,
): number => {
  return Number.parseFloat(style.getPropertyValue(property)) || 0;
};
