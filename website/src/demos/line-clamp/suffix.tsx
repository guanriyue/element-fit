import { LineClamp } from '@guanriyue/react-fit/line-clamp';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { longDescription } from '@/demos/line-clamp/shared';

type SuffixPreviewProps = {
  label: string;
  withExpand?: boolean;
};

const SuffixPreview = (props: SuffixPreviewProps) => {
  const { label, withExpand = false } = props;
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded((value) => !value);
  };

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="w-full min-w-0 rounded-md border bg-background p-4 text-sm leading-7">
        <LineClamp
          expanded={expanded}
          lines={2}
          suffix={(
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    onClick={withExpand ? handleToggle : undefined}
                    className="h-auto px-1 py-0 align-baseline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {withExpand && expanded ? '收起' : '详情'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>
                  {withExpand ? '点击切换展开状态，也可以仅作为提示入口。' : '这里只展示附加提示，不改变展开状态。'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        >
          {longDescription}
        </LineClamp>
      </div>
    </div>
  );
};

const LineClampSuffixDemo = () => {
  return (
    <DemoBox widthControl defaultWidth={520} minWidth={280} maxWidth={760}>
      <div className="w-full min-w-0 space-y-4">
        <SuffixPreview label="Hover tooltip" />
        <SuffixPreview label="Tooltip + 展开控制" withExpand />
      </div>
    </DemoBox>
  );
};

export default LineClampSuffixDemo;
