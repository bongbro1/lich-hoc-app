export function formatDate(date: Date | string): string {
  const d = new Date(date); // convert string -> Date nếu cần
  d.setHours(0, 0, 0, 0);   // normalize giờ về 0
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export const normalizeDateLocal = (date: Date) => {
  const d = new Date(date);
  // Lấy các phần local
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  return new Date(year, month, day); // tạo Date mới local 0:00
};

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('vi-VN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
};
export const formatChatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const isYesterday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate() - 1;

  const timeString = date.toLocaleTimeString("vi-VN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return timeString;

  if (isYesterday) return `Hôm qua ${timeString}`;

  // Nếu khác ngày → hiển thị ngày/tháng + giờ
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()} ${timeString}`;
};


// Tạo timestamp để gửi lên backend (ISO chuẩn)
export const getVietnamTimeISO = (): string => {
  const now = new Date();
  // Lấy giờ hiện tại VN
  const tzOffset = 7 * 60; // GMT+7
  const localTime = new Date(now.getTime() + tzOffset * 60 * 1000);
  return localTime.toISOString();
};


import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatTimeAgo = (timestamp: string | Date): string => {
  // Nếu string, parse như UTC rồi chuyển sang giờ VN
  const time = dayjs(timestamp).tz("Asia/Ho_Chi_Minh");

  const now = dayjs().tz('Asia/Ho_Chi_Minh');

  const diffSeconds = now.diff(time, 'second');

  if (diffSeconds < 60) return 'Vừa xong';

  const diffMinutes = now.diff(time, 'minute');
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = now.diff(time, 'hour');
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = now.diff(time, 'day');
  if (diffDays < 30) return `${diffDays} ngày trước`;

  const diffMonths = now.diff(time, 'month');
  if (diffMonths < 12) return `${diffMonths} tháng trước`;

  const diffYears = now.diff(time, 'year');
  if (diffYears < 1) return `${diffMonths} tháng trước`;

  // quá 1 năm
  return time.format('DD/MM/YY');
};

export const formatDateDMY = (timestamp: string | Date): string => {
  return dayjs(timestamp).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY");
};

export const parseDate = (input: string | Date): Date => {
  if (input instanceof Date) return input;
  return new Date(input);
};


export const formatCallDuration = (seconds?: number | null) => {
  if (!seconds) return "Cuộc gọi";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
};



// schedule time screen
export const pad = (n: number) => n.toString().padStart(2, '0');

export const addMinutes = (hour: number, minute: number, plus: number) => {
    let total = hour * 60 + minute + plus;
    return {
        hour: Math.floor(total / 60),
        minute: total % 60,
    };
};

export const formatTimeSchedule = (hour: number, minute: number) =>
    `${pad(hour)}:${pad(minute)}`;