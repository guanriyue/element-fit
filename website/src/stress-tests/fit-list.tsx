import { FitList } from '@guanriyue/react-fit/fit-list';
import {
  BellIcon,
  ChartNoAxesColumnIcon,
  HomeIcon,
  SettingsIcon,
} from 'lucide-react';
import { memo, useState } from 'react';
import { FPS } from '@/components/custom/fps';
import { Button } from '@/components/ui/button';
import {
  getStressWidthClassName,
  type StressInstanceCount,
  StressInstanceCountSelect,
  type StressRenderMode,
  StressRenderModeControl,
  StressWidthSwitches,
  stressInstances,
  useStressWidth,
} from '@/stress-tests/shared';

const items = [
  {
    label: '概览',
    longLabel: '业务数据概览',
    icon: HomeIcon,
  },
  {
    label: '报表',
    longLabel: '数据分析报表',
    icon: ChartNoAxesColumnIcon,
  },
  {
    label: '通知',
    longLabel: '通知消息中心',
    icon: BellIcon,
  },
  {
    label: '设置',
    longLabel: '团队偏好设置',
    icon: SettingsIcon,
  },
] as const;

type FitListStressListProps = {
  detailed: boolean;
  instanceCount: StressInstanceCount;
  renderMode: StressRenderMode;
};

type StressItemsProps = {
  detailed: boolean;
  native: boolean;
};

const buttonClassName =
  'inline-flex h-7 shrink-0 items-center gap-1 rounded-sm border bg-background px-2 text-xs whitespace-nowrap';

const StressItems = (props: StressItemsProps) => {
  const { detailed, native } = props;
  const nativeExpandedClassName = detailed
    ? 'hidden @min-[29rem]:inline'
    : 'hidden @min-[16rem]:inline';

  return items.map((item) => {
    const Icon = item.icon;
    const label = detailed ? item.longLabel : item.label;
    const button = (
      <button
        key={item.label}
        type="button"
        aria-label={label}
        className={buttonClassName}
      >
        <Icon className="size-3.5" />
        {native ? (
          <span className={nativeExpandedClassName}>{label}</span>
        ) : (
          <>
            <FitList.Expanded asChild>
              <span className="data-inactive:hidden">
                {label}
              </span>
            </FitList.Expanded>
            <FitList.Compact asChild>
              <span className="sr-only data-inactive:hidden">
                {label}
              </span>
            </FitList.Compact>
          </>
        )}
      </button>
    );

    if (native) {
      return button;
    }

    return (
      <FitList.Item key={item.label} asChild>
        {button}
      </FitList.Item>
    );
  });
};

const FitListStressList = memo((props: FitListStressListProps) => {
  const { detailed, instanceCount, renderMode } = props;

  return (
    <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-2">
      {stressInstances.slice(0, instanceCount).map((index) => (
        <div key={index} className="min-w-0 bg-background px-3 py-2">
          <div className="@container min-w-0">
            {renderMode === 'component' ? (
              <FitList className="group/fit-list flex min-w-0 items-center gap-1 overflow-hidden">
                <StressItems detailed={detailed} native={false} />
              </FitList>
            ) : (
              <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                <StressItems detailed={detailed} native={true} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

FitListStressList.displayName = 'FitListStressList';

export const FitListStressTest = () => {
  const [instanceCount, setInstanceCount] = useState<StressInstanceCount>(300);
  const [renderMode, setRenderMode] = useState<StressRenderMode>('component');
  const [detailed, setDetailed] = useState(true);
  const [mountRevision, setMountRevision] = useState(0);
  const {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  } = useStressWidth();

  const handleLabelsToggle = () => {
    setDetailed((current) => !current);
  };

  const handleRemount = () => {
    setMountRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <StressInstanceCountSelect
          id="fit-list-instance-count"
          value={instanceCount}
          onValueChange={setInstanceCount}
        />
        <StressRenderModeControl
          value={renderMode}
          onValueChange={setRenderMode}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLabelsToggle}
        >
          {detailed ? '切换为短标签' : '切换为长标签'}
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemount}
        >
          重新挂载
        </Button>

        <StressWidthSwitches
          idPrefix="fit-list"
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
        <FitListStressList
          key={`${renderMode}-${mountRevision}`}
          detailed={detailed}
          instanceCount={instanceCount}
          renderMode={renderMode}
        />
      </div>
    </div>
  );
};
