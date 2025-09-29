import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Toast as ToastType, TOAST_COLORS, TOAST_ICONS } from '../../types/toast';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '../../constants/colors';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
  index: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_HEIGHT = 80;
const ANIMATION_DURATION = 300;
const SWIPE_THRESHOLD = 100;

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss, index }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const styles = createStyles(colors, insets);
  const toastColors = TOAST_COLORS[toast.type];

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      translateX.extractOffset();
    },
    onPanResponderMove: Animated.event(
      [null, { dx: translateX }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > SWIPE_THRESHOLD || gestureState.vx > 0.5) {
        dismissToast();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const topOffset = toast.config.position === 'top'
    ? insets.top + SPACING.md + (index * (TOAST_HEIGHT + SPACING.xs))
    : undefined;

  const bottomOffset = toast.config.position === 'bottom'
    ? insets.bottom + SPACING.md + (index * (TOAST_HEIGHT + SPACING.xs))
    : undefined;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          backgroundColor: toastColors.background,
          transform: [
            { translateX },
            { translateY },
            { scale }
          ],
          opacity,
          top: topOffset,
          bottom: bottomOffset,
        },
      ]}
    >
      <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={TOAST_ICONS[toast.type]}
              size={24}
              color={toastColors.icon}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.message, { color: toastColors.text }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>

          {toast.config.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                toast.config.action?.onPress();
                dismissToast();
              }}
            >
              <Text style={[styles.actionText, { color: toastColors.text }]}>
                {toast.config.action.text}
              </Text>
            </TouchableOpacity>
          )}

          {!toast.config.persistent && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismissToast}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={20}
                color={toastColors.icon}
              />
            </TouchableOpacity>
          )}
      </View>

      {/* Progress bar for timed toasts */}
      {!toast.config.persistent && toast.config.duration && (
        <ProgressBar
          duration={toast.config.duration}
          color={toastColors.text}
          styles={styles}
        />
      )}
    </Animated.View>
  );
};

interface ProgressBarProps {
  duration: number;
  color: string;
  styles: any;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ duration, color, styles }) => {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, [duration]);

  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const createStyles = (colors: any, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: SPACING.md,
      right: SPACING.md,
      minHeight: TOAST_HEIGHT,
      borderRadius: BORDER_RADIUS.lg,
      ...SHADOWS.medium,
      overflow: 'hidden',
      zIndex: 9999,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: TOAST_HEIGHT - 4, // Account for progress bar
    },
    iconContainer: {
      marginRight: SPACING.sm,
    },
    textContainer: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    message: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      lineHeight: 20,
    },
    actionButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginRight: SPACING.xs,
    },
    actionText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: '700',
    },
    closeButton: {
      padding: SPACING.xs,
    },
    progressContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressBar: {
      height: '100%',
      opacity: 0.8,
    },
  });


export default React.memo(ToastComponent);