import React, { useState } from 'react';

import { Button } from '@/components/ui';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Banner, Chips, Note } from './parts';

const SPORTS = ['Basketball', 'Football', 'Badminton', 'Cricket'];
const COURTS: Record<string, string> = {
  Basketball: 'Main campus court · Evening slots open',
  Football: 'North ground turf',
  Badminton: 'Indoor hall · Court 2',
  Cricket: 'Practice nets',
};

export function SportsScreen() {
  const [sport, setSport] = useState('Basketball');
  const [booked, setBooked] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed && booked) {
    return (
      <CampusScreen title="Booking Confirmed!" subtitle="Game on! See you at the court." activeTab="services">
        <Banner kicker="YOUR BOOKING" title={booked} body={COURTS[booked] ?? 'Campus venue'} />
        <Button
          title="Go to My bookings"
          onPress={() => setConfirmed(false)}
        />
      </CampusScreen>
    );
  }

  return (
    <CampusScreen title="Sports" subtitle="Book. Play. Connect." activeTab="services">
      <Note>Book a court or join a game with others on campus.</Note>
      <Chips options={SPORTS} value={sport} onChange={setSport} />
      <CampusCard icon="basketball" title={sport} detail={COURTS[sport]} meta="Open" accent="#A78BFA" />
      {booked ? (
        <CampusCard icon="calendar" title="Upcoming booking" detail={booked} meta="Kept" accent="#34D399" />
      ) : (
        <Note>No bookings yet. Your next pass will show here.</Note>
      )}
      <Button
        title="Book a Court"
        onPress={() => {
          setBooked(sport);
          setConfirmed(true);
        }}
      />
      {booked ? (
        <Button
          title="Cancel booking"
          variant="outline"
          onPress={() => setBooked(null)}
        />
      ) : null}
    </CampusScreen>
  );
}
