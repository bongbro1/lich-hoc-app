import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: any;
}

export default function Skeleton({
  width = "100%",
  height = 18,
  radius = 10,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.6)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    loopRef.current.start();

    return () => {
      loopRef.current?.stop();
      opacity.stopAnimation();
      opacity.setValue(0.6);
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#D1D9E0", // đậm hơn
  },
});
