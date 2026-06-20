## 2026-06-20 - Critical A11y Pattern: Icon-Only Close Buttons
**Learning:** Multiple key overlay and modal components in the application (ProjectModal, PortfolioLayout, ShareModal, EditorLayout) implemented icon-only close buttons without `aria-label` attributes, making them inaccessible to screen readers and difficult to navigate via keyboard due to missing `focus-visible` states.
**Action:** Always enforce `aria-label` attributes and explicit `focus-visible` styles for any icon-only button, especially for critical navigation and overlay controls.
