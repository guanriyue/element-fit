# FitList

`FitList` 用于在同一组列表项中切换完整内容和紧凑内容。空间足够时，每个 Item 展示
`Expanded`；空间不足时，同一批 Item 切换为 `Compact`。

Item 始终使用同一个 DOM 元素，`Expanded` 和 `Compact` 也保持挂载。它适合 Tabs、导航和操作列表等
需要保留 Item 焦点、内部状态和元素身份的场景。

## Import

```tsx
import { FitList } from '@guanriyue/react-fit/fit-list';
```

## Basic Example

```tsx
const actions = [
  { id: 'overview', label: 'Business overview', shortLabel: 'Overview', icon: HomeIcon },
  { id: 'reports', label: 'Data analysis reports', shortLabel: 'Reports', icon: ChartIcon },
  { id: 'settings', label: 'Team preferences', shortLabel: 'Settings', icon: SettingsIcon },
];

function ActionList() {
  return (
    <FitList className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <FitList.Item key={action.id} className="shrink-0">
            <button
              type="button"
              aria-label={action.label}
              className="inline-flex items-center gap-1"
            >
              <Icon aria-hidden="true" />

              <FitList.Expanded className="data-inactive:hidden">
                {action.label}
              </FitList.Expanded>

              <FitList.Compact className="data-inactive:hidden">
                {action.shortLabel}
              </FitList.Compact>
            </button>
          </FitList.Item>
        );
      })}
    </FitList>
  );
}
```

Root、Item、Expanded 和 Compact 不提供布局或隐藏样式。调用方需要建立单行布局，并根据
`data-inactive` 决定非当前内容的表现。

如果紧凑形态只需要保留 Item 中始终存在的图标，可以省略 `Compact`：

```tsx
<FitList.Item className="shrink-0">
  <button type="button" aria-label={label}>
    <Icon aria-hidden="true" />
    <FitList.Expanded className="data-inactive:hidden">
      {label}
    </FitList.Expanded>
  </button>
</FitList.Item>
```

## Inactive Content

`Expanded` 在 compact 模式下带有空值的 `data-inactive` attribute；`Compact` 在 expanded 模式下
带有相同 attribute。当前生效的内容不带状态 attribute。

```tsx
<FitList.Expanded className="data-inactive:hidden">
  Full title
</FitList.Expanded>

<FitList.Compact className="data-inactive:hidden">
  Short title
</FitList.Compact>
```

`data-inactive` 只表达内容当前不生效，不等价于 `hidden`、`inert` 或 `aria-hidden`。调用方可以使用
`display: none`，也可以让 inactive 内容脱离常规流并保持可测量。组件不会自动管理 inactive 内容中可聚焦
元素的交互状态。

测量期间，Root 会短暂带有空值的 `data-measuring` attribute。需要时可以使用它关闭尺寸 transition，避免
过渡中的布局影响测量结果。

## API Reference

### Root

包含全部 Item，默认渲染为 `div`。Root 的 content box 表示列表可以使用的宽度。

```tsx
<FitList>
  {/* Item */}
</FitList>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `asChild` | `boolean` | `false` |

除 `asChild` 外，还支持 `React.ComponentPropsWithoutRef<typeof Primitive.div>` 中的原生属性。

#### Data attributes

| Attribute | Value | Condition |
| --- | --- | --- |
| `data-measuring` | `""` | 正在测量 expanded 布局时存在 |

### Item

声明一个始终保留的列表项，默认渲染为 `span`。Item 必须最终成为 Root 的直接 DOM 子节点。

```tsx
<FitList.Item>
  <button type="button">Item content</button>
</FitList.Item>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `asChild` | `boolean` | `false` |

除 `asChild` 外，还支持 `React.ComponentPropsWithoutRef<typeof Primitive.span>` 中的原生属性。

Item 没有状态 attribute。expanded 和 compact 切换不会卸载 Item，也不会替换它的 DOM 元素。

### Expanded

声明空间足够时生效的内容，默认渲染为 `span`。Expanded 应位于对应 Item 内部，一个 Item 可以包含多个
Expanded。

```tsx
<FitList.Expanded className="data-inactive:hidden">
  Full title
</FitList.Expanded>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `asChild` | `boolean` | `false` |

除 `asChild` 外，还支持 `React.ComponentPropsWithoutRef<typeof Primitive.span>` 中的原生属性。

#### Data attributes

| Attribute | Value | Condition |
| --- | --- | --- |
| `data-inactive` | `""` | 当前处于 compact 模式 |

### Compact

声明 Expanded 放不下时生效的内容，默认渲染为 `span`。Compact 应位于对应 Item 内部，一个 Item 可以包含
多个 Compact，也可以完全省略 Compact。

```tsx
<FitList.Compact className="data-inactive:hidden">
  Short title
</FitList.Compact>
```

#### Props

| Prop | Type | Default |
| --- | --- | --- |
| `asChild` | `boolean` | `false` |

除 `asChild` 外，还支持 `React.ComponentPropsWithoutRef<typeof Primitive.span>` 中的原生属性。

#### Data attributes

| Attribute | Value | Condition |
| --- | --- | --- |
| `data-inactive` | `""` | 当前处于 expanded 模式 |

## Mode Selection

FitList 判断全部 Expanded 内容能否放入 Root。Expanded 能放下时使用 expanded 模式，否则使用 compact
模式。所有 Item 共享同一个 mode，不会单独折叠其中一部分 Item。

Compact 是最终回退形态。如果全部 Compact 内容仍然超过 Root，组件会保持 compact，不会继续隐藏 Item、
切换第三种形态或发出警告。首次可信测量完成前使用 expanded 模式。

## As Child

Root、Item、Expanded 和 Compact 都支持 `asChild`。只有在需要移除默认包装节点或把状态连接到已有组件时
才需要使用它。唯一 child 必须把 ref 转发到最终 HTMLElement。

## Boundaries

- 只支持单行横向布局，不支持通过换行建立多行回退。
- Item 必须是 Root 的直接 DOM 子节点，Expanded 和 Compact 应位于对应 Item 的 DOM subtree 中。
- Item 应保持不可压缩，例如使用 `flex-shrink: 0`。如果 Item 或 Expanded 先被压缩，组件测得的是压缩后的
  布局，而不是完整内容所需宽度。
- Compact 必须由调用方设计为可接受的最终形态；组件不验证 Compact 是否能够放下。
- `data-inactive` 不提供默认隐藏、焦点或无障碍行为。inactive 内容中存在交互元素时，调用方必须确保它不会
  被用户看到、点击或聚焦。
- 只修改外部样式表且没有引起 Root 或可见 Item 尺寸变化时，不保证组件能够知道隐藏的 Expanded 已经改变宽度。
- 多行内容、复杂 transform、负 margin、脱离预期常规流的布局和伪元素尺寸不属于可靠测量范围。
- `asChild` 会把 `data-inactive` 连接到最终 child；该 child 不应同时把同名 attribute 用作其他独立状态。
- 当前不提供受控 mode、默认 mode、手动 remeasure 或 mode change callback。
