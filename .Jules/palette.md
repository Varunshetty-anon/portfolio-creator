## 2024-05-18 - Added ARIA labels to Close Modals
**Learning:** Found multiple instances where close modal buttons (`<X />` icon or text like '✕ CLOSE') were missing ARIA labels, rendering them inaccessible or confusing to screen reader users. This seems to be a common pattern in the app's modal/overlay components.
**Action:** When implementing or reviewing modal/overlay components, always ensure that close actions (both mobile and desktop variants) include an explicit `aria-label="Close modal"` (or similar appropriate description) attribute on the `<button>` element.
