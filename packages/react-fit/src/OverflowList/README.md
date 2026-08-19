# OverflowList

`OverflowList` 用于单行操作列表：空间足够时展示全部 Item；空间不足时保留 DOM 顺序中的可见前缀，
隐藏尾部 Item，并把它们的业务数据交给调用方渲染附属操作。

组件不内置 Dropdown、菜单项、按钮样式或优先级模型。调用方通过 `Item.data` 描述业务操作，使用
`Overflow` 消费溢出数据，并用一个或多个 `Accessory` 声明仅在溢出时参与布局的真实元素。

## Import

```tsx
import { OverflowList } from '@guanriyue/react-fit/overflow-list';
```

## Basic Example

```tsx
type Action = {
  id: string;
  label: string;
  run: () => void;
};

function Actions({ actions }: { actions: readonly Action[] }) {
  return (
    <OverflowList className="flex min-w-0 items-center gap-2">
      {actions.map((action) => (
        <OverflowList.Item key={action.id} data={action} asChild>
          <button
            type="button"
            className="shrink-0 whitespace-nowrap"
            onClick={action.run}
          >
            {action.label}
          </button>
        </OverflowList.Item>
      ))}

      <OverflowList.Overflow<Action>>
        {({ overflowItems }) => (
          <DropdownMenu>
            <OverflowList.Accessory asChild>
              <DropdownMenu.Trigger asChild>
                <button type="button" aria-label="More actions">
                  More
                </button>
              </DropdownMenu.Trigger>
            </OverflowList.Accessory>

            <DropdownMenu.Content>
              {overflowItems.map((action) => (
                <DropdownMenu.Item key={action.id} onSelect={action.run}>
                  {action.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      </OverflowList.Overflow>
    </OverflowList>
  );
}
```

Root、Item 和 Accessory 不提供默认布局样式。上例中的 `min-w-0` 允许 Root 在 flex 布局中收缩，
Item 的 `shrink-0` 保证一个操作不会先被压缩成更窄的形态，然后才被判定为溢出。

## API Reference

### Root

包含 OverflowList 的全部部分，默认渲染为 `div`。Root 的 content box 表示列表可以使用的宽度。
原生 `div` props 会转发给最终元素，ref 类型为 `HTMLElement`。

```tsx
<OverflowList>
  {/* Item, Overflow and Accessory */}
</OverflowList>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `asChild` | `boolean` | `false` |

除上表外，还支持 `React.ComponentPropsWithoutRef<typeof Primitive.div>` 中的原生属性，例如
`children`、`className`、`style`、`dir` 和事件处理函数。

#### Data attributes

| Attribute | Value | Condition |
| --- | --- | --- |
| `data-overflow-list-root` | `""` | 始终存在 |
| `data-overflow` | `""` | 至少一个 Item 溢出时存在 |

首次客户端测量前以及服务端渲染时，全部 Item 正常渲染、Accessory 不渲染，Root 不带
`data-overflow`。当前不提供受控 overflow、默认可见数量或手动 remeasure API。

### Item

声明一个可以从列表尾部隐藏的元素，默认渲染为 `span`。原生 `span` props 会转发给最终元素，ref 类型为
`HTMLElement`。Item 必须是 Root 的直接 DOM 子节点。

```tsx
<OverflowList.Item data={action} asChild>
  <button type="button">{action.label}</button>
</OverflowList.Item>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `data` | `any` | Required |
| `asChild` | `boolean` | `false` |

`data` 只用于生成 `overflowItems`，不会作为 DOM attribute 转发。其余原生 `span` 属性正常转发。

#### Data attributes

| Attribute | Value | Condition |
| --- | --- | --- |
| `data-overflow-list-item` | `""` | Item 挂载时始终存在 |

隐藏 Item 渲染为 `null`，因此没有用于表示隐藏状态的 DOM attribute。

### Overflow

通过 render function 暴露当前溢出的 Item 数据。Overflow 不渲染自己的 DOM，不转发 ref 或原生属性。

```tsx
<OverflowList.Overflow<Action>>
  {({ overflowItems }) => <ActionMenu actions={overflowItems} />}
</OverflowList.Overflow>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `children` | `(props: { overflowItems: readonly Data[] }) => ReactNode` | Required |

`Data` 是调用方传入的泛型参数。组件不会在运行时校验它与各个 `Item.data` 的类型关系。

Overflow 没有对应的 data attribute，因为它不创建 DOM 元素。

### Accessory

声明仅在存在溢出 Item 时参与布局的附属元素，默认渲染为 `span`。原生 `span` props 会转发给最终元素，
ref 类型为 `HTMLElement`。Accessory 必须是 Root 的直接 DOM 子节点。

```tsx
<OverflowList.Accessory asChild>
  <button type="button">More</button>
</OverflowList.Accessory>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `asChild` | `boolean` | `false` |

除 `asChild` 外，还支持原生 `span` 属性。测量状态下，组件会把 `aria-hidden` 强制设为 `true`，并覆盖
inline `style` 中的 `visibility` 和 `pointerEvents`；正常展示时使用调用方传入的值。

#### Data attributes

| Attribute | Value | Condition |
| --- | --- | --- |
| `data-overflow-list-accessory` | `""` | Accessory 挂载时始终存在 |
| `data-overflow-list-measuring` | `""` | Accessory 以不可见状态参与测量时存在 |

没有溢出时 Accessory 渲染为 `null`，因此不存在表示 hidden 状态的 DOM attribute。

## Item

`OverflowList.Item` 声明一个可以从列表尾部省略的操作。`data` 是必填的业务数据，组件不会读取或限制
它的结构。发生溢出时，隐藏 Item 的 `data` 会按照 DOM 顺序出现在 `overflowItems` 中。

```tsx
<OverflowList.Item data={action} asChild>
  <button type="button">{action.label}</button>
</OverflowList.Item>
```

Item 的优先级由 DOM 顺序表达：越靠前的 Item 越优先保留。组件只会保留连续前缀，不支持在中间跳过
某个 Item 后继续展示后面的 Item。

隐藏的 Item 会渲染为 `null`，而不是通过 `display: none` 或 dataset 隐藏。这意味着：

- 隐藏 Item 的内部状态会被销毁，ref 会收到 `null`。
- 隐藏 Item 中的焦点、未受控表单状态和正在执行的交互不会保留。
- 隐藏 Item 不存在可观察的 DOM 尺寸；它会在下一次完整测量时重新挂载并参与真实布局。

条件添加或删除 Item 会使现有几何缓存失效，并触发新的完整测量。`data` 引用变化同样会触发测量，以便
`Overflow` 获得最新数据。仅移动使用稳定 key 的现有 DOM 节点不会改变元素尺寸，也不保证触发观察器；如果
业务会动态调整 Item 的 DOM 顺序，应同时更新 `data`、key 或重新挂载列表，使组件重新建立顺序缓存。

## Overflow

`OverflowList.Overflow` 本身不渲染 DOM。它订阅当前的溢出数据，并使用 render function 将
`overflowItems` 交给调用方：

```tsx
<OverflowList.Overflow<Action>>
  {({ overflowItems }) => (
    <ActionMenu actions={overflowItems} />
  )}
</OverflowList.Overflow>
```

没有溢出时，render function 仍会执行，并收到空数组。完整测量期间，`overflowItems` 可能先得到候选结果，
随后再得到最终结果。render function 应保持为纯渲染，不应在 render 阶段产生外部副作用。

`Overflow` 不要求一定返回 Accessory，也可以用于渲染 Portal、更新无障碍描述或把数据交给其他组件。
但是，任何为了处理溢出而在 Root 常规流中占用空间的元素，都应通过 `Accessory` 注册，否则它不会被纳入
可靠的可用空间计算。

## Accessory

`OverflowList.Accessory` 声明只在至少一个 Item 溢出时展示的真实布局元素，例如更多按钮、计数器或
菜单 Trigger。

Accessory 可以有多个。它们具有相同的显示状态：要么全部不渲染，要么全部挂载并参与测量。组件根据所有
Accessory 的真实布局跨度为它们共同保留空间，不要求调用方预先声明固定宽度。

没有溢出时，Accessory 渲染为 `null`。检测到候选溢出后，它会先以测量状态挂载：组件强制设置
`visibility: hidden`、`pointer-events: none` 和 `aria-hidden="true"`，让元素参与真实布局但不被用户看到或
操作。测量完成后，同一个 Accessory 转为正常展示。

测量状态带有空值的 `data-overflow-list-measuring` attribute。正常展示时，该 attribute 不存在。
测量用的 `visibility` 和 `pointer-events` 会覆盖调用方传入的同名 inline style。

如果隐藏全部 Item 后，Accessory 仍然无法放入 Root，组件仍会保留 Accessory 展示。它不会继续隐藏
Accessory，也不会发出警告。

### Measuring A Trigger

当 Accessory 对应 Dropdown Trigger 时，应使用 `asChild` 把 ref 和测量属性连接到最终的 Trigger 元素：

```tsx
<DropdownMenu>
  <OverflowList.Accessory asChild>
    <DropdownMenu.Trigger asChild>
      <button type="button">More</button>
    </DropdownMenu.Trigger>
  </OverflowList.Accessory>

  <DropdownMenu.Content>{/* overflow items */}</DropdownMenu.Content>
</DropdownMenu>
```

Dropdown 根组件或 Provider 可以不产生 DOM，但 Accessory 最终连接到的 HTMLElement 必须是
OverflowList Root 的直接子节点。

## DOM Structure And As Child

Root 默认渲染 `div`，Item 和 Accessory 默认渲染 `span`。三者都基于 Radix Primitive，因此支持
`asChild`。使用 `asChild` 的组件必须把 ref 转发到唯一的 HTMLElement。

Item 与 Accessory 最终渲染出的 DOM 元素必须是 Root 的直接子节点。`Overflow` 没有 DOM，因此可以位于
JSX 结构中并返回 Context Provider、Dropdown Root 等不产生常规流 DOM 的组件。

如果 Root 也需要 `asChild`，应提供一个实际的根元素，再把 Item 和 Accessory 放在其中：

```tsx
<OverflowList asChild>
  <nav className="flex min-w-0 gap-2">
    <OverflowList.Item data={primary} asChild>
      <a href={primary.href}>{primary.label}</a>
    </OverflowList.Item>
    {/* other items and overflow renderer */}
  </nav>
</OverflowList>
```

不要在 Root 的常规流中混入未注册但会占用横向空间的直接子元素。固定标签、标题或其他始终可见的 UI，
推荐放在 OverflowList 外部，由外层 flex/grid 为 OverflowList 分配剩余宽度。

## Boundaries

- 只支持单行横向列表，不支持通过换行保留多行 Item。
- Item 和 Accessory 必须最终渲染为 Root 的直接 HTMLElement 子节点。
- 可见结果始终是 DOM 顺序前缀；组件不根据视觉位置或业务权重重新排序。
- `direction: ltr` 和 `direction: rtl` 都可以使用，但组件不读取 direction。DOM 顺序仍应表达操作优先级。
- `flex-direction: row-reverse`、CSS `order` 等视觉重排不会改变 Item 优先级，可能使被隐藏的一侧不符合预期。
- 推荐用容器 `gap` 表达间距。首尾 margin、绝对定位、transform、负 margin 和脱离常规流的内容不属于
  稳定测量模型。
- Item 应保持不可压缩，或者由调用方接受 Item 先收缩、再溢出的行为。
- 多个 Accessory 必须遵循共同显示、共同隐藏的语义；不支持按剩余空间分别省略 Accessory。
- Separator 暂未建模。Separator 的显示通常依赖相邻 Item 状态，应由业务渲染逻辑自行处理。
- 隐藏 Item 会卸载，不适合要求隐藏后仍保留内部状态或焦点的组件。
- 隐藏 Item 没有可观察的 DOM。如果只有隐藏 Item 因外部样式变化而缩小，组件无法自动知道它已经可以重新
  展示；可以改变对应 Item 的 `data`/key、改变 Root 尺寸或重新挂载列表来触发重新测量。

这些边界通过组件约定表达，不通过 computed style 分析、DOM 克隆或通用视觉顺序推断补偿。超出约定的布局
应使用更符合业务优先级和焦点语义的专用组件。

内部测量阶段、几何缓存、尺寸精度和调度策略记录在 [IMPLEMENTATION.md](./IMPLEMENTATION.md)。
