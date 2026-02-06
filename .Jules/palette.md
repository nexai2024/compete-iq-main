## 2025-05-14 - [Form Accessibility and Auto-focus]
**Learning:** In list-based form inputs, auto-focusing the first field of a newly added item significantly improves the perceived speed and flow of the application. Additionally, linking inputs to their error messages using `aria-describedby` and `role="alert"` is a foundational accessibility requirement that is often overlooked in custom UI components.
**Action:** Always implement focus management for dynamic lists and ensure `aria-describedby` is wired up in reusable input components.
