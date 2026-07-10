import { FitSwitch } from '@guanriyue/react-fit/fit-switch';
import { BellIcon, ChartNoAxesColumnIcon, HomeIcon, SettingsIcon } from 'lucide-react';
import { DemoBox } from '@/components/custom/demo-box';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const items = [
  {
    value: 'overview',
    label: '概览',
    icon: HomeIcon,
    content: '概览页用于集中查看关键指标和最近活动。',
  },
  {
    value: 'reports',
    label: '数据报表',
    icon: ChartNoAxesColumnIcon,
    content: '数据报表页展示趋势、分组和明细分析。',
  },
  {
    value: 'notifications',
    label: '通知中心',
    icon: BellIcon,
    content: '通知中心页用于处理待办、提醒和系统消息。',
  },
  {
    value: 'settings',
    label: '偏好设置',
    icon: SettingsIcon,
    content: '偏好设置页用于调整团队、权限和显示选项。',
  },
] as const;

const CompactTabsList = () => {
  return (
    <TabsList>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <TabsTrigger key={item.value} value={item.value}>
            <Icon />
            <span className="sr-only">{item.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};

const ExpandedTabsList = () => {
  return (
    <TabsList>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <TabsTrigger key={item.value} value={item.value}>
            <Icon />
            <span>{item.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
};

const FitSwitchTabs = ({ className }: { className?: string }) => {
  return (
    <Tabs defaultValue="overview" className={className}>
      <div className="relative min-w-0 overflow-hidden">
        <FitSwitch>
          <FitSwitch.Collapsed className="w-max origin-left transition-[opacity,transform] duration-200 data-[fit-switch-state=measuring]:scale-95 data-[fit-switch-state=measuring]:opacity-0 data-[fit-switch-state=visible]:scale-100 data-[fit-switch-state=visible]:opacity-100">
            <CompactTabsList />
          </FitSwitch.Collapsed>

          <FitSwitch.Expanded className="w-max origin-left transition-[opacity,transform] duration-200 data-[fit-switch-state=measuring]:scale-95 data-[fit-switch-state=measuring]:opacity-0 data-[fit-switch-state=visible]:scale-100 data-[fit-switch-state=visible]:opacity-100">
            <ExpandedTabsList />
          </FitSwitch.Expanded>
        </FitSwitch>
      </div>

      {items.map((item) => {
        return (
          <TabsContent key={item.value} value={item.value} className="rounded-md border p-4 text-sm">
            {item.content}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

const FitSwitchTabsDemo = () => {
  return (
    <DemoBox>
      <div className="space-y-6 p-6">
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">宽容器</div>
          <FitSwitchTabs />
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">窄容器</div>
          <div className="w-60 max-w-full">
            <FitSwitchTabs />
          </div>
        </div>
      </div>
    </DemoBox>
  );
};

export default FitSwitchTabsDemo;
