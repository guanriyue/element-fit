import {
  LineClamp,
  type LineClampMeasureStrategy,
} from '@guanriyue/react-fit/line-clamp';
import { memo, useState } from 'react';
import { FPS } from '@/components/custom/fps';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NativeLineClamp } from '@/stress-tests/line-clamp-baseline';
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

type LineClampListProps = {
  expanded: boolean;
  instanceCount: StressInstanceCount;
  longText: boolean;
  measureStrategy: LineClampMeasureStrategy;
  renderMode: StressRenderMode;
};

const getItemText = (index: number, longText: boolean) => {
  if (!longText) {
    return `订单 ${index + 1} 等待复核。`;
  }

  return `订单 ${index + 1} 正在等待复核，包含客户资料、合同信息、交付计划、风险记录和多条需要进一步确认的业务备注。`;
};

const LineClampList = memo((props: LineClampListProps) => {
  const {
    expanded,
    instanceCount,
    longText,
    measureStrategy,
    renderMode,
  } = props;

  return (
    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
      {stressInstances.slice(0, instanceCount).map((index) => (
        <div key={index} className="min-w-0 bg-background px-3 py-2">
          {renderMode === 'component' ? (
            <LineClamp
              className="break-all text-sm leading-5"
              lines={2}
              expanded={expanded}
              measureStrategy={measureStrategy}
              suffix={<span className="ml-1 text-xs text-blue-600 dark:text-blue-400">详情</span>}
            >
              {getItemText(index, longText)}
            </LineClamp>
          ) : (
            <NativeLineClamp
              className="break-all text-sm leading-5"
              expanded={expanded}
              showSuffix={longText}
              suffix={<span className="ml-1 text-xs text-blue-600 dark:text-blue-400">详情</span>}
            >
              {getItemText(index, longText)}
            </NativeLineClamp>
          )}
        </div>
      ))}
    </div>
  );
});

LineClampList.displayName = 'LineClampList';

export const LineClampStressTest = () => {
  const [instanceCount, setInstanceCount] = useState<StressInstanceCount>(200);
  const [renderMode, setRenderMode] = useState<StressRenderMode>('component');
  const [longText, setLongText] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [measureStrategy, setMeasureStrategy] =
    useState<LineClampMeasureStrategy>('in-place');
  const [mountRevision, setMountRevision] = useState(0);
  const {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  } = useStressWidth();

  const handleMeasureStrategyChange = (value: string) => {
    if (value === 'in-place' || value === 'clone') {
      setMeasureStrategy(value);
    }
  };

  const handleTextToggle = () => {
    setLongText((current) => !current);
  };

  const handleExpandedToggle = () => {
    setExpanded((current) => !current);
  };

  const handleRemount = () => {
    setMountRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <StressInstanceCountSelect
          id="line-clamp-instance-count"
          value={instanceCount}
          onValueChange={setInstanceCount}
        />
        <StressRenderModeControl value={renderMode} onValueChange={setRenderMode} />

        <div className="mr-2 flex items-center gap-2">
          <label htmlFor="line-clamp-measure-strategy" className="text-sm text-muted-foreground">
            测量策略
          </label>
          <Select
            value={measureStrategy}
            disabled={renderMode === 'native'}
            onValueChange={handleMeasureStrategyChange}
          >
            <SelectTrigger id="line-clamp-measure-strategy" size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="in-place">in-place</SelectItem>
              <SelectItem value="clone">clone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={handleTextToggle}>
          {longText ? '切换为短文本' : '切换为长文本'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleExpandedToggle}>
          {expanded ? '全部收起' : '全部展开'}
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
          idPrefix="line-clamp"
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
        <LineClampList
          key={`${renderMode}-${mountRevision}`}
          expanded={expanded}
          instanceCount={instanceCount}
          longText={longText}
          measureStrategy={measureStrategy}
          renderMode={renderMode}
        />
      </div>
    </div>
  );
};
