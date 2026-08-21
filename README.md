# Element Fit

English | [简体中文](./README.zh-CN.md)

[![Deploy Website](https://github.com/guanriyue/element-fit/actions/workflows/deploy-website.yml/badge.svg)](https://github.com/guanriyue/element-fit/actions/workflows/deploy-website.yml)

Adaptive layout components for React elements.

Element Fit helps interfaces respond to the actual space available to an element. Instead of mapping every layout decision to viewport breakpoints, components can adapt grids, content, actions, and input height from their own rendered environment.

[Documentation](https://guanriyue.github.io/element-fit/) · [简体中文](https://guanriyue.github.io/element-fit/zh/) · [Implementation](https://guanriyue.github.io/element-fit/implementation/) · [Lab](https://guanriyue.github.io/element-fit/lab/)

> Element Fit is under active development. APIs and measurement boundaries may change before the initial release. The documentation website reflects the current behavior.

## Components

| Component | Purpose |
| --- | --- |
| [FitGrid](https://guanriyue.github.io/element-fit/guide/fit-grid) | Uses CSS Grid to derive the column count from each item's minimum usable width. |
| [CompactGrid](https://guanriyue.github.io/element-fit/guide/compact-grid) | Moves extra content into the last valid slot when an adaptive Grid becomes compact. |
| [FitSwitch](https://guanriyue.github.io/element-fit/guide/fit-switch) | Selects between complete expanded and collapsed views according to available width. |
| [InlineOverflow](https://guanriyue.github.io/element-fit/guide/inline-overflow) | Detects horizontal overflow in single-line content with subpixel boundary correction. |
| [LineClamp](https://guanriyue.github.io/element-fit/guide/line-clamp) | Limits multiline inline content and renders a custom suffix only when content overflows. |
| [OverflowList](https://guanriyue.github.io/element-fit/guide/overflow-list) | Keeps a continuous prefix of actions visible and passes trailing action data to a custom overflow renderer. |
| [Textarea](https://guanriyue.github.io/element-fit/guide/textarea) | Preserves native textarea behavior while adapting height to content, width, and row limits. |

## Design principles

- **Element-scoped adaptation** — layout decisions follow the space assigned to a component, including sidebars, dialogs, cards, and nested panels.
- **Browser-native layout** — CSS handles the layout whenever it can express the complete behavior; JavaScript measurement is used for state that CSS does not expose.
- **Composable behavior** — components provide layout state and structural primitives without prescribing a design system, menu implementation, Tooltip, or animation style.
- **Explicit measurement boundaries** — each component documents which boxes, content changes, and DOM relationships form its stable measurement model.
- **Coordinated layout work** — shared scheduling batches DOM reads and writes and prioritizes work near the viewport when many instances update together.

## Example

```tsx
import { FitGrid } from '@guanriyue/react-fit/fit-grid';

function Settings() {
  return (
    <FitGrid minItemWidth="14rem" maxColumns={3} colGap="1rem" rowGap="1rem">
      <ProfileField />
      <LocaleField />
      <NotificationField />

      <FitGrid.Item pin="row-end">
        <button type="submit">Save</button>
      </FitGrid.Item>
    </FitGrid>
  );
}
```

FitGrid is entirely CSS-driven. Components that expose overflow or switch rendered structure use browser geometry and observation APIs; their constraints and update behavior are documented individually.

## Repository structure

```text
packages/
  react-fit/               React layout and measurement components
  measure-inline-overflow/ Framework-agnostic single-line overflow measurement
  resize-observer-hub/     Shared ResizeObserver infrastructure
website/                   Documentation, interactive examples, and stress tests
```

The [Implementation](https://guanriyue.github.io/element-fit/implementation/) section explains the browser-level techniques used by the project, including Range geometry, DOM mirror measurement, style invalidation, staged layout tasks, and viewport-priority scheduling.

The [Lab](https://guanriyue.github.io/element-fit/lab/) contains high-instance-count stress tests, continuous resize scenarios, and experimental implementations. Its results are intended for observation rather than as fixed performance benchmarks.

## Development

Element Fit uses Node.js 22.13 or newer and pnpm 11.9.

```bash
pnpm install
pnpm --filter website dev
```

Repository checks are available from the workspace root:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

## License

[MIT](./LICENSE)
