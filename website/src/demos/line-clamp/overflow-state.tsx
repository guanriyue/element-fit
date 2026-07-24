import { type ChangeEvent, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  LineClampPreview,
  longDescription,
  OverflowBadge,
  shortDescription,
} from '@/demos/line-clamp/shared';

const LineClampOverflowStateDemo = () => {
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState(2);
  const [overflow, setOverflow] = useState(false);
  const [text, setText] = useState(longDescription);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handlePresetToggle = () => {
    setText((value) => {
      return value === longDescription ? shortDescription : longDescription;
    });
    setExpanded(false);
  };

  return (
    <DemoBox defaultWidth={460} minWidth={200} maxWidth={720} widthStep={1}>
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

          <div className="space-y-1.5 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label htmlFor="line-clamp-overflow-text">示例文本</Label>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handlePresetToggle}
              >
                {text === longDescription ? '切换短文本' : '切换长文本'}
              </Button>
            </div>
            <textarea
              id="line-clamp-overflow-text"
              value={text}
              onChange={handleTextChange}
              className="min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </DemoBox.Controls>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            内容变化
          </div>
          <OverflowBadge overflow={overflow} />
        </div>

        <DemoBox.Preview>
          <LineClampPreview
            expanded={expanded}
            lines={lines}
            onOverflowChange={setOverflow}
            onToggle={() => {
              setExpanded((value) => !value);
            }}
          >
            {text}
          </LineClampPreview>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default LineClampOverflowStateDemo;
