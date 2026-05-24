import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLoading } from '../contexts/LoadingContext';
import { Colors } from '../utils/theme';
import { useUser } from 'contexts/UserContext';

export const LoadingOverlay = () => {
  const { loading, message } = useLoading();

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Spin + fade + scale — restart khi loading bật lên
  useEffect(() => {
    if (loading) {
      // Reset và restart spin
      rotateAnim.setValue(0);
      const spin = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 16, stiffness: 200, useNativeDriver: true }),
      ]).start();

      return () => spin.stop();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const backdropBg = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)'],
  });

  const { darkMode } = useUser();
  const theme = {
    card: darkMode ? '#1E293B' : '#fff',
    text: darkMode ? '#F8FAFC' : '#1F2937',
    textMuted: darkMode ? '#94A3B8' : '#9CA3AF',
    track: darkMode ? '#334155' : '#E8F0FE',
    center: darkMode ? '#0F172A' : '#F0F5FF',
  };

  return (
    <Modal
      visible={loading}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { backgroundColor: backdropBg }]}>
        <Animated.View style={[
          styles.card,
          {
            backgroundColor: theme.card,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          {/* Outer ring */}
          <View style={styles.spinnerWrap}>
            <View style={[styles.spinnerTrack, { borderColor: theme.track }]} />
            <Animated.View style={[styles.spinnerArc, { transform: [{ rotate }] }]} />
            {/* Center dot */}
            <View style={[styles.spinnerCenter, { backgroundColor: theme.center }]}>
              <View style={styles.centerDot} />
            </View>
          </View>

          <Text style={[styles.loadingText, { color: theme.text }]}>
            {message || 'Đang xử lý...'}
          </Text>
          <Text style={[styles.subText, { color: theme.textMuted }]}>Vui lòng chờ trong giây lát</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const SPINNER_SIZE = 64;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 200,
    overflow: 'hidden',
  },
  spinnerWrap: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerTrack: {
    position: 'absolute',
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: 4,
  },
  spinnerArc: {
    position: 'absolute',
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderRadius: SPINNER_SIZE / 2,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primary,
  },
  spinnerCenter: {
    position: 'absolute',
    width: SPINNER_SIZE - 16,
    height: SPINNER_SIZE - 16,
    borderRadius: (SPINNER_SIZE - 16) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
