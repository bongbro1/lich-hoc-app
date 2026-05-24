export type Lesson = {
    id: string;                  // UUID hoặc STT
    title: string;               // Tên môn học / hoạt động
    code?: string;               // Mã học phần (nếu có)
    credit?: number;             // Số tín chỉ (nếu có)
    teacher?: string;            // Giảng viên (nếu có)
    location?: string;           // Phòng học / link meet
    date: string | Date;          // Ngày thi / ngày học (API trả về string, logic dùng Date)
    startHour?: string;
    endHour?: string;
    startPeriod?: string;        // Tiết học bắt đầu
    endPeriod?: string;          // Tiết học kết thúc
    examType?: string;           // Hình thức thi (nếu là lịch thi)
    examSession?: string;        // Ca thi (nếu là lịch thi)
    studentId?: string;          // Số báo danh (nếu là lịch thi)
    note?: string;               // Ghi chú
    isExam?: boolean;            // true nếu là lịch thi, false mặc định
};
export type DaySchedule = {
    date: Date;
    lessons: Lesson[];
};