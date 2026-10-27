export type ConnectTab = 'events' | 'clubs' | 'internships' | 'jobs';

export type DirectoryRole = 'Alumni' | 'Students' | 'Faculty' | 'Connections';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number | null;
  registeredCount: number;
  bannerKey: string | null;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  formattedDate: string;
  formattedTime: string;
  createdBy: string;
}

export interface ClubMember {
  userId: string;
  fullName: string;
  clubRole: string;
  department: string;
  batch?: string | null;
  usn?: string | null;
  initials: string;
  isLead: boolean;
}

export interface CampusClub {
  id: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  bannerKey: string | null;
  status: string;
  leadUserId?: string | null;
  leadName?: string | null;
  meetingSchedule?: string | null;
  roomOrVenue?: string | null;
  contactEmail?: string | null;
  isJoined?: boolean;
  members?: ClubMember[];
}

export interface CampusOpportunity {
  id: string;
  title: string;
  company: string;
  type: 'INTERNSHIP' | 'JOB';
  location: string;
  stipendOrSalary: string | null;
  description: string;
  applyUrl: string | null;
  deadline: string | null;
}

export interface ConnectMember {
  userId: string;
  fullName: string;
  role: string;
  batch: string | null;
  department: string | null;
  initials: string;
  photoKey: string | null;
  usn: string | null;
  program?: string | null;
  email?: string | null;
  handle?: string;
  connectionId?: string | null;
  connectionStatus?: 'NONE' | 'PENDING' | 'INCOMING_REQUEST' | 'ACCEPTED';
}

export interface IncomingConnectionRequest {
  connectionId: string;
  requesterUserId: string;
  fullName: string;
  role: string;
  department: string | null;
  batch: string | null;
  program: string | null;
  initials: string;
  handle: string;
  photoKey: string | null;
  createdAt: string;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity?: number;
}

export interface CreateOpportunityPayload {
  title: string;
  company: string;
  type: 'INTERNSHIP' | 'JOB';
  location: string;
  description: string;
  skillsAndEligibility?: string;
  stipendOrSalary?: string;
  deadline?: string;
  applyUrl?: string;
}
