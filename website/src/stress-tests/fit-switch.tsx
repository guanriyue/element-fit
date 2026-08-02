import { FitSwitch } from '@guanriyue/react-fit/fit-switch';
import { memo, useState } from 'react';
import { FPS } from '@/components/custom/fps';
import { Button } from '@/components/ui/button';
import {
  getStressWidthClassName,
  type StressInstanceCount,
  StressInstanceCountSelect,
  type StressRenderMode,
  StressRenderModeControl,
  StressWidthSwitches,
  stressInstances,
  useStressWidth,
} from '@/stress-tests/shared';

const compactLabels = ['概览', '更多'];
const shortExpandedLabels = ['概览', '报表', '通知', '设置'];
const longExpandedLabels = ['概览', '数据报表', '通知中心', '偏好设置'];

type FitSwitchListProps = {
  detailed: boolean;
  instanceCount: StressInstanceCount;
  renderMode: StressRenderMode;
};

const FitSwitchLabels = (props: { labels: string[] }) => {
  const { labels } = props;

  return (
    <div className="flex w-max items-center gap-1">
      {labels.map((label) => (
        <span key={label} className="rounded-sm bg-muted px-2 py-1 text-xs">
          {label}
        </span>
      ))}
    </div>
  );
};

const FitSwitchList = memo((props: FitSwitchListProps) => {
  const { detailed, instanceCount, renderMode } = props;
  const expandedLabels = detailed ? longExpandedLabels : shortExpandedLabels;
  const collapsedClassName = detailed
    ? 'block @min-[15rem]:hidden'
    : 'block @min-[12rem]:hidden';
  const expandedClassName = detailed
    ? 'hidden @min-[15rem]:block'
    : 'hidden @min-[12rem]:block';

  return (
    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
      {stressInstances.slice(0, instanceCount).map((index) => (
        <div key={index} className="min-w-0 bg-background px-3 py-2">
          <div className="@container relative min-w-0 overflow-hidden">
            {renderMode === 'component' ? (
              <FitSwitch>
                <FitSwitch.Collapsed className="top-0 left-0 w-max data-fit-measuring:absolute data-fit-measuring:opacity-0">
                  <FitSwitchLabels labels={compactLabels} />
                </FitSwitch.Collapsed>
                <FitSwitch.Expanded className="top-0 left-0 w-max data-fit-measuring:absolute data-fit-measuring:opacity-0">
                  <FitSwitchLabels labels={expandedLabels} />
                </FitSwitch.Expanded>
              </FitSwitch>
            ) : (
              <>
                <div className={collapsedClassName}>
                  <FitSwitchLabels labels={compactLabels} />
                </div>
                <div className={expandedClassName}>
                  <FitSwitchLabels labels={expandedLabels} />
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

FitSwitchList.displayName = 'FitSwitchList';

export const FitSwitchStressTest = () => {
  const [instanceCount, setInstanceCount] = useState<StressInstanceCount>(200);
  const [renderMode, setRenderMode] = useState<StressRenderMode>('component');
  const [detailed, setDetailed] = useState(true);
  const [mountRevision, setMountRevision] = useState(0);
  const {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  } = useStressWidth();

  const handleLabelsToggle = () => {
    setDetailed((current) => !current);
  };

  const handleRemount = () => {
    setMountRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <StressInstanceCountSelect
          id="fit-switch-instance-count"
          value={instanceCount}
          onValueChange={setInstanceCount}
        />
        <StressRenderModeControl
          value={renderMode}
          onValueChange={setRenderMode}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLabelsToggle}
        >
          {detailed ? '切换为短标签' : '切换为长标签'}
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemount}
        >
          重新挂载
        </Button>

        <StressWidthSwitches
          idPrefix="fit-switch"
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
        <FitSwitchList
          key={`${renderMode}-${mountRevision}`}
          detailed={detailed}
          instanceCount={instanceCount}
          renderMode={renderMode}
        />
      </div>
    </div>
  );
};
