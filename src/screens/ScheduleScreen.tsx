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
        bg: darkMode ? '#0F172A' : '#F8FAFC',
        card: darkMode ? '#1E293B' : '#FFFFFF',
        text: darkMode ? '#F8FAFC' : '#1E293B',
        textMuted: darkMode ? '#94A3B8' : '#64748B',
        border: darkMode ? '#334155' : '#E2E8F0',
        header: darkMode ? '#334155' : '#F1F5F9',
        accent: Colors.primary,
    };

    const nowMinutes = useMemo(() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    }, []);

    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const renderItem = ({ item, index }: { item: ScheduleItem, index: number }) => {
        const isCurrent = nowMinutes >= timeToMinutes(item.start) && nowMinutes <= timeToMinutes(item.end);

        return (
            <View style={[
                styles.row,
                { borderBottomColor: theme.border },
                isCurrent && { backgroundColor: `${theme.accent}15` }
            ]}>
                <View style={[styles.cell, styles.periodCell, { borderRightColor: theme.border }]}>
                    <Text style={[styles.cellText, { color: isCurrent ? theme.accent : theme.text, fontWeight: isCurrent ? '800' : '500' }]}>
                        {item.period}
                    </Text>
                </View>
                <View style={[styles.cell, { borderRightColor: theme.border }]}>
                    <Text style={[styles.cellText, { color: isCurrent ? theme.accent : theme.text, fontWeight: isCurrent ? '700' : '400' }]}>
                        {item.start}
                    </Text>
                </View>
                <View style={styles.cell}>
                    <Text style={[styles.cellText, { color: isCurrent ? theme.accent : theme.text, fontWeight: isCurrent ? '700' : '400' }]}>
                        {item.end}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SimpleHeader title="Thời gian biểu" />

            <View style={styles.container}>
                <View style={[styles.tableContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {/* Header Row */}
                    <View style={[styles.row, styles.headerRow, { backgroundColor: theme.header, borderBottomColor: theme.border }]}>
                        <View style={[styles.cell, styles.periodCell, { borderRightColor: theme.border }]}>
                            <Text style={[styles.headerText, { color: theme.textMuted }]}>Tiết</Text>
                        </View>
                        <View style={[styles.cell, { borderRightColor: theme.border }]}>
                            <Text style={[styles.headerText, { color: theme.textMuted }]}>Giờ vào</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={[styles.headerText, { color: theme.textMuted }]}>Giờ ra</Text>
                        </View>
                    </View>

                    {/* Data List */}
                    <FlatList
                        data={scheduleData}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 20,
    },
    tableContainer: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    headerRow: {
        paddingVertical: 12,
    },
    cell: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
    },
    periodCell: {
        flex: 0.7,
    },
    headerText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cellText: {
        fontSize: 15,
    },
});