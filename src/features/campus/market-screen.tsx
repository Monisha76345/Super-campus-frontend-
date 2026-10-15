import React, { useState } from 'react';

import { Button } from '@/components/ui';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Banner, Field, Note } from './parts';

type Listing = { title: string; detail: string; price: string };

const STARTER: Listing[] = [
  { title: 'Data structures notes', detail: 'Semester 3 · Library porch', price: '₹200' },
  { title: 'Drawing tablet', detail: 'Lightly used · Hostel block C', price: '₹4,500' },
];

export function MarketplaceScreen() {
  const [mode, setMode] = useState<'list' | 'create' | 'detail'>('list');
  const [listings, setListings] = useState(STARTER);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [detail, setDetail] = useState('');

  if (mode === 'create') {
    return (
      <CampusScreen title="Create listing" subtitle="Share with your campus" activeTab="services">
        <Field label="Title" placeholder="What are you listing?" value={title} onChangeText={setTitle} />
        <Field label="Price" placeholder="₹200" value={price} onChangeText={setPrice} keyboardType="number-pad" />
        <Field label="Details" placeholder="Where can a classmate pick it up?" value={detail} onChangeText={setDetail} />
        <Button
          title="Publish listing"
          onPress={() => {
            if (!title.trim()) {
              return;
            }
            setListings((current) => [
              { title: title.trim(), detail: detail.trim() || 'Pickup on campus', price: price.trim() || 'Free' },
              ...current,
            ]);
            setTitle('');
            setPrice('');
            setDetail('');
            setMode('list');
          }}
        />
        <Button title="Back" variant="ghost" onPress={() => setMode('list')} />
      </CampusScreen>
    );
  }

  if (mode === 'detail' && selected) {
    return (
      <CampusScreen title={selected.title} subtitle="Listing" activeTab="services">
        <Banner kicker="MARKETPLACE" title={selected.price} body={selected.detail} />
        <Note>Listings stay inside NMIT.</Note>
        <Button title="Message seller" onPress={() => setMode('list')} />
        <Button title="Back" variant="ghost" onPress={() => setMode('list')} />
      </CampusScreen>
    );
  }

  return (
    <CampusScreen title="Marketplace" subtitle="Find your next campus essential" activeTab="services">
      <Button title="Create listing" onPress={() => setMode('create')} />
      {listings.length === 0 ? (
        <Note>Nothing listed yet. Be the first to list an item for your campus.</Note>
      ) : (
        listings.map((item) => (
          <CampusCard
            key={item.title}
            icon="bag-handle"
            title={item.title}
            detail={item.detail}
            meta={item.price}
            accent="#34D399"
            onPress={() => {
              setSelected(item);
              setMode('detail');
            }}
          />
        ))
      )}
    </CampusScreen>
  );
}
