import { CompactGrid } from '@guanriyue/react-fit/compact-grid';
import { type CSSProperties, memo, useState } from 'react';
import { FPS } from '@/components/custom/fps';
import { Button } from '@/components/ui/button';
import {
  getStressWidthClassName,
  StressInstanceCountSelect,
  type StressInstanceCount,
  StressRenderModeControl,
  type StressRenderMode,
  stressInstances,
  StressWidthSwitches,
  useStressWidth,
} from '@/stress-tests/shared';

type CompactGridListProps = {
  instanceCount: StressInstanceCount;
  renderMode: StressRenderMode;
  showRegion: boolean;
};

const nativeGridStyle: CSSProperties = {
  columnGap: '0.25rem',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(max(6.5rem, calc((100% - 0.25rem * 2) / 3)), 1fr))',
  rowGap: '0.25rem',
};

const itemClassName = 'min-w-0 rounded-sm border px-2 py-1.5 text-xs';

const CompactGridList = memo((props: CompactGridListProps) => {
  const { instanceCount, renderMode, showRegion } = props;

  return (
    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
      {stressInstances.slice(0, instanceCount).map((index) => (
        <div key={index} className="min-w-0 bg-background p-2">
          {renderMode === 'component' ? (
            <CompactGrid minItemWidth="6.5rem" maxColumns={3} colGap="0.25rem" rowGap="0.25rem">
              <CompactGrid.Item className={itemClassName}>
                关键词 {index + 1}
              </CompactGrid.Item>
              <CompactGrid.Item className={itemClassName}>状态</CompactGrid.Item>
              {showRegion ? (
                <CompactGrid.Item className={itemClassName}>区域</CompactGrid.Item>
              ) : null}
              <CompactGrid.Item className={`${itemClassName} flex items-center justify-between gap-1`}>
                <span className="truncate">负责人</span>
                <CompactGrid.ExtraSlot className="shrink-0" />
              </CompactGrid.Item>
              <CompactGrid.Extra className={`${itemClassName} text-blue-600 dark:text-blue-400`}>
                重置
              </CompactGrid.Extra>
            </CompactGrid>
          ) : (
            <div style={nativeGridStyle}>
              <div className={itemClassName}>关键词 {index + 1}</div>
              <div className={itemClassName}>状态</div>
              {showRegion ? <div className={itemClassName}>区域</div> : null}
              <div className={`${itemClassName} flex items-center justify-between gap-1`}>
                <span className="truncate">负责人</span>
              </div>
              <div className={`${itemClassName} text-blue-600 dark:text-blue-400`}>
                重置
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

CompactGridList.displayName = 'CompactGridList';

export const CompactGridStressTest = () => {
  const [instanceCount, setInstanceCount] = useState<StressInstanceCount>(200);
  const [renderMode, setRenderMode] = useState<StressRenderMode>('component');
  const [showRegion, setShowRegion] = useState(false);
  const [mountRevision, setMountRevision] = useState(0);
  const {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  } = useStressWidth();

  const handleRegionToggle = () => {
    setShowRegion((current) => !current);
  };

  const handleRemount = () => {
    setMountRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <StressInstanceCountSelect
          id="compact-grid-instance-count"
          value={instanceCount}
          onValueChange={setInstanceCount}
        />
        <StressRenderModeControl value={renderMode} onValueChange={setRenderMode} />

        <Button type="button" variant="outline" size="sm" onClick={handleRegionToggle}>
          {showRegion ? '移除区域字段' : '增加区域字段'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={autoResize}
          onClick={toggleNarrow}
        >
          {narrow ? '切换为宽容器' : '切换为窄容器'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleRemount}>
          重新挂载
        </Button>

        <StressWidthSwitches
          idPrefix="compact-grid"
          autoResize={autoResize}
          widthAnimation={widthAnimation}
          onAutoResizeChange={setAutoResize}
          onWidthAnimationChange={setWidthAnimation}
        />
      </div>

      <div
        className={getStressWidthClassName(widthAnimation)}
        style={{ width: narrow ? '62%' : '100%' }}
      >
        <CompactGridList
          key={`${renderMode}-${mountRevision}`}
          instanceCount={instanceCount}
          renderMode={renderMode}
          showRegion={showRegion}
        />
      </div>
    </div>
  );
};
