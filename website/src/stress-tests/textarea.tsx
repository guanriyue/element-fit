import { Textarea } from '@guanriyue/react-fit/textarea';
import { memo, useState } from 'react';
import { FPS } from '@/components/custom/fps';
import { Button } from '@/components/ui/button';
import {
  getStressWidthClassName,
  StressInstanceCountSelect,
  type StressInstanceCount,
  StressRenderModeControl,
  type StressRenderMode,
  stressInstances,
  StressWidthSwitches,
  useStressWidth,
} from '@/stress-tests/shared';

type TextareaListProps = {
  instanceCount: StressInstanceCount;
  longText: boolean;
  renderMode: StressRenderMode;
};

const textareaClassName =
  'w-full resize-none overflow-y-auto rounded-md border bg-background px-3 py-2 text-sm leading-5 outline-none';
const nativeTextareaClassName =
  `${textareaClassName} min-h-[58px] max-h-[118px] [field-sizing:content]`;

const getItemText = (index: number, longText: boolean) => {
  if (!longText) {
    return `订单 ${index + 1} 等待复核。`;
  }

  return `订单 ${index + 1} 的业务备注：客户资料与合同信息已提交，等待复核。\n请继续核对交付计划、风险记录和后续跟进事项。`;
};

const TextareaList = memo((props: TextareaListProps) => {
  const { instanceCount, longText, renderMode } = props;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stressInstances.slice(0, instanceCount).map((index) => (
        renderMode === 'component' ? (
          <Textarea
            key={index}
            aria-label={`订单 ${index + 1} 备注`}
            autoSize={{ minRows: 2, maxRows: 5 }}
            className={textareaClassName}
            readOnly
            value={getItemText(index, longText)}
          />
        ) : (
          <textarea
            key={index}
            aria-label={`订单 ${index + 1} 备注`}
            className={nativeTextareaClassName}
            readOnly
            rows={2}
            value={getItemText(index, longText)}
          />
        )
      ))}
    </div>
  );
});

TextareaList.displayName = 'TextareaList';

export const TextareaStressTest = () => {
  const [instanceCount, setInstanceCount] = useState<StressInstanceCount>(200);
  const [renderMode, setRenderMode] = useState<StressRenderMode>('component');
  const [longText, setLongText] = useState(true);
  const [mountRevision, setMountRevision] = useState(0);
  const {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  } = useStressWidth();

  const handleTextToggle = () => {
    setLongText((current) => !current);
  };

  const handleRemount = () => {
    setMountRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <StressInstanceCountSelect
          id="textarea-instance-count"
          value={instanceCount}
          onValueChange={setInstanceCount}
        />
        <StressRenderModeControl value={renderMode} onValueChange={setRenderMode} />

        <Button type="button" variant="outline" size="sm" onClick={handleTextToggle}>
          {longText ? '切换为短文本' : '切换为长文本'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={autoResize}
          onClick={toggleNarrow}
        >
          {narrow ? '切换为宽容器' : '切换为窄容器'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleRemount}>
          重新挂载
        </Button>

        <StressWidthSwitches
          idPrefix="textarea"
          autoResize={autoResize}
          widthAnimation={widthAnimation}
          onAutoResizeChange={setAutoResize}
          onWidthAnimationChange={setWidthAnimation}
        />
      </div>

      <div
        className={getStressWidthClassName(widthAnimation)}
        style={{ width: narrow ? '62%' : '100%' }}
      >
        <TextareaList
          key={`${renderMode}-${mountRevision}`}
          instanceCount={instanceCount}
          longText={longText}
          renderMode={renderMode}
        />
      </div>
    </div>
  );
};
