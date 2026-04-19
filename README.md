# Study Tracker (Tauri + Vue)

Pixel-art styled quest timer with 6 categories that level up based on time spent.

## Features
- 6 categories, each with:
  - Level = 1 per hour spent
  - Progress bar to next level (within the current hour)
- Start a quest (timer) in a category -> auto-navigates to the Quest screen
- Quest screen shows: category + elapsed time + end quest button
- Progress persists locally via `localStorage`

## Dev
1. Install deps: `npm i`
2. Run web UI: `npm run dev`
3. Run desktop: `npm run tauri:dev`

## Build
`npm run tauri:build`

