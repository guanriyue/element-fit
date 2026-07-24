import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { memo, useState } from 'react';
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

type InlineOverflowListProps = {
  instanceCount: StressInstanceCount;
  longText: boolean;
  renderMode: StressRenderMode;
};

const getItemText = (index: number, longText: boolean) => {
  if (!longText) {
    return `订单 ${index + 1}`;
  }

  return `订单 ${index + 1} / 华东区域 / 企业客户 / 待复核的超长业务名称`;
};

const InlineOverflowList = memo((props: InlineOverflowListProps) => {
  const { instanceCount, longText, renderMode } = props;

  return (
    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
      {stressInstances.slice(0, instanceCount).map((index) => (
        <div key={index} className="min-w-0 bg-background px-3 py-2">
          {renderMode === 'component' ? (
            <InlineOverflow className="flex w-full min-w-0 items-center">
              <InlineOverflow.Content className="min-w-0 flex-1 truncate text-sm">
                {getItemText(index, longText)}
              </InlineOverflow.Content>
              <InlineOverflow.Accessory className="ml-2 shrink-0 text-xs text-blue-600 dark:text-blue-400">
                详情
              </InlineOverflow.Accessory>
            </InlineOverflow>
          ) : (
            <div className="flex w-full min-w-0 items-center">
              <span className="min-w-0 flex-1 truncate text-sm">
                {getItemText(index, longText)}
              </span>
              <span className="ml-2 shrink-0 text-xs text-blue-600 dark:text-blue-400">
                详情
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

InlineOverflowList.displayName = 'InlineOverflowList';

export const InlineOverflowStressTest = () => {
  const [instanceCount, setInstanceCount] = useState<StressInstanceCount>(200);
  const [renderMode, setRenderMode] = useState<StressRenderMode>('component');
  const [longText, setLongText] = useState(true);
  const [mountRevision, setMountRevision] = useState(0);
  const {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  } = useStressWidth();

  const handleTextToggle = () => {
    setLongText((current) => !current);
  };

  const handleRemount = () => {
    setMountRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <StressInstanceCountSelect
          id="inline-overflow-instance-count"
          value={instanceCount}
          onValueChange={setInstanceCount}
        />
        <StressRenderModeControl value={renderMode} onValueChange={setRenderMode} />

        <Button type="button" variant="outline" size="sm" onClick={handleTextToggle}>
          {longText ? '切换为短文本' : '切换为长文本'}
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
          idPrefix="inline-overflow"
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
        <InlineOverflowList
          key={`${renderMode}-${mountRevision}`}
          instanceCount={instanceCount}
          longText={longText}
          renderMode={renderMode}
        />
      </div>
    </div>
  );
};
