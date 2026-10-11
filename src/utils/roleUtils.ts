import { Member } from '../types';

/**
 * Kiểm tra xem thành viên có phải là Giáo viên chủ nhiệm (GVCN) Thầy Nguyễn Văn Út hay không
 */
export function isTeacherMember(
  m: { id?: string; email?: string; name?: string; role?: string } | null | undefined
): boolean {
  if (!m) return false;
  return (
    m.id === 'm0' ||
    m.role === 'teacher' ||
    (m.email ? m.email.toLowerCase().includes('utnv') : false) ||
    (m.name ? m.name.toLowerCase().includes('nguyễn văn út') || m.name.toLowerCase().includes('gvcn') : false)
  );
}

/**
 * Kiểm tra xem thành viên có phải là Tổ trưởng (Trần Công Minh) hay không
 * Chú ý: Thầy Nguyễn Văn Út là GVCN, TUYỆT ĐỐI KHÔNG PHẢI là Tổ trưởng!
 */
export function isLeaderMember(
  m: { id?: string; email?: string; name?: string; role?: string } | null | undefined
): boolean {
  if (!m) return false;
  if (isTeacherMember(m)) return false;
  return m.role === 'leader' || (m.name ? m.name.includes('Trần Công Minh') : false);
}

/**
 * Lấy chức danh hiển thị thống nhất trên toàn ứng dụng:
 * - Thầy Nguyễn Văn Út: 'Giáo viên chủ nhiệm (GVCN)' / 'GVCN' / '👨‍🏫 GVCN'
 * - Trần Công Minh: 'Tổ trưởng' / '👑 Tổ trưởng'
 * - Học sinh còn lại: 'Thành viên' / '🎒 Thành viên'
 */
export function getMemberDisplayRole(
  m: { id?: string; email?: string; name?: string; role?: string } | null | undefined,
  format: 'full' | 'short' | 'with_icon' | 'badge' = 'full'
): string {
  if (isTeacherMember(m)) {
    if (format === 'short') return 'GVCN';
    if (format === 'with_icon') return '👨‍🏫 GVCN';
    if (format === 'badge') return '⭐ [GVCN]';
    return 'Giáo viên chủ nhiệm (GVCN)';
  }
  if (isLeaderMember(m)) {
    if (format === 'short') return 'Tổ trưởng';
    if (format === 'with_icon') return '👑 Tổ trưởng';
    if (format === 'badge') return '👑 [Tổ trưởng]';
    return 'Tổ trưởng';
  }
  if (format === 'short') return 'Thành viên';
  if (format === 'with_icon') return '🎒 Thành viên';
  if (format === 'badge') return '🎒 [Học sinh]';
  return 'Thành viên';
}

/**
 * Lấy danh sách chỉ gồm các học sinh của Tổ 3 (8 học sinh, loại bỏ GVCN m0)
 */
export function getStudentMembers(members: Member[]): Member[] {
  return members.filter((m) => !isTeacherMember(m));
}

/**
 * Lấy thông tin GVCN Thầy Nguyễn Văn Út
 */
export function getTeacherMember(members: Member[]): Member | undefined {
  return members.find((m) => isTeacherMember(m));
}

/**
 * Lấy thông tin Tổ trưởng (Trần Công Minh)
 */
export function getTeamLeaderMember(members: Member[]): Member | undefined {
  return members.find((m) => isLeaderMember(m)) || members.find((m) => m.name.includes('Trần Công Minh'));
}
