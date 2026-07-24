import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type OverflowStrategy = 'clip' | 'ellipsis';

const defaultText =
  'element-fit/packages/react-fit/src/InlineOverflow/content-style-is-owned-by-the-app.tsx';

const InlineOverflowStyleStrategiesDemo = () => {
  const [text, setText] = useState(defaultText);
  const [rootPadding, setRootPadding] = useState(12);
  const [strategy, setStrategy] = useState<OverflowStrategy>('ellipsis');
  const [overflow, setOverflow] = useState(false);

  const handleStrategyChange = (nextStrategy: string) => {
    if (nextStrategy === 'clip' || nextStrategy === 'ellipsis') {
      setStrategy(nextStrategy);
    }
  };

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <DemoBox defaultWidth={420} minWidth={120} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider sliderClassName="w-56" />
            <DemoBox.Slider
              label="Root padding"
              min={0}
              max={24}
              step={1}
              value={rootPadding}
              onValueChange={setRootPadding}
              valueFormatter={(value) => `${value}px`}
              sliderClassName="w-56"
            />

            <div className="flex flex-wrap items-center gap-4">
              <Label
                htmlFor="inline-overflow-strategy"
                className="min-w-28 text-muted-foreground"
              >
                裁剪策略
              </Label>
              <Select value={strategy} onValueChange={handleStrategyChange}>
                <SelectTrigger
                  id="inline-overflow-strategy"
                  size="sm"
                  className="w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="ellipsis">Ellipsis</SelectItem>
                  <SelectItem value="clip">Clip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="inline-overflow-strategy-text">示例文本</Label>
            <textarea
              id="inline-overflow-strategy-text"
              aria-describedby="inline-overflow-strategy-text-description"
              value={text}
              onChange={handleTextChange}
              className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <div
              id="inline-overflow-strategy-text-description"
              className="text-xs text-muted-foreground"
            >
              修改文本、宽度和 Root padding，观察 overflow 状态变化。
            </div>
          </div>
        </DemoBox.Controls>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            {strategy === 'ellipsis' ? 'Ellipsis' : 'Clip'}
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'overflow' : 'fit'}
          </div>
        </div>

        <DemoBox.Preview>
          <InlineOverflow
            className="flex w-full min-w-0 rounded-md border bg-background data-overflow:border-primary"
            style={{ padding: rootPadding }}
            onOverflowChange={setOverflow}
          >
            <InlineOverflow.Content
              className={cn(
                'min-w-0 flex-1 whitespace-nowrap',
                strategy === 'ellipsis'
                  ? 'overflow-hidden text-ellipsis'
                  : 'overflow-clip',
              )}
            >
              {text}
            </InlineOverflow.Content>
          </InlineOverflow>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowStyleStrategiesDemo;
