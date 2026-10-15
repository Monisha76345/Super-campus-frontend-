import { ProfileVisibility, ResidencyStatus } from './enums';

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  startDate: string | null;
  endDate: string | null;
  visibility: ProfileVisibility;
}

export interface ExperienceEntry {
  id: string;
  employer: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  visibility: ProfileVisibility;
}

export interface SkillEntry {
  id: string;
  name: string;
}

export interface CampusProfile {
  id: string;
  usn: string;
  collegeEmail: string;
  role: string;
  department: string | null;
  batch: string | null;
  firstName: string | null;
  lastName: string | null;
  handle: string | null;
  graduationYear: number | null;
  visibility: ProfileVisibility;
  residency: ResidencyStatus;
  bio: string | null;
  photoDocumentId: number | null;
  photoKey: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: SkillEntry[];
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  handle?: string;
  graduationYear?: number;
  visibility?: ProfileVisibility;
  residency?: ResidencyStatus;
  bio?: string;
}

export interface EducationInput {
  school: string;
  degree: string;
  startDate?: string;
  endDate?: string;
  visibility?: ProfileVisibility;
}

export interface ExperienceInput {
  employer: string;
  title: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  visibility?: ProfileVisibility;
}
