# Lesson 03 — `$` in a `String.replace` replacement is a backreference

**Date:** commit `bb77699d` (the "price" keyword sweep)
**Severity:** P1 — mangled output written to all 71 breed pages

## What happened

The price-keyword sweep inserted a chip like `💵 Price: $800–$3,500` into every breed page using `html.replace(regex, replacementString)` where the replacement string contained dollar amounts. The output came out mangled — e.g. `💵 Price: <div...>,500` — and we had to `git checkout HEAD -- breeds/` and redo it.

## Root cause

In JavaScript `String.prototype.replace`, the **replacement string** gives special meaning to `$`:
- `$1`, `$2` … = capture groups
- `$&` = whole match
- `$\`` / `$'` = before/after

So a replacement string containing `$1,500` was interpreted as "capture group 1" + `,500`. The dollar amounts got eaten.

## The fix

Use a **replacement function** instead of a string — function return values are inserted literally, with no `$` interpretation:

```js
html = html.replace(/(<div class="breed-snapshot-chips"[^>]*>\s*)/, function (m) {
  return m + chip + "\n      ";   // chip contains "$800–$3,500" safely
});
```

(Alternative: escape `$` → `$$` in the replacement string, but the function form is clearer and harder to get wrong.)

## Detection rule

Any time a `.replace()` replacement contains user/data text with `$` (money is everywhere on this site), use the **function form**. If you see `$`-digit garbage in generated HTML, this is why.

## Forward-looking rule

Generators that splice dollar values (`add-price-keyword.js`, `add-condition-guides.js`) must use replacement functions for any insertion that carries a price. Grep new generator scripts for `.replace(.*,\s*["'\`]` with `$` in the replacement before running them at scale.
