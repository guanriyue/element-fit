import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const defaultText = 'InlineOverflow single element with inline padding';

const InlineOverflowSingleElementDemo = () => {
  const [text, setText] = useState(defaultText);
  const [width, setWidth] = useState(320);
  const [paddingEnabled, setPaddingEnabled] = useState(true);
  const [overflow, setOverflow] = useState(false);

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const handleWidthChange = (nextValue: number[]) => {
    setWidth(nextValue[0] ?? width);
  };

  return (
    <DemoBox>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">单元素模式</div>
            <div className="text-xs text-muted-foreground">
              Root 和 Content 共享同一个 DOM 元素
            </div>
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'overflow' : 'fit'}
          </div>
        </div>

        <div className="max-w-full" style={{ width }}>
          <InlineOverflow asChild onOverflowChange={setOverflow}>
            <InlineOverflow.Content
              className={cn(
                'box-border block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md border bg-background text-sm data-overflow:border-primary',
                paddingEnabled && 'px-4 py-3',
              )}
            >
              {text}
            </InlineOverflow.Content>
          </InlineOverflow>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="inline-overflow-single-element-padding"
            className="text-sm font-medium"
          >
            启用 padding
          </label>
          <Switch
            id="inline-overflow-single-element-padding"
            checked={paddingEnabled}
            onCheckedChange={setPaddingEnabled}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="inline-overflow-single-element-width"
            className="flex justify-between text-sm font-medium"
          >
            <span>元素宽度</span>
            <span>{width}px</span>
          </label>
          <Slider
            id="inline-overflow-single-element-width"
            min={120}
            max={480}
            value={[width]}
            onValueChange={handleWidthChange}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="inline-overflow-single-element-text"
            className="text-sm font-medium"
          >
            示例文本
          </label>
          <input
            id="inline-overflow-single-element-text"
            value={text}
            onChange={handleTextChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowSingleElementDemo;
