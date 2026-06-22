## 2024-06-22 - [Avoid repeated sorting on re-renders]
**Learning:** Components that handle complex visual states (like `PortfolioLayout` with `scrolled`, `contactOpen`) re-render frequently. Synchronously sorting arrays and finding elements on every re-render is a performance anti-pattern that can block the main thread and cause jank.
**Action:** Always wrap expensive operations like `.sort()` and `.find()` over arrays in `useMemo`, ensuring they only run when their underlying data changes.
