import {
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
    useFonts,
} from '@expo-google-fonts/outfit';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { BackHandler, Platform } from 'react-native';

import { AuthSessionProvider } from '@/features/auth';
import { AppThemeProvider, useAppTheme } from '@/theme/app-theme';
import { AlertModalProvider } from '@/components/ui';

SplashScreen.hideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  return (
    <AuthSessionProvider>
      <AppThemeProvider>
        <AlertModalProvider>
          <RootNavigator />
        </AlertModalProvider>
      </AppThemeProvider>
    </AuthSessionProvider>
  );
}

function RootNavigator() {
  const { colors, scheme } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Android Back Button Handling:
  // When pressing back from any feature/tab, come to Home first.
  // When already on Home, exit the application.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // If on auth login or root landing, allow default exit
      if (
        pathname === '/' ||
        pathname === '/index' ||
        pathname === '/(auth)/login' ||
        pathname === '/login'
      ) {
        return false;
      }

      // If on forgot password, return to login
      if (pathname === '/(auth)/forgot-password' || pathname === '/forgot-password') {
        router.replace('/(auth)/login');
        return true;
      }

      // If user is already on home, exit the application
      if (pathname === '/home') {
        BackHandler.exitApp();
        return true;
      }

      // On any other screen or feature, back button navigates back to Home first
      router.replace('/home');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [pathname, router]);

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary.main,
        background: colors.background.canvas,
        card: colors.background.canvas,
        text: colors.text.primary,
        border: colors.border.subtle,
      },
    };
  }, [colors, scheme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background.canvas },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="discover" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ headerShown: false }} />
        <Stack.Screen name="connect" options={{ headerShown: false }} />
        <Stack.Screen name="inbox" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="marketplace" options={{ headerShown: false }} />
        <Stack.Screen name="sports" options={{ headerShown: false }} />
        <Stack.Screen name="food" options={{ headerShown: false }} />
        <Stack.Screen name="outpass" options={{ headerShown: false }} />
        <Stack.Screen name="projects" options={{ headerShown: false }} />
        <Stack.Screen name="services" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false }} />
        <Stack.Screen name="buzz" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
