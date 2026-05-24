import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    ListRenderItem,
} from 'react-native';
import { WEEKDAY } from '../utils/constants';
import { DaySchedule, Lesson } from '../models/schedule';
import { formatDate } from '../utils/date';
import { throttle } from 'lodash';
import { Colors } from '../utils/theme';
import { useUser } from '../contexts/UserContext';

interface ScheduleViewProps {
    schedules: DaySchedule[];
    selectedDate: Date;
    onVisibleDateChange?: (date: Date) => void;
    isFromCalendarRef?: React.MutableRefObject<boolean>;
    doneCalendar?: () => void;
}

export interface ScheduleViewRef {
    scrollToDate: (date: Date) => void;
}

const numberItemToRender = 10;
const viewabilityConfig = { itemVisiblePercentThreshold: 80 };



const LessonCard = React.memo(({ lesson, color }: { lesson: Lesson, color: string }) => {
    if (lesson.isExam) {
        return <ExamCard lesson={lesson} color={color} />;
    }

    return <NormalLessonCard lesson={lesson} color={color} />;
});

const ExamCard = React.memo(({ lesson, color }: { lesson: Lesson, color: string }) => {
    const { darkMode } = useUser();
    const textColor = darkMode ? color : Colors.white;

    return (
        <View style={styles.lessonCard}>
            <View style={[styles.bulletRow, styles.underlineTime, { borderBottomColor: darkMode ? `${color}40` : Colors.white }]}>
                <Text style={[styles.timeStudy, { color: textColor }]}>
                    {lesson.startHour} - {lesson.endHour}
                </Text>

                <View style={styles.examTag}>
                    <View style={styles.whiteDot} />
                    <Text style={styles.examText}>Lịch thi</Text>
                </View>
            </View>

            <View style={styles.bulletRow}>
                <Text style={[styles.subjectName, { color: textColor }]}>
                    {lesson.title} ({lesson.code})
                </Text>
            </View>

            {lesson.studentId && (
                <View style={styles.bulletRow}>
                    <Text style={[styles.bullet, { color: textColor }]}>{'\u2022'}</Text>
                    <Text style={[styles.info, { color: textColor }]}>SBD: {lesson.studentId}</Text>
                </View>
            )}

            <View style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: textColor }]}>{'\u2022'}</Text>
                <Text style={[styles.info, { color: textColor }]}>Phòng: {lesson.location}</Text>
            </View>

            {lesson.examSession && (
                <View style={styles.bulletRow}>
                    <Text style={[styles.bullet, { color: textColor }]}>{'\u2022'}</Text>
                    <Text style={[styles.info, { color: textColor }]}>Ca thi: {lesson.examSession.replace(/\n/g, ' ')}</Text>
                </View>
            )}

            {lesson.examType && (
                <View style={styles.bulletRow}>
                    <Text style={[styles.bullet, { color: textColor }]}>{'\u2022'}</Text>
                    <Text style={[styles.info, { color: textColor }]}>Hình thức thi: {lesson.examType}</Text>
                </View>
            )}
        </View>
    );
});

const NormalLessonCard = React.memo(({ lesson, color }: { lesson: Lesson, color: string }) => {
    const { darkMode } = useUser();
    const textColor = darkMode ? color : Colors.white;

    return (
        <View style={styles.lessonCard}>
            <View style={[styles.bulletRow, styles.underlineTime, { borderBottomColor: darkMode ? `${color}40` : Colors.white }]}>
                <Text style={[styles.timeStudy, { color: textColor }]}>
                    {lesson.startHour} - {lesson.endHour}
                </Text>

                <View style={styles.lessonTag}>
                    <View style={styles.whiteDot} />
                    <Text style={styles.lessonText}>Lịch học</Text>
                </View>
            </View>

            <View style={styles.bulletRow}>
                <Text style={[styles.subjectName, { color: textColor }]}>{lesson.title}</Text>
            </View>

            {lesson.location && lesson.location !== '-' && (
                <View style={styles.bulletRow}>
                    <Text style={[styles.bullet, { color: textColor }]}>{'\u2022'}</Text>
                    <Text style={[styles.info, { color: textColor }]}>Phòng: {lesson.location}</Text>
                </View>
            )}

            {lesson.teacher && (
                <View style={styles.bulletRow}>
                    <Text style={[styles.bullet, { color: textColor }]}>{'\u2022'}</Text>
                    <Text style={[styles.info, { color: textColor }]}>Giáo viên: {lesson.teacher}</Text>
                </View>
            )}
        </View>
    );
});

const DayCard = React.memo(
    ({ item }: { item: DaySchedule }) => {
        const { darkMode } = useUser();
        const dayDate = new Date(item.date);
        dayDate.setHours(0, 0, 0, 0);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const tmr = new Date(now);
        tmr.setDate(now.getDate() + 1);

        let accentColor = Colors.primary;
        if (dayDate.getTime() === now.getTime()) {
            accentColor = Colors.orange;
        } else if (dayDate.getTime() === tmr.getTime()) {
            accentColor = Colors.purple;
        } else if (dayDate.getTime() < now.getTime()) {
            accentColor = darkMode ? '#94A3B8' : '#b3b3b3';
        }

        const theme = {
            card: darkMode ? '#1E293B' : '#fff',
            dateText: darkMode ? accentColor : Colors.primary,
            weekText: darkMode ? '#94A3B8' : '#666',
            boxBg: darkMode ? `${accentColor}20` : accentColor,
            border: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        };

        return (
            <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: darkMode ? 1 : 0 }]}>
                <View style={styles.dateBox}>
                    <Text style={[styles.dayText, { color: theme.dateText }]}>{item.date.getDate()}</Text>
                    <Text style={[styles.weekText, { color: theme.weekText }]}>{WEEKDAY[item.date.getDay()]}</Text>
                </View>

                <View style={[styles.lessonBox, { backgroundColor: theme.boxBg }]}>
                    {item.lessons.length === 0 ? (
                        <View style={styles.freeBox}>
                            <Text style={[styles.freeText, { color: darkMode ? accentColor : Colors.white }]}>Bạn rảnh...</Text>
                        </View>
                    ) : (
                        item.lessons.map(lesson => (
                            <LessonCard key={lesson.id} lesson={lesson} color={accentColor} />
                        ))
                    )}
                </View>
            </View>
        );
    },
    (prev, next) =>
        formatDate(prev.item.date) === formatDate(next.item.date) &&
        prev.item.lessons === next.item.lessons
);

const ScheduleView = forwardRef<ScheduleViewRef, ScheduleViewProps>(
    ({ schedules, selectedDate, onVisibleDateChange, isFromCalendarRef, doneCalendar }, ref) => {
        const { darkMode } = useUser();
        const { today, todayStr } = useMemo(() => {
            const t = new Date();
            t.setHours(0, 0, 0, 0);
            return { today: t, todayStr: formatDate(t) };
        }, []);

        const [renderSchedules, setRenderSchedules] = useState<DaySchedule[]>(() => {
            if (!schedules.length) return [];
            const DAYS_BEFORE = 3;
            const tStr = formatDate(today);
            const todayIdx = schedules.findIndex(s => formatDate(s.date) === tStr);
            const startIdx = todayIdx > -1 ? Math.max(0, todayIdx - DAYS_BEFORE) : 0;
            return schedules.slice(startIdx);
        });
        const flatListRef = useRef<FlatList<DaySchedule> | null>(null);
        const isInitialScrollRef = useRef(true);
        const lastDateRef = useRef<string | null>(null);
        const [isLoadingMore, setIsLoadingMore] = useState(false);
        const isAppendingRef = useRef(false);

        const scheduleMap = useMemo(() => buildScheduleMap(schedules), [schedules]);

        useEffect(() => {
            if (!schedules.length) {
                setRenderSchedules([]);
                isInitialScrollRef.current = true;
                lastDateRef.current = null;
                return;
            }

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const tStr = formatDate(now);

            const DAYS_BEFORE = 3;
            const todayIdx = schedules.findIndex(
                s => formatDate(s.date) === tStr
            );
            const startIdx = todayIdx > -1 ? Math.max(0, todayIdx - DAYS_BEFORE) : 0;


            setRenderSchedules(schedules.slice(startIdx));
            isInitialScrollRef.current = true;
            lastDateRef.current = null;
        }, [schedules]);

        useEffect(() => {
            if (!selectedDate || !renderSchedules.length) return;
            if (isInitialScrollRef.current) return;

            const firstDate = renderSchedules[0]?.date;
            const lastDate = renderSchedules[renderSchedules.length - 1]?.date;

            if (firstDate && formatDate(selectedDate) < formatDate(firstDate)) {
                setRenderSchedules(prev => {
                    let nextSchedules = prev;

                    while (formatDate(nextSchedules[0].date) > formatDate(selectedDate)) {
                        nextSchedules = prependPreviousDays(
                            nextSchedules,
                            scheduleMap,
                            numberItemToRender
                        );
                    }

                    return nextSchedules;
                });
                return;
            }

            if (lastDate && formatDate(selectedDate) > formatDate(lastDate)) {
                setRenderSchedules(prev => {
                    let nextSchedules = prev;

                    while (
                        formatDate(nextSchedules[nextSchedules.length - 1].date) <
                        formatDate(selectedDate)
                    ) {
                        nextSchedules = appendNextDays(
                            nextSchedules,
                            scheduleMap,
                            numberItemToRender
                        );
                    }

                    return nextSchedules;
                });
            }
        }, [renderSchedules, scheduleMap, selectedDate]);

        useEffect(() => {
            if (!selectedDate || !renderSchedules.length) return;
            if (!isInitialScrollRef.current) return;

            const index = renderSchedules.findIndex(
                schedule => formatDate(schedule.date) === formatDate(selectedDate)
            );

            if (index !== -1) {
                // Tăng timeout lên 500ms để Android chắc chắn render xong
                setTimeout(() => {
                    if (flatListRef.current) {
                        flatListRef.current.scrollToIndex({
                            index: index,
                            animated: false,
                            viewPosition: 0,
                        });
                        lastDateRef.current = formatDate(selectedDate);

                        setTimeout(() => {
                            isInitialScrollRef.current = false;
                            doneCalendar?.();
                        }, 500);
                    }
                }, 500);
            } else {
                isInitialScrollRef.current = false;
                doneCalendar?.();
            }
        }, [doneCalendar, renderSchedules, selectedDate]);

        useEffect(() => {
            if (!selectedDate || !renderSchedules.length) return;
            if (isInitialScrollRef.current) return;
            if (!isFromCalendarRef?.current) return;

            const index = renderSchedules.findIndex(
                schedule => formatDate(schedule.date) === formatDate(selectedDate)
            );

            if (index === -1) return;

            flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0,
            });

            lastDateRef.current = formatDate(selectedDate);
        }, [isFromCalendarRef, renderSchedules, selectedDate]);

        const handleScrollToDate = useCallback((date: Date) => {
            const index = renderSchedules.findIndex(
                schedule => formatDate(schedule.date) === formatDate(date)
            );

            if (index === -1) return;

            flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0,
            });
        }, [renderSchedules]);

        useImperativeHandle(ref, () => ({
            scrollToDate: handleScrollToDate,
        }), [handleScrollToDate]);

        const handleEndReached = useCallback(
            throttle(() => {
                if (isAppendingRef.current) return;

                isAppendingRef.current = true;
                setIsLoadingMore(true);

                requestAnimationFrame(() => {
                    setRenderSchedules(prev =>
                        appendNextDays(prev, scheduleMap, numberItemToRender)
                    );

                    setIsLoadingMore(false);
                    isAppendingRef.current = false;
                });
            }, 160),
            [scheduleMap]
        );

        const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
            if (!viewableItems.length) return;
            if (isInitialScrollRef.current) {
                return;
            }
            if (isFromCalendarRef?.current) {
                return;
            }

            let firstVisibleItem = viewableItems[0];
            const nextDate = formatDate(firstVisibleItem.item.date);

            if (lastDateRef.current === nextDate) return;
            lastDateRef.current = nextDate;
            onVisibleDateChange?.(firstVisibleItem.item.date);
        }).current;

        const renderItem = useCallback<ListRenderItem<DaySchedule>>(
            ({ item }) => <DayCard item={item} />,
            []
        );

        const keyExtractor = useCallback(
            (item: DaySchedule) => formatDate(item.date),
            []
        );

        return (
            <FlatList
                ref={flatListRef}
                data={renderSchedules}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                initialNumToRender={5}
                maxToRenderPerBatch={4}
                updateCellsBatchingPeriod={50}
                windowSize={4}
                removeClippedSubviews
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.25}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                onScrollToIndexFailed={info => {
                    flatListRef.current?.scrollToOffset({
                        offset: info.averageItemLength * info.index,
                        animated: false,
                    });

                    requestAnimationFrame(() => {
                        flatListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: false,
                            viewPosition: 0,
                        });
                    });
                }}
                onMomentumScrollEnd={() => {
                    doneCalendar?.();
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={styles.footerLoading}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={[styles.footerLoadingText, { color: darkMode ? '#94A3B8' : Colors.primary }]}>
                                {'Đang tải thêm lịch...'}
                            </Text>
                        </View>
                    ) : null
                }
            />
        );
    }
);

export default ScheduleView;

const formatKey = (date: Date): string => {
    return formatDate(date);
};



const buildScheduleMap = (allSchedules: DaySchedule[]) => {
    const map = new Map<string, DaySchedule>();

    allSchedules.forEach(schedule => {
        map.set(formatKey(schedule.date), schedule);
    });

    return map;
};

const prependPreviousDays = (
    currentSchedules: DaySchedule[],
    scheduleMap: Map<string, DaySchedule>,
    daysToAdd: number = 10
): DaySchedule[] => {
    if (currentSchedules.length === 0) {
        return Array.from(scheduleMap.values()).slice(0, daysToAdd);
    }

    const firstDate = currentSchedules[0].date;
    const newSchedules: DaySchedule[] = [];

    for (let i = daysToAdd; i >= 1; i--) {
        const newDate = new Date(firstDate);
        newDate.setDate(newDate.getDate() - i);

        const key = formatKey(newDate);
        newSchedules.push(scheduleMap.get(key) ?? { date: newDate, lessons: [] });
    }

    return [...newSchedules, ...currentSchedules];
};

const appendNextDays = (
    currentSchedules: DaySchedule[],
    scheduleMap: Map<string, DaySchedule>,
    daysToAdd: number = 10
): DaySchedule[] => {
    if (currentSchedules.length === 0) {
        return Array.from(scheduleMap.values()).slice(0, daysToAdd);
    }

    const lastDate = currentSchedules[currentSchedules.length - 1].date;
    const newSchedules: DaySchedule[] = [];

    for (let i = 1; i <= daysToAdd; i++) {
        const newDate = new Date(lastDate);
        newDate.setDate(newDate.getDate() + i);

        const key = formatKey(newDate);
        newSchedules.push(scheduleMap.get(key) ?? { date: newDate, lessons: [] });
    }

    return [...currentSchedules, ...newSchedules];
};

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: 16,
    },
    footerLoading: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLoadingText: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '500',
    },
    lessonTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F766E',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    whiteDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
        marginRight: 4,
    },
    lessonText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    examTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    examText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    dayCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 14,
        marginVertical: 6,
        marginHorizontal: 2,
        padding: 8,
        minWidth: 200,
        elevation: 2,
        minHeight: 80,
    },
    dateBox: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    dayText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    weekText: { fontSize: 12, color: '#666' },
    lessonBox: {
        flex: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    freeBox: {
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    freeText: { color: Colors.white, fontStyle: 'italic', opacity: 0.8 },
    lessonCard: {
        padding: 8,
    },
    subject: { fontWeight: '700', fontSize: 14 },
    info: { fontSize: 12, color: Colors.white },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    bullet: {
        fontSize: 10,
        lineHeight: 18,
        marginRight: 6,
        color: Colors.white,
    },
    underlineTime: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.white,
    },
    timeStudy: {
        fontWeight: '500',
        flex: 1,
        color: Colors.white,
    },
    subjectName: {
        fontWeight: '600',
        fontSize: 14,
        color: Colors.white,
    },
});
