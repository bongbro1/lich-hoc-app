import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ComingSoonProps {
  featureName: string;
}

export default function ComingSoon({ featureName }: ComingSoonProps) {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
      }}
    >
      <View
        style={{
          backgroundColor: '#fff',
          padding: 30,
          borderRadius: 20,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <MaterialIcons
            name="construction"
            size={60}
            color="#ff6b6b"
            style={{ marginBottom: 20 }}
          />
        </Animated.View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 10 }}>
          Tính năng đang phát triển
        </Text>
        <Text style={{ fontSize: 16, color: '#555', textAlign: 'center' }}>
          Tính năng "{featureName}" sẽ sớm được cập nhật. Hãy quay lại sau nhé!
        </Text>
      </View>
    </View>
  );
}
