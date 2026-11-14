# Shared interface and mobile verification

The dashboard is the app's design reference. Tailwind pages/forms and MUI dashboard controls now share Inter typography, the dashboard blue palette, rounded white cards, consistent shadows, and viewport-aware layouts. Tailwind's body, headline and default sans font resolve to the same font variable as MUI. Inter weights used by the dashboard are loaded explicitly.

The MUI cache uses unlayered styles because this repository uses Tailwind v3, whose unlayered reset otherwise overrides a named MUI layer. The local browser check confirmed a contained dashboard button renders blue with a 44px height and outlined fields retain their borders.

Shared controls provide 16px mobile input text, 44px primary touch targets, wrapping actions, single-column phone form grids, bounded scrollable dialogs and keyboard-focusable local table scrolling. Module headers and action rows wrap instead of pushing the document wider. Print output uses the same font family. Reduced-motion preferences are respected.

## Browser checks (14 November 2026)

An isolated local fixture rendered the real shared components and MUI controls with synthetic data. No production credentials or business records were used. The fixture is excluded from the PR.

| Viewport width | Document horizontal overflow | Shared font | Mobile input text |
| --- | --- | --- | --- |
| 320 | None | Inter | 16px |
| 360 | None | Inter | 16px |
| 390 | None | Inter | 16px |
| 768 | None | Inter | 14px desktop size |
| 1024 | None | Inter | 14px desktop size |
| 1440 | None | Inter | 14px desktop size |

At 320×480, the long-form dialog stayed between y=16 and y=464. Its 744px content scrolled within a 446px viewport; follow-up fields, save and cancel were reachable. Close and keyboard focus were checked. Wide tables remained inside their own scroll area at each width; the region is labelled and keyboard-focusable. Long reference text wrapped without widening the document.

These are shared-component checks, not a claim that every authenticated business route has been exercised. Signed-in module workflows, validation states and file/date pickers should receive a final smoke test on the new preview before production release. No authentication, data access, RLS, Firebase migration or production configuration was changed for this design work.

`AGENTS.md` records these design and responsive requirements for future edits.
