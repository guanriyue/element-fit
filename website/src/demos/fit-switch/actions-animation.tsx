import { FitSwitch } from '@guanriyue/react-fit/fit-switch';
import {
  DownloadIcon,
  PencilIcon,
  SettingsIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const actions = [
  { label: '编辑', icon: PencilIcon },
  { label: '分享', icon: Share2Icon },
  { label: '下载', icon: DownloadIcon },
  { label: '删除', icon: Trash2Icon },
] as const;

const FitSwitchActionsAnimationDemo = () => {
  return (
    <DemoBox defaultWidth={560} minWidth={180} maxWidth={720} widthStep={1}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <DemoBox.WidthSlider sliderClassName="w-56" />
          <div className="text-xs text-muted-foreground">
            调整工具栏宽度，观察操作按钮与齿轮菜单之间的裁切切换。
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview className="rounded-md border bg-background p-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0 flex-1 truncate text-sm font-medium">
              项目操作
            </div>

            <div className="relative flex min-h-8 min-w-0 flex-1 justify-end overflow-hidden">
              <FitSwitch>
                <DropdownMenu>
                  <FitSwitch.Collapsed
                    asChild
                    className="top-0 right-0 rotate-0 opacity-100 delay-150 transition-[opacity,transform] duration-200 ease-out data-fit-measuring:absolute data-fit-measuring:rotate-90 data-fit-measuring:opacity-0 data-fit-measuring:delay-0 motion-reduce:transition-none"
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="打开操作菜单"
                      >
                        <SettingsIcon />
                      </Button>
                    </DropdownMenuTrigger>
                  </FitSwitch.Collapsed>

                  <DropdownMenuContent align="end">
                    {actions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <DropdownMenuItem key={action.label}>
                          <Icon />
                          {action.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <FitSwitch.Expanded
                  asChild
                  className="top-0 right-0 flex w-max shrink-0 translate-x-0 gap-2 transition-transform duration-300 ease-out data-fit-measuring:absolute data-fit-measuring:translate-x-full motion-reduce:transition-none"
                >
                  <div>
                    {actions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <Button
                          key={action.label}
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          <Icon />
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                </FitSwitch.Expanded>
              </FitSwitch>
            </div>
          </div>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default FitSwitchActionsAnimationDemo;
