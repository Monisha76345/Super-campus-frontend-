export type ProjectStatus = 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type ProjectCategory =
  | 'Academic'
  | 'Hackathon'
  | 'Startup'
  | 'Research'
  | 'Social impact'
  | 'Open source';

export type ProjectStage =
  | 'Idea'
  | 'Planning'
  | 'Prototype'
  | 'In Progress'
  | 'Completed';

export type ProjectSupportType =
  | 'HIRE_STUDENTS'
  | 'HIRE_MENTOR'
  | 'COLLEGE_FUNDING'
  | 'CROWDFUNDING';

export type ProjectVisibility = 'CAMPUS_ONLY' | 'PUBLIC';

export interface ProjectSupportItem {
  id?: string;
  serviceType: ProjectSupportType;
  rolesNeeded?: string | null;
  numberOfStudents?: string | null;
  commitment?: string | null;
  preferredSkills?: string | null;
  mentorDomain?: string | null;
  fundingDetails?: string | null;
}

export interface ProjectMediaItem {
  id?: string;
  mediaType: string;
  fileUrl: string;
  fileName?: string | null;
}

export interface ProjectContribution {
  id: string;
  projectId: string;
  contributorName: string;
  contributorRole?: string | null;
  fundingType: 'COLLEGE_FUNDING' | 'CROWDFUNDING';
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paymentStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  createdAt: string;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  applicantName: string;
  applicantRole?: string | null;
  applicantUsn?: string | null;
  roleApplied: string;
  message?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface Project {
  id: string;
  campusId: string;
  creatorId: string;
  creatorName?: string | null;
  creatorUsn?: string | null;
  creatorRole?: string | null;
  creatorDepartment?: string | null;
  creatorEmployeeId?: string | null;
  creatorBatch?: string | null;
  title: string;
  shortDescription: string;
  moreDetails?: string | null;
  category: ProjectCategory;
  stage: ProjectStage;
  status: ProjectStatus;
  duration: string;
  location: string;
  visibility: ProjectVisibility;
  bannerUrl?: string | null;
  fundingTarget?: number;
  fundingRaised?: number;
  backersCount?: number;
  skills: string[];
  supportNeeds: ProjectSupportItem[];
  media: ProjectMediaItem[];
  pdfDocument?: {
    name: string;
    size?: number;
    uri: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  shortDescription: string;
  moreDetails?: string;
  category: ProjectCategory;
  stage: ProjectStage;
  duration?: string;
  location?: string;
  visibility?: ProjectVisibility;
  fundingTarget?: number;
  skills?: string[];
  supportNeeds?: ProjectSupportItem[];
  bannerUrl?: string;
  pdfDocument?: {
    name: string;
    size?: number;
    uri: string;
  } | null;
}
