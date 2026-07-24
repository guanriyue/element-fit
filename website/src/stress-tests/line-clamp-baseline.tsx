import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type NativeLineClampProps = {
  children: ReactNode;
  className?: string;
  expanded: boolean;
  showSuffix: boolean;
  suffix: ReactNode;
};

const collapsedStyle: CSSProperties = {
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
};

const spacerStyle: CSSProperties = {
  float: 'right',
  height: '100%',
  marginBottom: '-1lh',
  width: 0,
};

const floatButtonStyle: CSSProperties = {
  clear: 'both',
  float: 'right',
};

export const NativeLineClamp = (props: NativeLineClampProps) => {
  const { children, className, expanded, showSuffix, suffix } = props;

  return (
    <div className="flex min-w-0">
      <div
        className={cn('min-w-0 flex-1', className)}
        style={expanded ? undefined : collapsedStyle}
      >
        {!expanded && showSuffix ? (
          <>
            <span aria-hidden={true} style={spacerStyle} />
            <span style={floatButtonStyle}>{suffix}</span>
          </>
        ) : null}
        {children}
        {expanded && showSuffix ? <span>{suffix}</span> : null}
      </div>
    </div>
  );
};
