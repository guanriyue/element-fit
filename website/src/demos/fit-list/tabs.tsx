import { FitList } from '@guanriyue/react-fit/fit-list';
import {
  BellIcon,
  ChartNoAxesColumnIcon,
  HomeIcon,
  SettingsIcon,
} from 'lucide-react';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const items = [
  {
    value: 'overview',
    shortLabel: '概览',
    longLabel: '业务数据概览',
    icon: HomeIcon,
    content: '查看业务的关键指标和最近活动。',
  },
  {
    value: 'reports',
    shortLabel: '报表',
    longLabel: '数据分析报表',
    icon: ChartNoAxesColumnIcon,
    content: '查看趋势、分组和明细分析。',
  },
  {
    value: 'notifications',
    shortLabel: '通知',
    longLabel: '通知消息中心',
    icon: BellIcon,
    content: '处理待办、提醒和系统消息。',
  },
  {
    value: 'settings',
    shortLabel: '设置',
    longLabel: '团队偏好设置',
    icon: SettingsIcon,
    content: '调整团队、权限和显示选项。',
  },
] as const;

const FitListTabsDemo = () => {
  const [activeValue, setActiveValue] = useState<string>('overview');
  const [itemCount, setItemCount] = useState(items.length);
  const [longLabels, setLongLabels] = useState(true);
  const [compactLabels, setCompactLabels] = useState(false);
  const visibleItems = items.slice(0, itemCount);

  const handleItemCountChange = (nextItemCount: number) => {
    if (
      !Number.isInteger(nextItemCount)
      || nextItemCount < 2
      || nextItemCount > items.length
    ) {
      return;
    }

    const nextItems = items.slice(0, nextItemCount);

    setItemCount(nextItemCount);

    if (!nextItems.some((item) => item.value === activeValue)) {
      setActiveValue('overview');
    }
  };

  return (
    <DemoBox defaultWidth={520} minWidth={220} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider label="width" sliderClassName="w-56" />
            <DemoBox.Slider
              label="items"
              min={2}
              max={items.length}
              step={1}
              value={itemCount}
              onValueChange={handleItemCountChange}
              sliderClassName="w-56"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="fit-list-long-labels"
                checked={longLabels}
                onCheckedChange={setLongLabels}
              />
              <label
                htmlFor="fit-list-long-labels"
                className="text-sm font-medium"
              >
                Expanded 长标题
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="fit-list-compact-labels"
                checked={compactLabels}
                onCheckedChange={setCompactLabels}
              />
              <label
                htmlFor="fit-list-compact-labels"
                className="text-sm font-medium"
              >
                Compact 短标题
              </label>
            </div>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview>
          <Tabs value={activeValue} onValueChange={setActiveValue}>
            <FitList asChild>
              <TabsList className="group/fit-list flex w-full min-w-0 flex-nowrap justify-start overflow-hidden">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const label = longLabels
                    ? item.longLabel
                    : item.shortLabel;

                  return (
                    <FitList.Item key={item.value} asChild>
                      <TabsTrigger
                        value={item.value}
                        aria-label={item.longLabel}
                        className="flex-none group-data-measuring/fit-list:transition-none"
                      >
                        <Icon />
                        <FitList.Expanded className="data-inactive:hidden">
                          {label}
                        </FitList.Expanded>
                        {compactLabels && (
                          <FitList.Compact className="data-inactive:hidden">
                            {item.shortLabel}
                          </FitList.Compact>
                        )}
                      </TabsTrigger>
                    </FitList.Item>
                  );
                })}
              </TabsList>
            </FitList>

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
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default FitListTabsDemo;
