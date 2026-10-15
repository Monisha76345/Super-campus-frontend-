import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';

import { Button } from '@/components/ui';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Banner, Chips, Field } from './parts';

type Person = {
  name: string;
  role: 'Students' | 'Faculty' | 'Alumni';
  detail: string;
};

const PEOPLE: Person[] = [
  { name: 'Druva', role: 'Students', detail: '1NT22AD015 · AI & Data Science · 2022' },
  { name: 'Anu D', role: 'Faculty', detail: 'Artificial Intelligence · Faculty' },
  { name: 'Alumni Sample', role: 'Alumni', detail: '1NT18CS001 · Computer Science · 2018' },
];

export function ConnectScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('Students');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Person | null>(null);

  const rows = useMemo(() => {
    const pool = tab === 'Connections' ? PEOPLE.slice(0, 1) : PEOPLE.filter((person) => person.role === tab);
    const needle = query.trim().toLowerCase();
    return pool.filter((person) => !needle || person.name.toLowerCase().includes(needle));
  }, [query, tab]);

  if (selected) {
    return (
      <CampusScreen title={selected.name} subtitle="Member profile" activeTab="services">
        <Banner kicker="SAME CAMPUS" title={selected.role.replace(/s$/, '')} body={selected.detail} />
        <Button title="Message" onPress={() => router.push('/messages')} />
        <Button title="Back to Connect" variant="ghost" onPress={() => setSelected(null)} />
      </CampusScreen>
    );
  }

  return (
    <CampusScreen title="Connect" subtitle="Connect. Collaborate. Grow." activeTab="services">
      <Banner
        kicker="YOUR CAMPUS COMMUNITY"
        title="Find your campus"
        body="Search students, faculty, and alumni. Open a profile and start a conversation."
      />
      <Field
        label="Search"
        placeholder={
          tab === 'Faculty'
            ? 'Search faculty by name'
            : tab === 'Alumni'
              ? 'Search alumni by name'
              : tab === 'Connections'
                ? 'Search your connections'
                : 'Search students by name'
        }
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
        autoCorrect={false}
      />
      <Chips options={['Students', 'Faculty', 'Alumni', 'Connections']} value={tab} onChange={setTab} />
      {rows.length === 0 ? (
        <CampusCard icon="people" title="No matches" detail="Try another name in your campus directory." />
      ) : (
        rows.map((person) => (
          <CampusCard
            key={person.name}
            icon={person.role === 'Faculty' ? 'school' : 'person'}
            title={person.name}
            detail={person.detail}
            meta={person.role === 'Students' ? 'Student' : person.role.replace(/s$/, '')}
            onPress={() => setSelected(person)}
          />
        ))
      )}
    </CampusScreen>
  );
}
