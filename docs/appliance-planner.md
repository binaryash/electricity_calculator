# Appliance Planner

This document explains the appliance-planning part of the app.

## Goal

The appliance section is designed to answer:

`Given my current bill situation, what appliance mix can I safely run in a day?`

## Appliance Groups

The app organizes appliances into three groups:

## Base load

Daily essentials and always-on appliances.

Current profiles:

- Refrigerator
- Wi-Fi router
- 4 LED lights

## Comfort load

Lifestyle and comfort appliances used more actively through the day.

Current profiles:

- 1-ton inverter AC
- Ceiling fan
- LED TV
- Laptop

## Burst load

High-draw appliances that usually run for short periods.

Current profiles:

- Iron box
- 25L geyser
- Washing machine
- Microwave oven

## Default Checked Set

The default checked set is intended to mirror a realistic starting point rather than assume every appliance is active.

Current defaults:

- Checked:
  - 4 LED lights
  - 1-ton inverter AC
  - Ceiling fan
  - LED TV
  - Laptop
  - Iron box
  - 25L geyser
- Unchecked:
  - Refrigerator
  - Wi-Fi router
  - Washing machine
  - Microwave oven

## What Each Row Means

Each appliance row contains:

- selection checkbox
- appliance code badge
- appliance label
- short appliance note
- safe runtime for the selected set
- wattage
- safe units/day
- safe rupee/day

Important:

- checked rows are part of the selected-set plan
- unchecked rows are informational only

## Requested Runtime

Each selected appliance exposes a runtime slider.

Current range:

- minimum: `10 min/day`
- maximum: `24 h/day`

This slider is a request, not a guarantee.

If the selected set fits inside the safe daily cap, the requested runtime is used directly.

If the selected set exceeds the cap, the app scales the selected runtimes down proportionally.

## Why Rebalancing Exists

Without rebalancing, a user could request individually valid runtimes that are impossible when combined.

Example:

- AC requested high
- fan requested high
- TV requested high
- geyser requested high

Each line might look plausible in isolation, but the selected set could exceed the safe daily cap.

The app solves this by turning the selected set into one safe plan.

## How To Read The Section

Use the appliance section in this order:

1. Check the appliances you want for that day.
2. Adjust requested runtime for the selected appliances.
3. Read the selected-set summary:
   - selected appliances count
   - safe units/day for the selected set
   - safe cost/day for the selected set
   - headroom left
4. Read the checked rows:
   - the displayed runtime is the safe runtime
   - the displayed units/day and `₹/day` match that safe runtime

## Recommended UX Interpretation

- If the app says the selected set fits:
  the displayed checked rows can be treated as the usable plan for the day.

- If the app says the selected set was rebalanced:
  the requested plan was too heavy, and the displayed checked rows are the safe reduced plan.

- If nothing is checked:
  the section is inactive by design and no selected-set analytics are produced.
