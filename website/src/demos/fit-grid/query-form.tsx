import { FitGrid } from '@guanriyue/react-fit/fit-grid';
import { RotateCcwIcon, SearchIcon } from 'lucide-react';
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

const FitGridQueryFormDemo = () => {
  return (
    <DemoBox defaultWidth={720} minWidth={260} maxWidth={960} widthStep={10}>
      <div className="space-y-5 p-6">
        <DemoBox.Controls>
          <DemoBox.WidthSlider sliderClassName="w-56" />
        </DemoBox.Controls>

        <DemoBox.Preview className="rounded-md border bg-background p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <FitGrid
              minItemWidth="200px"
              maxColumns={4}
              colGap="0.75rem"
              rowGap="1rem"
            >
              <div className="space-y-2">
                <Label htmlFor="order-keyword">关键词</Label>
                <Input id="order-keyword" placeholder="订单号 / 客户名" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-status">订单状态</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="order-status" className="w-full">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="shipping">配送中</SelectItem>
                    <SelectItem value="done">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-range">下单时间</Label>
                <Select defaultValue="7d">
                  <SelectTrigger id="order-range" className="w-full">
                    <SelectValue placeholder="选择时间" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">今天</SelectItem>
                    <SelectItem value="7d">近 7 天</SelectItem>
                    <SelectItem value="30d">近 30 天</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FitGrid.Item pin="row-end">
                <div className="flex h-full flex-wrap items-end justify-end gap-2">
                  <Button type="button" variant="outline">
                    <RotateCcwIcon />
                    重置
                  </Button>
                  <Button type="submit">
                    <SearchIcon />
                    查询
                  </Button>
                </div>
              </FitGrid.Item>
            </FitGrid>
          </form>
        </DemoBox.Preview>
      </div>
    </DemoBox>
  );
};

export default FitGridQueryFormDemo;
