# SHEiQpro interface standards

- Use the dashboard as the visual reference for every page and form: Inter typography, shared colour tokens, rounded white cards, blue primary actions, and consistent spacing.
- Reuse the shared UI components and dashboard theme. Do not introduce separate font families, local palettes or competing form-control styles.
- Every new or changed page/form must work at 320, 360, 390, 768, 1024 and 1440 CSS pixels. Include a short-height/mobile-dialog check. Check long labels and validation messages.
- Keep document-level horizontal overflow at zero. Wide tables may scroll inside their own labelled, keyboard-focusable region; do not hide overflowing content as a substitute for responsive layout.
- Start form fields in one column on phones, then add columns at wider breakpoints. Wrap header actions and use full-width mobile form actions. Keep mobile inputs at least 16px to avoid focus zoom and main touch targets at least 44px.
- Bound dialogs to the viewport and allow vertical scrolling. Keep close, cancel and submit controls reachable using touch and keyboard. Preserve focus handling and reduced-motion support.
- Validate shared-component changes with TypeScript, build checks and representative browser checks at the widths above. Report authenticated pages that could not be exercised; do not claim all routes were tested from a component preview alone.
- Preserve authentication, tenant ownership, business records, RLS and production configuration during design work. Keep changes on the reviewed draft branch until release validation.
