import { apiRequest } from '@/lib/api/api-client';
import {
  CreateBookingPayload,
  SlotAvailability,
  SportsBooking,
  SportsFacility,
} from './sports-types';

export const FALLBACK_FACILITIES: SportsFacility[] = [
  {
    id: 'fac-badminton-1',
    campusId: 'nmit',
    name: 'Badminton Court 1',
    sportType: 'BADMINTON',
    venueType: 'INDOOR',
    location: 'Indoor Sports Complex · Floor 1',
    description: 'Championship wooden floor court with professional LED lighting.',
    rules: 'Non-marking badminton shoes mandatory. Maximum 4 players.',
    openingTime: '06:00:00',
    closingTime: '22:00:00',
    slotDurationMinutes: 60,
    maxPlayers: 4,
    isActive: 1,
  },
  {
    id: 'fac-badminton-2',
    campusId: 'nmit',
    name: 'Badminton Court 2',
    sportType: 'BADMINTON',
    venueType: 'INDOOR',
    location: 'Indoor Sports Complex · Floor 1',
    description: 'Tournament synthetic court with net tension regulator.',
    rules: 'Non-marking shoes only. Maximum 4 players per slot.',
    openingTime: '06:00:00',
    closingTime: '22:00:00',
    slotDurationMinutes: 60,
    maxPlayers: 4,
    isActive: 1,
  },
  {
    id: 'fac-pickleball-1',
    campusId: 'nmit',
    name: 'Pickleball Court A',
    sportType: 'PICKLEBALL',
    venueType: 'OUTDOOR',
    location: 'North Quad Sports Arena',
    description: 'Dedicated outdoor acrylic pickleball court with night floodlights.',
    rules: 'Standard pickleball paddles and balls required. Respect slot timing.',
    openingTime: '06:00:00',
    closingTime: '21:00:00',
    slotDurationMinutes: 60,
    maxPlayers: 4,
    isActive: 1,
  },
  {
    id: 'fac-basketball-1',
    campusId: 'nmit',
    name: 'Main Basketball Arena',
    sportType: 'BASKETBALL',
    venueType: 'OUTDOOR',
    location: 'Campus Central Ground',
    description: 'Full-size regulation outdoor basketball court with fiber backboards.',
    rules: 'Proper sports footwear required. Maximum 10 players for full-court run.',
    openingTime: '06:00:00',
    closingTime: '20:00:00',
    slotDurationMinutes: 60,
    maxPlayers: 10,
    isActive: 1,
  },
];

export async function fetchSportsFacilitiesApi(
  token?: string,
  tenantId?: string,
  query?: { sportType?: string; venueType?: string; search?: string },
): Promise<SportsFacility[]> {
  try {
    const queryParts: string[] = [];
    if (query?.sportType && query.sportType !== 'All') {
      queryParts.push(`sportType=${encodeURIComponent(query.sportType)}`);
    }
    if (query?.venueType && query.venueType !== 'All') {
      queryParts.push(`venueType=${encodeURIComponent(query.venueType)}`);
    }
    if (query?.search && query.search.trim()) {
      queryParts.push(`search=${encodeURIComponent(query.search.trim())}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await apiRequest<SportsFacility[]>(`/sports/facilities${qs}`, {
      method: 'GET',
      token,
      tenantId,
    });
    return res && res.length > 0 ? res : FALLBACK_FACILITIES;
  } catch (error) {
    console.warn('fetchSportsFacilitiesApi fallback:', error);
    return FALLBACK_FACILITIES;
  }
}

export async function fetchSlotAvailabilityApi(
  token: string | undefined,
  tenantId: string | undefined,
  facilityId: string,
  date: string,
): Promise<{ facility: SportsFacility; date: string; slots: SlotAvailability[] }> {
  try {
    return await apiRequest<{ facility: SportsFacility; date: string; slots: SlotAvailability[] }>(
      `/sports/facilities/${facilityId}/slots?date=${encodeURIComponent(date)}`,
      { method: 'GET', token, tenantId },
    );
  } catch (error) {
    console.warn('fetchSlotAvailabilityApi fallback:', error);
    // Generate fallback slots
    const slots: SlotAvailability[] = [];
    for (let h = 6; h <= 21; h++) {
      const sH = String(h).padStart(2, '0');
      const eH = String(h + 1).padStart(2, '0');
      slots.push({
        startTime: `${sH}:00:00`,
        endTime: `${eH}:00:00`,
        status: h === 18 ? 'BOOKED' : 'AVAILABLE',
        maxPlayers: 4,
        currentPlayers: h === 18 ? 2 : 0,
      });
    }
    const facility = FALLBACK_FACILITIES.find((f) => f.id === facilityId) || FALLBACK_FACILITIES[0];
    return { facility, date, slots };
  }
}

export async function createSportsBookingApi(
  token: string,
  tenantId: string,
  payload: CreateBookingPayload,
): Promise<SportsBooking> {
  return apiRequest<SportsBooking>('/sports/bookings', {
    method: 'POST',
    token,
    tenantId,
    body: payload,
  });
}

export async function fetchMySportsBookingsApi(
  token?: string,
  tenantId?: string,
): Promise<SportsBooking[]> {
  try {
    return await apiRequest<SportsBooking[]>('/sports/bookings/my', {
      method: 'GET',
      token,
      tenantId,
    });
  } catch (error) {
    console.warn('fetchMySportsBookingsApi fallback:', error);
    return [];
  }
}

export async function joinGameByCodeApi(
  token: string,
  tenantId: string,
  inviteCode: string,
): Promise<SportsBooking> {
  return apiRequest<SportsBooking>('/sports/bookings/join-code', {
    method: 'POST',
    token,
    tenantId,
    body: { inviteCode },
  });
}

export async function fetchOpenGamesApi(
  token?: string,
  tenantId?: string,
): Promise<SportsBooking[]> {
  try {
    return await apiRequest<SportsBooking[]>('/sports/open-games', {
      method: 'GET',
      token,
      tenantId,
    });
  } catch (error) {
    console.warn('fetchOpenGamesApi fallback:', error);
    return [];
  }
}

export async function cancelSportsBookingApi(
  token: string,
  tenantId: string,
  bookingId: string,
  reason?: string,
): Promise<SportsBooking> {
  return apiRequest<SportsBooking>(`/sports/bookings/${bookingId}/cancel`, {
    method: 'POST',
    token,
    tenantId,
    body: { reason },
  });
}
