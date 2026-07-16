import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { LineClampPreview, longDescription } from '@/demos/line-clamp/shared';

const LineClampBasicDemo = () => {
  const [expanded, setExpanded] = useState(false);
  const [lines, setLines] = useState(3);

  return (
    <DemoBox widthControl defaultWidth={520} minWidth={280} maxWidth={760}>
      <div className="w-full min-w-0 space-y-4">
        <DemoBox.Slider
          label="行数"
          min={1}
          max={6}
          step={1}
          value={lines}
          onValueChange={setLines}
          sliderClassName="w-56"
        />

        <LineClampPreview
          expanded={expanded}
          lines={lines}
          onToggle={() => {
            setExpanded((value) => !value);
          }}
        >
          {longDescription}
        </LineClampPreview>
      </div>
    </DemoBox>
  );
};

export default LineClampBasicDemo;
