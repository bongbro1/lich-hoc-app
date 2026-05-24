import React, {
    forwardRef,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    LayoutAnimation,
    Text,
} from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { formatDate } from '../utils/date';
import { WEEKDAY } from '../utils/constants';
import { DaySchedule } from '../models/schedule';
import { Colors } from '../utils/theme';
import { useUser } from '../contexts/UserContext';

export interface CalendarViewRef {
    selectDate: (date: Date) => void;
}

interface CalendarViewProps {
    selectedDate: Date;
    onDateChange?: (date: Date) => void;
    schedules: DaySchedule[];
}

type PropsWeek = {
    date: Date;
    onSelectDate?: (d: Date) => void;
    scheduledDateKeys?: Set<string>;
};

LocaleConfig.locales.vi = {
    monthNames: [
        'Th\u00e1ng 1', 'Th\u00e1ng 2', 'Th\u00e1ng 3', 'Th\u00e1ng 4',
        'Th\u00e1ng 5', 'Th\u00e1ng 6', 'Th\u00e1ng 7', 'Th\u00e1ng 8',
        'Th\u00e1ng 9', 'Th\u00e1ng 10', 'Th\u00e1ng 11', 'Th\u00e1ng 12',
    ],
    monthNamesShort: [
        'Th1', 'Th2', 'Th3', 'Th4',
        'Th5', 'Th6', 'Th7', 'Th8',
        'Th9', 'Th10', 'Th11', 'Th12',
    ],
    dayNames: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    today: 'Hôm nay',
};

LocaleConfig.defaultLocale = 'vi';



const CalendarView = forwardRef<CalendarViewRef, CalendarViewProps>(
    ({ selectedDate, onDateChange, schedules }, ref) => {
        const [expanded, setExpanded] = useState(false);
        const { darkMode } = useUser();
        const todayKey = useMemo(() => formatDate(new Date()), []);

        const theme = {
            card: darkMode ? '#1E293B' : '#fff',
            text: darkMode ? '#F8FAFC' : '#222',
            textMuted: darkMode ? '#94A3B8' : '#777',
            border: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        };

        useImperativeHandle(ref, () => ({
            selectDate: (date: Date) => {
                onDateChange?.(date);
            },
        }));

        const handleDayPress = (day: Date) => {
            onDateChange?.(day);
        };

        const { baseMarkedDates, scheduledDateKeys } = useMemo(() => {
            const marked: Record<string, any> = {};
            const keys = new Set<string>();

            schedules?.forEach(schedule => {
                if (schedule.lessons.length === 0) return;

                const key = formatDate(schedule.date);
                keys.add(key);
                marked[key] = {
                    dots: [{ color: 'red', key: `lesson-${key}` }],
                };
            });

            return {
                baseMarkedDates: marked,
                scheduledDateKeys: keys,
            };
        }, [schedules]);

        const markedDates = useMemo(() => {
            const selectedKey = formatDate(selectedDate);
            const nextMarkedDates = { ...baseMarkedDates };

            nextMarkedDates[selectedKey] = {
                ...(nextMarkedDates[selectedKey] || {}),
                selected: true,
                selectedColor: Colors.primary,
                dots: nextMarkedDates[selectedKey]?.dots || [],
            };

            nextMarkedDates[todayKey] = {
                ...(nextMarkedDates[todayKey] || {}),
                selected: true,
                selectedColor: Colors.orange,
                dots: nextMarkedDates[todayKey]?.dots || [],
            };

            return nextMarkedDates;
        }, [baseMarkedDates, selectedDate]);

        return (
            <View style={[styles.calendarBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                <View style={{ display: expanded ? 'none' : 'flex' }}>
                    <WeekView
                        date={selectedDate}
                        onSelectDate={handleDayPress}
                        scheduledDateKeys={scheduledDateKeys}
                    />
                </View>

                <View style={{ display: expanded ? 'flex' : 'none' }}>
                    <Calendar
                        current={formatDate(selectedDate)}
                        markingType="multi-dot"
                        markedDates={markedDates}
                        onDayPress={(day: DateData) =>
                            handleDayPress(new Date(`${day.dateString}T00:00:00`))
                        }
                        theme={{
                            backgroundColor: theme.card,
                            calendarBackground: theme.card,
                            textSectionTitleColor: darkMode ? '#94A3B8' : '#666',
                            selectedDayBackgroundColor: Colors.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: Colors.orange,
                            dayTextColor: darkMode ? '#F8FAFC' : '#222',
                            textDisabledColor: darkMode ? '#475569' : '#d9e1e8',
                            dotColor: 'red',
                            selectedDotColor: '#ffffff',
                            arrowColor: darkMode ? Colors.primary : '#007AFF',
                            monthTextColor: darkMode ? '#F8FAFC' : '#222',
                            textDayFontSize: 14,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 12,
                        }}
                        style={{
                            marginBottom: 4,
                            height: 312,
                            overflow: 'hidden',
                        }}
                    />
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        setExpanded(prev => !prev);
                    }}
                >
                    <Text style={[styles.hintText, { color: theme.textMuted }]}>
                        {expanded
                            ? 'Thu gọn lịch'
                            : 'Nhấn để xem lịch tháng'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }
);

export default React.memo(CalendarView);

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

const WeekView = React.memo(function WeekView({
    date,
    onSelectDate,
    scheduledDateKeys,
}: PropsWeek) {
    const { darkMode } = useUser();
    const startOfWeek = (value: Date) => {
        const start = new Date(value);
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        return start;
    };

    const start = startOfWeek(date);
    const days = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
    });

    const today = new Date();

    return (
        <View style={styles.box}>
            <View style={styles.row}>
                {WEEKDAY.map(label => (
                    <View key={label} style={styles.cell}>
                        <Text style={styles.weekday}>{label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.row}>
                {days.map(day => {
                    const dayKey = formatDate(day);
                    const selectedKey = formatDate(date);
                    const todayKey = formatDate(today);
                    
                    const selected = dayKey === selectedKey;
                    const isToday = dayKey === todayKey;
                    const hasLesson = scheduledDateKeys?.has(dayKey);

                    return (
                        <TouchableOpacity
                            key={dayKey}
                            style={styles.cell}
                            onPress={() => onSelectDate?.(day)}
                        >
                            <View
                                style={[
                                    styles.circle,
                                    isToday && styles.circleNumToday,
                                    (selected && !isToday) && styles.circleSel, // Chỉ hiện màu xanh nếu không phải là hôm nay
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.num,
                                        { color: darkMode ? '#F8FAFC' : '#222' },
                                        isToday && styles.numToday,
                                        (selected && !isToday) && styles.numSel, // Chỉ hiện chữ trắng nếu không phải là hôm nay
                                    ]}
                                >
                                    {day.getDate()}
                                </Text>
                                {hasLesson && <View style={styles.dot} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'red',
        position: 'absolute',
        bottom: 2,
        left: '50%',
        transform: [{ translateX: -2 }],
    },
    calendarBox: {
        borderRadius: 12,
        padding: 10,
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    hintText: {
        textAlign: 'center',
        color: '#777',
        fontStyle: 'italic',
        fontSize: 14,
        marginTop: 12,
    },
    numToday: {
        color: '#fff',
        fontWeight: 'bold',
    },
    circleNumToday: {
        width: 32,
        height: 32,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffa31a',
    },
    box: {},
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    cell: { flex: 1, alignItems: 'center', borderRadius: 20 },
    weekday: { fontSize: 12, color: '#666', marginBottom: 6, opacity: 0.7 },
    circle: {
        width: 32,
        height: 32,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleSel: { backgroundColor: Colors.primary, borderRadius: 18 },
    num: { fontSize: 14 },
    numSel: { color: '#fff' },
});
