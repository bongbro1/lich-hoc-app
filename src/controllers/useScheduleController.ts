import { useCallback, useRef, useState } from 'react';

export const useScheduleController = () => {
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const lastDateRef = useRef<string | null>(null);
    const isFromScrollRef = useRef(false);
    const isFromCalendarRef = useRef(false);

    const updateFromScroll = useCallback((date: Date) => {
        const key = date.toDateString();

        if (lastDateRef.current === key) return;
        if (isFromCalendarRef.current) return;

        lastDateRef.current = key;
        setSelectedDate(date);
    }, []);

    const updateFromCalendar = useCallback((date: Date) => {
        const key = date.toDateString();

        if (lastDateRef.current === key) return;

        lastDateRef.current = key;
        isFromCalendarRef.current = true;
        setSelectedDate(date);
    }, []);

    const doneScroll = useCallback(() => {
        isFromScrollRef.current = false;
    }, []);

    const doneCalendar = useCallback(() => {
        isFromCalendarRef.current = false;
    }, []);

    return {
        selectedDate,
        updateFromScroll,
        updateFromCalendar,
        doneScroll,
        doneCalendar,
        isFromScrollRef,
        isFromCalendarRef,
    };
};
