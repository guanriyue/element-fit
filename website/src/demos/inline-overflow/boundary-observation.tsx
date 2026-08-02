import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type BoundaryMetrics = {
  clientWidth: number;
  rangeWidth: number;
  scrollWidth: number;
};

type BoundaryComparisonProps = {
  correctedOverflow: boolean;
  metrics: BoundaryMetrics;
  regularOverflow: boolean;
};

const initialMetrics: BoundaryMetrics = {
  clientWidth: 0,
  rangeWidth: 0,
  scrollWidth: 0,
};

const readBoundaryMetrics = (element: HTMLElement): BoundaryMetrics => {
  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);

  return {
    clientWidth: element.clientWidth,
    rangeWidth: range.getBoundingClientRect().width,
    scrollWidth: element.scrollWidth,
  };
};

export const useBoundaryMetrics = () => {
  const contentRef = useRef<HTMLElement>(null);
  const [metrics, setMetrics] = useState(initialMetrics);

  const measure = useCallback(() => {
    const element = contentRef.current;

    if (element === null) {
      return;
    }

    const nextMetrics = readBoundaryMetrics(element);
    setMetrics((previousMetrics) => {
      if (
        previousMetrics.clientWidth === nextMetrics.clientWidth &&
        previousMetrics.rangeWidth === nextMetrics.rangeWidth &&
        previousMetrics.scrollWidth === nextMetrics.scrollWidth
      ) {
        return previousMetrics;
      }

      return nextMetrics;
    });
  }, []);

  useEffect(() => {
    const element = contentRef.current;

    if (element === null) {
      return;
    }

    measure();

    const resizeObserver = new ResizeObserver(measure);
    const mutationObserver = new MutationObserver(measure);
    resizeObserver.observe(element);
    mutationObserver.observe(element, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [measure]);

  return { contentRef, metrics };
};

export const BoundaryComparison = (props: BoundaryComparisonProps) => {
  const { correctedOverflow, metrics, regularOverflow } = props;
  const integerWidthsEqual = metrics.clientWidth === metrics.scrollWidth;
  const boundaryMatched =
    correctedOverflow && !regularOverflow && integerWidthsEqual;

  return (
    <div
      className={cn(
        'space-y-3 rounded-md border p-3',
        boundaryMatched && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">
          {boundaryMatched ? '已命中临界条件' : '尚未命中临界条件'}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border px-2 py-1">
            校正结果：{correctedOverflow ? '溢出' : '未溢出'}
          </span>
          <span className="rounded-md border px-2 py-1">
            普通判断：{regularOverflow ? '溢出' : '未溢出'}
          </span>
        </div>
      </div>

      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          clientWidth：
          <span className="font-mono text-foreground">
            {metrics.clientWidth}px
          </span>
        </div>
        <div>
          scrollWidth：
          <span className="font-mono text-foreground">
            {metrics.scrollWidth}px
          </span>
        </div>
        <div>
          Range width：
          <span className="font-mono text-foreground">
            {metrics.rangeWidth.toFixed(2)}px
          </span>
        </div>
      </div>
    </div>
  );
};
