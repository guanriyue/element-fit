import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const STRESS_INSTANCE_COUNTS = [20, 50, 100, 200, 300, 500] as const;
export const stressInstances = Array.from({ length: 500 }, (_, index) => index);

export type StressInstanceCount = (typeof STRESS_INSTANCE_COUNTS)[number];
export type StressRenderMode = 'component' | 'native';

type StressInstanceCountSelectProps = {
  id: string;
  label?: string;
  onValueChange: (value: StressInstanceCount) => void;
  value: StressInstanceCount;
};

type StressWidthSwitchesProps = {
  autoResize: boolean;
  idPrefix: string;
  onAutoResizeChange: (checked: boolean) => void;
  onWidthAnimationChange: (checked: boolean) => void;
  widthAnimation: boolean;
};

type StressRenderModeControlProps = {
  onValueChange: (value: StressRenderMode) => void;
  value: StressRenderMode;
};

export const StressRenderModeControl = (props: StressRenderModeControlProps) => {
  const { onValueChange, value } = props;

  return (
    <div className="mr-2 flex items-center gap-2">
      <span className="text-sm text-muted-foreground">渲染方式</span>
      <div
        role="group"
        aria-label="渲染方式"
        className="inline-flex h-8 items-center rounded-md bg-muted p-0.5"
      >
        <button
          type="button"
          aria-pressed={value === 'component'}
          className={cn(
            'h-7 rounded-sm px-2.5 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === 'component' && 'bg-background text-foreground shadow-sm',
          )}
          onClick={() => onValueChange('component')}
        >
          组件
        </button>
        <button
          type="button"
          aria-pressed={value === 'native'}
          className={cn(
            'h-7 rounded-sm px-2.5 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === 'native' && 'bg-background text-foreground shadow-sm',
          )}
          onClick={() => onValueChange('native')}
        >
          CSS 基线
        </button>
      </div>
    </div>
  );
};

export const StressInstanceCountSelect = (props: StressInstanceCountSelectProps) => {
  const { id, label = '实例数', onValueChange, value } = props;

  const handleValueChange = (nextValue: string) => {
    const nextCount = Number(nextValue);

    if (STRESS_INSTANCE_COUNTS.some((count) => count === nextCount)) {
      onValueChange(nextCount as StressInstanceCount);
    }
  };

  return (
    <div className="mr-2 flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <Select value={String(value)} onValueChange={handleValueChange}>
        <SelectTrigger id={id} size="sm" className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {STRESS_INSTANCE_COUNTS.map((count) => (
            <SelectItem key={count} value={String(count)}>
              {count}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const StressWidthSwitches = (props: StressWidthSwitchesProps) => {
  const {
    autoResize,
    idPrefix,
    onAutoResizeChange,
    onWidthAnimationChange,
    widthAnimation,
  } = props;

  return (
    <div className="ml-auto flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-sm" htmlFor={`${idPrefix}-width-animation`}>
        <Switch
          id={`${idPrefix}-width-animation`}
          checked={widthAnimation}
          onCheckedChange={onWidthAnimationChange}
        />
        宽度动画
      </label>
      <label className="flex items-center gap-2 text-sm" htmlFor={`${idPrefix}-auto-resize`}>
        <Switch
          id={`${idPrefix}-auto-resize`}
          checked={autoResize}
          onCheckedChange={onAutoResizeChange}
        />
        持续缩放
      </label>
    </div>
  );
};

export const useStressWidth = () => {
  const [narrow, setNarrow] = useState(false);
  const [widthAnimation, setWidthAnimation] = useState(false);
  const [autoResize, setAutoResize] = useState(false);

  useEffect(() => {
    if (!autoResize) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNarrow((current) => !current);
    }, 1400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoResize]);

  const toggleNarrow = () => {
    setNarrow((current) => !current);
  };

  return {
    autoResize,
    narrow,
    setAutoResize,
    setWidthAnimation,
    toggleNarrow,
    widthAnimation,
  };
};

export const getStressWidthClassName = (widthAnimation: boolean) => {
  return widthAnimation
    ? 'max-w-full transition-[width] duration-1000 ease-in-out'
    : 'max-w-full';
};
