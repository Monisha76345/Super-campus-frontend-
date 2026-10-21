import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { useAuthSession } from '@/features/auth';
import { HomeBottomTabs } from '@/features/home/components/HomeBottomTabs';
import { openTab } from '@/features/campus/navigation';
import { useAppTheme } from '@/theme/app-theme';
import { LogoLoader } from '@/components/ui/LogoLoader';
import { ConnectHomeScreen } from './ConnectHomeScreen';
import { ConnectDirectoryScreen } from './ConnectDirectoryScreen';
import { ConnectFeedScreen } from './ConnectFeedScreen';
import { CreateEventScreen } from './CreateEventScreen';
import { CreateOpportunityScreen } from './CreateOpportunityScreen';
import { MemberProfileScreen } from './MemberProfileScreen';
import { ConnectMember, ConnectTab } from '../types/connect-types';

type ConnectViewMode =
  | 'hub'
  | 'directory'
  | 'feed'
  | 'create_event'
  | 'create_opportunity'
  | 'member_profile';

export function ConnectHubScreen() {
  const router = useRouter();
  const { colors: Colors } = useAppTheme();
  const { user } = useAuthSession();
  const token = user?.token || '';
  const tenantId = user?.tenantId || 'nmit';
  const campusName = user?.campusName?.replace(/\s*campus\s*/i, '').trim() || 'NMIT';

  const [mode, setMode] = useState<ConnectViewMode>('hub');
  const [previousMode, setPreviousMode] = useState<ConnectViewMode>('hub');
  const [selectedMember, setSelectedMember] = useState<ConnectMember | null>(null);
  const [selectedFeedTab, setSelectedFeedTab] = useState<ConnectTab>('events');
  const [opportunityType, setOpportunityType] = useState<'INTERNSHIP' | 'JOB'>('INTERNSHIP');
  const [screenTransitioning, setScreenTransitioning] = useState(false);

  const transitionTo = (nextMode: ConnectViewMode, tab?: ConnectTab) => {
    setScreenTransitioning(true);
    if (tab) setSelectedFeedTab(tab);
    setTimeout(() => {
      setMode(nextMode);
      setScreenTransitioning(false);
    }, 180);
  };

  const handleSelectCategory = (tab: ConnectTab) => {
    transitionTo('feed', tab);
  };

  const handleOpenCreateOpportunity = (type: 'INTERNSHIP' | 'JOB') => {
    setOpportunityType(type);
    transitionTo('create_opportunity');
  };

  const handleViewMemberProfile = (member: ConnectMember) => {
    setSelectedMember(member);
    setPreviousMode(mode);
    transitionTo('member_profile');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.canvas }}>
      {screenTransitioning && <LogoLoader overlay text="Loading Connect..." />}

      {mode === 'hub' && (
        <ConnectHomeScreen
          campusName={campusName}
          token={token}
          tenantId={tenantId}
          onRefresh={() => transitionTo('hub')}
          onOpenNotifications={() => router.push('/notifications')}
          onSelectCategory={handleSelectCategory}
          onOpenClubsFeed={() => transitionTo('feed', 'clubs')}
          onOpenEventsFeed={() => transitionTo('feed', 'events')}
          onViewMemberProfile={handleViewMemberProfile}
        />
      )}

      {mode === 'directory' && (
        <ConnectDirectoryScreen
          token={token}
          tenantId={tenantId}
          onBack={() => transitionTo('hub')}
          onViewMemberProfile={handleViewMemberProfile}
        />
      )}

      {mode === 'feed' && (
        <ConnectFeedScreen
          campusName={campusName}
          initialTab={selectedFeedTab}
          token={token}
          tenantId={tenantId}
          onBack={() => transitionTo('hub')}
          onOpenCreateEvent={() => transitionTo('create_event')}
          onOpenCreateOpportunity={handleOpenCreateOpportunity}
        />
      )}

      {mode === 'create_event' && (
        <CreateEventScreen
          campusName={campusName}
          token={token}
          tenantId={tenantId}
          onBack={() => transitionTo('feed', 'events')}
          onEventCreated={() => transitionTo('feed', 'events')}
        />
      )}

      {mode === 'create_opportunity' && (
        <CreateOpportunityScreen
          campusName={campusName}
          type={opportunityType}
          token={token}
          tenantId={tenantId}
          onBack={() => transitionTo('feed', opportunityType === 'INTERNSHIP' ? 'internships' : 'jobs')}
          onOpportunityCreated={() => transitionTo('feed', opportunityType === 'INTERNSHIP' ? 'internships' : 'jobs')}
        />
      )}

      {mode === 'member_profile' && selectedMember && (
        <MemberProfileScreen
          member={selectedMember}
          token={token}
          tenantId={tenantId}
          onBack={() => transitionTo(previousMode)}
        />
      )}

      {/* Floating 5-tab Bottom Navigation Bar (hidden on dedicated modals/screens) */}
      {mode !== 'member_profile' && mode !== 'create_event' && mode !== 'create_opportunity' && (
        <HomeBottomTabs
          activeTab="connect"
          onTabChange={(tab) => openTab(router, tab)}
        />
      )}
    </View>
  );
}
