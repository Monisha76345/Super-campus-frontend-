import { useRouter } from 'expo-router';

import { TabKey } from '@/features/home/components/HomeBottomTabs';

type AppRouter = ReturnType<typeof useRouter>;

export function openTab(router: AppRouter, tab: TabKey) {
  if (tab === 'home') {
    router.replace('/home');
    return;
  }
  if (tab === 'services') {
    router.replace('/services');
    return;
  }
  if (tab === 'community') {
    router.replace('/buzz');
    return;
  }
  router.replace('/profile');
}

export function openService(router: AppRouter, id: string) {
  const path =
    id === 'food'
      ? '/food'
      : id === 'outpass'
        ? '/outpass'
        : id === 'sports'
          ? '/sports'
          : id === 'marketplace'
            ? '/marketplace'
            : id === 'projects'
              ? '/projects'
              : id === 'connect'
                ? '/connect'
                : id === 'messages'
                  ? '/messages'
                  : '/notifications';
  router.push(path);
}
