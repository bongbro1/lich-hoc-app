import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, MaterialIcons as Icon } from '@expo/vector-icons';
import Skeleton from '../types/Skeleton';
import { useUser } from '../contexts/UserContext';

type SimpleHeaderProps = {
    title?: string;
    showBackButton?: boolean;
    onPressOptions?: () => void;
    loading?: boolean;
    rightLabel?: string;
    onPressRight?: () => void;
    rightDisabled?: boolean;
    children?: React.ReactNode;
    rightComponent?: React.ReactNode;
};

export default function SimpleHeader({
    title,
    showBackButton = true,
    onPressOptions,
    loading,
    rightLabel,
    onPressRight,
    rightDisabled,
    children,
    rightComponent
}: SimpleHeaderProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { darkMode } = useUser();

    const theme = {
        bg: darkMode ? '#1E293B' : Colors.primary,
        text: darkMode ? '#F8FAFC' : Colors.white,
    };
    return (

        <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
            <View style={styles.contentArea}>
                <View style={styles.leftSection}>
                    {showBackButton ? (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Icon name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 12 }} />
                    )}

                    {children ? (
                        <View style={styles.childrenContainer}>{children}</View>
                    ) : loading ? (
                        <View style={styles.skeletonContainer}>
                            <Skeleton width={150} height={20} radius={8} />
                        </View>
                    ) : (
                        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
                    )}
                </View>

                {/* RIGHT */}
                {rightComponent ? (
                    <View style={styles.rightComponentContainer}>{rightComponent}</View>
                ) : rightLabel && onPressRight ? (
                    <Pressable
                        onPress={onPressRight}
                        disabled={rightDisabled}
                        style={styles.sideButton}
                        hitSlop={8}
                    >
                        <Text style={[styles.rightLabelText, { color: theme.text, opacity: rightDisabled ? 0.5 : 1 }]}>{rightLabel}</Text>
                    </Pressable>
                ) : onPressOptions ? (
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
                    <View style={{ width: 44, height: 44 }} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 10,
    },
    contentArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 12,
        height: 50, // Fixed height requested
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    childrenContainer: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18, // Slightly smaller for compact header
        fontWeight: '700',
        color: Colors.white,
        marginLeft: 8,
    },
    skeletonContainer: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 8,
    },
    backButton: {
        marginRight: 4,
        paddingLeft: 16,
    },
    rightComponentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sideButton: {
        minWidth: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    rightLabelText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
