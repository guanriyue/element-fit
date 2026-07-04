// 某些测试环境或样式引擎可能会保留 `repeat(<count>, ...)`，
// 而不是把 computed grid tracks 展开成空格分隔的列表。
const repeatColumnPattern = /^repeat\(\s*(\d+)\s*,/u;

export const getColumnCount = (gridTemplateColumns: string): number => {
  const trimmed = gridTemplateColumns.trim();
  const repeatMatch = repeatColumnPattern.exec(trimmed);

  if (repeatMatch !== null) {
    return Number.parseInt(repeatMatch[1] as string, 10);
  }

  if (trimmed === 'none') {
    return 0;
  }

  return trimmed.split(' ').filter((track) => track.length > 0).length;
};
