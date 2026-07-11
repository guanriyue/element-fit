import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const defaultText =
  'element-fit/packages/react-fit/src/InlineOverflow/accessory-can-live-on-a-separate-layout-row.tsx';

const InlineOverflowAccessorySeparateRowDemo = () => {
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
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            Accessory 单独一行
          </div>
          <div className="rounded-md border px-2 py-1 text-xs">
            {overflow ? 'accessory visible' : 'accessory hidden'}
          </div>
        </div>

        <div className="w-[340px] max-w-full rounded-md border bg-background p-3">
          <TooltipProvider>
            <Tooltip
              open={overflow && tooltipOpen}
              onOpenChange={handleTooltipOpenChange}
            >
              <InlineOverflow
                className="grid max-w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-2 data-overflow:text-primary"
                onOverflowChange={(nextOverflow) => {
                  setOverflow(nextOverflow);
                  if (!nextOverflow) {
                    setTooltipOpen(false);
                  }
                }}
              >
                <InlineOverflow.Content className="min-w-0">
                  {text}
                </InlineOverflow.Content>

                <TooltipTrigger asChild>
                  <InlineOverflow.Accessory asChild className="justify-self-start">
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      className="px-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View full path
                    </Button>
                  </InlineOverflow.Accessory>
                </TooltipTrigger>
              </InlineOverflow>
              <TooltipContent>{text}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="inline-overflow-accessory-separate-row-text"
            className="text-sm font-medium"
          >
            示例文本
          </label>
          <textarea
            id="inline-overflow-accessory-separate-row-text"
            aria-describedby="inline-overflow-accessory-separate-row-text-description"
            value={text}
            onChange={handleTextChange}
            className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <div
            id="inline-overflow-accessory-separate-row-text-description"
            className="text-xs text-muted-foreground"
          >
            修改文本长度，观察 Accessory 在第二行随 overflow 状态显示或隐藏。
          </div>
        </div>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowAccessorySeparateRowDemo;
