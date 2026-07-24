import { type ComponentPropsWithoutRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const SAMPLE_WINDOW_MS = 500;
const GOOD_FPS = 55;
const WARNING_FPS = 30;

type FPSStatus = 'measuring' | 'good' | 'warning' | 'poor';

export type FPSProps = Omit<ComponentPropsWithoutRef<'output'>, 'children'>;

const statusStyles: Record<
  FPSStatus,
  {
    dot: string;
    value: string;
  }
> = {
  measuring: {
    dot: 'bg-muted-foreground',
    value: 'text-muted-foreground',
  },
  good: {
    dot: 'bg-emerald-500',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    dot: 'bg-amber-500',
    value: 'text-amber-600 dark:text-amber-400',
  },
  poor: {
    dot: 'bg-red-500',
    value: 'text-red-600 dark:text-red-400',
  },
};

const getStatus = (fps: number | null): FPSStatus => {
  if (fps === null) {
    return 'measuring';
  }

  if (fps >= GOOD_FPS) {
    return 'good';
  }

  if (fps >= WARNING_FPS) {
    return 'warning';
  }

  return 'poor';
};

export const FPS = (props: FPSProps) => {
  const { className, ...outputProps } = props;
  const [fps, setFps] = useState<number | null>(null);
  const status = getStatus(fps);
  const styles = statusStyles[status];

  useEffect(() => {
    let animationFrameId = 0;
    let frameCount = 0;
    let sampleStartedAt = performance.now();

    const resetSample = () => {
      frameCount = 0;
      sampleStartedAt = performance.now();
      setFps(null);
    };

    const measureFrame = (timestamp: number) => {
      frameCount += 1;

      const elapsed = timestamp - sampleStartedAt;

      if (elapsed >= SAMPLE_WINDOW_MS) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        sampleStartedAt = timestamp;
      }

      animationFrameId = requestAnimationFrame(measureFrame);
    };

    document.addEventListener('visibilitychange', resetSample);
    animationFrameId = requestAnimationFrame(measureFrame);

    return () => {
      document.removeEventListener('visibilitychange', resetSample);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const label = fps === null ? '正在测量帧率' : `当前帧率 ${fps} FPS`;

  return (
    <output
      {...outputProps}
      aria-label={label}
      aria-live="off"
      className={cn(
        'fixed top-20 right-4 z-50 flex h-10 min-w-28 items-center gap-2 rounded-md border bg-background px-3 shadow-sm',
        className,
      )}
      data-fps={fps ?? undefined}
      data-status={status}
    >
      <span aria-hidden={true} className={cn('size-2 rounded-full', styles.dot)} />
      <span className="text-xs text-muted-foreground">FPS</span>
      <strong className={cn('ml-auto text-sm tabular-nums', styles.value)}>
        {fps ?? '--'}
      </strong>
    </output>
  );
};
