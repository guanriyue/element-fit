// 某些测试环境或样式引擎可能会保留 `repeat(<count>, ...)`，
// 而不是把 computed grid tracks 展开成空格分隔的列表。
const repeatColumnPattern = /^repeat\(\s*(\d+)\s*,/u;

// CSS Grid 允许布局过程创建隐式 track，例如某个 grid item 被放置到显式网格之外。
// 这些隐式 track 也可能出现在 computed `grid-template-columns` 结果中。
//
// 对列数统计来说，接近 0 宽的 track 通常不是调用方想要感知的“可见列”。
// 这里忽略小于 1px 的 track，使调用方可以通过把隐式列压到 0px 的方式，
// 将它们从列数语义中排除。
//
// 使用 1px 而不是严格判断 0px，是为了容忍浏览器的小数布局、缩放和序列化误差。
const minVisibleTrackSize = 1;

const isVisibleTrack = (track: string): boolean => {
  const trackSize = Number.parseFloat(track);

  if (Number.isNaN(trackSize)) {
    return true;
  }

  return trackSize >= minVisibleTrackSize;
};

export const getColumnCount = (gridTemplateColumns: string): number => {
  const trimmed = gridTemplateColumns.trim();
  const repeatMatch = repeatColumnPattern.exec(trimmed);

  if (repeatMatch !== null) {
    return Number.parseInt(repeatMatch[1] as string, 10);
  }

  if (trimmed === 'none') {
    return 0;
  }

  return trimmed.split(' ').filter((track) => {
    return track.length > 0 && isVisibleTrack(track);
  }).length;
};
