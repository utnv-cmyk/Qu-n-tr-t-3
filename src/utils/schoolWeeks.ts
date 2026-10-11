/**
 * Tiện ích quản lý Tuần học Năm học 2026 - 2027 (THPT Dương Minh Châu)
 * - Khung năm học: 35 tuần học chính khóa (Tuần 1 đến Tuần 35)
 * - Tuần 1: Bắt đầu từ Thứ Hai ngày 07/09/2026 đến Chủ Nhật ngày 13/09/2026
 * - Tuần 2: Bắt đầu từ Thứ Hai ngày 14/09/2026 đến Chủ Nhật ngày 20/09/2026 (ngày 20/09/2026 là Tuần 2)
 * - Tuần 3: Bắt đầu từ Thứ Hai ngày 21/09/2026 đến Chủ Nhật ngày 27/09/2026 (ngày 21/09/2026 - 27/09/2026)
 */

export const TOTAL_SCHOOL_WEEKS = 35;

// Mốc ngày bắt đầu Tuần 1: Thứ Hai 07/09/2026 (năm 2026, tháng 8 theo 0-indexed là tháng 9, ngày 7)
export const SCHOOL_YEAR_START_DATE = new Date(2026, 8, 7); // 2026-09-07

export interface SchoolWeekInfo {
  weekNumber: number;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  startDateISO: string; // YYYY-MM-DD
  endDateISO: string; // YYYY-MM-DD
  label: string; // Tuần 3 (21/09/2026 - 27/09/2026)
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateVN(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Lấy thông tin ngày bắt đầu (Thứ Hai) và kết thúc (Chủ Nhật) của Tuần thứ `weekNumber` (1 - 35)
 */
export function getSchoolWeekInfo(weekNumber: number): SchoolWeekInfo {
  const safeWeek = Math.max(1, Math.min(TOTAL_SCHOOL_WEEKS, Math.round(weekNumber) || 3));

  const monday = new Date(SCHOOL_YEAR_START_DATE);
  monday.setDate(SCHOOL_YEAR_START_DATE.getDate() + (safeWeek - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = formatDateVN(monday);
  const endDate = formatDateVN(sunday);
  const startDateISO = formatDateISO(monday);
  const endDateISO = formatDateISO(sunday);

  return {
    weekNumber: safeWeek,
    startDate,
    endDate,
    startDateISO,
    endDateISO,
    label: `Tuần ${safeWeek} (${startDate} - ${endDate})`,
  };
}

/**
 * Tính số tuần học (1 - 35) từ bất kỳ ngày nào trong năm học
 * - Ví dụ: 20/09/2026 -> Tuần 2
 * - Ví dụ: 21/09/2026 đến 27/09/2026 -> Tuần 3
 */
export function getWeekFromDate(dateInput: string | Date): number {
  if (!dateInput) return 3;

  let targetDate: Date;
  if (typeof dateInput === 'string') {
    // Xử lý cả dạng DD/MM/YYYY và YYYY-MM-DD
    if (dateInput.includes('/')) {
      const parts = dateInput.split('/');
      if (parts.length === 3) {
        targetDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        targetDate = new Date(dateInput);
      }
    } else {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        targetDate = new Date(dateInput);
      }
    }
  } else {
    targetDate = dateInput;
  }

  if (isNaN(targetDate.getTime())) return 3;

  // Tìm Thứ Hai của tuần chứa targetDate
  // Trong JS, getDay(): 0 = Chủ Nhật, 1 = Thứ Hai, ... 6 = Thứ Bảy
  const day = targetDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // Nếu là Chủ Nhật thì Thứ Hai cách -6 ngày
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const baseMonday = new Date(SCHOOL_YEAR_START_DATE);
  baseMonday.setHours(0, 0, 0, 0);

  const diffTime = monday.getTime() - baseMonday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const weekNum = Math.floor(diffDays / 7) + 1;

  if (weekNum < 1) return 1;
  if (weekNum > TOTAL_SCHOOL_WEEKS) return TOTAL_SCHOOL_WEEKS;
  return weekNum;
}

/**
 * Danh sách toàn bộ 35 tuần học của năm học 2026 - 2027
 */
export const ALL_SCHOOL_WEEKS: SchoolWeekInfo[] = Array.from(
  { length: TOTAL_SCHOOL_WEEKS },
  (_, i) => getSchoolWeekInfo(i + 1)
);
