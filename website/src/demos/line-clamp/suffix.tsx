import { LineClamp } from '@guanriyue/react-fit/line-clamp';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { longDescription } from '@/demos/line-clamp/shared';

type SuffixPreviewProps = {
  label: string;
  lines: number;
  suffixLabel: string;
  withExpand?: boolean;
};

const SuffixPreview = (props: SuffixPreviewProps) => {
  const { label, lines, suffixLabel, withExpand = false } = props;
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
          lines={lines}
          suffix={
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
                    {withExpand && expanded ? '收起' : suffixLabel}
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>
                  {withExpand
                    ? '点击切换展开状态，也可以仅作为提示入口。'
                    : '这里只展示附加提示，不改变展开状态。'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        >
          {longDescription}
        </LineClamp>
      </div>
    </div>
  );
};

const LineClampSuffixDemo = () => {
  const [lines, setLines] = useState(2);
  const [longSuffix, setLongSuffix] = useState(false);
  const suffixLabel = longSuffix ? '查看完整说明' : '详情';

  return (
    <DemoBox defaultWidth={520} minWidth={200} maxWidth={760} widthStep={1}>
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
              id="line-clamp-long-suffix"
              checked={longSuffix}
              onCheckedChange={setLongSuffix}
            />
            <Label htmlFor="line-clamp-long-suffix">较长的 suffix</Label>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview className="space-y-4">
          <SuffixPreview
            label="Hover tooltip"
            lines={lines}
            suffixLabel={suffixLabel}
          />
          <SuffixPreview
            label="Tooltip + 展开控制"
            lines={lines}
            suffixLabel={suffixLabel}
            withExpand
          />
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default LineClampSuffixDemo;
