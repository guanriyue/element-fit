import type { ComponentPropsWithoutRef } from 'react';

export type DemoBoxProps = ComponentPropsWithoutRef<'div'>;

export const DemoBox = (props: DemoBoxProps) => {
  return <div {...props} />;
};
