import { CompactGrid } from '@guanriyue/react-fit/compact-grid';
import { FitSwitch } from '@guanriyue/react-fit/fit-switch';
import { InlineOverflow } from '@guanriyue/react-fit/inline-overflow';
import { LineClamp } from '@guanriyue/react-fit/line-clamp';
import { RotateCcwIcon, SearchIcon } from 'lucide-react';
import {
  type CSSProperties,
  type FormEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { FPS } from '@/components/custom/fps';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { NativeLineClamp } from '@/stress-tests/line-clamp-baseline';
import {
  type StressInstanceCount,
  StressInstanceCountSelect,
  type StressRenderMode,
  StressRenderModeControl,
} from '@/stress-tests/shared';

const orderStatuses = ['待复核', '处理中', '待交付', '已完成'] as const;
const customerNames = [
  '远山科技',
  '北辰制造',
  '云际网络',
  '海岳供应链',
  '澄明数据',
];

type OrderStatus = (typeof orderStatuses)[number];

type OrderRecord = {
  customerName: string;
  id: number;
  orderNumber: string;
  status: OrderStatus;
};

type OrderRowProps = {
  longContent: boolean;
  onOpenDetails: (orderId: number) => void;
  order: OrderRecord;
  renderMode: StressRenderMode;
};

type OrderTableProps = {
  longContent: boolean;
  onOpenDetails: (orderId: number) => void;
  renderMode: StressRenderMode;
  rowCount: StressInstanceCount;
};

const orders: OrderRecord[] = Array.from({ length: 500 }, (_, index) => {
  const id = index + 1;

  return {
    customerName: customerNames[index % customerNames.length] ?? '企业客户',
    id,
    orderNumber: `SO-2026-07-${String(id).padStart(4, '0')}/East-Region`,
    status: orderStatuses[index % orderStatuses.length] ?? '待复核',
  };
});

const statusStyles: Record<OrderStatus, string> = {
  待复核: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  处理中: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  待交付:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  已完成:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

const summaryItems = [
  { label: '今日新增', value: '128' },
  { label: '待复核', value: '46' },
  { label: '处理中', value: '312' },
  { label: '本月成交额', value: '¥ 8.42M' },
];

const filterFields = [
  { id: 'keyword', label: '关键词', placeholder: '订单号 / 客户名' },
  { id: 'status', label: '状态', placeholder: '全部状态' },
  { id: 'owner', label: '负责人', placeholder: '姓名 / 团队' },
  { id: 'region', label: '区域', placeholder: '全部区域' },
  { id: 'amount', label: '金额区间', placeholder: '最低 - 最高' },
];

const orderTableGridStyle: CSSProperties = {
  gridTemplateColumns:
    'minmax(0, 16fr) minmax(0, 21fr) minmax(0, 34fr) minmax(0, 12fr) minmax(0, 17fr)',
};

const nativeFilterGridStyle: CSSProperties = {
  columnGap: '0.75rem',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(max(11rem, calc((100% - 0.75rem * 3) / 4)), 1fr))',
  rowGap: '0.75rem',
};

const getCustomerName = (order: OrderRecord, longContent: boolean) => {
  return longContent
    ? `${order.customerName}有限公司华东区域重点客户事业部`
    : order.customerName;
};

const getOrderDescription = (order: OrderRecord, longContent: boolean) => {
  if (!longContent) {
    return `订单 ${order.id} 等待业务确认。`;
  }

  return `订单 ${order.id} 包含客户资料、合同条款、交付计划和风险记录，需要销售、法务与交付团队共同复核后继续处理。`;
};

const OrderFilters = memo((props: { renderMode: StressRenderMode }) => {
  const { renderMode } = props;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const actions = (
    <span className="flex items-center gap-2">
      <Button type="submit" size="sm">
        <SearchIcon />
        查询
      </Button>
      <Button type="reset" variant="outline" size="sm">
        <RotateCcwIcon />
        重置
      </Button>
    </span>
  );

  return (
    <form className="border-b p-4" onSubmit={handleSubmit}>
      {renderMode === 'component' ? (
        <CompactGrid
          minItemWidth="11rem"
          maxColumns={4}
          colGap="0.75rem"
          rowGap="0.75rem"
        >
          {filterFields.map((field) => (
            <CompactGrid.Item key={field.id} className="space-y-1.5">
              <Label htmlFor={`real-world-${field.id}`}>{field.label}</Label>
              <Input
                id={`real-world-${field.id}`}
                placeholder={field.placeholder}
              />
            </CompactGrid.Item>
          ))}
          <CompactGrid.Item className="space-y-1.5">
            <Label htmlFor="real-world-date">更新时间</Label>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Input id="real-world-date" placeholder="近 30 天" />
              </div>
              <CompactGrid.ExtraSlot className="flex shrink-0 items-end" />
            </div>
          </CompactGrid.Item>
          <CompactGrid.Extra className="flex items-end">
            {actions}
          </CompactGrid.Extra>
        </CompactGrid>
      ) : (
        <div style={nativeFilterGridStyle}>
          {filterFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`real-world-${field.id}`}>{field.label}</Label>
              <Input
                id={`real-world-${field.id}`}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="real-world-date">更新时间</Label>
            <Input id="real-world-date" placeholder="近 30 天" />
          </div>
          <div className="flex items-end">{actions}</div>
        </div>
      )}
    </form>
  );
});

OrderFilters.displayName = 'OrderFilters';

const OrderSummary = memo(() => {
  return (
    <section className="grid grid-cols-2 border-b lg:grid-cols-4">
      {summaryItems.map((item) => (
        <div key={item.label} className="border-r p-4 last:border-r-0">
          <div className="text-xs text-muted-foreground">{item.label}</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">
            {item.value}
          </div>
        </div>
      ))}
    </section>
  );
});

OrderSummary.displayName = 'OrderSummary';

const OrderRow = memo((props: OrderRowProps) => {
  const { longContent, onOpenDetails, order, renderMode } = props;
  const customerName = getCustomerName(order, longContent);
  const description = getOrderDescription(order, longContent);

  const handleOpenDetails = () => {
    onOpenDetails(order.id);
  };

  const customerDetail = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-5 px-1 py-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          详情
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={4}>{customerName}</TooltipContent>
    </Tooltip>
  );

  const descriptionDetail = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-5 px-1 py-0 align-baseline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          详情
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={4} className="max-w-sm leading-5">
        {description}
      </TooltipContent>
    </Tooltip>
  );

  const collapsedActions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="link" size="xs">
          更多
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={handleOpenDetails}>查看</DropdownMenuItem>
        <DropdownMenuItem onSelect={handleOpenDetails}>编辑</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleOpenDetails}>归档</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const expandedActions = (
    <>
      <Button
        type="button"
        variant="link"
        size="xs"
        onClick={handleOpenDetails}
      >
        查看
      </Button>
      <Button
        type="button"
        variant="link"
        size="xs"
        onClick={handleOpenDetails}
      >
        编辑
      </Button>
      <Button
        type="button"
        variant="link"
        size="xs"
        onClick={handleOpenDetails}
      >
        归档
      </Button>
    </>
  );

  return (
    <div
      role="row"
      className="grid border-t hover:bg-muted/30"
      style={orderTableGridStyle}
    >
      <div role="cell" className="overflow-hidden px-3 py-2.5">
        {renderMode === 'component' ? (
          <InlineOverflow className="flex w-full min-w-0">
            <InlineOverflow.Content className="min-w-0 flex-1 truncate font-mono text-xs">
              {order.orderNumber}
            </InlineOverflow.Content>
          </InlineOverflow>
        ) : (
          <span className="block truncate font-mono text-xs">
            {order.orderNumber}
          </span>
        )}
      </div>
      <div role="cell" className="overflow-hidden px-3 py-2.5">
        {renderMode === 'component' ? (
          <InlineOverflow className="flex w-full min-w-0 items-center">
            <InlineOverflow.Content className="min-w-0 flex-1 truncate text-sm">
              {customerName}
            </InlineOverflow.Content>
            <InlineOverflow.Accessory className="ml-1.5 shrink-0">
              {customerDetail}
            </InlineOverflow.Accessory>
          </InlineOverflow>
        ) : (
          <div className="flex w-full min-w-0 items-center">
            <span className="min-w-0 flex-1 truncate text-sm">
              {customerName}
            </span>
            <span className="ml-1.5 shrink-0">{customerDetail}</span>
          </div>
        )}
      </div>
      <div role="cell" className="overflow-hidden px-3 py-2.5">
        {renderMode === 'component' ? (
          <LineClamp
            lines={2}
            className="break-all text-sm leading-5 text-muted-foreground"
            suffix={descriptionDetail}
          >
            {description}
          </LineClamp>
        ) : (
          <NativeLineClamp
            className="break-all text-sm leading-5 text-muted-foreground"
            expanded={false}
            showSuffix={longContent}
            suffix={descriptionDetail}
          >
            {description}
          </NativeLineClamp>
        )}
      </div>
      <div role="cell" className="overflow-hidden px-3 py-2.5">
        <span
          className={cn(
            'inline-flex rounded-sm px-2 py-1 text-xs',
            statusStyles[order.status],
          )}
        >
          {order.status}
        </span>
      </div>
      <div role="cell" className="overflow-hidden px-3 py-2">
        <div className="@container relative overflow-hidden">
          {renderMode === 'component' ? (
            <FitSwitch>
              <FitSwitch.Collapsed className="top-0 left-0 w-max data-fit-inactive:absolute data-fit-inactive:opacity-0">
                {collapsedActions}
              </FitSwitch.Collapsed>
              <FitSwitch.Expanded className="top-0 left-0 flex w-max items-center data-fit-inactive:absolute data-fit-inactive:opacity-0">
                {expandedActions}
              </FitSwitch.Expanded>
            </FitSwitch>
          ) : (
            <>
              <div className="@min-[10rem]:hidden">{collapsedActions}</div>
              <div className="hidden w-max items-center @min-[10rem]:flex">
                {expandedActions}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

OrderRow.displayName = 'OrderRow';

const OrderTable = memo((props: OrderTableProps) => {
  const { longContent, onOpenDetails, renderMode, rowCount } = props;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="table"
        aria-rowcount={rowCount + 1}
        className="w-full text-left"
      >
        <div
          role="rowgroup"
          className="bg-muted/60 text-xs text-muted-foreground"
        >
          <div role="row" className="grid" style={orderTableGridStyle}>
            <div
              role="columnheader"
              className="overflow-hidden px-3 py-2 font-medium"
            >
              订单编号
            </div>
            <div
              role="columnheader"
              className="overflow-hidden px-3 py-2 font-medium"
            >
              客户
            </div>
            <div
              role="columnheader"
              className="overflow-hidden px-3 py-2 font-medium"
            >
              业务备注
            </div>
            <div
              role="columnheader"
              className="overflow-hidden px-3 py-2 font-medium"
            >
              状态
            </div>
            <div
              role="columnheader"
              className="overflow-hidden px-3 py-2 font-medium"
            >
              操作
            </div>
          </div>
        </div>
        <div role="rowgroup">
          {orders.slice(0, rowCount).map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              longContent={longContent}
              onOpenDetails={onOpenDetails}
              renderMode={renderMode}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
});

OrderTable.displayName = 'OrderTable';

export const RealWorldStressTest = () => {
  const [rowCount, setRowCount] = useState<StressInstanceCount>(100);
  const [renderMode, setRenderMode] = useState<StressRenderMode>('component');
  const [longContent, setLongContent] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [panelAnimation, setPanelAnimation] = useState(false);
  const [autoPanel, setAutoPanel] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(1);
  const [tableRevision, setTableRevision] = useState(0);
  const selectedOrder = orders[selectedOrderId - 1] ?? orders[0];

  useEffect(() => {
    if (!autoPanel) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setDetailsOpen((current) => !current);
    }, 1600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoPanel]);

  const handleOpenDetails = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setDetailsOpen(true);
  }, []);

  const handleContentToggle = () => {
    setLongContent((current) => !current);
  };

  const handlePanelToggle = () => {
    setDetailsOpen((current) => !current);
  };

  const handleRemount = () => {
    setTableRevision((current) => current + 1);
  };

  return (
    <div>
      <FPS />

      <div className="mb-6 flex flex-wrap items-center gap-3 border-y py-4">
        <StressInstanceCountSelect
          id="real-world-row-count"
          label="表格行数"
          value={rowCount}
          onValueChange={setRowCount}
        />
        <StressRenderModeControl
          value={renderMode}
          onValueChange={setRenderMode}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleContentToggle}
        >
          {longContent ? '切换为短内容' : '切换为长内容'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemount}
        >
          <RotateCcwIcon />
          重新挂载表格
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={autoPanel}
          onClick={handlePanelToggle}
        >
          {detailsOpen ? '关闭详情面板' : '打开详情面板'}
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-4">
          <label
            className="flex items-center gap-2 text-sm"
            htmlFor="real-world-panel-animation"
          >
            <Switch
              id="real-world-panel-animation"
              checked={panelAnimation}
              onCheckedChange={setPanelAnimation}
            />
            面板动画
          </label>
          <label
            className="flex items-center gap-2 text-sm"
            htmlFor="real-world-auto-panel"
          >
            <Switch
              id="real-world-auto-panel"
              checked={autoPanel}
              onCheckedChange={setAutoPanel}
            />
            自动开关面板
          </label>
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 overflow-hidden rounded-md border bg-background md:items-start',
          detailsOpen
            ? 'md:grid-cols-[minmax(0,1fr)_20rem]'
            : 'md:grid-cols-[minmax(0,1fr)_0rem]',
          panelAnimation &&
            'md:transition-[grid-template-columns] md:duration-700 md:ease-in-out',
        )}
      >
        <main className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <div className="font-semibold">订单运营中心</div>
              <div className="text-xs text-muted-foreground">
                销售、交付与风险协同处理
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {renderMode === 'component'
                ? `未虚拟化 · ${rowCount} 行 · 约 ${rowCount * 4 + 1} 个测量组件`
                : `未虚拟化 · ${rowCount} 行 · CSS 基线`}
            </div>
          </header>

          <OrderFilters renderMode={renderMode} />
          <OrderSummary />
          <OrderTable
            key={`${renderMode}-${tableRevision}`}
            rowCount={rowCount}
            longContent={longContent}
            onOpenDetails={handleOpenDetails}
            renderMode={renderMode}
          />
        </main>

        <aside
          aria-hidden={!detailsOpen}
          inert={detailsOpen ? undefined : true}
          className={cn(
            'h-full overflow-hidden bg-muted/20',
            detailsOpen
              ? 'block border-t md:border-t-0 md:border-l'
              : 'hidden md:block',
          )}
        >
          <div className="w-full space-y-5 p-4 md:w-80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">订单详情</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {selectedOrder?.orderNumber}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setDetailsOpen(false)}
              >
                关闭
              </Button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">客户</dt>
                <dd className="mt-1">{selectedOrder?.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">当前状态</dt>
                <dd className="mt-1">{selectedOrder?.status}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">负责人</dt>
                <dd className="mt-1">华东销售一组</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">下一步</dt>
                <dd className="mt-1 leading-6 text-muted-foreground">
                  完成合同条款复核，并确认交付时间和客户侧验收负责人。
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
};
