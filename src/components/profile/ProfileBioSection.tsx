import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../utils/theme';

type ProfileBioSectionProps = {
    theme: any;
    darkMode: boolean;
    followersCount: number;
    isCurrentUser: boolean;
    profile?: any;
    onEditPress?: () => void;
};

export default function ProfileBioSection({
    theme,
    darkMode,
    followersCount,
    isCurrentUser,
    profile,
    onEditPress,
}: ProfileBioSectionProps) {
    const rowBg = darkMode ? '#1E293B' : '#fff';
    const profileData = profile || {};

    const rows: { icon: any; text: React.ReactNode }[] = [
        ...(profileData.work ? [{ icon: 'work' as any, text: <Text>Làm việc tại <Text style={{ fontWeight: '600' }}>{profileData.work}</Text></Text> }] : []),
        ...(profileData.education && Array.isArray(profileData.education) ? profileData.education.map((school: string) => ({
            icon: 'school' as any,
            text: <Text>Từng học tại <Text style={{ fontWeight: '600' }}>{school}</Text></Text>
        })) : []),
        ...(profileData.currentCity ? [{ icon: 'home' as any, text: <Text>Sống tại <Text style={{ fontWeight: '600' }}>{profileData.currentCity}</Text></Text> }] : []),
        ...(profileData.hometown ? [{ icon: 'location-on' as any, text: <Text>Đến từ <Text style={{ fontWeight: '600' }}>{profileData.hometown}</Text></Text> }] : []),
        ...(profileData.relationship ? [{ icon: 'favorite' as any, text: <Text>{profileData.relationship}</Text> }] : []),
        ...(profileData.socialLink ? [{ icon: 'link' as any, text: <Text style={{ color: Colors.primary }}>{profileData.socialLink}</Text> }] : []),
        ...(profileData.major ? [{ icon: 'school' as any, text: <Text>{profileData.major}</Text> }] : []),
        ...(profileData.showFollowers !== false ? [{
            icon: 'people' as any,
            text: <Text>{followersCount.toLocaleString()} người theo dõi</Text>,
        }] : []),
    ];

    return (
        <View style={[styles.container, { backgroundColor: rowBg, borderTopWidth: 0.5, borderTopColor: theme.border, borderBottomWidth: 0.5, borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Giới thiệu</Text>

            {rows.map((row, i) => (
                <View key={i} style={styles.row}>
                    <MaterialIcons name={row.icon} size={22} color={theme.textMuted} style={styles.rowIcon} />
                    <Text style={[styles.rowText, { color: theme.text }]}>{row.text}</Text>
                </View>
            ))}

            {isCurrentUser && (
                <Pressable
                    onPress={onEditPress}
                    style={({ pressed }) => [
                        styles.editBtn,
                        { backgroundColor: darkMode ? '#334155' : '#E4E6EB', opacity: pressed ? 0.75 : 1 }
                    ]}
                >
                    <Text style={[styles.editBtnText, { color: theme.text }]}>
                        Chỉnh sửa thông tin giới thiệu
                    </Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    rowIcon: {
        marginRight: 12,
    },
    rowText: {
        fontSize: 15,
        flex: 1,
        lineHeight: 20,
    },
    editBtn: {
        width: '100%',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    editBtnText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
