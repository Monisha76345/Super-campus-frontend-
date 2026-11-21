import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  PanResponder,
  NativeModules,
  ActivityIndicator,
  PanResponderInstance,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export interface GlobalCropOptions {
  uri: string;
  aspect?: [number, number]; // e.g. [1, 1] or [16, 9]
  title?: string;
  onCrop: (croppedUri: string) => void;
  onCancel?: () => void;
}

export interface GlobalImageCropperModalProps {
  visible: boolean;
  uri: string | null;
  aspect?: [number, number];
  title?: string;
  onConfirm: (croppedUri: string) => void;
  onCancel: () => void;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type HandleType = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br' | 'move';

export async function cropImageNative(
  uri: string,
  cropData: {
    offset: { x: number; y: number };
    size: { width: number; height: number };
    displaySize?: { width: number; height: number };
    resizeMode?: 'contain' | 'cover' | 'stretch';
  },
): Promise<string> {
  return new Promise((resolve) => {
    const editor = NativeModules.ImageEditingManager || NativeModules.ImageEditor;
    if (editor && typeof editor.cropImage === 'function') {
      editor.cropImage(
        uri,
        cropData,
        (croppedUri: string) => resolve(croppedUri),
        (err: any) => {
          console.warn('[GlobalImageCropper] Native crop error, falling back to original:', err);
          resolve(uri);
        },
      );
    } else {
      resolve(uri);
    }
  });
}

const MIN_CROP_SIZE = 50;

export function GlobalImageCropperModal({
  visible,
  uri,
  aspect: initialAspect,
  title = 'Crop Image',
  onConfirm,
  onCancel,
}: GlobalImageCropperModalProps) {
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerLayout, setContainerLayout] = useState<{ width: number; height: number } | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 200, height: 200 });
  const [activeAspect, setActiveAspect] = useState<[number, number] | null>(initialAspect || null);
  const [processing, setProcessing] = useState(false);
  const [rotation, setRotation] = useState(0);

  const cropBoxRef = useRef<CropBox>(cropBox);
  cropBoxRef.current = cropBox;

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialBox: CropBox;
  }>({
    startX: 0,
    startY: 0,
    initialBox: { x: 0, y: 0, width: 200, height: 200 },
  });

  // Calculate displayed image dimensions and offset in container
  const displayMetrics = useMemo(() => {
    if (!imgDimensions || !containerLayout || containerLayout.width === 0 || containerLayout.height === 0) {
      return null;
    }
    const isRotated90or270 = rotation % 180 !== 0;
    const origW = isRotated90or270 ? imgDimensions.height : imgDimensions.width;
    const origH = isRotated90or270 ? imgDimensions.width : imgDimensions.height;

    const imgRatio = origW / origH;
    const contRatio = containerLayout.width / containerLayout.height;

    let dispW = 0;
    let dispH = 0;

    if (imgRatio > contRatio) {
      dispW = containerLayout.width;
      dispH = containerLayout.width / imgRatio;
    } else {
      dispH = containerLayout.height;
      dispW = containerLayout.height * imgRatio;
    }

    const offsetX = (containerLayout.width - dispW) / 2;
    const offsetY = (containerLayout.height - dispH) / 2;
    const scale = origW / dispW;

    return {
      dispW,
      dispH,
      offsetX,
      offsetY,
      origW,
      origH,
      scale,
    };
  }, [imgDimensions, containerLayout, rotation]);

  // Load image size
  useEffect(() => {
    if (uri && visible) {
      setProcessing(false);
      setRotation(0);
      setActiveAspect(initialAspect || null);
      Image.getSize(
        uri,
        (w, h) => {
          setImgDimensions({ width: w, height: h });
        },
        () => {
          setImgDimensions({ width: 1000, height: 1000 });
        },
      );
    } else {
      setImgDimensions(null);
    }
  }, [uri, visible, initialAspect]);

  // Initial crop box setup once displayMetrics are available
  useEffect(() => {
    if (!displayMetrics) return;
    const { dispW, dispH } = displayMetrics;

    let w = dispW * 0.85;
    let h = dispH * 0.85;

    if (activeAspect) {
      const [rW, rH] = activeAspect;
      const targetRatio = rW / rH;
      if (w / h > targetRatio) {
        w = h * targetRatio;
      } else {
        h = w / targetRatio;
      }
    }

    const initial: CropBox = {
      x: (dispW - w) / 2,
      y: (dispH - h) / 2,
      width: Math.max(MIN_CROP_SIZE, w),
      height: Math.max(MIN_CROP_SIZE, h),
    };
    setCropBox(initial);
  }, [displayMetrics, activeAspect]);

  // Handle Drag logic for all 8 handles and box movement
  const createHandlePanResponder = (handle: HandleType): PanResponderInstance => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRef.current = {
          startX: 0,
          startY: 0,
          initialBox: { ...cropBoxRef.current },
        };
      },
      onPanResponderMove: (_, gestureState) => {
        if (!displayMetrics) return;
        const { dispW, dispH } = displayMetrics;
        const { initialBox } = dragStartRef.current;
        const { dx, dy } = gestureState;

        let { x, y, width, height } = initialBox;

        switch (handle) {
          case 'move': {
            x = Math.max(0, Math.min(dispW - width, initialBox.x + dx));
            y = Math.max(0, Math.min(dispH - height, initialBox.y + dy));
            break;
          }
          case 'tl': {
            const nextX = Math.max(0, Math.min(initialBox.x + initialBox.width - MIN_CROP_SIZE, initialBox.x + dx));
            const nextY = Math.max(0, Math.min(initialBox.y + initialBox.height - MIN_CROP_SIZE, initialBox.y + dy));
            x = nextX;
            width = initialBox.width - (nextX - initialBox.x);
            y = nextY;
            height = initialBox.height - (nextY - initialBox.y);
            break;
          }
          case 'tc': {
            const nextY = Math.max(0, Math.min(initialBox.y + initialBox.height - MIN_CROP_SIZE, initialBox.y + dy));
            y = nextY;
            height = initialBox.height - (nextY - initialBox.y);
            break;
          }
          case 'tr': {
            width = Math.max(MIN_CROP_SIZE, Math.min(dispW - initialBox.x, initialBox.width + dx));
            const nextY = Math.max(0, Math.min(initialBox.y + initialBox.height - MIN_CROP_SIZE, initialBox.y + dy));
            y = nextY;
            height = initialBox.height - (nextY - initialBox.y);
            break;
          }
          case 'ml': {
            const nextX = Math.max(0, Math.min(initialBox.x + initialBox.width - MIN_CROP_SIZE, initialBox.x + dx));
            x = nextX;
            width = initialBox.width - (nextX - initialBox.x);
            break;
          }
          case 'mr': {
            width = Math.max(MIN_CROP_SIZE, Math.min(dispW - initialBox.x, initialBox.width + dx));
            break;
          }
          case 'bl': {
            const nextX = Math.max(0, Math.min(initialBox.x + initialBox.width - MIN_CROP_SIZE, initialBox.x + dx));
            x = nextX;
            width = initialBox.width - (nextX - initialBox.x);
            height = Math.max(MIN_CROP_SIZE, Math.min(dispH - initialBox.y, initialBox.height + dy));
            break;
          }
          case 'bc': {
            height = Math.max(MIN_CROP_SIZE, Math.min(dispH - initialBox.y, initialBox.height + dy));
            break;
          }
          case 'br': {
            width = Math.max(MIN_CROP_SIZE, Math.min(dispW - initialBox.x, initialBox.width + dx));
            height = Math.max(MIN_CROP_SIZE, Math.min(dispH - initialBox.y, initialBox.height + dy));
            break;
          }
        }

        // Clamp inside boundaries
        x = Math.max(0, Math.min(dispW - MIN_CROP_SIZE, x));
        y = Math.max(0, Math.min(dispH - MIN_CROP_SIZE, y));
        width = Math.max(MIN_CROP_SIZE, Math.min(dispW - x, width));
        height = Math.max(MIN_CROP_SIZE, Math.min(dispH - y, height));

        setCropBox({ x, y, width, height });
      },
    });
  };

  const movePanResponder = useMemo(() => createHandlePanResponder('move'), [displayMetrics]);
  const tlPanResponder = useMemo(() => createHandlePanResponder('tl'), [displayMetrics]);
  const tcPanResponder = useMemo(() => createHandlePanResponder('tc'), [displayMetrics]);
  const trPanResponder = useMemo(() => createHandlePanResponder('tr'), [displayMetrics]);
  const mlPanResponder = useMemo(() => createHandlePanResponder('ml'), [displayMetrics]);
  const mrPanResponder = useMemo(() => createHandlePanResponder('mr'), [displayMetrics]);
  const blPanResponder = useMemo(() => createHandlePanResponder('bl'), [displayMetrics]);
  const bcPanResponder = useMemo(() => createHandlePanResponder('bc'), [displayMetrics]);
  const brPanResponder = useMemo(() => createHandlePanResponder('br'), [displayMetrics]);

  // Finalize Crop: One-step tap on ✓
  const handleConfirm = useCallback(async () => {
    if (!uri || !displayMetrics || processing) return;
    setProcessing(true);

    try {
      const { scale, origW, origH } = displayMetrics;
      const curBox = cropBoxRef.current;

      const pixelX = Math.max(0, Math.min(origW - 1, Math.round(curBox.x * scale)));
      const pixelY = Math.max(0, Math.min(origH - 1, Math.round(curBox.y * scale)));
      const pixelW = Math.max(1, Math.min(origW - pixelX, Math.round(curBox.width * scale)));
      const pixelH = Math.max(1, Math.min(origH - pixelY, Math.round(curBox.height * scale)));

      const croppedUri = await cropImageNative(uri, {
        offset: { x: pixelX, y: pixelY },
        size: { width: pixelW, height: pixelH },
      });

      onConfirm(croppedUri || uri);
    } catch (e) {
      console.warn('[GlobalImageCropper] crop error:', e);
      onConfirm(uri);
    } finally {
      setProcessing(false);
    }
  }, [uri, displayMetrics, processing, onConfirm]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const setPresetRatio = (ratio: [number, number] | null) => {
    setActiveAspect(ratio);
    if (!displayMetrics) return;
    const { dispW, dispH } = displayMetrics;

    if (!ratio) {
      // Free form
      return;
    }

    const [rW, rH] = ratio;
    const targetRatio = rW / rH;

    let w = dispW * 0.85;
    let h = dispH * 0.85;

    if (w / h > targetRatio) {
      w = h * targetRatio;
    } else {
      h = w / targetRatio;
    }

    w = Math.max(MIN_CROP_SIZE, Math.min(dispW, w));
    h = Math.max(MIN_CROP_SIZE, Math.min(dispH, h));

    setCropBox({
      x: (dispW - w) / 2,
      y: (dispH - h) / 2,
      width: w,
      height: h,
    });
  };

  if (!visible || !uri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* TOP BAR */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{title}</Text>

          {/* VISIBLE ✓ CONFIRMATION BUTTON IN TOP RIGHT */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={processing}
            style={[styles.confirmBtn, processing && { opacity: 0.7 }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.8}>
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.confirmBtnInner}>
                <Ionicons name="checkmark" size={22} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* IMAGE CROPPING VIEWPORT */}
        <View
          style={styles.viewport}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setContainerLayout({ width, height });
          }}>
          {displayMetrics && (
            <View
              style={[
                styles.imageContainer,
                {
                  width: displayMetrics.dispW,
                  height: displayMetrics.dispH,
                  left: displayMetrics.offsetX,
                  top: displayMetrics.offsetY,
                },
              ]}>
              <Image
                source={{ uri }}
                style={[
                  styles.image,
                  {
                    width: displayMetrics.dispW,
                    height: displayMetrics.dispH,
                    transform: [{ rotate: `${rotation}deg` }],
                  },
                ]}
                resizeMode="contain"
              />

              {/* DARK MASKS OUTSIDE CROP BOX */}
              {/* Top Mask */}
              <View
                style={[styles.mask, { top: 0, left: 0, right: 0, height: cropBox.y }]}
                pointerEvents="none"
              />
              {/* Bottom Mask */}
              <View
                style={[
                  styles.mask,
                  {
                    top: cropBox.y + cropBox.height,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  },
                ]}
                pointerEvents="none"
              />
              {/* Left Mask */}
              <View
                style={[
                  styles.mask,
                  {
                    top: cropBox.y,
                    left: 0,
                    width: cropBox.x,
                    height: cropBox.height,
                  },
                ]}
                pointerEvents="none"
              />
              {/* Right Mask */}
              <View
                style={[
                  styles.mask,
                  {
                    top: cropBox.y,
                    left: cropBox.x + cropBox.width,
                    right: 0,
                    height: cropBox.height,
                  },
                ]}
                pointerEvents="none"
              />

              {/* CROP BOX */}
              <View
                style={[
                  styles.cropBox,
                  {
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.width,
                    height: cropBox.height,
                  },
                ]}>
                {/* Center drag area */}
                <View {...movePanResponder.panHandlers} style={StyleSheet.absoluteFill}>
                  {/* Grid Lines (Rule of Thirds) */}
                  <View style={[styles.gridLineH, { top: '33.33%' }]} />
                  <View style={[styles.gridLineH, { top: '66.66%' }]} />
                  <View style={[styles.gridLineV, { left: '33.33%' }]} />
                  <View style={[styles.gridLineV, { left: '66.66%' }]} />
                </View>

                {/* 8 FUNCTIONAL DRAGGABLE HANDLES */}

                {/* 1. TOP-LEFT HANDLE */}
                <View {...tlPanResponder.panHandlers} style={[styles.handleTouch, styles.touchTL]}>
                  <View style={[styles.cornerHandle, styles.cornerTL]} />
                </View>

                {/* 2. TOP-CENTER HANDLE */}
                <View {...tcPanResponder.panHandlers} style={[styles.handleTouch, styles.touchTC]}>
                  <View style={[styles.edgeHandle, styles.edgeH]} />
                </View>

                {/* 3. TOP-RIGHT HANDLE */}
                <View {...trPanResponder.panHandlers} style={[styles.handleTouch, styles.touchTR]}>
                  <View style={[styles.cornerHandle, styles.cornerTR]} />
                </View>

                {/* 4. MIDDLE-LEFT HANDLE */}
                <View {...mlPanResponder.panHandlers} style={[styles.handleTouch, styles.touchML]}>
                  <View style={[styles.edgeHandle, styles.edgeV]} />
                </View>

                {/* 5. MIDDLE-RIGHT HANDLE */}
                <View {...mrPanResponder.panHandlers} style={[styles.handleTouch, styles.touchMR]}>
                  <View style={[styles.edgeHandle, styles.edgeV]} />
                </View>

                {/* 6. BOTTOM-LEFT HANDLE */}
                <View {...blPanResponder.panHandlers} style={[styles.handleTouch, styles.touchBL]}>
                  <View style={[styles.cornerHandle, styles.cornerBL]} />
                </View>

                {/* 7. BOTTOM-CENTER HANDLE */}
                <View {...bcPanResponder.panHandlers} style={[styles.handleTouch, styles.touchBC]}>
                  <View style={[styles.edgeHandle, styles.edgeH]} />
                </View>

                {/* 8. BOTTOM-RIGHT HANDLE */}
                <View {...brPanResponder.panHandlers} style={[styles.handleTouch, styles.touchBR]}>
                  <View style={[styles.cornerHandle, styles.cornerBR]} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* BOTTOM CONTROLS (Aspect Ratios & Rotation) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.aspectBtn, activeAspect === null && styles.aspectBtnActive]}
            onPress={() => setPresetRatio(null)}>
            <Text style={[styles.aspectText, activeAspect === null && styles.aspectTextActive]}>Free</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.aspectBtn,
              activeAspect?.[0] === 1 && activeAspect?.[1] === 1 && styles.aspectBtnActive,
            ]}
            onPress={() => setPresetRatio([1, 1])}>
            <Text
              style={[
                styles.aspectText,
                activeAspect?.[0] === 1 && activeAspect?.[1] === 1 && styles.aspectTextActive,
              ]}>
              1:1
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.aspectBtn,
              activeAspect?.[0] === 4 && activeAspect?.[1] === 3 && styles.aspectBtnActive,
            ]}
            onPress={() => setPresetRatio([4, 3])}>
            <Text
              style={[
                styles.aspectText,
                activeAspect?.[0] === 4 && activeAspect?.[1] === 3 && styles.aspectTextActive,
              ]}>
              4:3
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.aspectBtn,
              activeAspect?.[0] === 16 && activeAspect?.[1] === 9 && styles.aspectBtnActive,
            ]}
            onPress={() => setPresetRatio([16, 9])}>
            <Text
              style={[
                styles.aspectText,
                activeAspect?.[0] === 16 && activeAspect?.[1] === 9 && styles.aspectTextActive,
              ]}>
              16:9
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleRotate}>
            <Ionicons name="refresh" size={20} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Global Singleton Bridge for imperative use
let globalOpenCropper: ((options: GlobalCropOptions) => void) | null = null;

export function registerGlobalImageCropper(fn: (options: GlobalCropOptions) => void) {
  globalOpenCropper = fn;
}

export function unregisterGlobalImageCropper() {
  globalOpenCropper = null;
}

export function openGlobalImageCropper(options: GlobalCropOptions): void {
  if (globalOpenCropper) {
    globalOpenCropper(options);
  } else {
    console.warn('[GlobalImageCropper] No global cropper registered. Invoking fallback.');
    options.onCrop(options.uri);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1E293B',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981', // Prominent high-contrast emerald green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mask: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  // Handles
  handleTouch: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  touchTL: { top: -22, left: -22 },
  touchTC: { top: -22, left: '50%', marginLeft: -22 },
  touchTR: { top: -22, right: -22 },
  touchML: { top: '50%', left: -22, marginTop: -22 },
  touchMR: { top: '50%', right: -22, marginTop: -22 },
  touchBL: { bottom: -22, left: -22 },
  touchBC: { bottom: -22, left: '50%', marginLeft: -22 },
  touchBR: { bottom: -22, right: -22 },

  cornerHandle: {
    width: 18,
    height: 18,
    backgroundColor: '#FFFFFF',
    borderColor: '#090D16',
    borderWidth: 2,
    borderRadius: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  cornerTL: {},
  cornerTR: {},
  cornerBL: {},
  cornerBR: {},

  edgeHandle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#090D16',
    borderWidth: 1.5,
    borderRadius: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  edgeH: {
    width: 24,
    height: 7,
  },
  edgeV: {
    width: 7,
    height: 24,
  },

  bottomBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1E293B',
  },
  aspectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  aspectBtnActive: {
    backgroundColor: '#2563EB',
  },
  aspectText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  aspectTextActive: {
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

