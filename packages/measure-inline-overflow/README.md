# @guanriyue/measure-inline-overflow

English | [简体中文](./README.zh-CN.md)

`measure-inline-overflow` provides a synchronous, framework-agnostic DOM utility for detecting single-line horizontal overflow.

The usual `scrollWidth > clientWidth` check works in most cases, but browser-exposed dimensions may be rounded to integers. At the exact boundary where `text-overflow: ellipsis` appears, some content may already be hidden while JavaScript still reports equal `scrollWidth` and available width values.

This package keeps the regular dimension comparison as its fast path and uses the Range API for a higher-precision fallback when the result enters the one-pixel integer precision boundary.

## Usage

```ts
import { measureInlineOverflow } from '@guanriyue/measure-inline-overflow';

const overflow = measureInlineOverflow(contentElement);
```

By default, Content is also the Container. The fast path compares Content's `scrollWidth` with its `clientWidth`, while the Range fallback uses Content's content-box width. Both paths therefore keep the same box-model semantics when Content itself has inline padding.

### Container

Pass a `container` when another element defines the space available to Content:

```ts
const overflow = measureInlineOverflow(contentElement, {
  container: rootElement,
});
```

The function uses the Container's `clientWidth` and subtracts `padding-inline-start` and `padding-inline-end` to obtain its content-box width. Explicitly passing `container: contentElement` has the same semantics as omitting `container`.

### Known Width

If ResizeObserver or another layout system already provides the available width, pass it directly to avoid another computed-style read:

```ts
const overflow = measureInlineOverflow(contentElement, {
  container: rootElement,
  containerContentBoxWidth: resizeObserverEntry.contentBoxSize[0].inlineSize,
});
```

`containerContentBoxWidth` must be a finite, non-negative number describing the resolved Container's content-box width. Container still determines whether Content clips itself or receives its available space from a separate element, so these two options do not override one another.

### Skip Range Fallback

The Range fallback is enabled by default. It can be skipped when comparing the regular algorithm or investigating browser differences:

```ts
const overflow = measureInlineOverflow(contentElement, {
  disableRangeFallback: true,
});
```

When the Range fallback is disabled, the function directly evaluates `scrollWidth > availableWidth` and does not apply the one-pixel precision boundary. The `1px` boundary only decides when Range takes over; it is not an epsilon for the regular comparison.

## Measurement

The function first compares Content's `scrollWidth` with the resolved available width:

```text
scrollWidth - availableWidth >= 1  -> true
scrollWidth - availableWidth <= -1 -> false
-1 < difference < 1               -> Range fallback
```

When the result is within the boundary, Content is not empty, and `disableRangeFallback` is not set, the function selects all Content descendants and compares `range.getBoundingClientRect().width` with the Container's content-box width. This boundary also covers rounding differences when an integer `scrollWidth` is compared with a fractional ResizeObserver width.

Range can measure text, elements, and mixed content in a regular single-line flow. Unlike approaches that clone a node, insert it into the document, measure it, and then remove it, Range does not mutate the DOM or introduce rendering work caused by mounting a temporary node. Reading DOM geometry may still require the browser to synchronously update layout, so call this function during an intentional measurement phase.

## Boundaries

- Only horizontal writing mode is currently supported.
- The function does not observe size or content changes. Callers decide when to measure again.
- A Range bounding rect is not the intrinsic width of an arbitrary DOM subtree.
- Margins, pseudo-elements, positioning, transforms, and multiline layouts are outside the reliable scope of the Range fallback.
- When Content and Container are separate elements, Content's own padding, border, and margin are not normalized separately. Content should represent the actual content width that must fit in the Container's content box.
- When supplied by the caller, `containerContentBoxWidth` is not checked for freshness against the current Container layout.
- Browser version, operating system fonts, and zoom settings may affect measurements near the boundary.

## Related Discussions

- [CSSWG issue #4123: It should be detectable whether an element ellipsized the text](https://github.com/w3c/csswg-drafts/issues/4123) discusses cases where ellipsis is visible but rounding leaves `scrollWidth`, `clientWidth`, or DOMRect values equal.
- [Stack Overflow: Wrong ellipsis detection with scrollWidth when text length is close to width](https://stackoverflow.com/questions/71440290/wrong-elipsis-detection-with-scrollwidth-when-text-length-is-close-to-width) presents an alternative that clones the content, inserts a hidden node, measures it, and removes it, while noting the cost of the extra DOM operations.
- [Chromium issue 41468858](https://issues.chromium.org/issues/41468858) tracks related discussion for Chromium.
- [Mozilla bug 1250824: Scroll Width wrong on element with overflow:hidden + text-overflow: ellipsis](https://bugzilla.mozilla.org/show_bug.cgi?id=1250824) records a related `scrollWidth` and ellipsis issue in Firefox.
