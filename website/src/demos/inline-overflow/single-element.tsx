import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';

const defaultText = 'InlineOverflow single element with inline padding';

const InlineOverflowSingleElementDemo = () => {
  const [text, setText] = useState(defaultText);
  const [paddingInline, setPaddingInline] = useState(16);
  const [paddingBlock, setPaddingBlock] = useState(12);
  const [overflow, setOverflow] = useState(false);

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  return (
    <DemoBox defaultWidth={320} minWidth={120} maxWidth={480} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider label="元素宽度" sliderClassName="w-56" />
            <DemoBox.Slider
              label="inline padding"
              min={0}
              max={32}
              step={1}
              value={paddingInline}
              onValueChange={setPaddingInline}
              valueFormatter={(value) => `${value}px`}
              sliderClassName="w-56"
            />
            <DemoBox.Slider
              label="block padding"
              min={0}
              max={20}
              step={1}
              value={paddingBlock}
              onValueChange={setPaddingBlock}
              valueFormatter={(value) => `${value}px`}
              sliderClassName="w-56"
            />
          </div>

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="inline-overflow-single-element-text">
              示例文本
            </Label>
            <input
              id="inline-overflow-single-element-text"
              value={text}
              onChange={handleTextChange}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </DemoBox.Controls>

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

        <DemoBox.Preview>
          <InlineOverflow asChild onOverflowChange={setOverflow}>
            <InlineOverflow.Content
              className="box-border block w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md border bg-background text-sm data-overflow:border-primary"
              style={{ paddingInline, paddingBlock }}
            >
              {text}
            </InlineOverflow.Content>
          </InlineOverflow>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowSingleElementDemo;
