import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, InteractionManager } from 'react-native';
import SimpleHeader from '../components/SimpleHeader';
import { Colors } from '../utils/theme';
import { useUser } from '../contexts/UserContext';
import storageService, { STORAGE_KEYS } from '../services/storageService';
import { addMinutes, formatTimeSchedule } from 'utils/date';

type ScheduleItem = {
    id: string;
    period: number;
    start: string;
    end: string;
};

const dsTietTrongNgay = [
    { "tiet": 1, "gio_bat_dau": "06:30", "gio_ket_thuc": "07:45", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 2, "gio_bat_dau": "07:55", "gio_ket_thuc": "09:10", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 3, "gio_bat_dau": "09:20", "gio_ket_thuc": "10:35", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 4, "gio_bat_dau": "10:45", "gio_ket_thuc": "12:00", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 5, "gio_bat_dau": "12:30", "gio_ket_thuc": "13:45", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 6, "gio_bat_dau": "13:55", "gio_ket_thuc": "15:10", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 7, "gio_bat_dau": "15:20", "gio_ket_thuc": "16:35", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 8, "gio_bat_dau": "16:45", "gio_ket_thuc": "18:00", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 9, "gio_bat_dau": "18:10", "gio_ket_thuc": "19:25", "so_phut": 75, "nhhk": 20251 },
    { "tiet": 10, "gio_bat_dau": "19:35", "gio_ket_thuc": "20:50", "so_phut": 75, "nhhk": 20251 }
];

const generateScheduleICTU = (): ScheduleItem[] => {
    const sessions = [
        { start: [6, 45], count: 5 },
        { start: [13, 0], count: 5 },
        { start: [18, 15], count: 5 },
    ];
    let period = 1;
    const result: ScheduleItem[] = [];
    sessions.forEach(({ start, count }) => {
        let [hour, minute] = start;
        for (let i = 0; i < count; i++) {
            const startTime = formatTimeSchedule(hour, minute);
            const endTimeObj = addMinutes(hour, minute, 50);
            const endTime = formatTimeSchedule(endTimeObj.hour, endTimeObj.minute);
            result.push({ id: `${period}`, period, start: startTime, end: endTime });
            const breakTime = [2, 7, 12].includes(period) ? 10 : 5;
            const next = addMinutes(endTimeObj.hour, endTimeObj.minute, breakTime);
            hour = next.hour; minute = next.minute;
            period++;
        }
    });
    return result;
};

export default function ScheduleScreen() {
    const { darkMode } = useUser();
    const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            const load = async () => {
                const user = await storageService.get({ key: STORAGE_KEYS.CREDENTIALS });
                if (!user) return;
                const data = user.domain === 'TNUT'
                    ? dsTietTrongNgay.map(item => ({ id: `${item.tiet}`, period: item.tiet, start: item.gio_bat_dau, end: item.gio_ket_thuc }))
                    : generateScheduleICTU();
                setScheduleData(data);
            };
            load();
        });
        return () => task.cancel();
    }, []);

    const theme = {
        bg: darkMode ? '#0F172A' : '#F5F7FB',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#1E293B',
        textMuted: darkMode ? '#94A3B8' : '#64748B',
        border: darkMode ? '#334155' : '#E2E8F0',
        header: darkMode ? '#334155' : '#F1F5F9',
        accent: Colors.primary,
        subAccent: `${Colors.primary}15`,
    };

    const nowMinutes = useMemo(() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    }, []);

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const renderItem = ({ item }: { item: ScheduleItem }) => {
        const isCurrent = nowMinutes >= timeToMinutes(item.start) && nowMinutes <= timeToMinutes(item.end);

        return (
            <View style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                isCurrent && [styles.activeCard, { borderColor: theme.accent }]
            ]}>
                <View style={[styles.periodBadge, { backgroundColor: isCurrent ? theme.accent : theme.header }]}>
                    <Text style={[styles.periodText, { color: isCurrent ? '#FFF' : theme.textMuted }]}>
                        {item.period}
                    </Text>
                </View>

                <View style={styles.timeInfo}>
                    <View style={styles.timeBlock}>
                        <Text style={[styles.timeLabel, { color: theme.textMuted }]}>Bắt đầu</Text>
                        <Text style={[styles.timeValue, { color: isCurrent ? theme.accent : theme.text }]}>{item.start}</Text>
                    </View>
                    <View style={[styles.timeDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.timeBlock}>
                        <Text style={[styles.timeLabel, { color: theme.textMuted }]}>Kết thúc</Text>
                        <Text style={[styles.timeValue, { color: isCurrent ? theme.accent : theme.text }]}>{item.end}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SimpleHeader title="Thời gian biểu" />

            <FlatList
                data={scheduleData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <Text style={[styles.listSubtitle, { color: theme.textMuted }]}>
                            Danh sách tiết học trong ngày
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 12,
        paddingBottom: 32,
    },
    listHeader: {
        marginBottom: 12,
    },
    listSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    activeCard: {
        borderWidth: 1.5,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        transform: [{ scale: 1.01 }],
    },
    periodBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    periodText: {
        fontSize: 15,
        fontWeight: '800',
    },
    timeInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeBlock: {
        flex: 1,
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 0,
    },
    timeValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    timeDivider: {
        width: 1,
        height: 20,
        marginHorizontal: 12,
    },
});