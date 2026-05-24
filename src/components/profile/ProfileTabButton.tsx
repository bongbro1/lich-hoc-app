import React, { useEffect, useRef } from 'react';
import { Pressable, Text, Animated, StyleSheet } from 'react-native';
import { useUser } from '../../contexts/UserContext';
import { Colors } from '../../utils/theme';

type TabProps = {
    label: string;
    active: boolean;
    onPress: () => void;
};

export default function ProfileTabButton({ label, active, onPress }: TabProps) {
    const { darkMode } = useUser();
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (active) {
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    damping: 12,
                    stiffness: 160,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scale.setValue(0);
            opacity.setValue(0);
        }
    }, [active, opacity, scale]);

    return (
        <Pressable 
            onPress={onPress} 
            style={({ pressed }) => [styles.tabBtn, { backgroundColor: pressed ? (darkMode ? '#334155' : '#F1F5F9') : 'transparent' }]} 
        >
            <Text style={[styles.tabText, { color: darkMode ? (active ? Colors.primary : '#94A3B8') : (active ? Colors.primary : Colors.gray) }]}>
                {label}
            </Text>

            <Animated.View
                style={[
                    styles.tabIndicator,
                    {
                        opacity,
                        transform: [{ scaleX: scale }],
                    },
                ]}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    tabText: {
        fontSize: 15,
        fontWeight: "600",
    },
    tabIndicator: {
        marginTop: 6,
        height: 3,
        width: "60%",
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
});
