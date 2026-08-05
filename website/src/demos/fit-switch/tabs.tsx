import { FitSwitch } from '@guanriyue/react-fit/fit-switch';
import {
  BellIcon,
  ChartNoAxesColumnIcon,
  HomeIcon,
  SettingsIcon,
} from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const items = [
  {
    value: 'overview',
    shortLabel: '概览',
    longLabel: '业务概览',
    icon: HomeIcon,
    content: '概览页用于集中查看关键指标和最近活动。',
  },
  {
    value: 'reports',
    shortLabel: '报表',
    longLabel: '数据分析报表',
    icon: ChartNoAxesColumnIcon,
    content: '数据报表页展示趋势、分组和明细分析。',
  },
  {
    value: 'notifications',
    shortLabel: '通知',
    longLabel: '通知消息中心',
    icon: BellIcon,
    content: '通知中心页用于处理待办、提醒和系统消息。',
  },
  {
    value: 'settings',
    shortLabel: '设置',
    longLabel: '团队偏好设置',
    icon: SettingsIcon,
    content: '偏好设置页用于调整团队、权限和显示选项。',
  },
] as const;

type TabItem = (typeof items)[number];

type DemoTabsListProps = ComponentProps<typeof TabsList> & {
  items: readonly TabItem[];
};

type ExpandedTabsListProps = DemoTabsListProps & {
  longLabels: boolean;
};

type FitSwitchTabsProps = {
  activeValue: string;
  asChild: boolean;
  expandedPadding: number;
  ignoreInvalidated: boolean;
  items: readonly TabItem[];
  longLabels: boolean;
  longTransition: boolean;
  onValueChange: (value: string) => void;
  transition: boolean;
};

const CompactTabsList = (props: DemoTabsListProps) => {
  const { items: visibleItems, ...listProps } = props;

  return (
    <TabsList {...listProps}>
      {visibleItems.map((item) => {
        const Icon = item.icon;

        return (
          <TabsTrigger key={item.value} value={item.value}>
            <Icon />
            <span className="sr-only">{item.longLabel}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};

const ExpandedTabsList = (props: ExpandedTabsListProps) => {
  const { items: visibleItems, longLabels, ...listProps } = props;

  return (
    <TabsList {...listProps}>
      {visibleItems.map((item) => {
        const Icon = item.icon;

        return (
          <TabsTrigger key={item.value} value={item.value}>
            <Icon />
            <span>{longLabels ? item.longLabel : item.shortLabel}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};

const FitSwitchTabs = (props: FitSwitchTabsProps) => {
  const {
    activeValue,
    asChild,
    expandedPadding,
    ignoreInvalidated,
    items: visibleItems,
    longLabels,
    longTransition,
    onValueChange,
    transition,
  } = props;
  const viewClassName = cn(
    'top-0 left-0 w-max origin-left data-fit-inactive:absolute data-fit-inactive:opacity-0',
    transition &&
      'scale-100 transition-[opacity,transform] data-fit-inactive:scale-95',
    transition && (longTransition ? 'duration-1000' : 'duration-200'),
    transition &&
      !ignoreInvalidated &&
      'data-fit-invalidated:transition-none',
  );

  return (
    <Tabs value={activeValue} onValueChange={onValueChange}>
      <div className="relative min-w-0 overflow-hidden">
        <FitSwitch>
          <FitSwitch.Collapsed asChild={asChild} className={viewClassName}>
            <CompactTabsList items={visibleItems} />
          </FitSwitch.Collapsed>

          <FitSwitch.Expanded
            asChild={asChild}
            className={viewClassName}
            style={{ paddingInline: expandedPadding }}
          >
            <ExpandedTabsList items={visibleItems} longLabels={longLabels} />
          </FitSwitch.Expanded>
        </FitSwitch>
      </div>

      {visibleItems.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className="rounded-md border p-4 text-sm"
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

const FitSwitchTabsDemo = () => {
  const [activeValue, setActiveValue] = useState<string>('overview');
  const [itemCount, setItemCount] = useState(4);
  const [expandedPadding, setExpandedPadding] = useState(0);
  const [longLabels, setLongLabels] = useState(true);
  const [asChild, setAsChild] = useState(false);
  const [transition, setTransition] = useState(true);
  const [ignoreInvalidated, setIgnoreInvalidated] = useState(false);
  const [longTransition, setLongTransition] = useState(false);
  const visibleItems = items.slice(0, itemCount);

  const handleItemCountChange = (nextItemCount: number) => {
    if (
      !Number.isInteger(nextItemCount) ||
      nextItemCount < 2 ||
      nextItemCount > 4
    ) {
      return;
    }

    const nextItems = items.slice(0, nextItemCount);

    setItemCount(nextItemCount);

    if (!nextItems.some((item) => item.value === activeValue)) {
      setActiveValue('overview');
    }
  };

  const handleValueChange = (nextValue: string) => {
    if (visibleItems.some((item) => item.value === nextValue)) {
      setActiveValue(nextValue);
    }
  };

  return (
    <DemoBox defaultWidth={520} minWidth={180} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider label="width" sliderClassName="w-56" />
            <DemoBox.Slider
              label="items"
              min={2}
              max={4}
              step={1}
              value={itemCount}
              onValueChange={handleItemCountChange}
              sliderClassName="w-56"
            />
            <DemoBox.Slider
              label="Expanded padding"
              min={0}
              max={24}
              step={4}
              value={expandedPadding}
              onValueChange={setExpandedPadding}
              valueFormatter={(value) => `${value}px`}
              sliderClassName="w-56"
            />
          </div>

          <div className="flex flex-wrap gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="fit-switch-long-labels"
                checked={longLabels}
                onCheckedChange={setLongLabels}
              />
              <label
                htmlFor="fit-switch-long-labels"
                className="text-sm font-medium"
              >
                长标签
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="fit-switch-as-child"
                checked={asChild}
                onCheckedChange={setAsChild}
              />
              <label
                htmlFor="fit-switch-as-child"
                className="text-sm font-medium"
              >
                asChild
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="fit-switch-transition"
                checked={transition}
                onCheckedChange={setTransition}
              />
              <label
                htmlFor="fit-switch-transition"
                className="text-sm font-medium"
              >
                transition
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="fit-switch-ignore-invalidated"
                checked={ignoreInvalidated}
                onCheckedChange={setIgnoreInvalidated}
              />
              <label
                htmlFor="fit-switch-ignore-invalidated"
                className="text-sm font-medium"
              >
                不设置 invalidated transition-none
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="fit-switch-long-transition"
                checked={longTransition}
                onCheckedChange={setLongTransition}
              />
              <label
                htmlFor="fit-switch-long-transition"
                className="text-sm font-medium"
              >
                长 transition duration
              </label>
            </div>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview>
          <FitSwitchTabs
            activeValue={activeValue}
            asChild={asChild}
            expandedPadding={expandedPadding}
            ignoreInvalidated={ignoreInvalidated}
            items={visibleItems}
            longLabels={longLabels}
            longTransition={longTransition}
            onValueChange={handleValueChange}
            transition={transition}
          />
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default FitSwitchTabsDemo;
