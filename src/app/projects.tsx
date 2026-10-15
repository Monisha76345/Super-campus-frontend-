import React from 'react';

import { ProjectsScreen } from '@/features/campus/screens';
import { ScreenContainer } from '@/layouts';

export default function ProjectsRoute() {
  return (
    <ScreenContainer scrollable={false}>
      <ProjectsScreen />
    </ScreenContainer>
  );
}
