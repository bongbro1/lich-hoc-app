import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    InteractionManager,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ArrowClockwise, BookOpen, GraduationCap, Medal, Star, Trophy } from 'phosphor-react-native';
import SimpleHeader from '../components/SimpleHeader';
import { StudentInfo_Mark, Subject_Mark } from '../models/viewModel';
import { getStudentMarks } from '../services/apiService';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useLoading } from '../contexts/LoadingContext';
import { Colors } from '../utils/theme';
import { useUser } from '../contexts/UserContext';

/* ─── helpers ─────────────────────────────────────────────────── */
function getLetterColor(letter: string) {
    if (!letter) return '#9CA3AF';
    if (letter === 'A+' || letter === 'A') return '#10B981';
    if (letter === 'B+' || letter === 'B') return '#3B82F6';
    if (letter === 'C+' || letter === 'C') return '#F59E0B';
    if (letter === 'D+' || letter === 'D') return '#F97316';
    return '#EF4444'; // F
}


function getGpaColor(gpa: number) {
    if (gpa >= 3.6) return '#10B981';
    if (gpa >= 3.2) return '#3B82F6';
    if (gpa >= 2.5) return '#F59E0B';
    if (gpa >= 2.0) return '#F97316';
    return '#EF4444';
}

const THEME = {
    dark: {
        bg: '#0F172A',
        card: '#1E293B',
        text: '#F8FAFC',
        textMuted: '#94A3B8',
        border: 'rgba(255,255,255,0.08)',
        skeleton: '#334155',
        box: '#1E293B',
        accent: '#EFF6FF20',
    },
    light: {
        bg: '#F1F5F9',
        card: '#fff',
        text: '#111827',
        textMuted: '#6B7280',
        border: '#F3F4F6',
        skeleton: '#E5E7EB',
        box: '#F3F4F6',
        accent: '#EFF6FF',
    }
};

/* ─── skeleton ───────────────────────────────────────────────── */
function SkeletonBox({ width, height, style }: { width?: number | string; height: number; style?: object }) {
    const { darkMode } = useUser();
    const theme = darkMode ? THEME.dark : THEME.light;
    const anim = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View
            style={[
                { width: width ?? '100%', height, borderRadius: 8, backgroundColor: theme.skeleton, opacity: anim },
                style,
            ]}
        />
    );
}

function GradesSkeleton() {
    const { darkMode } = useUser();
    const theme = darkMode ? THEME.dark : THEME.light;
    return (
        <View>
            {/* Profile card skeleton */}
            <View style={[styles.skeletonCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                <SkeletonBox width={52} height={52} style={{ borderRadius: 26, marginRight: 12 }} />
                <View style={{ flex: 1, gap: 8 }}>
                    <SkeletonBox width='70%' height={14} />
                    <SkeletonBox width='45%' height={11} />
                </View>
                <SkeletonBox width={38} height={38} style={{ borderRadius: 10 }} />
            </View>

            {/* GPA card skeleton */}
            <View style={[styles.skeletonCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                    <SkeletonBox width={22} height={22} style={{ borderRadius: 11 }} />
                    <View style={{ gap: 6 }}>
                        <SkeletonBox width={160} height={13} />
                        <SkeletonBox width={80} height={11} />
                    </View>
                </View>
                <SkeletonBox width={52} height={36} style={{ borderRadius: 8 }} />
            </View>

            {/* Stats grid skeleton */}
            <View style={styles.skeletonGrid}>
                {[...Array(6)].map((_, i) => (
                    <View key={i} style={[styles.skeletonStatCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                        <SkeletonBox width='60%' height={18} style={{ marginBottom: 6 }} />
                        <SkeletonBox width='80%' height={10} />
                    </View>
                ))}
            </View>

            {/* Section header skeleton */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingHorizontal: 2 }}>
                <SkeletonBox width={16} height={16} style={{ borderRadius: 4 }} />
                <SkeletonBox width={140} height={14} />
                <View style={{ flex: 1 }} />
                <SkeletonBox width={60} height={24} style={{ borderRadius: 999 }} />
            </View>

            {/* Subject card skeletons */}
            {[...Array(5)].map((_, i) => (
                <View key={i} style={[styles.subjectCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0, marginBottom: 10 }]}>
                    <View style={styles.subjectHeader}>
                        <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
                        <SkeletonBox width='60%' height={13} style={{ flex: 1 }} />
                        <SkeletonBox width={64} height={26} style={{ borderRadius: 8 }} />
                    </View>
                    <View style={[styles.subjectStats, { borderTopColor: theme.border }]}>
                        {[...Array(5)].map((__, j) => (
                            <View key={j} style={styles.subjectStat}>
                                <SkeletonBox width='55%' height={9} style={{ marginBottom: 4 }} />
                                <SkeletonBox width='45%' height={13} />
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
}

/* ─── sub-components ──────────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
    const { darkMode } = useUser();
    const theme = darkMode ? THEME.dark : THEME.light;
    return (
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
            <Text style={[styles.statValue, color ? { color } : { color: theme.text }]}>{value ?? '—'}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
        </View>
    );
}

import { MotiView } from 'moti';

function SubjectCard({ item, index }: { item: Subject_Mark; index: number }) {
    const { darkMode } = useUser();
    const theme = darkMode ? THEME.dark : THEME.light;
    const isFail = item.rank === 'KHONG_DAT';
    const letterColor = getLetterColor(item.letter);
    return (
        <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: index * 50 }}
            style={[
            styles.subjectCard,
            { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 },
            isFail && styles.subjectCardFail
        ]}>
            {/* Subject name + rank badge */}
            <View style={styles.subjectHeader}>
                <View style={[styles.indexBadge, { backgroundColor: theme.box }]}>
                    <Text style={[styles.indexText, { color: theme.textMuted }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.subjectName, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                <View style={[styles.rankBadge, { backgroundColor: isFail ? (darkMode ? '#7F1D1D40' : '#FEF2F2') : (darkMode ? '#064E3B40' : '#ECFDF5') }]}>
                    <Text style={[styles.rankText, { color: isFail ? '#EF4444' : '#10B981', fontSize: 10 }]}>{item.rank || '—'}</Text>
                </View>
            </View>

            {/* Stats row */}
            <View style={[styles.subjectStats, { borderTopColor: theme.border }]}>
                <View style={styles.subjectStat}>
                    <Text style={[styles.subjectStatLabel, { color: theme.textMuted }]}>Tín chỉ</Text>
                    <Text style={[styles.subjectStatValue, { color: theme.text }]}>{item.credits}</Text>
                </View>
                <View style={[styles.subjectStatDivider, { backgroundColor: theme.border }]} />
                <View style={styles.subjectStat}>
                    <Text style={[styles.subjectStatLabel, { color: theme.textMuted }]}>Chuyên cần</Text>
                    <Text style={[styles.subjectStatValue, { color: theme.text }]}>{item.cc ?? '—'}</Text>
                </View>
                <View style={[styles.subjectStatDivider, { backgroundColor: theme.border }]} />
                <View style={styles.subjectStat}>
                    <Text style={[styles.subjectStatLabel, { color: theme.textMuted }]}>Thi</Text>
                    <Text style={[styles.subjectStatValue, { color: theme.text }]}>{item.thi ?? '—'}</Text>
                </View>
                <View style={[styles.subjectStatDivider, { backgroundColor: theme.border }]} />
                <View style={styles.subjectStat}>
                    <Text style={[styles.subjectStatLabel, { color: theme.textMuted }]}>TKHP</Text>
                    <Text style={[styles.subjectStatValue, { color: letterColor, fontWeight: '800' }]}>
                        {item.tkhp ?? '—'}
                    </Text>
                </View>
                <View style={[styles.subjectStatDivider, { backgroundColor: theme.border }]} />
                <View style={styles.subjectStat}>
                    <Text style={[styles.subjectStatLabel, { color: theme.textMuted }]}>Chữ</Text>
                    <Text style={[styles.subjectStatValue, { color: letterColor }]}>{item.letter ?? '—'}</Text>
                </View>
            </View>
        </MotiView>
    );
}

/* ─── main screen ─────────────────────────────────────────────── */
export default function GradesScreen() {
    const { darkMode } = useUser();
    const theme = darkMode ? THEME.dark : THEME.light;
    const { run } = useAsyncAction();
    const { loading, showLoading, hideLoading } = useLoading();
    const [studentInfo, setStudentInfo] = useState<StudentInfo_Mark | null>(null);
    const [subjects, setSubjects] = useState<Subject_Mark[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchStudentMarks = async (silent = false) => {
        try {
            setError(null);
            if (!silent) {
                showLoading('Đang tải kết quả học tập...');
            }

            const credentials = await storageService.get({ key: STORAGE_KEYS.CREDENTIALS });
            if (!credentials) {
                setError('Không tìm thấy thông tin đăng nhập');
                return;
            }

            const result = await run(() => getStudentMarks(credentials));
            if (result?.success && result.data) {
                setStudentInfo(result.data.studentInfo);
                setSubjects(result.data.subjects);
                await storageService.set({ key: STORAGE_KEYS.STUDENT_MARKS, value: result.data });
            } else {
                setError(result?.error || 'Không thể lấy dữ liệu từ máy chủ');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi kết nối với máy chủ');
        } finally {
            hideLoading();
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            const loadCache = async () => {
                const cachedData = await storageService.get({ key: STORAGE_KEYS.STUDENT_MARKS });
                if (cachedData) {
                    setStudentInfo(cachedData.studentInfo);
                    setSubjects(cachedData.subjects);
                    setIsInitialLoad(false);
                    return;
                }
                fetchStudentMarks();
            };
            loadCache();
        });
        return () => task.cancel();
    }, []);

    const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    const gpa4 = studentInfo ? parseFloat(studentInfo.dtbTLHS4 as any) : 0;
    const gpaColor = getGpaColor(gpa4);

    const EmptyComponent = () => {
        if (loading || isInitialLoad) return <GradesSkeleton />;

        return (
            <View style={styles.emptyState}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.box, marginBottom: 10 }]}>
                    <ArrowClockwise size={24} color={theme.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    {error ? 'Không thể tải dữ liệu' : 'Chưa có dữ liệu điểm'}
                </Text>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    {error || 'Vui lòng nhấn nút làm mới để thử lại'}
                </Text>
                <TouchableOpacity
                    style={[styles.refreshBtn, { backgroundColor: theme.accent, width: 'auto', paddingHorizontal: 20, marginTop: 15 }]}
                    onPress={() => fetchStudentMarks()}
                    activeOpacity={0.7}
                >
                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>Thử lại ngay</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const ListHeader = studentInfo ? (
        <View>
            {/* Profile card */}
            <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                {/* Avatar circle */}
                <View style={styles.avatarCircle}>
                    <GraduationCap size={32} color="#fff" weight="fill" />
                </View>

                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: theme.text }]}>{studentInfo.name}</Text>
                    <Text style={[styles.profileId, { color: theme.textMuted }]}>MSSV: {studentInfo.studentId}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.refreshBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.5 }]}
                    onPress={() => fetchStudentMarks(true)}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <ArrowClockwise size={18} color={Colors.primary} weight="bold" />
                </TouchableOpacity>
            </View>

            {/* GPA highlight */}
            <View style={[styles.gpaCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                <View style={styles.gpaLeft}>
                    <Trophy size={22} color={gpaColor} weight="fill" />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.gpaLabel, { color: theme.text }]}>Điểm trung bình tích lũy</Text>
                        <Text style={[styles.gpaSubLabel, { color: theme.textMuted }]}>Thang điểm 4</Text>
                    </View>
                </View>
                <Text style={[styles.gpaValue, { color: gpaColor }]}>{studentInfo.dtbTLHS4 ?? '—'}</Text>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
                <StatCard label="Tín chỉ tích lũy" value={studentInfo.totalCredits} color={Colors.primary} />
                <StatCard label="STC tích lũy" value={studentInfo.stcTL} color="#8B5CF6" />
                <StatCard label="TBC HS10" value={studentInfo.tbcHS10} color="#F59E0B" />
                <StatCard label="TBC HS4" value={studentInfo.tbcHS4} color="#10B981" />
                <StatCard label="DTB TL HS10" value={studentInfo.dtbTLHS10} color="#EC4899" />
                <StatCard label="DTB TL HS4" value={studentInfo.dtbTLHS4} color={gpaColor} />
            </View>

            {/* Section label */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Danh sách môn học</Text>
                <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.countText}>{subjects.length} môn</Text>
                </View>
            </View>
        </View>
    ) : null;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <SimpleHeader title="Kết quả học tập" />

            <FlatList
                data={sortedSubjects}
                keyExtractor={(item) => item.code}
                renderItem={({ item, index }) => <SubjectCard item={item} index={index} />}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyComponent />}
            />
        </View>
    );
}

/* ─── styles ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 14,
        paddingBottom: 30,
    },

    /* Profile card */
    profileCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    avatarCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 15,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    profileId: {
        fontSize: 12,
        marginTop: 2,
    },
    refreshBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* GPA card */
    gpaCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    gpaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gpaLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    gpaSubLabel: {
        fontSize: 11,
        marginTop: 1,
    },
    gpaValue: {
        fontSize: 32,
        fontWeight: '900',
    },

    /* Stats grid */
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
    },
    statCard: {
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        width: (Dimensions.get('window').width - 28 - 20) / 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        textAlign: 'center',
        fontWeight: '600',
    },

    /* Section header */
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    countText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primary,
    },

    /* Subject card */
    subjectCard: {
        borderRadius: 14,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },
    subjectCardFail: {
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    subjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 10,
    },
    indexBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indexText: {
        fontSize: 10,
        fontWeight: '700',
    },
    subjectName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    rankBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 36,
        alignItems: 'center',
    },
    rankText: {
        fontSize: 13,
        fontWeight: '900',
    },
    statusBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
    },
    subjectStats: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingVertical: 8,
    },
    subjectStat: {
        flex: 1,
        alignItems: 'center',
    },
    subjectStatDivider: {
        width: 1,
        marginVertical: 4,
    },
    subjectStatLabel: {
        fontSize: 9,
        fontWeight: '600',
        marginBottom: 2,
    },
    subjectStatValue: {
        fontSize: 13,
        fontWeight: '700',
    },

    /* Empty state */
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    emptyText: {
        fontSize: 13,
        color: '#D1D5DB',
    },

    /* Skeleton */
    skeletonCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    skeletonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14,
    },
    skeletonStatCard: {
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: 'center',
        width: (Dimensions.get('window').width - 28 - 20) / 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
});
