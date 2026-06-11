import React, { useEffect, useRef } from 'react';
import { Pressable, Text, Animated, StyleSheet, View } from 'react-native';
import { useUser } from '../../contexts/UserContext';
import { Colors } from '../../utils/theme';

type TabProps = {
    label: string;
    active: boolean;
    onPress: () => void;
};

export default function ProfileTabButton({ label, active, onPress }: TabProps) {
    const { darkMode } = useUser();
    const indicatorAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(indicatorAnim, {
            toValue: active ? 1 : 0,
            duration: 160,
            useNativeDriver: false,
        }).start();
    }, [active, indicatorAnim]);

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.tabBtn,
                { backgroundColor: pressed ? (darkMode ? '#334155' : '#F1F5F9') : 'transparent' }
            ]}
        >
            <Text style={[styles.tabText, {
                color: active
                    ? Colors.primary
                    : (darkMode ? '#94A3B8' : '#64748B'),
                fontWeight: active ? '700' : '600',
            }]}>
                {label}
            </Text>

            {/* Bottom underline indicator (Facebook style) */}
            <Animated.View
                style={[
                    styles.tabIndicator,
                    {
                        backgroundColor: Colors.primary,
                        opacity: indicatorAnim,
                        transform: [{ scaleX: indicatorAnim }],
                    }
                ]}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    tabBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabText: {
        fontSize: 14,
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderRadius: 2,
    },
});
