export type SportType =
  | 'BADMINTON'
  | 'BASKETBALL'
  | 'PICKLEBALL'
  | 'TABLE_TENNIS';


export type VenueType = 'INDOOR' | 'OUTDOOR';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type PlayerRole = 'HOST' | 'PLAYER';

export interface SportsFacility {
  id: string;
  campusId: string;
  name: string;
  sportType: SportType;
  venueType: VenueType;
  location: string;
  description?: string | null;
  rules?: string | null;
  openingTime: string; // "06:00:00"
  closingTime: string; // "22:00:00"
  slotDurationMinutes: number;
  maxPlayers: number;
  isActive: number;
}

export interface SlotAvailability {
  startTime: string; // "18:00:00"
  endTime: string;   // "19:00:00"
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST';
  blockedReason?: string;
  bookingId?: string;
  isOpenGame?: boolean;
  currentPlayers?: number;
  maxPlayers?: number;
}

export interface SportsBookingPlayer {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userUsn?: string | null;
  role: PlayerRole;
  qrToken: string;
  joinedAt: string;
}

export interface SportsBooking {
  id: string;
  campusId: string;
  facilityId: string;
  facilityName?: string;
  sportType?: SportType | string;
  venueType?: VenueType | string;
  location?: string;
  userId: string;
  userName: string;
  userUsn?: string | null;
  bookingDate: string; // "YYYY-MM-DD"
  startTime: string;   // "18:00:00"
  endTime: string;     // "19:00:00"
  status: BookingStatus;
  inviteCode: string;
  isOpenGame: number | boolean;
  maxPlayers: number;
  currentPlayersCount: number;
  notes?: string | null;
  cancellationReason?: string | null;
  qrToken: string;
  myQrToken?: string;
  myRole?: PlayerRole;
  players?: SportsBookingPlayer[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingPayload {
  facilityId: string;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  isOpenGame?: boolean;
  maxPlayers?: number;
  notes?: string;
  teammates?: { userId: string; userName: string; userUsn?: string }[];
}

export interface SportsFacilityClosure {
  id: string;
  campusId: string;
  facilityId: string;
  closureDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt?: string;
}

export interface AdminCallOffPayload {
  facilityId: string; // Specific ID or 'ALL'
  closureDate: string; // YYYY-MM-DD
  reason: string;
  startTime?: string;
  endTime?: string;
}

export interface AdminReopenPayload {
  facilityId: string; // Specific ID or 'ALL'
  closureDate: string; // YYYY-MM-DD
}

export interface AdminUpdateTimingPayload {
  openingTime?: string;
  closingTime?: string;
  slotDurationMinutes?: number;
}

