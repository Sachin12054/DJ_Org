import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { DJEvent, CreateEventInput, UpdateEventInput, EventStatus } from '../types/Event';
import {
  scheduleEventReminder,
  schedulePaymentReminder,
  cancelNotification,
} from '../lib/notifications';

// ─── State ────────────────────────────────────────────────────────────────────

interface EventState {
  events: DJEvent[];
  loading: boolean;
}

type EventAction =
  | { type: 'SET_EVENTS'; events: DJEvent[] }
  | { type: 'SET_LOADING'; loading: boolean };

function reducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.events };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface EventContextType {
  events: DJEvent[];
  loading: boolean;
  addEvent: (input: CreateEventInput) => Promise<DJEvent>;
  updateEvent: (id: string, input: UpdateEventInput) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  markStatus: (id: string, status: EventStatus) => Promise<void>;
  getEventById: (id: string) => DJEvent | undefined;
  upcomingEvents: DJEvent[];
  pinnedEvents: DJEvent[];
  todayEvents: DJEvent[];
  totalEarned: number;
  totalPending: number;
}

const EventContext = createContext<EventContextType | null>(null);

// ─── Simple ID generator ──────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

const EVENTS_COLLECTION = 'events';

function eventsCollectionRef(userId: string) {
  return collection(db, 'users', userId, EVENTS_COLLECTION);
}

async function firestoreSave(userId: string, event: DJEvent): Promise<void> {
  await setDoc(doc(db, 'users', userId, EVENTS_COLLECTION, event.id), event);
}

async function firestoreDelete(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, EVENTS_COLLECTION, id));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { events: [], loading: true });
  const { user } = useAuth();

  // Real-time Firestore listener
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_EVENTS', events: [] });
      dispatch({ type: 'SET_LOADING', loading: false });
      return;
    }

    dispatch({ type: 'SET_LOADING', loading: true });

    const q = query(
      eventsCollectionRef(user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const events: DJEvent[] = snapshot.docs.map(d => d.data() as DJEvent);
        dispatch({ type: 'SET_EVENTS', events });
        dispatch({ type: 'SET_LOADING', loading: false });
      },
      error => {
        console.error('Firestore snapshot error:', error);
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const addEvent = useCallback(async (input: CreateEventInput): Promise<DJEvent> => {
    if (!user) {
      throw new Error('You must be logged in to add an event.');
    }

    const now = new Date().toISOString();
    const event: DJEvent = {
      ...input,
      id: generateId(),
      remainingAmount: input.totalAmount - input.advancePaid,
      createdAt: now,
      updatedAt: now,
    };

    // Schedule notifications
    const notifId = await scheduleEventReminder(event);
    await schedulePaymentReminder(event);
    if (notifId) event.notificationId = notifId;

    await firestoreSave(user.uid, event);
    return event;
  }, [user]);

  const updateEvent = useCallback(async (id: string, input: UpdateEventInput): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to update an event.');
    }

    const existing = state.events.find(e => e.id === id);
    if (!existing) return;

    if (existing.notificationId) {
      await cancelNotification(existing.notificationId);
    }

    const updated: DJEvent = {
      ...existing,
      ...input,
      remainingAmount:
        (input.totalAmount ?? existing.totalAmount) - (input.advancePaid ?? existing.advancePaid),
      updatedAt: new Date().toISOString(),
    };

    const notifId = await scheduleEventReminder(updated);
    await schedulePaymentReminder(updated);
    if (notifId) updated.notificationId = notifId;

    await firestoreSave(user.uid, updated);
  }, [state.events, user]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to delete an event.');
    }

    const event = state.events.find(e => e.id === id);
    if (event?.notificationId) {
      await cancelNotification(event.notificationId);
    }
    await firestoreDelete(user.uid, id);
  }, [state.events, user]);

  const togglePin = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to update an event.');
    }

    const event = state.events.find(e => e.id === id);
    if (!event) return;
    await firestoreSave(user.uid, { ...event, isPinned: !event.isPinned, updatedAt: new Date().toISOString() });
  }, [state.events, user]);

  const markStatus = useCallback(async (id: string, status: EventStatus): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to update an event.');
    }

    const event = state.events.find(e => e.id === id);
    if (!event) return;
    await firestoreSave(user.uid, { ...event, status, updatedAt: new Date().toISOString() });
  }, [state.events, user]);

  const getEventById = useCallback((id: string) => {
    return state.events.find(e => e.id === id);
  }, [state.events]);

  // ─── Derived data ───────────────────────────────────────────────────────────

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const upcomingEvents = state.events
    .filter(e => e.status === 'upcoming' && new Date(e.eventDate) >= now)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const pinnedEvents = state.events
    .filter(e => e.isPinned && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const todayEvents = state.events.filter(e => {
    const d = new Date(e.eventDate);
    return d >= todayStart && d < todayEnd;
  });

  const totalEarned = state.events
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const totalPending = state.events
    .filter(e => e.status === 'upcoming')
    .reduce((sum, e) => sum + e.remainingAmount, 0);

  return (
    <EventContext.Provider
      value={{
        events: state.events,
        loading: state.loading,
        addEvent,
        updateEvent,
        deleteEvent,
        togglePin,
        markStatus,
        getEventById,
        upcomingEvents,
        pinnedEvents,
        todayEvents,
        totalEarned,
        totalPending,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents(): EventContextType {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}
