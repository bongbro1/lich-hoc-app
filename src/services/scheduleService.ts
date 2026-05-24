
import { DaySchedule, Lesson } from '../models/schedule';
import { isSameDay } from '../utils/date';
import { getSchedule } from './apiService';
import storageService, { STORAGE_KEYS } from './storageService';

type APIResponse = {
  studentId: string;
  name: string;
  major: string;
  lessons: Lesson[];
};

export const getScheduleForDate = async (date: Date, refresh: boolean = false): Promise<DaySchedule> => {
  const lessons = await fetchSchedulesFromAPI(refresh);

  // Lọc các lesson cùng ngày
  const lessonsForDay = lessons.filter(l => isSameDay(new Date(l.date), date));

  return {
    date: new Date(date),
    lessons: lessonsForDay,
  };
};


export const getSchedulesForRange = async (
  refresh: boolean = false,
): Promise<DaySchedule[]> => {
  const schedules = await fetchSchedulesFromAPI(refresh);
  const fallbackDate = new Date();
  fallbackDate.setHours(0, 0, 0, 0);

  if (schedules == null) {
    return [
      {
        date: fallbackDate,
        lessons: [],
      },
    ];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scheduleDates = schedules.map(s => new Date(s.date).getTime());
  // Đảm bảo dải ngày luôn bao gồm ít nhất là từ "Hôm nay"
  const minDate = new Date(Math.min(today.getTime(), ...scheduleDates));
  const maxDate = new Date(Math.max(today.getTime(), ...scheduleDates));

  const result: DaySchedule[] = [];
  let current = new Date(minDate);

  while (current <= maxDate) {
    // ✅ gom tất cả schedule cùng ngày
    const lessonsForDay: Lesson[] = Array.from(
      new Map(
        schedules
          .filter(l => {
            // Nếu string là YYYY-MM-DD, parse thủ công để tránh bị nhảy múi giờ
            if (typeof l.date === 'string' && l.date.includes('-')) {
              const [y, m, d] = l.date.split('-').map(Number);
              return isSameDay(new Date(y, m - 1, d), current);
            }
            return isSameDay(new Date(l.date), current);
          })
          .map(l => [`${l.title}-${l.startHour}-${l.endHour}-${l.location}-${l.teacher}`, l])
      ).values()
    );
    result.push({
      date: new Date(current),
      lessons: lessonsForDay,
    });

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return result;
};


// fecth offline
export const fetchSchedulesFromAPI = async (refresh: boolean = false): Promise<Lesson[]> => {
  if (!refresh) {
    // check cache
    try {
      const cached = await storageService.get({ key: STORAGE_KEYS.SCHEDULE })
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('Failed to load schedule cache', err);
    }
  }

  try {
    const credentials = await storageService.get({ key: STORAGE_KEYS.CREDENTIALS });
    // Gọi API thật
    const result = await getSchedule(credentials);
    if (result.success) {
      await storageService.set({ key: STORAGE_KEYS.SCHEDULE, value: JSON.stringify(result.data) });
      return result.data;
    } else {
      throw new Error(result.error || 'API returned error');
    }
  } catch (err) {
    throw err;
  }
};