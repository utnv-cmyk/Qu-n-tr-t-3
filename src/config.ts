import { CompetitionCriteria, FileTypeCategory } from './types';
export {
  isTeacherMember,
  isLeaderMember,
  getMemberDisplayRole,
  getStudentMembers,
  getTeacherMember,
  getTeamLeaderMember,
} from './utils/roleUtils';

export const APP_CONFIG = {
  CLASS_NAME: '11A1',
  GROUP_NAME: 'Tổ 3',
  LEADER_NAME: 'Trần Công Minh',
  HOMEROOM_TEACHER: 'Nguyễn Văn Út',
  SCHOOL_NAME: 'THPT Dương Minh Châu',
  SCHOOL_YEAR: '2026 - 2027',
  SEMESTER: 'Học kỳ I',
  APP_TITLE: 'QUẢN LÝ TỔ 3 – HỌC TẬP & THI ĐUA – LỚP 11A1 (2026 - 2027)',
  APP_SUBTITLE: 'Không gian học tập, cộng tác và thi đua của Tổ 3',
  MAX_FILE_SIZE_MB: 50, // Cảnh báo khi file vượt quá 50MB
  STORAGE_KEY_PREFIX: 'to3_11a1_app_',
};

// Tiêu chí thi đua chuẩn Tổ 3: mỗi lượt cộng / trừ là 0.25 điểm
export const PREDEFINED_CRITERIA: CompetitionCriteria[] = [
  // Nhóm vi phạm (-0.25)
  { id: 'v_late', label: 'Đi học trễ', points: -0.25, type: 'minus', description: 'Đến lớp sau hiệu lệnh vào tiết' },
  { id: 'v_no_hw', label: 'Không làm bài', points: -0.25, type: 'minus', description: 'Chưa hoàn thành bài tập về nhà hoặc nhiệm vụ' },
  { id: 'v_talking', label: 'Nói chuyện riêng', points: -0.25, type: 'minus', description: 'Làm ồn hoặc mất tập trung trong giờ học' },
  { id: 'v_rules', label: 'Vi phạm nội quy lớp', points: -0.25, type: 'minus', description: 'Không đúng tác phong, đồng phục, sử dụng điện thoại sai quy định' },
  { id: 'v_language', label: 'Ngôn từ tiêu cực', points: -0.25, type: 'minus', description: 'Sử dụng từ ngữ thiếu văn minh hoặc xúc phạm bạn' },
  { id: 'v_other', label: 'Khác (Vi phạm)', points: -0.25, type: 'minus', description: 'Các lỗi vi phạm khác được ghi nhận' },
  
  // Nhóm tích cực (+0.25)
  { id: 'p_speak', label: 'Phát biểu xây dựng bài', points: 0.25, type: 'plus', description: 'Tích cực xung phong trả lời câu hỏi của giáo viên' },
  { id: 'p_help', label: 'Giúp đỡ bạn học', points: 0.25, type: 'plus', description: 'Kèm cặp, hỗ trợ thành viên trong tổ giải bài khó' },
  { id: 'p_product', label: 'Làm sản phẩm học tập', points: 0.25, type: 'plus', description: 'Đóng góp làm slide, video, poster, mô hình chất lượng' },
  { id: 'p_creative', label: 'Sáng tạo nội dung', points: 0.25, type: 'plus', description: 'Đề xuất ý tưởng mới cho thuyết trình hoặc dự án' },
  { id: 'p_commended', label: 'Được tuyên dương', points: 0.25, type: 'plus', description: 'Được thầy cô giáo bộ môn hoặc GVCN biểu dương' },
];

export const SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Tin học',
  'GD Kinh tế & Pháp luật',
  'Công nghệ',
  'GDQP-AN',
  'HĐ Trải nghiệm - Hướng nghiệp',
  'Khác',
];

export const DOCUMENT_CATEGORIES = [
  '📘 Học tập',
  '📕 Bài tập',
  '📗 Đề cương',
  '📙 Ôn tập',
  '📒 Tham khảo',
  '🎬 Video',
  '🎵 Âm thanh',
  '📊 Dữ liệu',
  '📁 Khác',
] as const;

/**
 * Nhận diện loại file từ phần mở rộng và MIME type
 */
export function detectFileType(fileName: string, mimeType?: string): FileTypeCategory {
  const ext = fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
  
  // Word
  if (['doc', 'docx', 'dot', 'dotx'].includes(ext) || mimeType?.includes('msword') || mimeType?.includes('wordprocessingml')) {
    return 'word';
  }
  // PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  // Excel
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mimeType?.includes('excel') || mimeType?.includes('spreadsheetml')) {
    return 'excel';
  }
  // PowerPoint
  if (['ppt', 'pptx', 'pps', 'ppsx'].includes(ext) || mimeType?.includes('powerpoint') || mimeType?.includes('presentationml')) {
    return 'powerpoint';
  }
  // Video
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv'].includes(ext) || mimeType?.startsWith('video/')) {
    return 'video';
  }
  // Audio
  if (['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'wma'].includes(ext) || mimeType?.startsWith('audio/')) {
    return 'audio';
  }
  // Image
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || mimeType?.startsWith('image/')) {
    return 'image';
  }
  // Text
  if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'py'].includes(ext) || mimeType?.startsWith('text/')) {
    return 'text';
  }
  // Archive
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('archive')) {
    return 'archive';
  }

  return 'other';
}

/**
 * Định dạng kích thước file sang KB, MB
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
