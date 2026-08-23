# @guanriyue/measure-inline-overflow

English | [简体中文](./README.zh-CN.md)

`measure-inline-overflow` provides a synchronous, framework-agnostic DOM utility for detecting single-line horizontal overflow.

The usual `scrollWidth > clientWidth` check works in most cases, but both values are exposed as integers. Content may cross a subpixel boundary while JavaScript still reports equal dimensions. This package keeps integer scroll geometry as its fast path and uses the Range API when the result enters a one-pixel low-confidence boundary.

## Usage

```ts
import { measureInlineOverflow } from '@guanriyue/measure-inline-overflow';

const overflow = measureInlineOverflow(element);
```

Without options, the element provides both the rendered content and its available space. The fast path compares `scrollWidth` with `clientWidth`. The Range fallback compares the selected content width with the element's content-box width, so inline padding keeps the same box-model meaning in both paths.

### Available Width

Pass `availableWidth` when the available content-box width comes from another element or has already been provided by a layout API:

```ts
const overflow = measureInlineOverflow(element, {
  availableWidth: resizeObserverEntry.contentBoxSize[0].inlineSize,
});
```

`availableWidth` must be a finite, non-negative number expressed in untransformed CSS pixels. It represents the content-box width available to the rendered content. The function removes the element's inline padding before comparing its scroll width with this value.

An element's `scrollWidth` is never smaller than its own scroll viewport. When `availableWidth` is narrower than the element's current content box, that minimum cannot describe how wide the selected content actually is. The default measurement therefore reads Range geometry directly in this case.

`availableWidth` changes the comparison threshold; it does not relayout the element. Range reads the DOM in its current rendered state. Measuring how the same subtree would lay out under a different width requires the caller to establish that layout first or use a separate measurement tree.

### Skip Range Fallback

The Range fallback is enabled by default. It can be skipped when only integer scroll geometry is desired:

```ts
const overflow = measureInlineOverflow(element, {
  disableRangeFallback: true,
});
```

Disabling Range also removes the direct Range path used when `availableWidth` is narrower than the element's current content box. The result then comes only from normalized `scrollWidth`, including its integer precision and scroll-viewport minimum.

## API

### `measureInlineOverflow(element, options?)`

Returns `true` when the measured content exceeds its available width.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `element` | `HTMLElement` | — | The element whose currently rendered contents are measured. |
| `options.availableWidth` | `number` | Element content-box width | Available content-box width in untransformed CSS pixels. |
| `options.disableRangeFallback` | `boolean` | `false` | Skips Range geometry and uses integer scroll geometry only. |

## Measurement

When the element provides its own available width, the initial comparison is:

```ts
element.scrollWidth - element.clientWidth;
```

When `availableWidth` is provided, inline padding is removed from `scrollWidth` before the comparison. If the supplied width is narrower than the element's current content box, the default path proceeds directly to Range because `scrollWidth` is bounded by the current scroll viewport.

The integer comparison uses the following decision boundary:

```text
difference >= 1   -> overflow
difference <= -1  -> fits
-1 < difference < 1 -> Range fallback
```

The `1px` value only identifies results whose integer precision is insufficient. It is not an overflow tolerance. The Range result uses a strict comparison:

```ts
range.getBoundingClientRect().width > availableWidth;
```

Range can measure text, elements, and mixed content in a regular single-line flow. It reads the layout that the browser has already produced and does not clone, mount, or remove temporary nodes. Geometry reads may still require a synchronous layout update, so the function should run during an intentional measurement phase.

## Boundaries

- Only horizontal writing mode is currently supported.
- The function does not observe size or content changes. Callers decide when to measure again.
- `availableWidth` uses layout CSS pixels. CSS transforms are outside the reliable Range fallback scope because Range rectangles use transformed viewport coordinates.
- A Range bounding rect is not the intrinsic width of an arbitrary DOM subtree.
- `availableWidth` does not cause counterfactual layout under a different width.
- Margins, pseudo-elements, positioning, transforms, and multiline layouts are outside the reliable Range fallback scope.
- A caller-provided `availableWidth` is not checked for freshness against the current layout.
- Browser version, operating system fonts, and zoom settings may affect measurements near the boundary.

## Related Discussions

- [CSSWG issue #4123: It should be detectable whether an element ellipsized the text](https://github.com/w3c/csswg-drafts/issues/4123) discusses cases where ellipsis is visible but rounding leaves `scrollWidth`, `clientWidth`, or DOMRect values equal.
- [Stack Overflow: Wrong ellipsis detection with scrollWidth when text length is close to width](https://stackoverflow.com/questions/71440290/wrong-elipsis-detection-with-scrollwidth-when-text-length-is-close-to-width) presents an alternative that clones the content, inserts a hidden node, measures it, and removes it, while noting the cost of the extra DOM operations.
- [Chromium issue 41468858](https://issues.chromium.org/issues/41468858) tracks related discussion for Chromium.
- [Mozilla bug 1250824: Scroll Width wrong on element with overflow:hidden + text-overflow: ellipsis](https://bugzilla.mozilla.org/show_bug.cgi?id=1250824) records a related `scrollWidth` and ellipsis issue in Firefox.
