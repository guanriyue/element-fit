# Element Fit

[English](./README.md) | 简体中文

[![部署 Website](https://github.com/guanriyue/element-fit/actions/workflows/deploy-website.yml/badge.svg)](https://github.com/guanriyue/element-fit/actions/workflows/deploy-website.yml)

面向 React 元素的自适应布局组件。

Element Fit 帮助界面根据元素自身的实际可用空间作出响应。开发者不必先把每一项布局决策映射到视窗断点，而可以让网格、内容、操作区和输入框高度根据它们所在元素的渲染环境进行调整。

[文档](https://guanriyue.github.io/element-fit/zh/) · [English](https://guanriyue.github.io/element-fit/) · [实现原理](https://guanriyue.github.io/element-fit/zh/implementation/) · [实验室](https://guanriyue.github.io/element-fit/zh/lab/)

> Element Fit 正在持续开发中。在首个正式版本发布前，API 和测量边界仍可能发生变化。文档网站记录当前实现的实际行为。

## 组件

| 组件 | 用途 |
| --- | --- |
| [FitGrid](https://guanriyue.github.io/element-fit/zh/guide/fit-grid) | 根据每个 Item 的最小可用宽度，使用 CSS Grid 自动调整列数。 |
| [CompactGrid](https://guanriyue.github.io/element-fit/zh/guide/compact-grid) | 自适应 Grid 进入紧凑状态时，把额外内容移动到最后一个有效插槽。 |
| [FitSwitch](https://guanriyue.github.io/element-fit/zh/guide/fit-switch) | 根据可用宽度，在完整的 Expanded 和 Collapsed 视图之间切换。 |
| [InlineOverflow](https://guanriyue.github.io/element-fit/zh/guide/inline-overflow) | 判断单行内容是否发生横向溢出，并对亚像素临界值进行校正。 |
| [LineClamp](https://guanriyue.github.io/element-fit/zh/guide/line-clamp) | 限制多行 inline 内容，并只在内容溢出时渲染自定义 Suffix。 |
| [OverflowList](https://guanriyue.github.io/element-fit/zh/guide/overflow-list) | 保留连续的前部操作，并把尾部操作数据交给自定义溢出渲染器。 |
| [Textarea](https://guanriyue.github.io/element-fit/zh/guide/textarea) | 保留原生 textarea 行为，并根据内容、宽度和行数限制调整高度。 |

## 设计原则

- **以元素为响应范围**：布局决策跟随组件实际获得的空间，适用于侧边栏、对话框、卡片和嵌套面板等不同容器。
- **使用浏览器原生布局能力**：CSS 能完整表达的布局直接交给 CSS；只有 CSS 没有暴露所需状态时才使用 JavaScript 测量。
- **保持组合能力**：组件提供布局状态和结构原语，不预设设计系统、菜单实现、Tooltip 或动画样式。
- **明确测量边界**：每个组件都会说明哪些盒模型、内容变化和 DOM 关系构成稳定的测量模型。
- **协调布局任务**：共享调度机制批量执行 DOM 读取和写入；大量实例同时更新时，优先处理视窗附近的任务。

## 示例

```tsx
import { FitGrid } from '@guanriyue/react-fit/fit-grid';

function Settings() {
  return (
    <FitGrid minItemWidth="14rem" maxColumns={3} colGap="1rem" rowGap="1rem">
      <ProfileField />
      <LocaleField />
      <NotificationField />

      <FitGrid.Item pin="row-end">
        <button type="submit">保存</button>
      </FitGrid.Item>
    </FitGrid>
  );
}
```

FitGrid 完全由 CSS 驱动。需要暴露 overflow 状态或切换渲染结构的组件会使用浏览器几何与观察 API；对应的约束和更新行为记录在各自的组件文档中。

## 仓库结构

```text
packages/
  react-fit/               React 布局与测量组件
  measure-inline-overflow/ 与框架无关的单行溢出测量工具
  resize-observer-hub/     共享 ResizeObserver 基础设施
website/                   文档、交互示例和压力测试
```

[实现原理](https://guanriyue.github.io/element-fit/zh/implementation/)记录项目使用的浏览器底层技术，包括 Range 几何测量、DOM 镜像测量、样式失效、分阶段布局任务和视窗优先级调度。

[实验室](https://guanriyue.github.io/element-fit/zh/lab/)包含大量实例压力测试、连续 Resize 场景和实验性实现。实验结果用于观察，不代表固定的性能基准。

## 本地开发

Element Fit 要求 Node.js 22.13 或更高版本，并使用 pnpm 11.9。

```bash
pnpm install
pnpm --filter website dev
```

在工作区根目录可以运行以下检查：

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

## 许可证

[MIT](./LICENSE)
