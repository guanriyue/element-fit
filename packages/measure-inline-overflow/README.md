# @guanriyue/measure-inline-overflow

English | [简体中文](./README.zh-CN.md)

`measure-inline-overflow` provides a synchronous, framework-agnostic DOM utility for detecting single-line horizontal overflow.

The usual `scrollWidth > clientWidth` check works in most cases, but browser-exposed dimensions may be rounded to integers. At the exact boundary where `text-overflow: ellipsis` appears, some content may already be hidden while JavaScript still reports equal `scrollWidth` and available width values.

This package keeps the regular dimension comparison as its fast path and uses the Range API for a higher-precision fallback when both dimensions are strictly equal.

## Usage

```ts
import { measureInlineOverflow } from '@guanriyue/measure-inline-overflow';

const overflow = measureInlineOverflow(contentElement);
```

By default, the available width comes from the Content element's `clientWidth`.

### Container

Pass a `container` when another element defines the space available to Content:

```ts
const overflow = measureInlineOverflow(contentElement, {
  container: rootElement,
});
```

The function uses the Container's `clientWidth` and subtracts `padding-inline-start` and `padding-inline-end` to obtain its content box width.

### Known Width

If ResizeObserver or another layout system already provides the available width, pass it directly to avoid another computed-style read:

```ts
const overflow = measureInlineOverflow(contentElement, {
  container: rootElement,
  availableWidth: resizeObserverEntry.contentBoxSize[0].inlineSize,
});
```

`availableWidth` takes precedence over `container`. When neither option is provided, the function uses Content's own `clientWidth`.

### Skip Range Fallback

The Range fallback is enabled by default. It can be skipped when comparing the regular algorithm or investigating browser differences:

```ts
const overflow = measureInlineOverflow(contentElement, {
  skipRangeFallback: true,
});
```

## Measurement

The function first compares Content's `scrollWidth` with the resolved available width:

```text
scrollWidth > availableWidth  -> true
scrollWidth < availableWidth  -> false
scrollWidth = availableWidth  -> Range fallback
```

When both dimensions are strictly equal, Content is not empty, and `skipRangeFallback` is not set, the function selects all Content descendants and compares `range.getBoundingClientRect().width` with the available width.

Range can measure text, elements, and mixed content in a regular single-line flow. Unlike approaches that clone a node, insert it into the document, measure it, and then remove it, Range does not mutate the DOM or introduce rendering work caused by mounting a temporary node. Reading DOM geometry may still require the browser to synchronously update layout, so call this function during an intentional measurement phase.

## Boundaries

- Only horizontal writing mode is currently supported.
- The function does not observe size or content changes. Callers decide when to measure again.
- A Range bounding rect is not the intrinsic width of an arbitrary DOM subtree.
- Margins, pseudo-elements, positioning, transforms, and multiline layouts are outside the reliable scope of the Range fallback.
- Differences caused by Content padding across measurement models are not handled separately yet.
- When supplied by the caller, `availableWidth` is not checked for freshness against the current layout.
- Browser version, operating system fonts, and zoom settings may affect measurements near the boundary.

## Related Discussions

- [CSSWG issue #4123: It should be detectable whether an element ellipsized the text](https://github.com/w3c/csswg-drafts/issues/4123) discusses cases where ellipsis is visible but rounding leaves `scrollWidth`, `clientWidth`, or DOMRect values equal.
- [Stack Overflow: Wrong ellipsis detection with scrollWidth when text length is close to width](https://stackoverflow.com/questions/71440290/wrong-elipsis-detection-with-scrollwidth-when-text-length-is-close-to-width) presents an alternative that clones the content, inserts a hidden node, measures it, and removes it, while noting the cost of the extra DOM operations.
- [Chromium issue 41468858](https://issues.chromium.org/issues/41468858) tracks related discussion for Chromium.
- [Mozilla bug 1250824: Scroll Width wrong on element with overflow:hidden + text-overflow: ellipsis](https://bugzilla.mozilla.org/show_bug.cgi?id=1250824) records a related `scrollWidth` and ellipsis issue in Firefox.

## Status

A public demo and a complete test suite are not available yet.
