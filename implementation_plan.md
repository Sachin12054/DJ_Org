# DJ Event Manager App — Implementation Plan

A professional event & payment manager built for DJs. Cross-platform: **Android, iOS, and Web** using **React Native (Expo)** + **Firebase**.

---

## User Review Required

> [!IMPORTANT]
> **Firebase Project Required**: You will need a Firebase project with **Firestore** (database) and **Firebase Cloud Messaging** (push notifications) enabled. I'll guide you through the setup — or if you already have a project, share the config keys.

> [!WARNING]
> **Expo Notifications on Web**: Push notifications are only fully supported on Android/iOS via Expo. On web, we'll use a browser-based notification fallback (Web Notifications API).

> [!IMPORTANT]
> **Authentication (Optional)**: The current plan stores data locally (AsyncStorage) with optional Firebase sync. Should I add **user login** (email/password or Google Sign-In) so data syncs across devices? This affects architecture significantly.

---

## Proposed Changes

### Phase 1 — Project Scaffolding

#### [NEW] Expo Project Setup
- Initialize with `npx create-expo-app@latest ./` inside the DJ folder
- Configure for web support: `expo-router` for file-based navigation
- Install all dependencies upfront

**Core Dependencies:**
```
expo-router              # Navigation
expo-notifications       # Push notifications
expo-calendar            # Calendar integration
expo-contacts            # Contact picker
expo-linking             # Deep links / maps / phone calls
@react-native-firebase/app
@react-native-firebase/firestore
react-native-calendars   # Calendar view component
react-native-async-storage/async-storage  # Local cache
react-native-paper       # UI components (optional)
```

---

### Phase 2 — Data Layer

#### [NEW] `lib/firebase.ts`
Firebase initialization and Firestore helpers.

#### [NEW] `lib/storage.ts`
AsyncStorage wrapper for offline-first caching.

#### [NEW] `lib/notifications.ts`
Expo notifications setup: request permissions, schedule local reminders.

#### [NEW] `types/Event.ts`
Full TypeScript Event model:
```ts
type Priority = 'low' | 'medium' | 'high';
type Status = 'upcoming' | 'completed' | 'cancelled';

interface Requirement {
  id: string;
  text: string;
  checked: boolean;
}

interface Event {
  id: string;
  eventName: string;
  clientName: string;
  phone: string;
  location: string;
  eventDate: string;       // ISO string
  reminderDate: string;    // ISO string
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number; // auto-computed
  priority: Priority;
  isPinned: boolean;
  requirements: Requirement[];
  notes: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}
```

---

### Phase 3 — Navigation Structure

Using **Expo Router** (file-based routing):

```
app/
├── (tabs)/
│   ├── index.tsx          → Dashboard (Home)
│   ├── events.tsx         → Events List
│   ├── calendar.tsx       → Calendar View
│   ├── payments.tsx       → Payments Tracker
│   └── settings.tsx       → Settings
├── event/
│   ├── [id].tsx           → Event Detail Screen
│   └── add.tsx            → Add/Edit Event Screen
└── _layout.tsx            → Root layout + tab bar
```

---

### Phase 4 — Screens

#### [NEW] Dashboard (`app/(tabs)/index.tsx`)
- **Pinned Events** carousel at top
- **Today's Reminders** alert strip
- **Upcoming Events** (next 7 days) list
- **Pending Payments** summary card
- Revenue mini-chart (weekly/monthly toggle)

#### [NEW] Events List (`app/(tabs)/events.tsx`)
- Searchable, filterable event list
- Filter chips: Upcoming / Completed / Cancelled
- Sort: Date ↑↓ / Priority
- FAB (+) to add event
- Swipe actions: Pin, Delete, Mark Complete

#### [NEW] Add/Edit Event (`app/event/add.tsx`)
All fields from the spec:
- Date/Time pickers
- Reminder picker
- Auto-compute `remainingAmount = totalAmount - advancePaid`
- Priority selector (color-coded chips)
- Requirements checklist builder
- Pin toggle

#### [NEW] Event Detail (`app/event/[id].tsx`)
- Full info display
- Payment breakdown with progress bar
- Requirements checklist (tap to check off)
- Action buttons: 📞 Call, 📍 Maps, ✔ Complete, ✏️ Edit

#### [NEW] Calendar View (`app/(tabs)/calendar.tsx`)
- Monthly calendar with event dot markers
- Tap date → slide-up event list for that day

#### [NEW] Payments Tracker (`app/(tabs)/payments.tsx`)
- Total earnings (completed events)
- Pending amounts (upcoming)
- Monthly breakdown chart
- Per-event payment cards

#### [NEW] Settings (`app/(tabs)/settings.tsx`)
- Dark / Light mode toggle
- Notification controls (enable/disable types)
- Data export (JSON backup)
- Firebase sync toggle
- App version info

---

### Phase 5 — UI Design System

#### [NEW] `constants/theme.ts`
**Dark-first design:**
- Background: `#0D0D0D` (near black)
- Surface: `#1A1A2E` (deep navy)
- Card: `#16213E`
- Accent: `#E94560` (vibrant red-pink)
- Secondary: `#0F3460` (deep blue)
- Success: `#4CAF50`
- Warning: `#FF9800`
- Text Primary: `#FFFFFF`
- Text Secondary: `#A0A0B0`
- Priority High: `#FF4757`
- Priority Medium: `#FFA502`
- Priority Low: `#2ED573`

**Typography**: Inter font family via `expo-font`

**Event Card Design:**
```
┌─────────────────────────────────┐
│ 🎉 Wedding Reception       📌  │  ← Pin indicator
│ 👤 John Smith                   │
│ 📅 15 Apr 2026 · 7:00 PM       │
│ 📍 Grand Ballroom, Mumbai       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 💰 ₹45,000 total · ₹15,000 due │  ← Payment bar
│                        🔴 HIGH  │  ← Priority badge
└─────────────────────────────────┘
```

---

### Phase 6 — Notifications

#### [NEW] `lib/notifications.ts`
- **Event reminder**: scheduled at `reminderDate`
- **Payment reminder**: 1 day before event if amount pending
- **Day-of reminder**: morning of event day
- Cancel notification on event delete

---

### Phase 7 — Firebase Integration

#### Firestore Structure:
```
/events/{eventId}    → Event document
```

- Real-time listener on events collection
- Offline persistence enabled
- Local AsyncStorage as fallback when offline

---

## Open Questions

> [!IMPORTANT]
> **Do you want user authentication?** (Google/Email login so data syncs across multiple devices) — This is a significant architectural decision.

> [!IMPORTANT]
> **Currency**: Should the app use ₹ (Indian Rupee) as default, or be configurable in settings?

> [!NOTE]
> **Maps Integration**: For "Open Location" — should I use Google Maps or the device's default maps app?

> [!NOTE]
> **Requirements field**: Should it support both a free-text area AND a checklist (add items one by one), or just one of these?

---

## Verification Plan

### Automated
- TypeScript type checking: `npx tsc --noEmit`
- Expo build verification: `npx expo export`

### Manual Testing
- Run on Expo Go (Android/iOS) via `npx expo start`
- Run on Web via `npx expo start --web`
- Test adding an event, setting reminder, checking payment tracking
- Test notifications on physical device

### Browser Testing
- Verify all 8 screens render correctly on web
- Test responsive layout on mobile browser
