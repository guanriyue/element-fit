import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
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
    <DemoBox>
      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            hover 查看完整内容
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'tooltip enabled' : 'fit'}
          </div>
        </div>

        <div className="w-75 max-w-full min-w-0 rounded-md border bg-background p-3">
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
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="inline-overflow-hover-text"
            className="text-sm font-medium"
          >
            示例文本
          </label>
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
            修改文本长度，观察溢出时 Tooltip 是否启用。
          </div>
        </div>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowHoverDemo;
