import { useRouter } from 'expo-router';

import { openService } from '@/features/campus/navigation';

type AppRouter = ReturnType<typeof useRouter>;

export function routeFromNotificationData(
  router: AppRouter,
  data?: Record<string, unknown> | null,
) {
  const screen = typeof data?.screen === 'string' ? data.screen : '';

  switch (screen) {
    case 'chat':
      router.push('/inbox');
      return;
    case 'outpass':
      openService(router as any, 'outpass');
      return;
    case 'sports':
      openService(router as any, 'sports');
      return;
    case 'marketplace':
      openService(router as any, 'marketplace');
      return;
    case 'projects':
      openService(router as any, 'projects');
      return;
    case 'connect':
      openService(router as any, 'connect');
      return;
    default:
      router.push('/notifications');
  }
}

export function categoryIcon(
  category: string,
): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap {
  switch (category) {
    case 'MESSAGES':
      return 'chatbubbles';
    case 'OUTPASS':
      return 'exit';
    case 'SPORTS':
      return 'basketball';
    case 'PROJECTS':
      return 'rocket';
    case 'MARKETPLACE':
      return 'bag-handle';
    case 'CONNECT':
      return 'people';
    default:
      return 'notifications';
  }
}

export function categoryAccent(category: string): string {
  switch (category) {
    case 'MESSAGES':
      return '#60A5FA';
    case 'OUTPASS':
      return '#F59E0B';
    case 'SPORTS':
      return '#A78BFA';
    case 'PROJECTS':
      return '#818CF8';
    case 'MARKETPLACE':
      return '#34D399';
    case 'CONNECT':
      return '#C084FC';
    default:
      return '#38BDF8';
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
