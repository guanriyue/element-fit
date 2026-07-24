# Textarea

`Textarea` 在原生 `<textarea>` 的基础上提供可选的自动高度能力。未启用 `autoSize` 时，组件保持
原生 textarea 的尺寸行为；启用后，组件根据内容和可用宽度计算高度。滚动、裁切和 resize 策略由调用方
通过 CSS 控制。

## Import

```tsx
import { Textarea } from '@guanriyue/react-fit/textarea';
```

## 简单示例

```tsx
<Textarea autoSize />
```

限制自动伸缩的行数范围：

```tsx
<Textarea autoSize={{ minRows: 2, maxRows: 6 }} />
```

`minRows` 和 `maxRows` 只接受正整数。两者同时存在且 `maxRows` 小于 `minRows` 时，组件会把
`maxRows` 收敛到 `minRows`。

达到 `maxRows` 后，高度不再继续增长。组件不会修改 `overflowY`；需要保留纵向滚动时，应由调用方设置
`overflow-y: auto`。

```tsx
<Textarea
  autoSize={{ minRows: 2, maxRows: 6 }}
  style={{ overflowY: 'auto' }}
/>
```

## rows

`rows` 在自动高度模式下可以作为最低行数：

- 未启用 `autoSize` 时，`rows` 保持原生语义。
- 启用 `autoSize` 且没有设置 `minRows` 时，有效的 `rows` 作为最低行数。
- 同时设置 `rows` 和 `minRows` 时，以 `minRows` 为准。

```tsx
<Textarea autoSize rows={3} />
```

## 受控与非受控

`Textarea` 保留原生的 `value`、`defaultValue` 和 `onChange` 接口。

受控模式下，组件在 `value` 变化后重新测量：

```tsx
const [value, setValue] = useState('');

<Textarea
  autoSize={{ minRows: 2, maxRows: 8 }}
  value={value}
  onChange={(event) => {
    setValue(event.target.value);
  }}
/>
```

非受控模式下，用户输入会直接调度重新测量：

```tsx
<Textarea autoSize defaultValue="初始内容" />
```

## 测量策略

自动高度使用隐藏的 mirror textarea 复现原始节点的文本排版。测量过程会读取原始节点的内容、宽度和
相关 computed style，把它们应用到 mirror，再通过 `scrollHeight` 计算自然高度和行数约束。

多个 Textarea 的测量通过共享 layout task 批量执行，阶段顺序为：

1. 读取所有原始 Textarea 的布局和计算样式。
2. 创建或更新 mirror，并通过共享 `DocumentFragment` 批量挂载新增节点。
3. 读取所有 mirror 的布局尺寸。
4. 提交各个 Textarea 的高度和 overflow 状态。

不同节点的读取和写入不会按照 `read → write → read → write` 交替执行。短时间内重复测量同一个
Textarea 时，尚未完成的旧请求会失效，只提交与当前元素和配置匹配的结果。测量完成后的 mirror 会被
短暂保留，以便连续输入或 Resize 时复用。

## Resize 观察

Textarea 使用 `ResizeObserver` 的 `border-box` 模式观察节点，从 entry 中读取 content-box width。
border-box 观察确保边框盒变化能够产生通知，content-box width 则表示文本实际可使用的横向排版空间。

当 content-box width 变化时，组件重新测量文本换行和高度。只改变高度但不改变 content-box width 时，
不会重复执行 mirror 测量。

## 重新测量

启用自动高度后，组件会在以下情况调度测量：

- `value`、`defaultValue`、`autoSize`、`minRows`、`maxRows` 或有效最低行数变化。
- 用户在非受控 Textarea 中输入内容。
- Textarea 的 content-box width 发生变化。
- `class`、`cols`、`dir`、`id`、`lang`、`placeholder`、`rows` 或 `wrap` 属性变化。
- React `style` prop 的内容变化。

## 视窗优先级调度

Textarea 使用包级的[视窗优先级测量调度](../../README.md#视窗优先级测量调度)。优先级采样元素是
Textarea 自身，垂直方向的 near margin 为一屏高度，水平方向不额外扩展视窗范围。

near 任务优先进入共享 Textarea layout task；far 任务通过 idle batch 分批进入相同的测量流程。该机制
只改变任务执行时机，不改变高度计算方式和最终结果。

## 样式行为

启用 `autoSize` 且完成首次测量后，组件只会在调用方 `style` 之后写入测量得到的 `height`。
`overflowY`、`resize` 和其他原生属性、事件及样式继续由调用方控制。

未启用 `autoSize` 或切换回 `autoSize={false}` 时，组件不再接管 `height`，恢复调用方提供的样式和
原生 textarea 尺寸行为。无论是否启用自动高度，组件都不会根据 `maxRows` 修改 overflow 样式。

```css
.textarea-scroll {
  overflow-y: auto;
}

.textarea-clip {
  overflow-y: clip;
}
```

自动高度模式下，手动拖动纵向 resize 手柄得到的高度可能在下一次测量时被覆盖。需要稳定的自动高度
界面时，可以设置 `resize: none`，或者只允许横向 resize。
