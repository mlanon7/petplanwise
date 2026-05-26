# Lesson 07 — `backdrop-filter` creates a stacking context that traps the mobile nav

**Date:** commit `75248bca` ("Fix mobile nav unclickable bug: escape header stacking context")
**Severity:** P1 — mobile menu items appeared greyed-out and unclickable

## Symptom

On phones, the open nav menu looked dimmed and **wouldn't accept taps** — items seemed "greyed out." Desktop was fine.

## Root cause

The sticky header had `backdrop-filter: blur(10px)`. **Any element with `backdrop-filter` (or `filter`, `transform`, `will-change`, `contain`, `perspective`) creates a new CSS stacking context.** The nav lived inside the header (`z-index: 100` *within* the header, which itself was `z-index: 50`). The full-screen mobile backdrop overlay was appended at `z-index: 99` at the body level. Because the nav was trapped inside the header's stacking context, its `z-index: 100` was only relative to the header — it could not rise above the body-level backdrop. The backdrop sat on top of the nav and ate the taps.

## The fix

On menu open, **move the nav element out to `document.body`** (so it escapes the header's stacking context), and restore it to the header on close. Done in `layout-<V>.js`.

## Detection rule

If a high-`z-index` element is visually covered by a lower-`z-index` one, look up the ancestor chain for `backdrop-filter` / `filter` / `transform` / `will-change`. A stacking context on an ancestor caps the child's effective z-index. `z-index` only competes **within the same stacking context.**

## Forward-looking rule

Overlays, modals, slide-in panels, and dropdowns that must sit above everything should be portaled to `document.body`, not nested inside a blurred/transformed header. When adding `backdrop-filter` to any container, check what lives inside it.
