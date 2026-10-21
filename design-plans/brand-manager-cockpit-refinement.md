# Brand Manager Cockpit Refinement & Design System Alignment

Written against: local workspace (frontend/src/lib/features/dashboard/)

## Evidence chain

- Surface: `frontend/src/routes/+page.svelte` (Role: `brand_manager`, lines 218–260)
- Problem:
  1. `BrandOutletHealthMatrixCard.svelte` contains hardcoded hex colors (`#f8fafc`, `#e2e8f0`, `#34d399`, `#f87171`), violating Golden Rule 10 (Light/Dark Mode Parity) and causing dark-mode contrast failures and sticker effects.
  2. `BrandPulseStrip.svelte` diverges from the established executive pulse strip grid (`.owner-pulse-grid`), contains a banned Unicode symbol (`▲`), and lacks Heroicon compliance.
  3. The health matrix table reimplements raw table layout and uses a non-standard "Detail" button (`.action-detail-btn`) instead of the standard "Lihat" (`.btn-view-direct`) pattern and shared table primitives.
- Design evidence:
  - `frontend/AGENTS.md` (Golden Rules 3, 4, 10, 11, 12, 13)
  - `frontend/.agents/rules/components.md` (Rules 1 & 2)
  - `frontend/src/app.css` (Design tokens: `var(--bg-panel)`, `var(--bg-panel-sub)`, `var(--border-panel)`, `var(--text-main)`, `var(--text-muted)`)
  - `frontend/src/lib/features/dashboard/dashboard.css` (`.owner-pulse-grid`, `.pulse-card`, `.pulse-top`, `.btn-view-direct`)
  - `frontend/src/lib/components/data/Table.svelte` (Shared table architecture)
- Owner: `frontend/src/lib/features/dashboard/components/`
- Scope and affected surfaces:
  - `frontend/src/lib/features/dashboard/components/BrandOutletHealthMatrixCard.svelte`
  - `frontend/src/lib/features/dashboard/components/BrandPulseStrip.svelte`
  - `frontend/src/lib/features/dashboard/components/BrandTaskActionRadarCard.svelte`
  - `frontend/src/lib/features/dashboard/components/BrandOutletDetailModal.svelte`
- Uncertainty: None; all tokens, styles, and components exist in current workspace source.

## Design decision

Bring the Brand Manager multi-outlet cockpit into 100% compliance with Hanjo's design system tokens, Golden Rule 10 (Light & Dark Mode Parity), and Golden Rule 13 (Simple tapi Informatif & Progressive Disclosure):
1. Modernize `BrandOutletHealthMatrixCard.svelte` by eliminating raw hex colors, removing fragile `:global([data-theme='light'])` color overrides, aligning with standard table styles, and unifying the primary row action to "Lihat" (`.btn-view-direct`).
2. Standardize `BrandPulseStrip.svelte` using `.owner-pulse-grid col-12`, replacing Unicode glyphs with Heroicons SVG (`arrow-trending-up`), and ensuring consistent card padding across all 4 responsive tiers.
3. Preserve the core identity of the Outlet Health Matrix as the central hero element of the Brand Manager cockpit while ensuring visual restraint across supporting cards.

## Reuse

- Tokens: `var(--bg-panel)`, `var(--bg-panel-sub)`, `var(--bg-panel-hover)`, `var(--border-panel)`, `var(--border-subtle)`, `var(--text-main)`, `var(--text-muted)`, `var(--text-subtle)`, `var(--brand-primary)`, `var(--pill-*)`
- Shared Components: `frontend/src/lib/components/data/Icon.svelte`, `frontend/src/lib/components/data/Badge.svelte`
- Shared Dashboard Classes: `.owner-pulse-grid`, `.pulse-card`, `.pulse-top`, `.pulse-trend-text`, `.btn-view-direct`, `.action-item-row`
- Exemplar: `frontend/src/lib/features/dashboard/components/OwnerPulseStrip.svelte` and `frontend/src/lib/features/dashboard/components/OutletComparisonCard.svelte`

## Changes

1. `frontend/src/lib/features/dashboard/components/BrandOutletHealthMatrixCard.svelte`
   - Change:
     - Replace hardcoded hex colors (`#34d399`, `#fbbf24`, `#f87171`, `#1e293b`, `#64748b`, `#38bdf8`) with CSS design variables (`var(--pill-success-text)`, `var(--pill-warning-text)`, `var(--pill-danger-text)`, `var(--text-main)`, `var(--text-muted)`).
     - Replace container background `#f8fafc` and border `#e2e8f0` with `var(--bg-panel-sub)` and `var(--border-panel)`.
     - Standardize table row typography and hover states using `var(--bg-panel-hover)` and `var(--border-panel)`.
     - Update action button text from "Detail" to "Lihat" with class `.btn-view-direct`.
   - Preserve:
     - Outlet status indicators, interactive row click triggering `onSelectOutlet`, and footer summary metrics.
   - Verify:
     - Component renders identically in Dark Mode and Light Mode without sticker patches or unreadable contrast.

2. `frontend/src/lib/features/dashboard/components/BrandPulseStrip.svelte`
   - Change:
     - Replace ad-hoc container `col-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-1` with `.owner-pulse-grid col-12`.
     - Replace `▲ {brandMetrics.lfl_growth}% LFL` with standard `.pulse-trend-text.success` containing `<Icon name="arrow-trending-up" size={14} />`.
     - Align card header and icon badges with standard `.pulse-top`, `.pulse-icon-badge`, `.pulse-label`, and `.pulse-main-val`.
     - Simplify sublines to eliminate crowded action buttons inside metric cards.
   - Preserve:
     - LFL growth metrics, alert counts, food cost %, and petty cash utilization data.
   - Verify:
     - Grid smoothly transitions across 4 tiers (1 column on mobile < 540px, 2 columns on tablet 540px–1023px, 4 columns on desktop >= 1024px).

3. `frontend/src/lib/features/dashboard/components/BrandTaskActionRadarCard.svelte`
   - Change:
     - Replace ad-hoc task button styling with standard `.btn-view-direct` and `.dash-card` tokens.
     - Ensure modal and details adhere strictly to progressive disclosure.
   - Preserve:
     - Interactive approval, recipe curation, and modal dialog capabilities.
   - Verify:
     - Clean, scannable dashboard row layout without cluttered multi-button groups.

## Scope

- Inherit: `frontend/src/routes/+page.svelte` when viewed by `brand_manager`.
- Verify: Light Mode (`data-theme="light"`) and Dark Mode (`data-theme="dark"`), mobile (< 768px) and desktop (>= 1200px) responsiveness.
- Exclude: Backend APIs, mock handlers, unrelated roles (`owner`, `finance`, `store_manager`, `cashier`).

## Validation

- Product: Brand Manager dashboard displays clean, cohesive metrics with the Outlet Health Matrix as the hero element.
- Interface: Tested across `/` route in `brand_manager` role on both Light and Dark modes.
- System: Zero hardcoded hex colors, zero Unicode glyphs, 100% token reuse.
- Repository: `npm run check` → 0 errors, 0 warnings.

## Stop conditions

- Stop if any mock data contract or property in `types.ts` is broken.
- Stop if changes affect other dashboard roles.

## Design documentation

- After acceptance and validation: Update `frontend/docs/milestones/MS-01.md` or component documentation if required.
