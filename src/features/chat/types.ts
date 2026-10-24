export interface ParticipantSummary {
  userId: string;
  fullName: string;
  usn: string | null;
  role: string;
  initials: string;
  department: string | null;
  photoKey?: string | null;
}

export interface ChatThread {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string | null;
  photoKey?: string | null;
  recipient: ParticipantSummary;
  participantsCount?: number;
  participants?: ParticipantSummary[];
  lastMessageText: string | null;
  lastMessageAt: string | null;
  formattedDate: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderUsn: string | null;
  senderPhotoKey?: string | null;
  senderInitials?: string | null;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  isMine: boolean;
  createdAt: string;
  formattedTime: string;
}

export interface SearchUser {
  userId: string;
  id?: string;
  fullName: string;
  usn: string;
  collegeEmail: string;
  role: string;
  department: string | null;
  initials: string;
  photoKey?: string | null;
}
