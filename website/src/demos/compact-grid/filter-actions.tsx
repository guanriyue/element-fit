import { useState } from 'react';
import { CompactGrid } from '@guanriyue/react-fit/compact-grid';
import { RotateCcwIcon } from 'lucide-react';
import { DemoBox } from '@/components/custom/demo-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const CompactGridFilterActionsDemo = () => {
  const [showPriority, setShowPriority] = useState(true);
  const [showChannel, setShowChannel] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showExtra, setShowExtra] = useState(true);

  return (
    <DemoBox>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="compact-show-priority"
              checked={showPriority}
              onCheckedChange={setShowPriority}
            />
            <Label htmlFor="compact-show-priority">优先级</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="compact-show-channel"
              checked={showChannel}
              onCheckedChange={setShowChannel}
            />
            <Label htmlFor="compact-show-channel">来源渠道</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="compact-show-amount"
              checked={showAmount}
              onCheckedChange={setShowAmount}
            />
            <Label htmlFor="compact-show-amount">金额区间</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="compact-show-status"
              checked={showStatus}
              onCheckedChange={setShowStatus}
            />
            <Label htmlFor="compact-show-status">状态</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="compact-show-extra"
              checked={showExtra}
              onCheckedChange={setShowExtra}
            />
            <Label htmlFor="compact-show-extra">Extra</Label>
          </div>
        </div>

        <div className="h-px bg-border" />

        <CompactGrid
          minItemWidth="180px"
          maxColumns={3}
          colGap="0.75rem"
          rowGap="1rem"
        >
          <div className="space-y-2">
            <Label htmlFor="compact-keyword">关键词</Label>
            <Input id="compact-keyword" placeholder="客户名 / 项目名" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compact-owner">负责人</Label>
            <Input id="compact-owner" placeholder="输入负责人" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compact-region">区域</Label>
            <Input id="compact-region" placeholder="华东 / 华南" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compact-date">更新时间</Label>
            <Input id="compact-date" placeholder="近 7 天" />
          </div>

          {showPriority && (
            <div className="space-y-2">
              <Label htmlFor="compact-priority">优先级</Label>
              <Select defaultValue="all">
                <SelectTrigger id="compact-priority" className="w-full">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部优先级</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showChannel && (
            <div className="space-y-2">
              <Label htmlFor="compact-channel">来源渠道</Label>
              <Input id="compact-channel" placeholder="官网 / 渠道商" />
            </div>
          )}

          {showAmount && (
            <div className="flex gap-2">
              <div className="space-y-2 w-full">
                <Label htmlFor="compact-amount">金额区间</Label>
                <Input id="compact-amount" placeholder="10k - 50k" />
              </div>
              <CompactGrid.ExtraSlot />
            </div>
          )}

          {showStatus && (
            <div className="space-y-2">
              <Label htmlFor="compact-status">状态</Label>
              <div className="flex gap-2">
                <Select defaultValue="active">
                  <SelectTrigger id="compact-status" className="min-w-0 flex-1">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">进行中</SelectItem>
                    <SelectItem value="paused">已暂停</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
                <CompactGrid.ExtraSlot />
              </div>
            </div>
          )}

          {showExtra && (
            <CompactGrid.Extra>
              <div className="flex h-full items-end">
                <Button type="button" variant="outline">
                  <RotateCcwIcon />
                  重置
                </Button>
              </div>
            </CompactGrid.Extra>
          )}
        </CompactGrid>
      </div>
    </DemoBox>
  );
};

export default CompactGridFilterActionsDemo;
