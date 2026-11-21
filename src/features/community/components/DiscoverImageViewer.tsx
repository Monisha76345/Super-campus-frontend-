import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface DiscoverImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function DiscoverImageViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: DiscoverImageViewerProps) {
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const imageSizesRef = useRef<Record<string, { width: number; height: number }>>({});

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const currentTranslateX = useRef(0);
  const currentTranslateY = useRef(0);

  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const initialTouchMidX = useRef(0);
  const initialTouchMidY = useRef(0);
  const initialTranslateX = useRef(0);
  const initialTranslateY = useRef(0);
  const initialTouchX = useRef(0);
  const initialTouchY = useRef(0);
  const isPinching = useRef(false);
  const hasPinchedInGesture = useRef(false);
  const lastTapTime = useRef(0);

  const screenWidth = dimensions.width;
  const screenHeight = dimensions.height;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(Dimensions.get('window'));
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const idScale = scale.addListener(({ value }) => {
      currentScale.current = value;
    });
    const idX = translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    });
    const idY = translateY.addListener(({ value }) => {
      currentTranslateY.current = value;
    });
    return () => {
      scale.removeListener(idScale);
      translateX.removeListener(idX);
      translateY.removeListener(idY);
    };
  }, [scale, translateX, translateY]);

  const resetZoom = useCallback(
    (animated = true) => {
      currentScale.current = 1;
      currentTranslateX.current = 0;
      currentTranslateY.current = 0;
      if (animated) {
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        scale.setValue(1);
        translateX.setValue(0);
        translateY.setValue(0);
      }
    },
    [scale, translateX, translateY],
  );

  const handleClose = useCallback(() => {
    resetZoom(false);
    onClose();
  }, [onClose, resetZoom]);

  useEffect(() => {
    if (visible) {
      const validIndex = Math.max(0, Math.min(initialIndex, images.length - 1));
      setCurrentIndex(validIndex);
      resetZoom(false);
    } else {
      resetZoom(false);
    }
  }, [visible, initialIndex, images.length, resetZoom]);

  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      resetZoom(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, images.length, resetZoom]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      resetZoom(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, resetZoom]);

  const currentImageUrl = images[currentIndex] || '';

  const getPanBounds = useCallback(
    (targetScale: number) => {
      const size = imageSizesRef.current[currentImageUrl];
      let displayWidth = screenWidth;
      let displayHeight = screenHeight;

      if (size && size.width > 0 && size.height > 0) {
        const imageAspect = size.width / size.height;
        const screenAspect = screenWidth / screenHeight;

        if (imageAspect > screenAspect) {
          displayWidth = screenWidth;
          displayHeight = screenWidth / imageAspect;
        } else {
          displayHeight = screenHeight;
          displayWidth = screenHeight * imageAspect;
        }
      }

      const maxTx = Math.max(
        0,
        (displayWidth * targetScale - screenWidth) / 2,
        (displayWidth * (targetScale - 1)) / 2,
      );
      const maxTy = Math.max(
        0,
        (displayHeight * targetScale - screenHeight) / 2,
        (displayHeight * (targetScale - 1)) / 2,
      );

      return { maxTx, maxTy };
    },
    [currentImageUrl, screenWidth, screenHeight],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          return (
            (touches && touches.length >= 2) ||
            gestureState.numberActiveTouches >= 2 ||
            currentScale.current > 1 ||
            Math.abs(gestureState.dx) > 6 ||
            Math.abs(gestureState.dy) > 6
          );
        },
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          return (
            (touches && touches.length >= 2) ||
            gestureState.numberActiveTouches >= 2
          );
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches && touches.length >= 2) {
            isPinching.current = true;
            hasPinchedInGesture.current = true;
            initialDistance.current = Math.hypot(
              touches[0].pageX - touches[1].pageX,
              touches[0].pageY - touches[1].pageY,
            );
            initialScale.current = currentScale.current;
            initialTouchMidX.current = (touches[0].pageX + touches[1].pageX) / 2;
            initialTouchMidY.current = (touches[0].pageY + touches[1].pageY) / 2;
            initialTranslateX.current = currentTranslateX.current;
            initialTranslateY.current = currentTranslateY.current;
          } else if (touches && touches.length === 1) {
            isPinching.current = false;
            hasPinchedInGesture.current = false;
            initialTouchX.current = touches[0].pageX;
            initialTouchY.current = touches[0].pageY;
            initialTranslateX.current = currentTranslateX.current;
            initialTranslateY.current = currentTranslateY.current;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;

          if (touches && touches.length >= 2) {
            hasPinchedInGesture.current = true;
            if (!isPinching.current) {
              isPinching.current = true;
              initialDistance.current = Math.hypot(
                touches[0].pageX - touches[1].pageX,
                touches[0].pageY - touches[1].pageY,
              );
              initialScale.current = currentScale.current;
              initialTouchMidX.current = (touches[0].pageX + touches[1].pageX) / 2;
              initialTouchMidY.current = (touches[0].pageY + touches[1].pageY) / 2;
              initialTranslateX.current = currentTranslateX.current;
              initialTranslateY.current = currentTranslateY.current;
              return;
            }

            const currentDist = Math.hypot(
              touches[0].pageX - touches[1].pageX,
              touches[0].pageY - touches[1].pageY,
            );

            if (initialDistance.current > 0) {
              const factor = currentDist / initialDistance.current;
              const targetScale = Math.max(1, Math.min(initialScale.current * factor, 6));
              scale.setValue(targetScale);

              const currentMidX = (touches[0].pageX + touches[1].pageX) / 2;
              const currentMidY = (touches[0].pageY + touches[1].pageY) / 2;
              const deltaX = currentMidX - initialTouchMidX.current;
              const deltaY = currentMidY - initialTouchMidY.current;

              translateX.setValue(initialTranslateX.current + deltaX);
              translateY.setValue(initialTranslateY.current + deltaY);
            }
          } else if (touches && touches.length === 1) {
            if (isPinching.current) {
              isPinching.current = false;
              initialTouchX.current = touches[0].pageX;
              initialTouchY.current = touches[0].pageY;
              initialTranslateX.current = currentTranslateX.current;
              initialTranslateY.current = currentTranslateY.current;
              return;
            }

            if (currentScale.current > 1) {
              const dx = touches[0].pageX - initialTouchX.current;
              const dy = touches[0].pageY - initialTouchY.current;
              translateX.setValue(initialTranslateX.current + dx);
              translateY.setValue(initialTranslateY.current + dy);
            } else if (!hasPinchedInGesture.current) {
              if (gestureState.dy > 0 && gestureState.dy > Math.abs(gestureState.dx) * 1.5) {
                translateY.setValue(gestureState.dy * 0.5);
              }
            }
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          isPinching.current = false;

          const isTap = Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8;
          const now = Date.now();
          if (isTap && now - lastTapTime.current < 300) {
            lastTapTime.current = 0;
            if (currentScale.current > 1.2) {
              resetZoom(true);
            } else {
              Animated.parallel([
                Animated.spring(scale, { toValue: 2.5, friction: 6, useNativeDriver: true }),
                Animated.spring(translateX, { toValue: 0, friction: 6, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
              ]).start();
            }
            return;
          }
          if (isTap) {
            lastTapTime.current = now;
          }

          const isAtBaseZoom = Math.abs(currentScale.current - 1) < 0.05;

          if (isAtBaseZoom && !hasPinchedInGesture.current) {
            if (gestureState.dy > 120 && gestureState.dy > Math.abs(gestureState.dx) * 2) {
              handleClose();
              return;
            }

            if (images.length > 1) {
              const isHorizontalSwipe =
                Math.abs(gestureState.dx) > 50 &&
                Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;

              if (isHorizontalSwipe) {
                if (gestureState.dx < -50 && currentIndex < images.length - 1) {
                  goToNext();
                  return;
                } else if (gestureState.dx > 50 && currentIndex > 0) {
                  goToPrev();
                  return;
                }
              }
            }

            resetZoom(true);
            return;
          }

          let targetScale = currentScale.current;
          if (targetScale < 1) targetScale = 1;
          if (targetScale > 5) targetScale = 5;

          const { maxTx, maxTy } = getPanBounds(targetScale);

          let targetTx = currentTranslateX.current;
          let targetTy = currentTranslateY.current;

          if (targetTx > maxTx) targetTx = maxTx;
          if (targetTx < -maxTx) targetTx = -maxTx;
          if (targetTy > maxTy) targetTy = maxTy;
          if (targetTy < -maxTy) targetTy = -maxTy;

          Animated.parallel([
            Animated.spring(scale, { toValue: targetScale, friction: 7, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: targetTx, friction: 7, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: targetTy, friction: 7, useNativeDriver: true }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          isPinching.current = false;
          hasPinchedInGesture.current = false;
          resetZoom(true);
        },
      }),
    [
      currentIndex,
      images.length,
      handleClose,
      resetZoom,
      goToNext,
      goToPrev,
      getPanBounds,
      scale,
      translateX,
      translateY,
    ],
  );

  if (!visible || !images || images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        {/* Pinch & Pan Gesture Image Container */}
        <View style={styles.gestureContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.imageTransformWrapper,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                ],
              },
            ]}>
            <Image
              source={{ uri: currentImageUrl }}
              style={styles.image}
              contentFit="contain"
              transition={200}
              onLoad={(e) => {
                if (e.source?.width && e.source?.height) {
                  imageSizesRef.current[currentImageUrl] = {
                    width: e.source.width,
                    height: e.source.height,
                  };
                }
              }}
            />
          </Animated.View>
        </View>

        {/* UI Overlay (Header, navigation buttons, pagination) */}
        <View style={styles.overlayContainer} pointerEvents="box-none">
          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 8 }]} pointerEvents="box-none">
            <Pressable
              onPress={handleClose}
              hitSlop={14}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>

            {images.length > 1 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {currentIndex + 1} / {images.length}
                </Text>
              </View>
            )}

            <View style={styles.topBarSpacer} />
          </View>

          {/* Left Arrow Navigation Button */}
          {images.length > 1 && currentIndex > 0 && (
            <View style={styles.leftNavContainer} pointerEvents="box-none">
              <Pressable
                onPress={goToPrev}
                hitSlop={14}
                style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
                <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* Right Arrow Navigation Button */}
          {images.length > 1 && currentIndex < images.length - 1 && (
            <View style={styles.rightNavContainer} pointerEvents="box-none">
              <Pressable
                onPress={goToNext}
                hitSlop={14}
                style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
                <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* Bottom Dots Indicator */}
          {images.length > 1 && (
            <View
              style={[
                styles.bottomDotsContainer,
                { paddingBottom: Math.max(insets.bottom, 16) + 12 },
              ]}
              pointerEvents="none">
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentIndex ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTransformWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 110,
    elevation: 22,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 120,
    elevation: 25,
  },
  counterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  topBarSpacer: {
    width: 44,
  },
  leftNavContainer: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 110,
    elevation: 22,
  },
  rightNavContainer: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 110,
    elevation: 22,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 120,
    elevation: 25,
  },
  bottomDotsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 105,
    elevation: 21,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#38BDF8',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
