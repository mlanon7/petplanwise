# Lesson 08 — `querySelector` wires only the FIRST element; use `querySelectorAll`

**Date:** commits `eeb6736c` + `94cbb7cf` (dropdown fixes)
**Severity:** P2 — only the first nav dropdown worked; the rest were dead

## Symptom

The header has multiple dropdowns (Calculators, Breeds). Only **Calculators** opened/closed on click; Breeds did nothing.

## Root cause

The handler was wired with `document.querySelector(".nav-dropdown-toggle")`, which returns **only the first match.** Every other dropdown toggle had no listener.

## The fix

Iterate all matches with a factory:

```js
document.querySelectorAll(".nav-dropdown-toggle").forEach(function (toggle) {
  // attach click + keyboard handlers to THIS toggle / its sibling menu
});
```

## A related dropdown bug (same commits)

The dropdown menu used `top: calc(100% + 6px)`, leaving a **6px dead gap** between the toggle and the menu. Moving the mouse from button to menu crossed un-hovered space and the menu closed. Fixed with an invisible bridge: `.nav-dropdown::before { content:""; position:absolute; height:8px; ... }` spanning the gap so hover never breaks.

## Detection rule

Any time there are N of a thing (dropdowns, tabs, accordions, cards with buttons) and only one responds, you used `querySelector` where you needed `querySelectorAll`. Grep `layout-<V>.js` and self-contained pages for `querySelector(` on classes that appear multiple times.

## Forward-looking rule

For repeated interactive components, default to `querySelectorAll(...).forEach(...)` and scope state per-element. Reserve `querySelector` for genuinely unique IDs.
