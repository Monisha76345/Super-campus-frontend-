import React, { useState } from 'react';

import { Button } from '@/components/ui';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Field, Note } from './parts';

export function OutpassScreen() {
  const [where, setWhere] = useState('');
  const [until, setUntil] = useState('');
  const [passes, setPasses] = useState<{ where: string; until: string }[]>([]);

  return (
    <CampusScreen title="Hostel outpass" subtitle="Request an outpass for the main campus gate." activeTab="services">
      <Note>Set your residency to Hostel Resident in Profile before requesting an outpass.</Note>
      <Field label="Where are you going?" placeholder="Home visit" value={where} onChangeText={setWhere} />
      <Field label="Return by" placeholder="10:30 PM" value={until} onChangeText={setUntil} />
      <Button
        title="Request an outpass"
        onPress={() => {
          if (!where.trim()) {
            return;
          }
          setPasses((current) => [{ where: where.trim(), until: until.trim() || '10:30 PM' }, ...current]);
          setWhere('');
          setUntil('');
        }}
      />
      {passes.length === 0 ? (
        <CampusCard icon="exit" title="My outpasses" detail="No outpass requests yet." meta="Empty" />
      ) : (
        passes.map((pass) => (
          <CampusCard
            key={`${pass.where}-${pass.until}`}
            icon="checkmark-circle"
            title={pass.where}
            detail={`Main Campus Gate · Valid till ${pass.until}`}
            meta="Active"
            accent="#34D399"
          />
        ))
      )}
    </CampusScreen>
  );
}
