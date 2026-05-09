# Electricity Use Planner

A focused electricity-budget planner built with `Vite + React + TypeScript`.

The app helps a household turn a remaining monthly electricity budget into:

- a safe `₹/day` limit
- a safe `units/day` limit
- a bill pacing check for the rest of the month
- an appliance plan based on only the appliances the user actually selects
- a rebalanced safe usage plan when requested appliance runtimes exceed the daily cap

## What The App Solves

Electricity budgeting usually breaks in two places:

1. People know the monthly budget but not the safe daily limit.
2. People know the appliances they want to use, but not how those choices translate into units and rupees per day.

This project closes that gap by combining bill-level planning with appliance-level planning.

## Core Features

- Monthly budget planning from:
  - total monthly budget
  - remaining balance
  - per-unit electricity charge
  - optional reserve/buffer
- Automatic reserve calculation when the reserve field is left blank
- Safe daily spending and unit caps based on remaining days in the month
- Month pacing analytics:
  - projected month-end bill
  - average daily spend so far
  - correction needed from the current pace
- Appliance planner:
  - checkbox-based appliance selection
  - default appliance set
  - per-appliance runtime, units/day, and rupee/day estimates
  - runtime slider for selected appliances
  - selected-set rebalancing against the safe daily cap
- Local persistence of:
  - form draft
  - selected appliances
  - requested appliance runtimes
  - recent calculation history

## How The Planner Works

The app is intentionally sequential:

1. Enter the bill values.
2. Read the safe daily limit.
3. Check whether the month is drifting.
4. Select appliances and shape a realistic daily usage plan.

This keeps the interface user-centric instead of forcing the user to interpret multiple disconnected dashboards.

## Appliance Planner Behavior

The appliance section has two layers:

1. Informational appliance profiles
2. A selected-set planner

Important behavior:

- Only checked appliances affect the selected-set analytics.
- Unchecked appliances remain informational and are not counted.
- Each selected appliance exposes a requested runtime slider.
- The slider currently supports:
  - minimum: `10 min/day`
  - maximum: `24 h/day`
- If the requested set fits inside the safe daily cap, those requested runtimes are used directly.
- If the requested set exceeds the cap, the app scales the selected appliances down proportionally so the final displayed plan fits the safe `units/day` and `₹/day` limit.

That means the runtime shown for a checked appliance is not just a static reference number. It is the safe runtime for the selected set after balancing.

## Technology Stack

- `React 19`
- `TypeScript`
- `Vite`
- `Vitest`
- `ESLint`

No backend is required. All persistence is browser-local.

## Project Structure

```text
.
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── service-worker.js
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── lib/
│       ├── analytics.ts
│       ├── analytics.test.ts
│       ├── calculator.ts
│       ├── calculator.test.ts
│       └── storage.ts
└── docs/
    ├── README.md
    ├── appliance-planner.md
    ├── calculation-model.md
    └── development-guide.md
```

## Getting Started

### Install

```bash
npm install
```

### Start Local Development

```bash
npm run dev
```

### Build Production Assets

```bash
npm run build
```

### Preview The Production Build

```bash
npm run preview
```

## Quality Checks

```bash
npm run lint
npm run test
npm run build
```

## Deployment

The app is a static site and can be deployed from `dist/`.

Suitable targets include:

- Vercel
- GitHub Pages
- Netlify
- any static file host

## Local Data And Persistence

The app stores its working state in browser storage only.

Current persisted areas include:

- draft input values
- selected appliance labels
- requested appliance runtimes
- recent history entries

There is no server sync and no account system.

## Assumptions And Limits

- Remaining days are calculated from the visitor's current device date.
- When reserve is blank, the app automatically protects `10%` of the remaining amount.
- Appliance wattage assumptions are intentionally fixed and simplified.
- Real-world consumption may vary by:
  - appliance model
  - compressor cycling
  - star rating
  - thermostat behavior
  - ambient conditions
- Bill pacing is calculated from the bill values.
- Appliance planning is calculated only from the selected appliance set.

## Documentation

Project documentation lives in [docs/README.md](/Users/ashvyn/Documents/study/elec_calc/docs/README.md:1).

Key references:

- [Calculation Model](/Users/ashvyn/Documents/study/elec_calc/docs/calculation-model.md:1)
- [Appliance Planner](/Users/ashvyn/Documents/study/elec_calc/docs/appliance-planner.md:1)
- [Development Guide](/Users/ashvyn/Documents/study/elec_calc/docs/development-guide.md:1)
# electricity_calculator
