import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { ColorTokens } from '@/constants/colors';
import { useColors } from '@/theme/app-theme';
import { Typography } from '@/constants/fonts';

import { CampusCard } from './components/CampusCard';
import { CampusScreen } from './components/CampusScreen';
import { Field, Note } from './parts';

const THREADS = [
  { name: 'Project studio', preview: 'Can you review the prototype?', mine: false },
  { name: 'Anu D', preview: 'See you at the lab.', mine: false },
];

export function MessagesScreen() {
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [thread, setThread] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<string[]>([]);

  if (thread) {
    return (
      <CampusScreen title={thread} subtitle="Write a message" activeTab="community">
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>Last message · Can you review the prototype?</Text>
        </View>
        {sent.map((line) => (
          <View key={line} style={[styles.bubble, styles.mine]}>
            <Text style={[styles.bubbleText, styles.mineText]}>{line}</Text>
          </View>
        ))}
        <Field
          label="Message"
          placeholder="Enter a message before sending."
          value={draft}
          onChangeText={setDraft}
        />
        <Button
          title="Send message"
          onPress={() => {
            const next = draft.trim();
            if (!next) {
              return;
            }
            setSent((current) => [...current, next]);
            setDraft('');
          }}
        />
        <Button title="Back to messages" variant="ghost" onPress={() => setThread(null)} />
      </CampusScreen>
    );
  }

  return (
    <CampusScreen title="Messages" subtitle="Campus conversations" activeTab="community">
      <Note>Open a member profile and choose Message to start a conversation.</Note>
      {THREADS.map((item) => (
        <CampusCard
          key={item.name}
          icon="chatbubble"
          title={item.name}
          detail={`Last message · ${item.preview}`}
          meta="Open"
          onPress={() => setThread(item.name)}
        />
      ))}
    </CampusScreen>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '86%',
    backgroundColor: Colors.background.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary.main,
  },
  bubbleText: {
    fontFamily: Typography.regular,
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  mineText: {
    color: Colors.text.onBrand,
  },
});
}
