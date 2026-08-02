import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { FileTextIcon } from 'lucide-react';
import { DemoBox } from '@/components/custom/demo-box';

const files = [
  {
    name: 'inline-overflow-accessory-preserved-layout-example.tsx',
    suffix: 'example.tsx',
  },
  {
    name: 'customer-retention-analysis-2026-final.xlsx',
    suffix: 'final.xlsx',
  },
  {
    name: 'product-launch-walkthrough.zh-CN.mp4',
    suffix: 'zh-CN.mp4',
  },
  {
    name: 'README.md',
    suffix: 'README.md',
  },
] as const;

const InlineOverflowFilenameSuffixDemo = () => {
  return (
    <DemoBox defaultWidth={400} minWidth={180} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <DemoBox.WidthSlider sliderClassName="w-56" />
          <div className="text-xs text-muted-foreground">
            调整列表宽度，观察完整文件名放不下时保留的末尾部分。
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview>
          <div className="overflow-hidden rounded-md border bg-background">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex min-w-0 items-center gap-2 border-b px-3 py-2.5 last:border-b-0"
              >
                <FileTextIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <InlineOverflow
                  dir="ltr"
                  title={file.name}
                  className="flex min-w-0 flex-1 font-mono text-sm"
                >
                  <InlineOverflow.Content className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {file.name}
                  </InlineOverflow.Content>
                  <InlineOverflow.Accessory
                    aria-hidden="true"
                    className="shrink-0 select-none whitespace-nowrap"
                  >
                    {file.suffix}
                  </InlineOverflow.Accessory>
                </InlineOverflow>
              </div>
            ))}
          </div>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default InlineOverflowFilenameSuffixDemo;
