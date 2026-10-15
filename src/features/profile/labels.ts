import { AppTheme, ProfileVisibility, ResidencyStatus } from './enums';

export const VISIBILITY_OPTIONS = [ProfileVisibility.Private, ProfileVisibility.Campus, ProfileVisibility.Public] as const;

export const RESIDENCY_OPTIONS = [ResidencyStatus.NotSet, ResidencyStatus.DayScholar, ResidencyStatus.HostelResident] as const;

export const THEME_OPTIONS = [AppTheme.Light, AppTheme.Dark, AppTheme.System] as const;

const VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  [ProfileVisibility.Private]: 'Private',
  [ProfileVisibility.Campus]: 'Campus',
  [ProfileVisibility.Public]: 'Public',
};

const RESIDENCY_LABEL: Record<ResidencyStatus, string> = {
  [ResidencyStatus.NotSet]: 'Not set',
  [ResidencyStatus.DayScholar]: 'Day Scholar',
  [ResidencyStatus.HostelResident]: 'Hostel Resident',
};

const THEME_LABEL: Record<AppTheme, string> = {
  [AppTheme.Light]: 'Light',
  [AppTheme.Dark]: 'Dark',
  [AppTheme.System]: 'System',
};

const THEME_DETAIL: Record<AppTheme, string> = {
  [AppTheme.Light]: 'Always use light appearance',
  [AppTheme.Dark]: 'Always use dark appearance',
  [AppTheme.System]: 'Match your device setting',
};

export function visibilityLabel(value: ProfileVisibility): string {
  return VISIBILITY_LABEL[value];
}

export function residencyLabel(value: ResidencyStatus): string {
  return RESIDENCY_LABEL[value];
}

export function themeLabel(value: AppTheme): string {
  return THEME_LABEL[value];
}

export function themeDetail(value: AppTheme): string {
  return THEME_DETAIL[value];
}

export function displayName(firstName: string | null, lastName: string | null, fallback: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || fallback;
}
