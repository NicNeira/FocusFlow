# FocusFlow - AI Coding Instructions

## Project Overview

FocusFlow is a React 19 + TypeScript PWA for study time management with three techniques: Libre (no limits), Pomodoro (25-5), and 52-17. Uses Vite, Tailwind CSS, and localStorage for persistence.

## Architecture

### Lifted State Pattern
All timer state lives in `App.tsx` and flows down via props. Components are presentational only.

```
App.tsx (state owner)
├── Timer.tsx (displays time, controls)
├── Dashboard.tsx (statistics, charts with Recharts)
├── History.tsx (session list)
└── NotificationSettings.tsx (user preferences)
```

### Time Calculation Pattern
Timer uses accumulated time + current segment to prevent drift:
```ts
elapsedSeconds = accumulatedTime + (Date.now() - startTime) / 1000
```
When paused, segment is added to `accumulatedTime` and `startTime` becomes null.

### Service Layer (`services/`)
- **storageService.ts** - All localStorage ops with versioned keys (`focusflow_*_v1`), includes data migration logic
- **techniqueService.ts** - Pure functions for technique logic, transition detection, state transformations
- **notificationService.ts** - Singleton for browser/PWA notifications with permission handling
- **audioService.ts** - Singleton with Web Audio API fallback if MP3 files unavailable
- **faviconService.ts** - Dynamic favicon (green=running, red=paused, gray=idle), must call `destroy()` on unmount

### Key State Flow
1. `loadTimerState()` on mount → state hydration with migration
2. `useEffect` watches `timerState` → auto-save to localStorage
3. Technique transitions in `App.tsx` lines 129-187 via `shouldTransitionToBreak()`/`shouldTransitionToWork()`
4. Cycle completion updates `pomodoroStats` counters

## Development

```bash
npm run dev      # Port 3000
npm run build    # Production build with PWA service worker
npm run preview  # Test production build locally
```

## Conventions

### Types
All shared types in `types.ts`. Key interfaces:
- `TimerState` - Current timer state with technique config
- `TechniqueConfig` - Work/break durations, cycle tracking
- `StudySession` - Completed session record
- `NotificationSettings` - User notification preferences

### Storage Keys
Versioned format: `focusflow_{datatype}_v1`. Migration logic in `loadTimerState()` handles schema changes.

### State Updates
- Pass callbacks as props (e.g., `onStart`, `onPause`, `onSubjectChange`)
- Never manage timer logic in child components
- Persistence happens automatically via useEffect in App.tsx

### PWA
- Config in `vite.config.ts` using `vite-plugin-pwa`
- Service worker auto-updates, runtime caching for CDN assets
- Test PWA: build → preview → Chrome DevTools > Application

## File Patterns

| Pattern | Location |
|---------|----------|
| Component props interface | Top of component file |
| Service singleton | `getInstance()` pattern in services/ |
| localStorage operations | services/storageService.ts only |
| Type definitions | types.ts |
| Technique pure functions | services/techniqueService.ts |

## Common Tasks

**Add new technique:** Update `TECHNIQUES` record in `techniqueService.ts`, add to `StudyTechnique` union type

**Add notification type:** Update `NotificationSettings` interface, add handler in App.tsx transition effects (lines 147-227)

**Persist new data:** Add versioned key + load/save functions in `storageService.ts`
