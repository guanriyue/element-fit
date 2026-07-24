import { CompactGrid } from '@guanriyue/react-fit/compact-grid';
import { RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';
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

type ColumnCountControlProps = {
  id: string;
  label: string;
  max: number;
  onValueChange: (value: string) => void;
  value: number | undefined;
};

const ColumnCountControl = (props: ColumnCountControlProps) => {
  const { id, label, max, onValueChange, value } = props;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Label htmlFor={id} className="min-w-28 text-muted-foreground">
        {label}
      </Label>
      <Select
        value={typeof value === 'number' ? String(value) : 'undefined'}
        onValueChange={onValueChange}
      >
        <SelectTrigger id={id} size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="undefined">undefined</SelectItem>
          {Array.from({ length: max }, (_, index) => index + 1).map((count) => (
            <SelectItem key={count} value={String(count)}>
              {count}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const CompactGridFilterActionsDemo = () => {
  const [minItemWidth, setMinItemWidth] = useState(180);
  const [minColumns, setMinColumns] = useState<number | undefined>(undefined);
  const [maxColumns, setMaxColumns] = useState<number | undefined>(3);
  const [colGap, setColGap] = useState(12);
  const [rowGap, setRowGap] = useState(16);
  const [showPriority, setShowPriority] = useState(true);
  const [showChannel, setShowChannel] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [showExtra, setShowExtra] = useState(true);

  const handleMinColumnsChange = (nextValue: string) => {
    if (nextValue === 'undefined') {
      setMinColumns(undefined);
      return;
    }

    const nextColumns = Number(nextValue);

    if (!Number.isInteger(nextColumns) || nextColumns < 1 || nextColumns > 4) {
      return;
    }

    setMinColumns(nextColumns);

    if (typeof maxColumns === 'number' && maxColumns < nextColumns) {
      setMaxColumns(nextColumns);
    }
  };

  const handleMaxColumnsChange = (nextValue: string) => {
    if (nextValue === 'undefined') {
      setMaxColumns(undefined);
      return;
    }

    const nextColumns = Number(nextValue);

    if (!Number.isInteger(nextColumns) || nextColumns < 1 || nextColumns > 5) {
      return;
    }

    setMaxColumns(nextColumns);

    if (typeof minColumns === 'number' && minColumns > nextColumns) {
      setMinColumns(nextColumns);
    }
  };

  return (
    <DemoBox defaultWidth={720} minWidth={320} maxWidth={960} widthStep={10}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider sliderClassName="w-56" />
            <DemoBox.Slider
              label="minItemWidth"
              min={120}
              max={280}
              step={10}
              value={minItemWidth}
              onValueChange={setMinItemWidth}
              valueFormatter={(value) => `${value}px`}
              sliderClassName="w-56"
            />
            <DemoBox.Slider
              label="colGap"
              min={0}
              max={32}
              step={4}
              value={colGap}
              onValueChange={setColGap}
              valueFormatter={(value) => `${value}px`}
              sliderClassName="w-56"
            />
            <DemoBox.Slider
              label="rowGap"
              min={0}
              max={32}
              step={4}
              value={rowGap}
              onValueChange={setRowGap}
              valueFormatter={(value) => `${value}px`}
              sliderClassName="w-56"
            />
            <ColumnCountControl
              id="compact-min-columns"
              label="minColumns"
              max={4}
              value={minColumns}
              onValueChange={handleMinColumnsChange}
            />
            <ColumnCountControl
              id="compact-max-columns"
              label="maxColumns"
              max={5}
              value={maxColumns}
              onValueChange={handleMaxColumnsChange}
            />
          </div>

          <div className="flex flex-wrap gap-4 border-t pt-4">
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
        </DemoBox.Controls>

        <DemoBox.Preview>
          <CompactGrid
            minItemWidth={minItemWidth}
            minColumns={minColumns}
            maxColumns={maxColumns}
            colGap={colGap}
            rowGap={rowGap}
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
                <div className="w-full space-y-2">
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
                    <SelectTrigger
                      id="compact-status"
                      className="min-w-0 flex-1"
                    >
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
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default CompactGridFilterActionsDemo;
