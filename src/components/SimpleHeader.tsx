import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../utils/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Skeleton from '../types/Skeleton';
import { useUser } from '../contexts/UserContext';

type SimpleHeaderProps = {
    title?: string;
    showBackButton?: boolean;
    onPressOptions?: () => void;
    loading?: boolean;
};

export default function SimpleHeader({ title, showBackButton = true, onPressOptions, loading }: SimpleHeaderProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { darkMode } = useUser();

    const theme = {
        bg: darkMode ? '#1E293B' : Colors.primary,
        text: darkMode ? '#F8FAFC' : Colors.white,
    };
    return (

        <View style={[styles.headerContainer, { paddingTop: insets.top + 8, backgroundColor: theme.bg, borderBottomColor: darkMode ? '#334155' : '#c0d4ff' }]}>
            {showBackButton && (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
            )}

            {loading ? (
                <View style={styles.skeletonContainer}>
                    <Skeleton width={150} height={20} radius={8} />
                </View>
            ) : (
                <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
            )}
            {/* RIGHT */}
            {onPressOptions ? (
                <Pressable
                    onPress={onPressOptions}
                    style={styles.sideButton}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons
                        name="dots-vertical"
                        size={24}
                        color={theme.text}
                    />
                </Pressable>
            ) : (
                <View style={styles.sideButton} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 16,
        borderBottomColor: '#c0d4ff',
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.white,
        flex: 1,
        textAlign: 'left',
        marginLeft: 8,
    },
    skeletonContainer: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 8,
    },
    backButton: {
        marginRight: 8,
        paddingHorizontal: 4,
    },

    sideButton: {
        width: 30,
        alignItems: "center",
        justifyContent: "center",
    },
});
