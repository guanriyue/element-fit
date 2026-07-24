import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import {
  type ChangeEvent,
  type ComponentProps,
  type ComponentType,
  useState,
} from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';

type InlineOverflowDebugProps = ComponentProps<typeof InlineOverflow> & {
  __debugDisableRangeFallback?: boolean;
};

const InlineOverflowDebug =
  InlineOverflow as ComponentType<InlineOverflowDebugProps> &
    typeof InlineOverflow;

const defaultText =
  'element-fit/packages/react-fit/src/InlineOverflow/very-long-file-name-for-observation.tsx';

const InlineOverflowWideDemo = () => {
  const [text, setText] = useState(defaultText);
  const [overflow, setOverflow] = useState(false);
  const [overflowWithoutFallback, setOverflowWithoutFallback] = useState(false);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <DemoBox defaultWidth={560} minWidth={180} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <DemoBox.WidthSlider sliderClassName="w-56" />

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="inline-overflow-wide-text">示例文本</Label>
            <textarea
              id="inline-overflow-wide-text"
              aria-describedby="inline-overflow-wide-text-description"
              value={text}
              onChange={handleTextChange}
              className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <div
              id="inline-overflow-wide-text-description"
              className="text-xs text-muted-foreground"
            >
              以 1px 步进调整宽度，尝试命中 ellipsis 的临界位置。
            </div>
          </div>
        </DemoBox.Controls>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            Ellipsis 边界校正
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-md border px-2 py-1">
              corrected: {overflow ? 'overflow' : 'fit'}
            </div>
            <div className="rounded-md border px-2 py-1">
              raw: {overflowWithoutFallback ? 'overflow' : 'fit'}
            </div>
          </div>
        </div>

        <DemoBox.Preview className="grid min-w-0 gap-3">
          <div className="min-w-0 rounded-md border bg-background p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              启用边界校正
            </div>
            <InlineOverflowDebug
              className="flex w-full min-w-0 data-overflow:text-primary"
              onOverflowChange={setOverflow}
            >
              <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {text}
              </InlineOverflow.Content>
            </InlineOverflowDebug>
          </div>

          <div className="min-w-0 rounded-md border bg-background p-3">
            <div className="mb-1 text-xs text-muted-foreground">
              关闭边界校正
            </div>
            <InlineOverflowDebug
              __debugDisableRangeFallback
              className="flex w-full min-w-0 data-overflow:text-primary"
              onOverflowChange={setOverflowWithoutFallback}
            >
              <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {text}
              </InlineOverflow.Content>
            </InlineOverflowDebug>
          </div>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowWideDemo;
