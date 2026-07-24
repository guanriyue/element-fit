import {
  LineClamp,
  type LineClampMeasureStrategy,
} from '@guanriyue/react-fit/line-clamp';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { OverflowBadge, ToggleSuffix } from '@/demos/line-clamp/shared';

type StrategyPreviewProps = {
  expanded: boolean;
  lines: number;
  onToggle: () => void;
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
  const { expanded, lines, onToggle, strategy } = props;
  const [overflow, setOverflow] = useState(false);

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          {strategy}
        </div>
        <OverflowBadge overflow={overflow} />
      </div>

      <div className="w-full min-w-0 rounded-md border bg-background p-4 text-sm leading-7">
        <LineClamp
          expanded={expanded}
          lines={lines}
          measureStrategy={strategy}
          onOverflowChange={setOverflow}
          suffix={<ToggleSuffix expanded={expanded} onToggle={onToggle} />}
        >
          {content}
        </LineClamp>
      </div>
    </div>
  );
};

const LineClampMeasureStrategyDemo = () => {
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState(3);

  const handleToggle = () => {
    setExpanded((value) => !value);
  };

  return (
    <DemoBox defaultWidth={560} minWidth={200} maxWidth={820} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider sliderClassName="w-56" />
            <DemoBox.Slider
              label="行数"
              min={1}
              max={6}
              step={1}
              value={lines}
              onValueChange={setLines}
              sliderClassName="w-56"
            />
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <Switch
              id="line-clamp-strategy-expanded"
              checked={expanded}
              onCheckedChange={setExpanded}
            />
            <Label htmlFor="line-clamp-strategy-expanded">expanded</Label>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview className="space-y-4">
          <StrategyPreview
            strategy="in-place"
            expanded={expanded}
            lines={lines}
            onToggle={handleToggle}
          />
          <StrategyPreview
            strategy="clone"
            expanded={expanded}
            lines={lines}
            onToggle={handleToggle}
          />
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default LineClampMeasureStrategyDemo;
