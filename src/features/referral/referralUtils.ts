import { Share } from 'react-native';

const DEFAULT_REFERRAL_CODE = 'CAMPUS2026';
const REFERRAL_BASE_URL = 'https://supercampus.io/join';

export function parseReferralCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // If it's a URL
  if (trimmed.includes('://') || trimmed.includes('?ref=') || trimmed.includes('&ref=')) {
    try {
      // Look for ref= or code= parameter
      const match = trimmed.match(/[?&](?:ref|referral|code)=([^&#\s]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).trim().toUpperCase();
      }
    } catch {
      // Fallback to sanitization
    }
  }

  // Treat as raw referral code: remove non-alphanumeric except hyphen/underscore
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
}

export function generateReferralLink(code?: string): string {
  const cleanCode = (code || DEFAULT_REFERRAL_CODE).trim().toUpperCase();
  return `${REFERRAL_BASE_URL}?ref=${encodeURIComponent(cleanCode)}`;
}

export async function shareReferralInvite(code?: string): Promise<boolean> {
  const referralCode = (code || DEFAULT_REFERRAL_CODE).trim().toUpperCase();
  const inviteUrl = generateReferralLink(referralCode);

  try {
    const result = await Share.share({
      title: 'Join Supercampus — All-in-one Campus App',
      message: `Join me on Supercampus! Find student communities, book sports courts, access marketplace, and get campus updates.\n\nUse my referral link: ${inviteUrl}\nor referral code: ${referralCode}`,
      url: inviteUrl,
    });

    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
