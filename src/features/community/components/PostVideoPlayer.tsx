import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PostVideoPlayerProps {
  uri: string;
}

export function PostVideoPlayer({ uri }: PostVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize expo-video player
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const togglePlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: any) => {
    e?.stopPropagation?.();
    if (!player) return;
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  return (
    <Pressable style={styles.container} onPress={togglePlay}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Floating Center Play button when paused */}
      {!isPlaying && (
        <View style={styles.playButtonOverlay} pointerEvents="none">
          <View style={styles.playButtonCircle}>
            <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
          </View>
        </View>
      )}

      {/* Floating Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.badge}>
          <Ionicons name="videocam" size={12} color="#38BDF8" />
          <Text style={styles.badgeText}>Video</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.muteButton, pressed && styles.pressed]}
          onPress={toggleMute}
          hitSlop={8}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    marginVertical: 4,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  playButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  muteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pressed: {
    opacity: 0.7,
  },
});
