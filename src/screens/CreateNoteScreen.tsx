import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Platform,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useAlert } from '../contexts/AlertContext';
import { userRepo } from '../repositories/userRepo';
import { Colors } from '../utils/theme';
import SimpleHeader from '../components/SimpleHeader';

type Props = {
    navigation: any;
    route?: any;
};

export default function CreateNoteScreen({ navigation, route }: Props) {
    const { user, darkMode, setUser } = useUser();
    const existingNote = user?.note || '';
    const [noteText, setNoteText] = useState(existingNote);
    const [sharing, setSharing] = useState(false);
    const [selectedAudience, setSelectedAudience] = useState<'friends' | 'close'>('friends');
    const { showAlert } = useAlert();

    const hasContent = noteText.trim().length > 0;
    const isEditing = existingNote.length > 0;

    const theme = useMemo(() => ({
        bg: darkMode ? '#0F172A' : '#F0F2F5',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#191B24',
        textSecondary: darkMode ? '#94A3B8' : '#424656',
        textMuted: darkMode ? '#64748B' : '#727687',
        border: darkMode ? '#334155' : 'rgba(194, 198, 216, 0.3)',
        inputBg: darkMode ? '#334155' : 'transparent',
        primary: Colors.primary,
        bubbleBg: darkMode ? '#1E293B' : '#FFFFFF',
        bubbleBorder: darkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(194, 198, 216, 0.3)',
        sectionBg: darkMode ? '#1E293B' : '#FFFFFF',
        radioActive: '#0866ff',
        radioInactive: darkMode ? '#475569' : '#C2C6D8',
        dangerBg: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
    }), [darkMode]);

    const handleCancel = useCallback(() => {
        if (hasContent && noteText !== existingNote) {
            showAlert({
                type: 'warning',
                title: 'Bỏ ghi chú này?',
                message: 'Thay đổi của bạn sẽ không được lưu.',
                confirmText: 'Bỏ',
                cancelText: 'Tiếp tục chỉnh sửa',
                onConfirm: () => navigation.goBack(),
            });
        } else {
            navigation.goBack();
        }
    }, [hasContent, noteText, existingNote, navigation, showAlert]);

    const handleShare = useCallback(async () => {
        if (!hasContent || !user?.studentId) return;
        setSharing(true);
        try {
            const finalNote = noteText.trim();
            await userRepo.updateNote(user.studentId, finalNote);
            setUser({ ...user, note: finalNote } as any);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving note:', error);
            showAlert({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể chia sẻ ghi chú. Vui lòng thử lại.',
            });
        } finally {
            setSharing(false);
        }
    }, [hasContent, noteText, user, setUser, navigation, showAlert]);

    const handleDelete = useCallback(() => {
        showAlert({
            type: 'warning',
            title: 'Xóa ghi chú?',
            message: 'Ghi chú hiện tại sẽ bị xóa.',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            onConfirm: async () => {
                if (!user?.studentId) return;
                try {
                    await userRepo.updateNote(user.studentId, null);
                    setUser({ ...user, note: null } as any);
                    navigation.goBack();
                } catch (error) {
                    console.error('Error deleting note:', error);
                    showAlert({
                        type: 'error',
                        title: 'Lỗi',
                        message: 'Không thể xóa ghi chú.',
                    });
                }
            },
        });
    }, [user, setUser, navigation, showAlert]);

    const avatarUri = user?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'User');

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader
                title={isEditing ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú'}
                rightLabel="Chia sẻ"
                onPressRight={handleShare}
                rightDisabled={!hasContent || sharing}
            />

            {/* Main Content */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar & Thought Bubble Section */}
                    <View style={styles.bubbleSection}>
                        <View style={styles.bubbleContainer}>
                            {/* Thought Bubble */}
                            <View style={[styles.thoughtBubble, { backgroundColor: theme.card, borderColor: theme.bubbleBorder }]}>
                                <TextInput
                                    style={[styles.bubbleInput, { color: theme.text }]}
                                    placeholder="Chia sẻ ý nghĩ..."
                                    placeholderTextColor={theme.textMuted}
                                    value={noteText}
                                    onChangeText={setNoteText}
                                    maxLength={60}
                                    multiline
                                    numberOfLines={2}
                                    textAlign="center"
                                    autoFocus
                                />
                                {/* Bubble Tail */}
                                <View style={[styles.bubbleTail, { borderTopColor: theme.card }]} />
                                <View style={[styles.bubbleTailBorder, { borderTopColor: theme.bubbleBorder }]} />
                            </View>

                            {/* Avatar */}
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatarRing, { borderColor: theme.card }]}>
                                    <Image
                                        source={{ uri: avatarUri }}
                                        style={styles.avatar}
                                    />
                                </View>
                                <View style={[styles.addBadge, { backgroundColor: theme.card, borderColor: theme.card }]}>
                                    <Ionicons name="add" size={14} color={theme.primary} />
                                </View>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={[styles.description, { color: theme.textMuted }]}>
                            Bạn bè có thể xem ghi chú của bạn trong 24 giờ.{'\n'}
                            Mọi người sẽ không nhận được thông báo khi bạn chia sẻ ghi chú.
                        </Text>
                    </View>

                    {/* Audience Section */}
                    <View style={styles.audienceSection}>
                        <Text style={[styles.audienceLabel, { color: theme.textMuted }]}>
                            AI CÓ THỂ XEM GHI CHÚ CỦA BẠN
                        </Text>
                        <View style={[styles.audienceCard, { backgroundColor: theme.card }]}>
                            {/* Option: Friends */}
                            <TouchableOpacity
                                style={[styles.audienceOption, { borderBottomColor: theme.border }]}
                                onPress={() => setSelectedAudience('friends')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.audienceOptionLeft}>
                                    <View style={[styles.audienceIcon, { backgroundColor: darkMode ? '#334155' : '#ECEDFA' }]}>
                                        <MaterialIcons name="group" size={22} color={theme.textSecondary} />
                                    </View>
                                    <Text style={[styles.audienceText, { color: theme.text }]}>
                                        Bạn bè bạn theo dõi lại
                                    </Text>
                                </View>
                                <View style={[
                                    styles.radio,
                                    selectedAudience === 'friends'
                                        ? { borderColor: theme.radioActive, backgroundColor: theme.radioActive }
                                        : { borderColor: theme.radioInactive }
                                ]}>
                                    {selectedAudience === 'friends' && (
                                        <View style={styles.radioDot} />
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Option: Close Friends */}
                            <TouchableOpacity
                                style={styles.audienceOption}
                                onPress={() => setSelectedAudience('close')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.audienceOptionLeft}>
                                    <View style={[styles.audienceIcon, { backgroundColor: darkMode ? '#334155' : '#ECEDFA' }]}>
                                        <MaterialIcons name="star" size={22} color="#A13400" />
                                    </View>
                                    <Text style={[styles.audienceText, { color: theme.text }]}>
                                        Bạn thân
                                    </Text>
                                </View>
                                <View style={[
                                    styles.radio,
                                    selectedAudience === 'close'
                                        ? { borderColor: theme.radioActive, backgroundColor: theme.radioActive }
                                        : { borderColor: theme.radioInactive }
                                ]}>
                                    {selectedAudience === 'close' && (
                                        <View style={styles.radioDot} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Delete Note Button (only if editing) */}
                    {isEditing && (
                        <View style={styles.deleteSection}>
                            <View style={[styles.audienceCard, { backgroundColor: theme.card }]}>
                                <TouchableOpacity
                                    style={[styles.audienceOption, { borderBottomWidth: 0, justifyContent: 'center' }]}
                                    onPress={handleDelete}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.audienceOptionLeft}>
                                        <View style={[styles.audienceIcon, { backgroundColor: theme.dangerBg }]}>
                                            <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
                                        </View>
                                        <Text style={[styles.audienceText, { color: '#EF4444' }]}>
                                            Xóa ghi chú
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    bubbleSection: {
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    bubbleContainer: {
        alignItems: 'center',
        width: '100%',
    },
    thoughtBubble: {
        width: '100%',
        maxWidth: 280,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    bubbleInput: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        minHeight: 48,
        padding: 0,
    },
    bubbleTail: {
        position: 'absolute',
        bottom: -10,
        left: '50%',
        marginLeft: -10,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    bubbleTailBorder: {
        position: 'absolute',
        bottom: -12,
        left: '50%',
        marginLeft: -11,
        width: 0,
        height: 0,
        borderLeftWidth: 11,
        borderRightWidth: 11,
        borderTopWidth: 11,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    addBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
        marginTop: 24,
        maxWidth: 300,
    },
    audienceSection: {
        marginTop: 32,
        paddingHorizontal: 16,
    },
    audienceLabel: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 10,
        paddingLeft: 8,
    },
    audienceCard: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    audienceOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    audienceOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    audienceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    audienceText: {
        fontSize: 15,
        fontWeight: '600',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    deleteSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
});
