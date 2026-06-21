## 2024-05-18 - Missing ARIA labels in icon-only buttons
**Learning:** Found that multiple critical interaction elements (like password visibility toggles and modal close/navigation buttons) in the design system rely solely on SVG icons without accessible names, causing poor experiences for screen reader users.
**Action:** When adding new icon-only buttons (like `Eye`, `EyeOff`, or SVG elements) across the application, always ensure they are accompanied by a descriptive `aria-label` attribute (e.g., `aria-label="Show password"`).
