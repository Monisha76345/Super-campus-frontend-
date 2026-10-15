import React, { useState } from 'react';

import { Button } from '@/components/ui';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Banner, Field } from './parts';

type Project = { title: string; detail: string; meta: string };

const STARTER: Project[] = [
  { title: 'Campus navigator', detail: 'Looking for a React Native partner', meta: 'Open' },
  { title: 'Lab inventory', detail: 'Faculty advised · 3 members', meta: 'Team' },
];

export function ProjectsScreen() {
  const [mode, setMode] = useState<'list' | 'create' | 'detail'>('list');
  const [projects, setProjects] = useState(STARTER);
  const [selected, setSelected] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [about, setAbout] = useState('');

  if (mode === 'create') {
    return (
      <CampusScreen title="Create Project" subtitle="Tell us about your project." activeTab="services">
        <Field label="Project title" placeholder="Untitled project" value={title} onChangeText={setTitle} />
        <Field label="About" placeholder="What should the campus team build?" value={about} onChangeText={setAbout} />
        <Button
          title="Publish Project"
          onPress={() => {
            if (!title.trim()) {
              return;
            }
            const created = { title: title.trim(), detail: about.trim() || 'Campus team', meta: 'Mine' };
            setProjects((current) => [created, ...current]);
            setTitle('');
            setAbout('');
            setSelected(created);
            setMode('detail');
          }}
        />
        <Button title="Back" variant="ghost" onPress={() => setMode('list')} />
      </CampusScreen>
    );
  }

  if (mode === 'detail' && selected) {
    return (
      <CampusScreen title="Project Details" subtitle={selected.title} activeTab="services">
        <Banner kicker="COLLABORATE" title={selected.title} body={selected.detail} />
        <Button title="Back to projects" variant="ghost" onPress={() => setMode('list')} />
      </CampusScreen>
    );
  }

  return (
    <CampusScreen title="Projects" subtitle="Collaborate with campus teams." activeTab="services">
      <Button title="Create project" onPress={() => setMode('create')} />
      {projects.map((project) => (
        <CampusCard
          key={project.title}
          icon="rocket"
          title={project.title}
          detail={project.detail}
          meta={project.meta}
          onPress={() => {
            setSelected(project);
            setMode('detail');
          }}
        />
      ))}
    </CampusScreen>
  );
}
