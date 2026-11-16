import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  AppStateStatus,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface PostVideoPlayerProps {
  uri: string;
  onLike?: () => void;
  isLiked?: boolean;
  isScreenFocused?: boolean;
}

export function PostVideoPlayer({
  uri,
  onLike,
  isLiked = false,
  isScreenFocused = true,
}: PostVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [barWidth, setBarWidth] = useState(1);

  // Center play/pause flash indicator
  const [centerIcon, setCenterIcon] = useState<'play' | 'pause' | null>(null);
  const centerAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<any>(null);

  // Instagram Double Tap Heart Burst Animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const [heartVisible, setHeartVisible] = useState(false);

  // Single vs Double tap resolution timer
  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<any>(null);

  // Initialize expo-video player
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
    p.timeUpdateEventInterval = 0.2; // Update every 200ms
  });

  // Pause playback when screen unfocuses or app enters background
  useEffect(() => {
    if (!player) return;

    if (!isScreenFocused && player.playing) {
      player.pause();
    }

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active' && player.playing) {
        player.pause();
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, [player, isScreenFocused]);

  useEffect(() => {
    if (!player) return;

    const playSub = player.addListener('playingChange', (status) => {
      setIsPlaying(status.isPlaying);
    });

    const muteSub = player.addListener('mutedChange', (status) => {
      setIsMuted(status.muted);
    });

    const timeSub = player.addListener('timeUpdate', (payload) => {
      setCurrentTime(payload.currentTime);
      if (player.duration && player.duration > 0) {
        setDuration(player.duration);
      }
    });

    const statusSub = player.addListener('statusChange', (status) => {
      if (player.duration && player.duration > 0) {
        setDuration(player.duration);
      }
    });

    return () => {
      playSub?.remove?.();
      muteSub?.remove?.();
      timeSub?.remove?.();
      statusSub?.remove?.();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, [player]);

  const flashCenterIndicator = (icon: 'play' | 'pause') => {
    setCenterIcon(icon);
    centerAnim.setValue(1);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(centerAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setCenterIcon(null));
    }, 400);
  };

  const triggerHeartAnimation = () => {
    setHeartVisible(true);
    heartScale.setValue(0.3);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.25,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setHeartVisible(false));
  };

  // Instagram Gesture Resolution: Double Tap vs Single Tap
  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_WINDOW = 260; // 260ms window

    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW) {
      // Confirmed Double Tap: Like post with heart burst animation
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      triggerHeartAnimation();
      onLike?.();
    } else {
      lastTapRef.current = now;
      // Schedule single tap playback toggle
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        if (!player) return;
        if (player.playing) {
          player.pause();
          flashCenterIndicator('pause');
        } else {
          player.play();
          flashCenterIndicator('play');
        }
      }, DOUBLE_TAP_WINDOW);
    }
  };

  const toggleMute = (e: any) => {
    e?.stopPropagation?.();
    if (!player) return;
    player.muted = !player.muted;
  };

  const seekToPosition = (locationX: number) => {
    if (!player || duration <= 0 || barWidth <= 0) return;
    const clampedX = Math.max(0, Math.min(barWidth, locationX));
    const targetSeconds = (clampedX / barWidth) * duration;
    player.currentTime = targetSeconds;
    setCurrentTime(targetSeconds);
  };

  const handleTrackPress = (e: GestureResponderEvent) => {
    seekToPosition(e.nativeEvent.locationX);
  };

  const handleBarLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setBarWidth(width);
  };

  const formatSeconds = (sec: number) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <View style={styles.container}>
      <Pressable onPress={handleTap} style={styles.videoWrapper}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Center Flash Play/Pause Indicator with subtle translucent dark circle */}
        {centerIcon && (
          <Animated.View
            style={[
              styles.centerIndicatorOverlay,
              {
                opacity: centerAnim,
                transform: [
                  {
                    scale: centerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.75, 1],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.centerIndicatorCircle}>
              <Ionicons
                name={centerIcon === 'play' ? 'play' : 'pause'}
                size={34}
                color="#FFFFFF"
                style={centerIcon === 'play' ? { marginLeft: 4 } : undefined}
              />
            </View>
          </Animated.View>
        )}

        {/* Double-tap Instagram Heart Burst Overlay */}
        {heartVisible && (
          <Animated.View
            style={[
              styles.centerIndicatorOverlay,
              {
                opacity: heartOpacity,
                transform: [{ scale: heartScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={96} color="#EC4899" />
          </Animated.View>
        )}

        {/* Top-Right Mute Pill */}
        <Pressable
          style={styles.muteButton}
          onPress={toggleMute}
          hitSlop={12}
          accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color="#FFFFFF"
          />
        </Pressable>
      </Pressable>

      {/* Instagram-style Scrubber Bar at Bottom */}
      <View style={styles.scrubberContainer}>
        <Pressable
          style={styles.trackTouchArea}
          onPress={handleTrackPress}
          onLayout={handleBarLayout}
          hitSlop={{ top: 10, bottom: 10, left: 0, right: 0 }}
        >
          {/* Background Track */}
          <View style={styles.trackBackground}>
            {/* Played Progress Fill */}
            <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
          </View>
          {/* Scrubber Thumb Dot */}
          <View
            style={[
              styles.thumbDot,
              {
                left: `${progressPercent}%`,
                transform: [{ translateX: -4 }],
              },
            ]}
          />
        </Pressable>

        {/* Duration / Current Time readout */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 1, // Full 1:1 Instagram standard frame
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  centerIndicatorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  centerIndicatorCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  muteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrubberContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  trackTouchArea: {
    width: '100%',
    height: 18,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    width: '100%',
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  thumbDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
    top: 4.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timeText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
