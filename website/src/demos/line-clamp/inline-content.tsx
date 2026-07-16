import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { LineClampPreview } from '@/demos/line-clamp/shared';

const LineClampInlineContentDemo = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <DemoBox widthControl defaultWidth={500} minWidth={280} maxWidth={760}>
      <div className="w-full min-w-0">
        <LineClampPreview
          expanded={expanded}
          lines={3}
          onToggle={() => {
            setExpanded((value) => !value);
          }}
        >
          普通文本可以和
          <strong className="mx-1 font-semibold text-foreground">强调内容</strong>
          、
          <a href="#line-clamp-inline-content" className="mx-1 text-blue-600 underline-offset-4 hover:underline">
            链接
          </a>
          、
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">inline code</code>
          以及
          <span className="mx-1 inline-block whitespace-nowrap rounded-md border px-2 text-xs font-medium">
            inline-block 标签
          </span>
          一起参与排版。
          <br />
          第二段由 BR 强制换行，用来观察 hard line break 与后续内容继续增长时的截断位置。
        </LineClampPreview>
      </div>
    </DemoBox>
  );
};

export default LineClampInlineContentDemo;
