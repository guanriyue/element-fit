import { LineClamp, type LineClampMeasureStrategy } from '@guanriyue/react-fit/line-clamp';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { OverflowBadge, ToggleSuffix } from '@/demos/line-clamp/shared';

type StrategyPreviewProps = {
  strategy: LineClampMeasureStrategy;
};

const content = (
  <>
    第一行包含普通文字和
    <span className="mx-1 inline-block whitespace-nowrap rounded-md border px-2 text-xs font-medium">
      不换行节点
    </span>
    ，随后继续加入足够长的说明文字。
    <br />
    第二行通过 BR 开始，再追加一段用于观察不同测量策略边界表现的内容。
    <br />
    第三行之后还有额外文字，方便判断内容是否超过指定行数。
  </>
);

const StrategyPreview = (props: StrategyPreviewProps) => {
  const { strategy } = props;
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          {strategy === 'in-place' ? 'in-place' : 'clone'}
        </div>
        <OverflowBadge overflow={overflow} />
      </div>

      <div className="w-full min-w-0 rounded-md border bg-background p-4 text-sm leading-7">
        <LineClamp
          expanded={expanded}
          lines={3}
          measureStrategy={strategy}
          onOverflowChange={setOverflow}
          suffix={(
            <ToggleSuffix
              expanded={expanded}
              onToggle={() => {
                setExpanded((value) => !value);
              }}
            />
          )}
        >
          {content}
        </LineClamp>
      </div>
    </div>
  );
};

const LineClampMeasureStrategyDemo = () => {
  return (
    <DemoBox widthControl defaultWidth={560} minWidth={200} maxWidth={820}>
      <div className="w-full min-w-0 space-y-4">
        <StrategyPreview strategy="in-place" />
        <StrategyPreview strategy="clone" />
      </div>
    </DemoBox>
  );
};

export default LineClampMeasureStrategyDemo;
