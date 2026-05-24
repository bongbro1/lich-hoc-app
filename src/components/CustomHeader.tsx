import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton, Avatar } from 'react-native-paper';
import { Colors } from '../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';

type CustomHeaderProps = {
    studentName: string;
    studentId: string;
    onTimetablePress: () => void;
    onRefreshPress: () => void;
};

function CustomHeader({
    studentName,
    studentId,
    onTimetablePress,
    onRefreshPress,
}: CustomHeaderProps) {
    const insets = useSafeAreaInsets();
    const { darkMode } = useUser();

    const theme = {
        header: darkMode ? '#1E293B' : Colors.primary,
        text: Colors.white,
        textSecondary: 'rgba(255,255,255,0.7)',
        iconBg: 'rgba(255,255,255,0.15)',
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <View style={[styles.headerContainer, { paddingTop: insets.top + 8, backgroundColor: theme.header }]}>
            <View style={styles.leftSection}>
                <Avatar.Text
                    size={48}
                    label={getInitials(studentName)}
                    style={[styles.avatar, { backgroundColor: theme.iconBg }]}
                    labelStyle={styles.avatarLabel}
                />
                <View style={styles.infoContainer}>
                    <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>{studentName || 'Người dùng'}</Text>
                    <Text style={[styles.studentId, { color: theme.textSecondary }]}>{studentId}</Text>
                </View>
            </View>
            <View style={styles.iconContainer}>
                <IconButton
                    icon="calendar-month"
                    iconColor={theme.text}
                    size={24}
                    style={[styles.iconButton, { backgroundColor: theme.iconBg }]}
                    onPress={onTimetablePress}
                />
                <IconButton
                    icon="refresh"
                    iconColor={theme.text}
                    size={24}
                    style={[styles.iconButton, { backgroundColor: theme.iconBg }]}
                    onPress={onRefreshPress}
                />
            </View>
        </View>
    );
}

export default React.memo(CustomHeader);

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 25,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 5,
        elevation: 5,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginRight: 12,
    },
    avatarLabel: {
        color: Colors.white,
        fontWeight: '700',
        fontSize: 18,
    },
    infoContainer: {
        flexDirection: 'column',
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.white,
        marginBottom: 2,
    },
    studentId: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    iconButton: {
        margin: 0,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
});
