# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```
Server runs on port 3000 (configured in vite.config.ts)

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Architecture Overview

### Core Application Structure

FocusFlow is a React-based study timer application with three main study techniques (Libre, Pomodoro, 52-17). The application uses **lifted state architecture** where all timer state lives in App.tsx and flows down to components as props.

**State Management Pattern:**
- All timer state (isRunning, elapsedSeconds, technique config, etc.) is managed in App.tsx
- Components are presentational and receive state via props
- State updates flow up through callback props (onStart, onPause, onSubjectChange, etc.)
- All persistence happens automatically through useEffect hooks in App.tsx

### Data Flow

1. **Timer State Lifecycle:**
   - Timer state is loaded from localStorage on mount via `loadTimerState()`
   - State changes trigger automatic saves via `useEffect` watching `timerState`
   - Time calculation uses accumulated time + current segment pattern:
     ```ts
     elapsedSeconds = accumulatedTime + (now - startTime) / 1000
     ```
   - When paused, current segment is added to `accumulatedTime` and `startTime` is set to null

2. **Technique Transitions:**
   - Automatic transitions between work/break periods are handled in App.tsx (lines 129-187)
   - Uses `shouldTransitionToBreak()` and `shouldTransitionToWork()` from techniqueService
   - Transitions reset the timer and update technique state
   - Cycle completion increments `pomodoroStats` counters

3. **Storage Service Pattern:**
   - All localStorage operations centralized in `services/storageService.ts`
   - Each data type has load/save function pairs (e.g., `loadSessions`/`saveSessions`)
   - Storage keys are versioned (e.g., `focusflow_sessions_v1`)
   - Includes migration logic for backward compatibility (see loadTimerState lines 42-53)

### Service Layer

**techniqueService.ts:**
- Pure functions for technique logic (no side effects)
- `getTechniqueConfig()` returns initial config for a technique type
- Transition detection functions: `shouldTransitionToBreak()`, `shouldTransitionToWork()`
- State transformation functions: `startBreakTime()`, `startWorkTime()`, `incrementCycle()`, `resetCycles()`

**storageService.ts:**
- All localStorage operations
- Data migration logic for schema changes
- Auto-reset logic for daily/weekly counters (see `resetCountsIfNeeded()` lines 151-175)

**faviconService.ts:**
- Singleton service that manages dynamic favicon based on timer state
- Uses Canvas API to draw custom favicons
- Three states: running (green blinking), paused (red solid), idle (gray solid)
- Must call `destroy()` on unmount to clean up animation timers

### Component Structure

**Timer Component:**
- Receives all state and handlers as props (no internal state for timer logic)
- Displays current time, progress bars, technique info, and cycle counts
- TechniqueSelector is a child component that handles technique selection

**Dashboard Component:**
- Displays statistics from sessions data
- Uses Recharts for data visualization
- Calculates weekly progress, objectives completion, and subject breakdowns
- Manages objectives and weekly targets with callbacks to App.tsx

**History Component:**
- Lists all study sessions chronologically
- Provides filtering and session deletion

### Type System

All shared types are defined in `types.ts`:
- `StudySession`: Completed study session record
- `TimerState`: Current timer state (includes accumulated time, technique config, pomodoro stats)
- `TechniqueConfig`: Configuration for a study technique (work/break durations, cycle tracking)
- `PomodoroStats`: Daily and weekly cycle counters with auto-reset dates

### Key Implementation Details

**Timer Accuracy:**
- Uses interval-based rendering (1 second) but calculates elapsed time from timestamps
- `now` state triggers re-renders every second when timer is running
- Actual elapsed time is always calculated from `Date.now() - startTime` to avoid drift

**Notification System:**
- Browser notifications trigger on work/break transitions
- Permission is NOT requested on load (removed in recent refactor)
- Notifications only fire if permission was previously granted

**Theme System:**
- Dark mode is the default
- Uses Tailwind's dark mode classes
- Theme preference is stored in component state (not persisted to localStorage)

**Categories:**
- Recently used study subjects are saved to localStorage
- Limited to 20 most recent categories
- Deduplicated case-insensitively

## Notifications and Audio System

FocusFlow includes a comprehensive notification and audio alert system for technique transitions.

**Architecture:**
- `notificationService.ts` - Manages browser/PWA notifications with permission handling
- `audioService.ts` - Handles sound playback with Web Audio API fallbacks
- `NotificationSettings.tsx` - UI component for user preferences
- Settings stored in localStorage with key `focusflow_notification_settings_v1`

**Notification Types:**
1. **Work Period End** - Alerts when work time finishes (Pomodoro/52-17)
2. **Break Period End** - Notifies when break time completes
3. **Cycle Complete** - Shows statistics when full cycle finishes (work + break)
4. **Achievements** - Custom notifications for milestones

**Audio System:**
- Dual-mode: Attempts to play MP3 files from `/sounds/`, falls back to Web Audio API tones
- Sound files: `work-end.mp3`, `break-end.mp3`, `cycle-complete.mp3`, `achievement.mp3`
- Web Audio API generates pleasant sine wave tones if files unavailable
- Volume control (0.0-1.0) persisted in localStorage

**User Preferences:**
- Individual toggles for each notification type
- Sound enable/disable with volume slider
- Vibration support for mobile devices
- Permission banner with graceful degradation if denied
- Settings accessible via Settings view (4th nav item)

**Integration Points:**
- Notifications triggered in App.tsx transition effects (lines 147-227)
- Uses user preferences from `notificationSettings` state
- Vibration patterns: `[200, 100, 200]` for work end, `[200, 100, 200, 100, 200]` for cycle complete

**Permission Flow:**
1. User navigates to Settings
2. Banner prompts for notification permission if not granted
3. On acceptance, test notification is shown
4. If denied, warning banner displays with instructions
5. Notifications only fire when enabled + permission granted

**PWA Integration:**
- Service worker can show notifications even when app is closed
- Uses `registration.showNotification()` when service worker available
- Falls back to standard `Notification` API otherwise

## Progressive Web App (PWA)

FocusFlow is configured as a Progressive Web App using `vite-plugin-pwa`.

**PWA Configuration:**
- Plugin configuration in vite.config.ts (lines 15-80)
- Service worker registration in index.tsx (lines 19-28)
- Manifest file auto-generated from vite.config.ts
- Additional manifest.json in public/ directory

**Service Worker Strategy:**
- Auto-update strategy: prompts user when new version is available
- Runtime caching for CDN resources (aistudiocdn.com, tailwindcss CDN)
- Cache-First strategy with 30-day expiration for external assets
- Glob patterns cache all built assets (js, css, html, images)
- DevOptions enabled for testing PWA during development

**Installation:**
- App can be installed on desktop and mobile devices
- Custom install prompt available
- Works offline after first visit
- Updates automatically when new version is deployed

**Icons:**
- SVG icon source in public/icon.svg
- PNG icons (192x192, 512x512) need to be generated from SVG
- Use generate-icons.js or online tools like realfavicongenerator.net
- Apple touch icons configured in index.html

**Testing PWA:**
- Run `npm run build` to generate production build with service worker
- Run `npm run preview` to test the production build locally
- Use Chrome DevTools > Application > Service Workers to inspect
- Use Lighthouse to audit PWA compliance

## Branch Strategy

- **Main branch:** `main`
- **Development branch:** `develop`
- Create pull requests from feature branches to `main`
