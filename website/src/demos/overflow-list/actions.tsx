import { OverflowList } from '@guanriyue/react-fit/overflow-list';
import {
  ArchiveIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  type LucideIcon,
  PencilIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type Action = {
  destructive?: boolean;
  icon: LucideIcon;
  id: string;
  label: string;
  longLabel: string;
};

const actions: readonly Action[] = [
  {
    id: 'edit',
    label: '编辑',
    longLabel: '编辑项目资料',
    icon: PencilIcon,
  },
  {
    id: 'copy',
    label: '复制',
    longLabel: '复制为新项目',
    icon: CopyIcon,
  },
  {
    id: 'share',
    label: '分享',
    longLabel: '分享给团队成员',
    icon: Share2Icon,
  },
  {
    id: 'download',
    label: '下载',
    longLabel: '下载项目文件',
    icon: DownloadIcon,
  },
  {
    id: 'archive',
    label: '归档',
    longLabel: '归档当前项目',
    icon: ArchiveIcon,
  },
  {
    id: 'delete',
    label: '删除',
    longLabel: '永久删除项目',
    icon: Trash2Icon,
    destructive: true,
  },
];

const OverflowListActionsDemo = () => {
  const [itemCount, setItemCount] = useState(actions.length);
  const [longLabels, setLongLabels] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [lastAction, setLastAction] = useState<string>('尚未执行操作');
  const renderedActions = actions.slice(0, itemCount);
  const direction = rtl ? 'rtl' : 'ltr';

  const runAction = (action: Action) => {
    setLastAction(`已执行：${action.longLabel}`);
  };

  return (
    <DemoBox defaultWidth={620} minWidth={190} maxWidth={760} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider label="width" sliderClassName="w-56" />
            <DemoBox.Slider
              label="items"
              min={2}
              max={actions.length}
              step={1}
              value={itemCount}
              onValueChange={setItemCount}
              sliderClassName="w-56"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="overflow-list-long-labels"
                checked={longLabels}
                onCheckedChange={setLongLabels}
              />
              <label
                htmlFor="overflow-list-long-labels"
                className="text-sm font-medium"
              >
                使用长文案
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="overflow-list-rtl"
                checked={rtl}
                onCheckedChange={setRtl}
              />
              <label
                htmlFor="overflow-list-rtl"
                className="text-sm font-medium"
              >
                RTL
              </label>
            </div>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview className="rounded-md border bg-background p-3">
          <div dir={direction} className="flex min-w-0 items-center gap-4">
            <div className="shrink-0 text-sm font-medium">项目操作</div>

            <OverflowList
              dir={direction}
              className="flex min-w-0 flex-1 items-center justify-end gap-2"
            >
              {renderedActions.map((action) => {
                const Icon = action.icon;

                return (
                  <OverflowList.Item key={action.id} data={action} asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        'shrink-0',
                        action.destructive && 'text-destructive',
                      )}
                      onClick={() => runAction(action)}
                    >
                      <Icon />
                      {longLabels ? action.longLabel : action.label}
                    </Button>
                  </OverflowList.Item>
                );
              })}

              <OverflowList.Overflow<Action>>
                {({ overflowItems }) => (
                  <DropdownMenu dir={direction}>
                    <OverflowList.Accessory asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="shrink-0"
                          aria-label={`更多操作，共 ${overflowItems.length} 项`}
                        >
                          <EllipsisIcon />
                        </Button>
                      </DropdownMenuTrigger>
                    </OverflowList.Accessory>

                    <DropdownMenuContent align="end">
                      {overflowItems.map((action) => {
                        const Icon = action.icon;

                        return (
                          <DropdownMenuItem
                            key={action.id}
                            variant={
                              action.destructive ? 'destructive' : 'default'
                            }
                            onSelect={() => runAction(action)}
                          >
                            <Icon />
                            {action.longLabel}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </OverflowList.Overflow>
            </OverflowList>
          </div>

          <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            {lastAction}
          </div>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default OverflowListActionsDemo;
