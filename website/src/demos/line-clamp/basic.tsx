import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LineClampPreview, longDescription } from '@/demos/line-clamp/shared';

const LineClampBasicDemo = () => {
  const [clampEnabled, setClampEnabled] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState(3);
  const state = clampEnabled
    ? expanded
      ? 'expanded'
      : 'collapsed'
    : 'unclamped';

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

          <div className="flex flex-wrap gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="line-clamp-enabled"
                checked={clampEnabled}
                onCheckedChange={setClampEnabled}
              />
              <Label htmlFor="line-clamp-enabled">启用 clamp</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="line-clamp-expanded"
                checked={expanded}
                disabled={!clampEnabled}
                onCheckedChange={setExpanded}
              />
              <Label htmlFor="line-clamp-expanded">expanded</Label>
            </div>
          </div>
        </DemoBox.Controls>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">
            基础状态
          </div>
          <code className="rounded-md border px-2 py-1 text-xs">
            data-state: {state}
          </code>
        </div>

        <DemoBox.Preview>
          <LineClampPreview
            expanded={expanded}
            lines={clampEnabled ? lines : 0}
            onToggle={() => {
              setExpanded((value) => !value);
            }}
          >
            {longDescription}
          </LineClampPreview>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default LineClampBasicDemo;
