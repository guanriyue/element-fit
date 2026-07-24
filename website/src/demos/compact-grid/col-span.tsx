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

const fieldClassName = 'space-y-2';
const spanFieldClassName =
  'space-y-2 rounded-md border border-dashed border-primary/40 bg-accent/30 p-3';

type AddressColSpan = 1 | 2 | 3 | 'full';

const CompactGridColSpanDemo = () => {
  const [addressColSpan, setAddressColSpan] = useState<AddressColSpan>(2);
  const [showAddress, setShowAddress] = useState(true);
  const [showNote, setShowNote] = useState(true);
  const [showPriority, setShowPriority] = useState(true);
  const [showAmount, setShowAmount] = useState(true);
  const [showAmountSlot, setShowAmountSlot] = useState(true);
  const [showExtra, setShowExtra] = useState(true);

  const handleAddressColSpanChange = (nextValue: string) => {
    if (nextValue === 'full') {
      setAddressColSpan('full');
      return;
    }

    const nextColSpan = Number(nextValue);

    if (nextColSpan === 1 || nextColSpan === 2 || nextColSpan === 3) {
      setAddressColSpan(nextColSpan);
    }
  };

  return (
    <DemoBox defaultWidth={760} minWidth={260} maxWidth={960} widthStep={10}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <div className="grid gap-4 lg:grid-cols-2">
            <DemoBox.WidthSlider sliderClassName="w-56" />

            <div className="flex flex-wrap items-center gap-4">
              <Label
                htmlFor="compact-address-col-span"
                className="min-w-28 text-muted-foreground"
              >
                colSpan
              </Label>
              <Select
                value={String(addressColSpan)}
                onValueChange={handleAddressColSpanChange}
              >
                <SelectTrigger
                  id="compact-address-col-span"
                  size="sm"
                  className="w-32"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="full">full</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Switch
                id="compact-col-span-show-address"
                checked={showAddress}
                onCheckedChange={setShowAddress}
              />
              <Label htmlFor="compact-col-span-show-address">联系地址</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="compact-col-span-show-note"
                checked={showNote}
                onCheckedChange={setShowNote}
              />
              <Label htmlFor="compact-col-span-show-note">备注整行</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="compact-col-span-show-priority"
                checked={showPriority}
                onCheckedChange={setShowPriority}
              />
              <Label htmlFor="compact-col-span-show-priority">优先级</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="compact-col-span-show-amount"
                checked={showAmount}
                onCheckedChange={setShowAmount}
              />
              <Label htmlFor="compact-col-span-show-amount">预计金额</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="compact-col-span-show-amount-slot"
                checked={showAmountSlot}
                onCheckedChange={setShowAmountSlot}
              />
              <Label htmlFor="compact-col-span-show-amount-slot">
                金额插槽
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="compact-col-span-show-extra"
                checked={showExtra}
                onCheckedChange={setShowExtra}
              />
              <Label htmlFor="compact-col-span-show-extra">Extra</Label>
            </div>
          </div>
        </DemoBox.Controls>

        <DemoBox.Preview>
          <CompactGrid
            minItemWidth="150px"
            maxColumns={4}
            colGap="0.75rem"
            rowGap="1rem"
          >
            <div className={fieldClassName}>
              <Label htmlFor="compact-col-span-customer">客户名称</Label>
              <Input
                id="compact-col-span-customer"
                placeholder="输入客户名称"
              />
            </div>

            <div className={fieldClassName}>
              <Label htmlFor="compact-col-span-owner">负责人</Label>
              <Input id="compact-col-span-owner" placeholder="输入负责人" />
            </div>

            <div className={fieldClassName}>
              <Label htmlFor="compact-col-span-stage">阶段</Label>
              <Select defaultValue="intent">
                <SelectTrigger id="compact-col-span-stage" className="w-full">
                  <SelectValue placeholder="选择阶段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intent">意向沟通</SelectItem>
                  <SelectItem value="quote">方案报价</SelectItem>
                  <SelectItem value="signed">已签约</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={fieldClassName}>
              <Label htmlFor="compact-col-span-region">区域</Label>
              <Input id="compact-col-span-region" placeholder="华东 / 华南" />
            </div>

            {showAddress && (
              <CompactGrid.Item
                colSpan={addressColSpan}
                className={spanFieldClassName}
              >
                <Label htmlFor="compact-col-span-address">联系地址</Label>
                <Input
                  id="compact-col-span-address"
                  placeholder="观察跨列范围"
                />
              </CompactGrid.Item>
            )}

            {showNote && (
              <CompactGrid.Item colSpan="full" className={spanFieldClassName}>
                <Label htmlFor="compact-col-span-note">备注</Label>
                <div className="flex gap-2">
                  <Input
                    id="compact-col-span-note"
                    placeholder="占满当前行显示"
                  />
                  <CompactGrid.ExtraSlot />
                </div>
              </CompactGrid.Item>
            )}

            {showPriority && (
              <div className={fieldClassName}>
                <Label htmlFor="compact-col-span-priority">优先级</Label>
                <Select defaultValue="medium">
                  <SelectTrigger
                    id="compact-col-span-priority"
                    className="w-full"
                  >
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showAmount && (
              <div className="flex gap-2">
                <div className="w-full space-y-2">
                  <Label htmlFor="compact-col-span-amount">预计金额</Label>
                  <Input id="compact-col-span-amount" placeholder="50k" />
                </div>
                {showAmountSlot && <CompactGrid.ExtraSlot />}
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

export default CompactGridColSpanDemo;
