export type PostVisibility = 'ONLY_ME' | 'CAMPUS' | 'PUBLIC';
export type PostStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  campusId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorHandle: string | null;
  authorAvatar: string | null;
  content: string;
  mediaUrls: string[];
  visibility: PostVisibility;
  status: PostStatus;
  rejectionReason: string | null;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  comments: PostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface MySubmissionsData {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  posts: CommunityPost[];
}

export interface CreatePostPayload {
  content: string;
  mediaUrls?: string[];
  visibility?: PostVisibility;
}
