import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../utils/theme';

export const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            return Animated.sequence([
                Animated.delay(delay),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(dot, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dot, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]);
        };

        Animated.parallel([
            animate(dot1, 0),
            animate(dot2, 200),
            animate(dot3, 400),
        ]).start();
    }, []);

    const renderDot = (anim: Animated.Value) => {
        const opacity = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
        });

        const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -4],
        });

        return (
            <Animated.View
                style={[
                    styles.dot,
                    {
                        opacity,
                        transform: [{ translateY }],
                    },
                ]}
            />
        );
    };

    return (
        <View style={styles.container}>
            {renderDot(dot1)}
            {renderDot(dot2)}
            {renderDot(dot3)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#64748B',
        marginHorizontal: 2,
    },
});
