import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { SelectList } from 'react-native-dropdown-select-list';
import { useUserVM } from '../viewmodels/useUserVM';
import SimpleHeader from '../components/SimpleHeader';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { Colors } from '../utils/theme';
import {
    SuggestionHelper,
    WORK_SUGGESTIONS,
    SCHOOL_SUGGESTIONS,
    CITY_SUGGESTIONS,
    RELATIONSHIP_SUGGESTIONS,
    LINK_SUGGESTIONS
} from '../components/profile/SuggestionHelper';

interface CustomToggleProps {
    value: boolean;
    onToggle: (v: boolean) => void;
    activeColor: string;
}

const CustomToggle = React.memo(({ value, onToggle, activeColor }: CustomToggleProps) => {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 20],
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E2E8F0', activeColor],
    });

    return (
        <Pressable
            onPress={() => {
                onToggle(!value);
            }}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        >
            <Animated.View style={[styles.toggleTrack, { backgroundColor }]}>
                <Animated.View style={[styles.toggleKnob, { transform: [{ translateX }] }]} />
            </Animated.View>
        </Pressable>
    );
});

export default function EditProfileDetailsScreen({ route, navigation }: any) {
    const { darkMode, setUser } = useUser();
    const { studentId, initialProfile } = route.params || {};
    const insets = useSafeAreaInsets();

    // Scroll refs
    const scrollViewRef = useRef<ScrollView>(null);
    const sectionPositions = useRef<Record<string, number>>({});
    const sectionsContainerY = useRef(0);

    const handleSectionLayout = useCallback((key: string, y: number) => {
        sectionPositions.current[key] = y;
    }, []);

    const scrollToSection = useCallback((key: string) => {
        // Small delay to let the input render before scrolling
        setTimeout(() => {
            const localY = sectionPositions.current[key];
            if (localY !== undefined && scrollViewRef.current) {
                const absoluteY = sectionsContainerY.current + localY;
                scrollViewRef.current.scrollTo({ y: Math.max(0, absoluteY - 20), animated: true });
            }
        }, 150);
    }, []);

    const {
        profile,
        loadProfile,
        updateProfile,
    } = useUserVM();

    // Local form states (populated instantly from cached parameters to prevent empty visual state on mount)
    const [work, setWork] = useState(initialProfile?.work || '');
    const [education, setEducation] = useState<string[]>(initialProfile?.education || []);
    const [currentCity, setCurrentCity] = useState(initialProfile?.currentCity || '');
    const [hometown, setHometown] = useState(initialProfile?.hometown || '');
    const [relationship, setRelationship] = useState(initialProfile?.relationship || '');
    const [socialLink, setSocialLink] = useState(initialProfile?.socialLink || '');
    const [showFollowers, setShowFollowers] = useState(initialProfile?.showFollowers !== false);

    // Editing states for each field to show input boxes inline
    const [editWork, setEditWork] = useState(false);
    const [editCurrentCity, setEditCurrentCity] = useState(false);
    const [editHometown, setEditHometown] = useState(false);
    const [editSocialLink, setEditSocialLink] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState('');
    const [showAddSchool, setShowAddSchool] = useState(false);

    useEffect(() => {
        if (studentId) {
            loadProfile(studentId);
        }
    }, [studentId]);

    useEffect(() => {
        if (profile) {
            setWork(profile.work || '');
            setEducation(profile.education || []);
            setCurrentCity(profile.currentCity || '');
            setHometown(profile.hometown || '');
            setRelationship(profile.relationship || '');
            setSocialLink(profile.socialLink || '');
            setShowFollowers(profile.showFollowers !== false);
        }
    }, [profile]);

    const theme = useMemo(() => ({
        bg: darkMode ? '#0F172A' : '#F0F2F5',
        card: darkMode ? '#1E293B' : '#fff',
        text: darkMode ? '#F8FAFC' : Colors.text,
        textMuted: darkMode ? '#94A3B8' : Colors.subText,
        border: darkMode ? '#334155' : '#E2E8F0',
        inputBg: darkMode ? '#334155' : '#F5F5F5',
        primary: Colors.primary,
        primaryBg: darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(8, 102, 255, 0.08)',
        secondaryBg: darkMode ? '#334155' : '#E4E6EB',
        secondaryText: darkMode ? '#F8FAFC' : '#1C1E21',
    }), [darkMode]);

    const handleSave = async () => {
        try {
            const updates = {
                work: work.trim() || null,
                education: education.length > 0 ? education : null,
                currentCity: currentCity.trim() || null,
                hometown: hometown.trim() || null,
                relationship: relationship.trim() || null,
                socialLink: socialLink.trim() || null,
                showFollowers: showFollowers,
            };
            await updateProfile(studentId, updates);
            setUser(prev => {
                if (!prev) return prev;
                const updatedUser = { ...prev, ...updates };
                storageService.set({ key: STORAGE_KEYS.USER, value: updatedUser });
                return updatedUser;
            });
            navigation.goBack();
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể lưu thông tin.');
        }
    };

    const handleAddSchool = () => {
        if (!newSchoolName.trim()) return;
        setEducation(prev => [...prev, newSchoolName.trim()]);
        setNewSchoolName('');
        setShowAddSchool(false);
    };

    const handleRemoveSchool = (index: number) => {
        setEducation(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <SimpleHeader title="Chỉnh sửa chi tiết" />

            <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
                {/* Header Description Section */}
                <View style={[styles.descSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.descTitle, { color: theme.text }]}>Tùy chỉnh phần giới thiệu</Text>
                    <Text style={[styles.descText, { color: theme.textMuted }]}>
                        Chi tiết bạn chọn sẽ hiển thị công khai và không đăng lên Bảng tin.
                    </Text>
                </View>

                <View style={styles.sectionsContainer} onLayout={(e) => { sectionsContainerY.current = e.nativeEvent.layout.y; }}>
                    {/* Công việc */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={(e) => handleSectionLayout('work', e.nativeEvent.layout.y)}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Công việc</Text>
                        </View>

                        {editWork ? (
                            <View>
                                <View style={styles.editRow}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                        value={work}
                                        onChangeText={setWork}
                                        placeholder="Tên công ty"
                                        placeholderTextColor={theme.textMuted}
                                        autoFocus
                                    />
                                    <Pressable onPress={() => setEditWork(false)} style={[styles.saveInlineBtn, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.saveInlineText}>Xong</Text>
                                    </Pressable>
                                </View>
                                <SuggestionHelper
                                    query={work}
                                    suggestions={WORK_SUGGESTIONS}
                                    onSelect={setWork}
                                    theme={theme}
                                />
                            </View>
                        ) : (
                            <View style={styles.detailsRow}>
                                <MaterialIcons name="work" size={22} color={theme.textMuted} style={styles.rowIcon} />
                                <View style={styles.textContainer}>
                                    {work ? (
                                        <Text style={[styles.rowText, { color: theme.text }]}>
                                            Làm việc tại <Text style={{ fontWeight: '600' }}>{work}</Text>
                                        </Text>
                                    ) : (
                                        <Text style={[styles.rowTextPlaceholder, { color: theme.textMuted }]}>
                                            Chưa thêm nơi làm việc
                                        </Text>
                                    )}
                                </View>
                                <Pressable onPress={() => { setEditWork(true); scrollToSection('work'); }} style={[styles.iconBtn, { backgroundColor: theme.secondaryBg }]}>
                                    <MaterialIcons name="edit" size={18} color={theme.primary} />
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* Học vấn */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={(e) => handleSectionLayout('education', e.nativeEvent.layout.y)}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Học vấn</Text>
                        </View>

                        <View style={styles.schoolList}>
                            {education.map((school, index) => (
                                <View key={index} style={styles.detailsRow}>
                                    <MaterialIcons name="school" size={22} color={theme.textMuted} style={styles.rowIcon} />
                                    <View style={styles.textContainer}>
                                        <Text style={[styles.rowText, { color: theme.text }]}>
                                            Từng học tại <Text style={{ fontWeight: '600' }}>{school}</Text>
                                        </Text>
                                    </View>
                                    <Pressable onPress={() => handleRemoveSchool(index)} style={[styles.iconBtn, { backgroundColor: theme.secondaryBg }]}>
                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    </Pressable>
                                </View>
                            ))}
                        </View>

                        {showAddSchool ? (
                            <View>
                                <View style={styles.editRow}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                        value={newSchoolName}
                                        onChangeText={setNewSchoolName}
                                        placeholder="Tên trường học..."
                                        placeholderTextColor={theme.textMuted}
                                        autoFocus
                                    />
                                    <View style={styles.schoolBtnRow}>
                                        <Pressable onPress={() => setShowAddSchool(false)} style={[styles.schoolCancelBtn, { borderColor: theme.border }]}>
                                            <Text style={[styles.schoolCancelText, { color: theme.text }]}>Hủy</Text>
                                        </Pressable>
                                        <Pressable onPress={handleAddSchool} style={[styles.schoolSaveBtn, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.schoolSaveText}>Thêm</Text>
                                        </Pressable>
                                    </View>
                                </View>
                                <SuggestionHelper
                                    query={newSchoolName}
                                    suggestions={SCHOOL_SUGGESTIONS}
                                    onSelect={setNewSchoolName}
                                    theme={theme}
                                />
                            </View>
                        ) : (
                            <Pressable
                                onPress={() => { setShowAddSchool(true); scrollToSection('education'); }}
                                style={[styles.addSchoolBtn, { backgroundColor: theme.primaryBg }]}
                            >
                                <Ionicons name="add-circle" size={20} color={theme.primary} />
                                <Text style={[styles.addSchoolBtnText, { color: theme.primary }]}>Thêm trường học</Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Tỉnh/Thành phố hiện tại */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={(e) => handleSectionLayout('currentCity', e.nativeEvent.layout.y)}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tỉnh/Thành phố hiện tại</Text>
                        </View>

                        {editCurrentCity ? (
                            <View>
                                <View style={styles.editRow}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                        value={currentCity}
                                        onChangeText={setCurrentCity}
                                        placeholder="Nhập thành phố đang sống..."
                                        placeholderTextColor={theme.textMuted}
                                        autoFocus
                                    />
                                    <Pressable onPress={() => setEditCurrentCity(false)} style={[styles.saveInlineBtn, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.saveInlineText}>Xong</Text>
                                    </Pressable>
                                </View>
                                <SuggestionHelper
                                    query={currentCity}
                                    suggestions={CITY_SUGGESTIONS}
                                    onSelect={setCurrentCity}
                                    theme={theme}
                                />
                            </View>
                        ) : (
                            <View style={styles.detailsRow}>
                                <MaterialIcons name="home" size={22} color={theme.textMuted} style={styles.rowIcon} />
                                <View style={styles.textContainer}>
                                    {currentCity ? (
                                        <Text style={[styles.rowText, { color: theme.text }]}>
                                            Sống tại <Text style={{ fontWeight: '600' }}>{currentCity}</Text>
                                        </Text>
                                    ) : (
                                        <Text style={[styles.rowTextPlaceholder, { color: theme.textMuted }]}>
                                            Chưa thêm nơi ở hiện tại
                                        </Text>
                                    )}
                                </View>
                                <Pressable onPress={() => { setEditCurrentCity(true); scrollToSection('currentCity'); }} style={[styles.iconBtn, { backgroundColor: theme.secondaryBg }]}>
                                    <MaterialIcons name="edit" size={18} color={theme.primary} />
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* Quê quán */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={(e) => handleSectionLayout('hometown', e.nativeEvent.layout.y)}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quê quán</Text>
                        </View>

                        {editHometown ? (
                            <View>
                                <View style={styles.editRow}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                        value={hometown}
                                        onChangeText={setHometown}
                                        placeholder="Nhập quê quán của bạn..."
                                        placeholderTextColor={theme.textMuted}
                                        autoFocus
                                    />
                                    <Pressable onPress={() => setEditHometown(false)} style={[styles.saveInlineBtn, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.saveInlineText}>Xong</Text>
                                    </Pressable>
                                </View>
                                <SuggestionHelper
                                    query={hometown}
                                    suggestions={CITY_SUGGESTIONS}
                                    onSelect={setHometown}
                                    theme={theme}
                                />
                            </View>
                        ) : (
                            <View style={styles.detailsRow}>
                                <MaterialIcons name="location-on" size={22} color={theme.textMuted} style={styles.rowIcon} />
                                <View style={styles.textContainer}>
                                    {hometown ? (
                                        <Text style={[styles.rowText, { color: theme.text }]}>
                                            Đến từ <Text style={{ fontWeight: '600' }}>{hometown}</Text>
                                        </Text>
                                    ) : (
                                        <Text style={[styles.rowTextPlaceholder, { color: theme.textMuted }]}>
                                            Chưa thêm quê quán
                                        </Text>
                                    )}
                                </View>
                                <Pressable onPress={() => { setEditHometown(true); scrollToSection('hometown'); }} style={[styles.iconBtn, { backgroundColor: theme.secondaryBg }]}>
                                    <MaterialIcons name="edit" size={18} color={theme.primary} />
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* Mối quan hệ */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={(e) => handleSectionLayout('relationship', e.nativeEvent.layout.y)}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mối quan hệ</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <MaterialIcons name="favorite" size={22} color={theme.textMuted} style={[styles.rowIcon, { marginTop: 10 }]} />
                            <View style={{ flex: 1 }}>
                                <SelectList
                                    setSelected={(val: string) => setRelationship(val)}
                                    data={RELATIONSHIP_SUGGESTIONS.map((item) => ({ key: item, value: item }))}
                                    save="value"
                                    placeholder="Chọn mối quan hệ..."
                                    searchPlaceholder="Tìm kiếm..."
                                    defaultOption={relationship ? { key: relationship, value: relationship } : undefined}
                                    boxStyles={{
                                        borderColor: theme.border,
                                        backgroundColor: theme.inputBg,
                                        borderRadius: 8,
                                        minHeight: 40,
                                        alignItems: 'center',
                                    }}
                                    inputStyles={{
                                        color: theme.text,
                                        fontSize: 15,
                                    }}
                                    dropdownStyles={{
                                        borderColor: theme.border,
                                        backgroundColor: theme.card,
                                        borderRadius: 8,
                                    }}
                                    dropdownTextStyles={{
                                        color: theme.text,
                                        fontSize: 15,
                                    }}
                                    search={false}
                                    arrowicon={<Ionicons name="chevron-down" size={16} color={theme.textMuted} />}
                                    closeicon={<Ionicons name="close" size={16} color={theme.textMuted} />}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Website & Links */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={(e) => handleSectionLayout('socialLink', e.nativeEvent.layout.y)}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Liên kết</Text>
                        </View>

                        {editSocialLink ? (
                            <View>
                                <View style={styles.editRow}>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                        value={socialLink}
                                        onChangeText={setSocialLink}
                                        placeholder="instagram.com/tài_khoản..."
                                        placeholderTextColor={theme.textMuted}
                                        autoFocus
                                    />
                                    <Pressable onPress={() => setEditSocialLink(false)} style={[styles.saveInlineBtn, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.saveInlineText}>Xong</Text>
                                    </Pressable>
                                </View>
                                <SuggestionHelper
                                    query={socialLink}
                                    suggestions={LINK_SUGGESTIONS}
                                    onSelect={setSocialLink}
                                    theme={theme}
                                />
                            </View>
                        ) : (
                            <View style={styles.detailsRow}>
                                <MaterialIcons name="link" size={22} color={theme.textMuted} style={styles.rowIcon} />
                                <View style={styles.textContainer}>
                                    {socialLink ? (
                                        <Text style={[styles.rowText, { color: theme.primary }]}>
                                            {socialLink}
                                        </Text>
                                    ) : (
                                        <Text style={[styles.rowTextPlaceholder, { color: theme.textMuted }]}>
                                            Chưa thêm liên kết xã hội
                                        </Text>
                                    )}
                                </View>
                                <Pressable onPress={() => { setEditSocialLink(true); scrollToSection('socialLink'); }} style={[styles.iconBtn, { backgroundColor: theme.secondaryBg }]}>
                                    <MaterialIcons name="edit" size={18} color={theme.primary} />
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {/* Người theo dõi */}
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Người theo dõi</Text>
                        </View>
                        <View style={styles.detailsRow}>
                            <MaterialIcons name="people" size={22} color={theme.textMuted} style={styles.rowIcon} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.rowText, { color: theme.text }]}>Hiển thị số người theo dõi</Text>
                            </View>
                            <CustomToggle
                                value={showFollowers}
                                onToggle={setShowFollowers}
                                activeColor={theme.primary}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions Row */}
            <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [
                        styles.cancelBtn,
                        { backgroundColor: theme.secondaryBg, opacity: pressed ? 0.8 : 1 }
                    ]}
                >
                    <Text style={[styles.cancelBtnText, { color: theme.secondaryText }]}>Hủy</Text>
                </Pressable>
                <Pressable
                    onPress={handleSave}
                    style={({ pressed }) => [
                        styles.saveBtn,
                        { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }
                    ]}
                >
                    <Text style={styles.saveBtnText}>Lưu</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 16,
    },
    descSection: {
        paddingHorizontal: 16,
        paddingVertical: 18,
        marginHorizontal: 8,
        borderRadius: 8,
        borderCurve: 'continuous',
        borderWidth: 0.5,
        marginBottom: 4,
    },
    descTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    descText: {
        fontSize: 14,
        lineHeight: 18,
    },
    sectionsContainer: {
        gap: 4,
    },
    sectionCard: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 8,
        borderRadius: 8,
        borderCurve: 'continuous',
        borderWidth: 0.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    rowIcon: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    rowText: {
        fontSize: 15,
        lineHeight: 20,
    },
    rowTextPlaceholder: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    input: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 15,
        borderWidth: 0.5,
    },
    saveInlineBtn: {
        paddingHorizontal: 16,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveInlineText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    publicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 0.5,
    },
    publicLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    publicText: {
        fontSize: 14,
        fontWeight: '500',
    },
    schoolList: {
        marginBottom: 8,
    },
    schoolBtnRow: {
        flexDirection: 'row',
        gap: 8,
    },
    schoolCancelBtn: {
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    schoolCancelText: {
        fontSize: 15,
        fontWeight: '600',
    },
    schoolSaveBtn: {
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    schoolSaveText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    addSchoolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
        marginTop: 8,
    },
    addSchoolBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 0.5,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowOffset: { width: 0, height: -3 },
                shadowRadius: 6,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveBtn: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    toggleTrack: {
        width: 38,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1.5 },
                shadowOpacity: 0.12,
                shadowRadius: 1.5,
            },
            android: {
                elevation: 2,
            },
        }),
    },
});
