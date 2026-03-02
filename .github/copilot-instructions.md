# Copilot Instructions — Endorsement Manager POC

## Project Overview

Insurance endorsement management SPA (Angular 21, standalone components, Angular Material, SCSS). Mirrors a WinForms control hierarchy as a web POC. The app lets users search/filter endorsement forms, select them into a policy, manage packages of endorsements, edit PDF form blanks, and preview endorsement text.

**Future integration:** This POC will become a smaller part of a larger web application that uses **PrimeNG** as its UI component library. Angular Material is used here for prototyping only — expect the styling layer to change when integrating into the parent app.

Backend API: ASP.NET at `https://localhost:7234/api/endorsements` (PDF retrieval and fill-blanks). Client-side PDF rendering uses `pdfjs-dist` with a local worker at `/pdf.worker.min.mjs`.

## Architecture

```
src/app/
  app.ts              — Root component (~1100 lines): master list, selection, filtering,
                        packages, policy stages. All endorsement data is hardcoded here.
  endorsement-editor/ — PDF viewer + fill-blanks editor (signals, MatDialog, pdfjs-dist)
  editors/            — Reusable HTML editor library (two variants):
    dg-html-editor/     Full WYSIWYG editor (toolbar, source panel, status bar)
    dg-mini-html-editor/ Compact contenteditable editor with floating toolbar
    shared/             Shared models, constants, and services for both editors
  package-manager-modal/ — Create/update endorsement packages
  view-text-preview/  — Inline PDF preview via iframe
```

### Key Data Flow

- `App` component owns all endorsement groups, selected endorsements, and packages as local state (no store/ngrx).
- `EndorsementService` (root singleton) handles HTTP for PDF fetch/fill.
- `EndorsementPdfService` (component-scoped via `providers: [...]`) manages pdfjs-dist document state with signals.
- Editor services (`EditorStateService`, `EditorCommandService`, etc.) are component-scoped, not root-level.

## Conventions

### Angular Patterns
- **Standalone components only** — do NOT set `standalone: true` (it's the default in Angular 21+).
- **Signals over observables** for component state; use `computed()` for derived state.
- **`input()` / `output()` functions** instead of `@Input` / `@Output` decorators. Exception: `ViewTextPreviewComponent` still uses `@Input` (legacy).
- **`inject()` function** instead of constructor injection.
- **`ChangeDetectionStrategy.OnPush`** on all new components.
- **Native control flow**: `@if`, `@for`, `@switch` — never `*ngIf` / `*ngFor`.
- **`host` object** in `@Component` decorator instead of `@HostBinding` / `@HostListener`.

### File & Module Organization
- Barrel exports (`index.ts`) at every feature boundary — import from the folder, not individual files.
- Component files use `.ts` extension (not `.component.ts` for the root `app.ts`).
- Templates/styles use `templateUrl` / `styleUrl` with relative paths for multi-file components.
- SCSS for styles; global theme: `@angular/material/prebuilt-themes/indigo-pink.css`.

### TypeScript
- Strict mode enabled (`strict`, `strictTemplates`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`).
- Prefer `type` imports for interfaces/types: `import type { ... }`.
- Avoid `any`; use `unknown` when uncertain.
- Use `as const` for readonly constant arrays (see `POLICY_FORM_OPTIONS`).

### Services
- **Root-level** (`providedIn: 'root'`): `EndorsementService` — shared HTTP client.
- **Component-scoped** (`providers: [...]` in `@Component`): `EndorsementPdfService`, editor services — isolated per instance.

## Commands

| Task | Command |
|------|---------|
| Dev server | `ng serve` → `http://localhost:4200` |
| Build | `ng build` |
| Test | `ng test` (Vitest) |
| Scaffold | `ng generate component <name>` |

## Domain Notes

- Endorsements are identified by "form display number" (e.g., `D26309 .000`) — a code + version format.
- Endorsement groups aggregate multiple versions under a group number (e.g., `D0072`).
- Policy stages: `quote`, `bind`, `issue`, `midterm` — each endorsement tracks status per stage.
- Packages map a set of endorsement version IDs to a named bundle with a policy form code.
- All endorsement data is currently hardcoded in `app.ts` and `hardcoded-data.md` — there is no dynamic list API yet.

## Testing

- Test runner: **Vitest** (run via `ng test`).
- No test files exist yet. When adding tests:
  - Place spec files next to the source file: `foo.component.spec.ts` alongside `foo.component.ts`.
  - Use `describe` / `it` blocks with clear descriptive names.
  - Prefer testing public component behavior over internal implementation details.
  - For signal-based components, test computed outputs and effects through the component's public API.
  - Mock HTTP calls using Angular's `provideHttpClientTesting` — do not hit real endpoints in tests.
