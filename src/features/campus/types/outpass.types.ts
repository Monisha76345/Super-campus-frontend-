export type OutpassStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE';

export type PassType = 'OUTPASS' | 'LEAVE';

export interface OutpassItem {
  id: string;
  studentId: string;
  studentName?: string | null;
  usn?: string | null;
  roomNumber?: string | null;
  passType?: PassType;
  destination: string;
  reason: string;
  departureTime: string;
  returnTime: string;
  status: OutpassStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  actualExitTime?: string | null;
  actualEntryTime?: string | null;
  qrToken?: string | null;
  parentPhone?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOutpassInput {
  destination: string;
  reason: string;
  departureTime: string;
  returnTime: string;
  passType?: PassType;
  roomNumber?: string;
  parentPhone?: string;
}

export interface GateScanResult {
  actionTaken: 'EXIT' | 'ENTRY';
  outpass: OutpassItem;
  parentPhone: string | null;
  smsSent: boolean;
  messageText: string;
}
