import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Banner, Note } from './parts';
import { openService } from './navigation';

const SERVICES = [
  { id: 'food', title: 'Campus dining', detail: 'Same campus. Healthier you.', icon: 'fast-food' as const, accent: '#F59E0B' },
  { id: 'outpass', title: 'Hostel outpass', detail: 'Request a gate pass', icon: 'qr-code' as const, accent: '#38BDF8' },
  { id: 'sports', title: 'Sports', detail: 'Book. Play. Connect.', icon: 'basketball' as const, accent: '#A78BFA' },
  { id: 'marketplace', title: 'Marketplace', detail: 'Buy and sell on campus', icon: 'bag-handle' as const, accent: '#34D399' },
  { id: 'projects', title: 'Projects', detail: 'Collaborate with a team', icon: 'rocket' as const, accent: '#818CF8' },
  { id: 'connect', title: 'Connect', detail: 'Your campus community', icon: 'people' as const, accent: '#C084FC' },
  { id: 'messages', title: 'Messages', detail: 'Write a message', icon: 'chatbubbles' as const, accent: '#60A5FA' },
  { id: 'notifications', title: 'Notifications', detail: 'Campus alerts', icon: 'notifications' as const, accent: '#F59E0B' },
];

export function ServicesScreen() {
  const router = useRouter();
  return (
    <CampusScreen title="Campus Services" subtitle="Your campus, in one place." activeTab="services">
      {SERVICES.map((item) => (
        <CampusCard
          key={item.id}
          icon={item.icon}
          title={item.title}
          detail={item.detail}
          accent={item.accent}
          meta="Open"
          onPress={() => openService(router, item.id)}
        />
      ))}
    </CampusScreen>
  );
}

export function BuzzScreen() {
  return (
    <CampusScreen title="Campus updates" subtitle="Trending on SuperCampus." activeTab="community">
      <Banner
        kicker="FEED"
        title="Around campus"
        body="Open studio tonight at the innovation lab. Bring a sketchbook."
      />
      <CampusCard icon="school" title="Cloud Architecture & DevOps" detail="Lecture Hall 302 · Academic Block B · 10:30 AM" meta="Today" accent="#38BDF8" />
      <CampusCard icon="people" title="From your community" detail="14 campus comments on the latest project showcase." meta="14" accent="#C084FC" />
      <CampusCard icon="megaphone" title="Campus events" detail="Explore and join campus clubs." meta="New" />
    </CampusScreen>
  );
}

export function FoodScreen() {
  return (
    <CampusScreen title="Campus dining" subtitle="Same Campus. Healthier You." activeTab="services">
      <Banner kicker="FOOD FOR YOU" title="Campus dining" body="Open cafes and the food court on NMIT." />
      <CampusCard icon="pizza" title="Student Bistro" detail="Fast food and snacks · 10m wait" meta="Open" accent="#F59E0B" />
      <CampusCard icon="cafe" title="Tech Cafe Express" detail="Coffee and bakery · 5m wait" meta="Open" accent="#38BDF8" />
      <CampusCard icon="restaurant" title="NMIT Food Court" detail="Meals through the evening" meta="Open" accent="#F59E0B" />
    </CampusScreen>
  );
}

export function NotificationsScreen() {
  return (
    <CampusScreen title="Notifications" subtitle="Campus alerts stay in your inbox." activeTab="profile">
      <Note>Get campus alerts even when the app is closed. Private details remain inside your inbox.</Note>
      <CampusCard icon="time" title="Next lecture in 35m" detail="Cloud Architecture & DevOps · Lecture Hall 302" meta="Now" />
      <CampusCard icon="exit" title="Outpass is active" detail="Main Campus Gate · Valid till 10:30 PM" meta="Gate" accent="#34D399" />
      <CampusCard icon="basketball" title="Upcoming booking" detail="Basketball · Main campus court" meta="Sports" accent="#A78BFA" />
    </CampusScreen>
  );
}

export function ScanScreen() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  return (
    <CampusScreen title="Scan" subtitle="Scan a Sports entry pass or the campus gate." activeTab="home">
      <View style={styles.finder}>
        <Text style={styles.finderMark}>QR</Text>
        <Text style={styles.finderText}>Point the camera at a campus QR code</Text>
      </View>
    </CampusScreen>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  finder: {
    height: 280,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.surface,
    gap: 16,
    padding: 24,
  },
  finderMark: {
    fontFamily: Typography.bold,
    color: Colors.primary.cyan,
    fontSize: 42,
    letterSpacing: 4,
  },
  finderText: {
    fontFamily: Typography.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: 14,
  },
});
}
