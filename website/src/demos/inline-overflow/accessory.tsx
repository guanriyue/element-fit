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

type AccessoryExampleProps = {
  label: string;
  text: string;
  widthClassName: string;
};

const defaultText =
  'element-fit/packages/react-fit/src/InlineOverflow/accessory-preserved-layout-example.tsx';

const AccessoryExample = (props: AccessoryExampleProps) => {
  const { label, text, widthClassName } = props;
  const [overflow, setOverflow] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const handleTooltipOpenChange = (nextOpen: boolean) => {
    setTooltipOpen(overflow && nextOpen);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="rounded-md border px-2 py-1 text-xs">
          {overflow ? 'accessory visible' : 'accessory hidden'}
        </div>
      </div>

      <div
        className={`${widthClassName} max-w-full min-w-0 rounded-md border bg-background p-3`}
      >
        <TooltipProvider>
          <Tooltip
            open={overflow && tooltipOpen}
            onOpenChange={handleTooltipOpenChange}
          >
            <InlineOverflow
              className="flex w-full min-w-0 items-center data-overflow:text-primary"
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

              <TooltipTrigger asChild>
                <InlineOverflow.Accessory asChild className="ml-2 flex-none">
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="px-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Detail
                  </Button>
                </InlineOverflow.Accessory>
              </TooltipTrigger>
            </InlineOverflow>
            <TooltipContent>{text}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

const InlineOverflowAccessoryDemo = () => {
  const [text, setText] = useState(defaultText);
  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <DemoBox>
      <div className="space-y-6 p-6">
        <div className="space-y-1.5">
          <label
            htmlFor="inline-overflow-accessory-text"
            className="text-sm font-medium"
          >
            示例文本
          </label>
          <textarea
            id="inline-overflow-accessory-text"
            aria-describedby="inline-overflow-accessory-text-description"
            value={text}
            onChange={handleTextChange}
            className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <div
            id="inline-overflow-accessory-text-description"
            className="text-xs text-muted-foreground"
          >
            修改文本长度，观察 Detail 按钮随 overflow 状态显示或隐藏。
          </div>
        </div>
        <AccessoryExample
          label="宽容器"
          text={text}
          widthClassName="w-[620px]"
        />
        <AccessoryExample
          label="窄容器"
          text={text}
          widthClassName="w-[300px]"
        />
      </div>
    </DemoBox>
  );
};

export default InlineOverflowAccessoryDemo;
