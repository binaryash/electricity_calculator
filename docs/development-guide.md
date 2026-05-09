# Development Guide

This document explains how the project is organized and how to extend it safely.

## Stack

- `React 19`
- `TypeScript`
- `Vite`
- `Vitest`
- `ESLint`

## Main Files

## App shell and UI

- `src/App.tsx`
  Main application composition and UI logic.

- `src/App.css`
  Application-specific styling.

- `src/index.css`
  Global page styling.

## Domain logic

- `src/lib/calculator.ts`
  Core bill and daily-limit calculations.

- `src/lib/analytics.ts`
  Pacing metrics and appliance recommendation generation.

- `src/lib/storage.ts`
  Browser-local persistence for drafts and history.

## Tests

- `src/lib/calculator.test.ts`
- `src/lib/analytics.test.ts`

## Persistence Model

The app currently stores draft and history in local storage.

Storage keys:

- `electricity-budget-draft-v1`
- `electricity-budget-history-v1`

Draft storage currently includes:

- bill inputs
- selected appliance labels
- requested runtime values for selected appliances

## How To Run

```bash
npm install
npm run dev
```

## How To Validate

```bash
npm run lint
npm run test
npm run build
```

## Extending Appliance Profiles

Appliance definitions live in:

- `src/lib/analytics.ts`
- `src/App.tsx` group metadata

To add a new appliance:

1. Add the appliance profile in `src/lib/analytics.ts`
   Include:
   - label
   - watts
   - practical default runtime
   - runtime mode
   - descriptive note

2. Add the appliance to a group in `src/App.tsx`
   Include:
   - label
   - short code
   - optional default checked state

3. Verify:
   - selected-set summary updates correctly
   - runtime slider behaves correctly
   - safe units/day and `₹/day` render correctly
   - tests still pass

## Editing The Runtime Planner

The selected-appliance planner currently follows this model:

1. User checks relevant appliances.
2. User requests runtime per selected appliance.
3. App converts requested runtime to requested units.
4. If the selected set exceeds the daily cap, app scales selected appliances down proportionally.
5. UI shows safe runtime, safe units/day, and safe rupee/day.

If you change this logic, update:

- `src/App.tsx`
- `docs/calculation-model.md`
- `docs/appliance-planner.md`
- tests where needed

## Documentation Maintenance

When changing product behavior, update both:

- root `README.md`
- the relevant file in `docs/`

In this project, the docs are intended to describe the actual implemented behavior, not aspirational design notes.
