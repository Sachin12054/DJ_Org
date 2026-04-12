export type Priority = 'low' | 'medium' | 'high';
export type EventStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Requirement {
  id: string;
  text: string;
  checked: boolean;
}

export interface DJEvent {
  id: string;
  eventName: string;
  clientName: string;
  phone: string;
  location: string;
  eventDate: string;       // ISO string
  reminderDate: string;    // ISO string
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number; // auto-computed: totalAmount - advancePaid
  priority: Priority;
  isPinned: boolean;
  requirements: Requirement[];
  notes: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  notificationId?: string;
}

export type CreateEventInput = Omit<DJEvent, 'id' | 'remainingAmount' | 'createdAt' | 'updatedAt' | 'notificationId'>;
export type UpdateEventInput = Partial<CreateEventInput>;
