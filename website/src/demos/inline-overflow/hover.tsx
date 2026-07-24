import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const defaultText =
  'Revenue / Enterprise Accounts / APAC / 2026 / Expansion Opportunity / Contract Review';

const InlineOverflowHoverDemo = () => {
  const [text, setText] = useState(defaultText);
  const [overflow, setOverflow] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleTooltipOpenChange = (nextOpen: boolean) => {
    setTooltipOpen(overflow && nextOpen);
  };

  return (
    <DemoBox defaultWidth={300} minWidth={160} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <DemoBox.WidthSlider sliderClassName="w-56" />

          <div className="space-y-1.5 border-t pt-4">
            <Label htmlFor="inline-overflow-hover-text">示例文本</Label>
            <textarea
              id="inline-overflow-hover-text"
              aria-describedby="inline-overflow-hover-text-description"
              value={text}
              onChange={handleTextChange}
              className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <div
              id="inline-overflow-hover-text-description"
              className="text-xs text-muted-foreground"
            >
              修改文本和宽度，观察溢出时 Tooltip 是否启用。
            </div>
          </div>
        </DemoBox.Controls>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            Hover 查看完整内容
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'tooltip enabled' : 'fit'}
          </div>
        </div>

        <DemoBox.Preview className="rounded-md border bg-background p-3">
          <TooltipProvider>
            <Tooltip
              open={overflow && tooltipOpen}
              onOpenChange={handleTooltipOpenChange}
            >
              <TooltipTrigger asChild>
                <InlineOverflow
                  className="flex w-full min-w-0 data-overflow:text-primary"
                  onOverflowChange={(nextOverflow) => {
                    setOverflow(nextOverflow);
                    if (!nextOverflow) {
                      setTooltipOpen(false);
                    }
                  }}
                >
                  <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {text}
                  </InlineOverflow.Content>
                </InlineOverflow>
              </TooltipTrigger>
              <TooltipContent>{text}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowHoverDemo;
