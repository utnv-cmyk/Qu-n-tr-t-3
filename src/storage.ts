import { APP_CONFIG } from './config';
import {
  Member,
  DocumentItem,
  Assignment,
  Submission,
  ProductItem,
  StudyGroup,
  DiscussionPost,
  AttendanceSession,
  CompetitionRecord,
  WeeklyReport,
  ActivityLog,
  FileItem,
  AppConfig,
  TrashItem,
  TrashItemType,
} from './types';
import {
  INITIAL_MEMBERS,
  INITIAL_DOCUMENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_PRODUCTS,
  INITIAL_GROUPS,
  INITIAL_DISCUSSIONS,
  INITIAL_ATTENDANCE,
  INITIAL_COMPETITION,
  INITIAL_REPORTS,
  INITIAL_ACTIVITIES,
} from './demoData';
import { detectFileType, formatBytes } from './config';
import {
  resetAIStorageToDemo,
  clearAIStorage,
  loadQuestionBank,
  saveQuestionBank,
  loadAssessmentTests,
  saveAssessmentTests,
  loadAssessmentAttempts,
  saveAssessmentAttempts,
  loadLearningEvents,
  saveLearningEvents,
  loadResearchData,
  saveResearchData,
} from './storageAI';

const KEYS = {
  CONFIG: APP_CONFIG.STORAGE_KEY_PREFIX + 'custom_config',
  TRASH: APP_CONFIG.STORAGE_KEY_PREFIX + 'trash',
  MEMBERS: APP_CONFIG.STORAGE_KEY_PREFIX + 'members',
  DOCUMENTS: APP_CONFIG.STORAGE_KEY_PREFIX + 'documents',
  ASSIGNMENTS: APP_CONFIG.STORAGE_KEY_PREFIX + 'assignments',
  SUBMISSIONS: APP_CONFIG.STORAGE_KEY_PREFIX + 'submissions',
  PRODUCTS: APP_CONFIG.STORAGE_KEY_PREFIX + 'products',
  GROUPS: APP_CONFIG.STORAGE_KEY_PREFIX + 'groups',
  DISCUSSIONS: APP_CONFIG.STORAGE_KEY_PREFIX + 'discussions',
  ATTENDANCE: APP_CONFIG.STORAGE_KEY_PREFIX + 'attendance',
  COMPETITION: APP_CONFIG.STORAGE_KEY_PREFIX + 'competition',
  REPORTS: APP_CONFIG.STORAGE_KEY_PREFIX + 'reports',
  ACTIVITIES: APP_CONFIG.STORAGE_KEY_PREFIX + 'activities',
  CURRENT_USER_ID: APP_CONFIG.STORAGE_KEY_PREFIX + 'current_user_id',
};

export const DEFAULT_APP_CONFIG: AppConfig = {
  CLASS_NAME: APP_CONFIG.CLASS_NAME,
  GROUP_NAME: APP_CONFIG.GROUP_NAME,
  LEADER_NAME: APP_CONFIG.LEADER_NAME,
  HOMEROOM_TEACHER: APP_CONFIG.HOMEROOM_TEACHER,
  SCHOOL_NAME: APP_CONFIG.SCHOOL_NAME,
  SCHOOL_YEAR: APP_CONFIG.SCHOOL_YEAR,
  SEMESTER: APP_CONFIG.SEMESTER,
  APP_TITLE: APP_CONFIG.APP_TITLE,
  APP_SUBTITLE: APP_CONFIG.APP_SUBTITLE,
  MAX_FILE_SIZE_MB: APP_CONFIG.MAX_FILE_SIZE_MB,
};

export function loadAppConfig(): AppConfig {
  const raw = localStorage.getItem(KEYS.CONFIG);
  if (!raw) return DEFAULT_APP_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_APP_CONFIG, ...parsed };
    // Auto-update legacy 2025 - 2026 to 2026 - 2027
    if (merged.SCHOOL_YEAR === '2025 - 2026' || !merged.SCHOOL_YEAR) {
      merged.SCHOOL_YEAR = '2026 - 2027';
      saveAppConfig(merged);
    }
    // Đảm bảo dữ liệu thống nhất: Tổ trưởng là Trần Công Minh, GVCN là Thầy Nguyễn Văn Út
    if (
      merged.LEADER_NAME?.includes('Nguyễn Văn Út') ||
      !merged.LEADER_NAME ||
      !merged.HOMEROOM_TEACHER
    ) {
      merged.LEADER_NAME = APP_CONFIG.LEADER_NAME;
      merged.HOMEROOM_TEACHER = APP_CONFIG.HOMEROOM_TEACHER;
      saveAppConfig(merged);
    }
    return merged;
  } catch {
    return DEFAULT_APP_CONFIG;
  }
}

export function saveAppConfig(cfg: AppConfig) {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(cfg));
}

export function loadTrash(): TrashItem[] {
  const raw = localStorage.getItem(KEYS.TRASH);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTrash(items: TrashItem[]) {
  localStorage.setItem(KEYS.TRASH, JSON.stringify(items));
}

export function addToTrash(
  item: Omit<TrashItem, 'id' | 'deletedAt'>
): TrashItem {
  const current = loadTrash();
  const newItem: TrashItem = {
    ...item,
    id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    deletedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
  };
  const updated = [newItem, ...current.slice(0, 49)]; // keep latest 50 deleted items
  saveTrash(updated);
  return newItem;
}

export function removeFromTrash(trashId: string): TrashItem | null {
  const current = loadTrash();
  const idStr = String(trashId).trim();
  const found = current.find((i) => String(i.id).trim() === idStr) || null;
  const filtered = current.filter((i) => String(i.id).trim() !== idStr);
  saveTrash(filtered);
  return found;
}

export function clearAllTrash() {
  saveTrash([]);
  try {
    localStorage.removeItem(KEYS.TRASH);
  } catch {
    // ignore
  }
}

// 5 demo members not in the actual group 3 roster
const EXCLUDED_DEMO_NAMES = [
  'nguyen van an',
  'le thi bich',
  'pham hoang cuong',
  'do thu dung',
  'vu minh duc',
];

export function isExcludedDemoMember(name: string): boolean {
  if (!name) return false;
  const norm = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
  return EXCLUDED_DEMO_NAMES.includes(norm);
}

// Direct export functions for simple consumption in components:

export function loadMembers(): Member[] {
  const raw = localStorage.getItem(KEYS.MEMBERS);
  let list: Member[];
  if (!raw) {
    list = INITIAL_MEMBERS;
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(list));
    return list;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_MEMBERS;
      localStorage.setItem(KEYS.MEMBERS, JSON.stringify(list));
      return list;
    }
  }

  // Filter out any legacy excluded demo members if present
  let filtered = list.filter((m) => !isExcludedDemoMember(m.name));

  // Ensure GVCN Nguyen Van Ut is present
  if (!filtered.some((m) => m.id === 'm0' || m.email.includes('utnv'))) {
    filtered = [INITIAL_MEMBERS[0], ...filtered];
  }

  if (filtered.length !== list.length) {
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(filtered));
  }
  return filtered;
}

/**
 * Đồng bộ tất cả số liệu thống kê thành viên (Chuyên cần, Thi đua, Bài nộp, Sản phẩm)
 * đảm bảo 100% khớp nhau trên toàn bộ ứng dụng (Điểm danh, Thi đua, Báo cáo, Tổng quan)
 */
export function syncMembersWithAllData(
  members: Member[],
  attendanceSessions: AttendanceSession[],
  competitionRecords: CompetitionRecord[],
  submissions: Submission[],
  products: ProductItem[]
): Member[] {
  return members.map((m) => {
    // 1. Chuyên cần (Attendance)
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let hasAttendanceRecords = false;

    attendanceSessions.forEach((s) => {
      const rec = s.records?.find(
        (r) =>
          r.studentId === m.id ||
          (r.studentName && r.studentName.trim().toLowerCase() === m.name.trim().toLowerCase())
      );
      if (rec) {
        hasAttendanceRecords = true;
        if (rec.status === 'present') presentCount++;
        else if (rec.status === 'late') lateCount++;
        else if (rec.status.startsWith('absent')) absentCount++;
      }
    });

    const maxSessions = attendanceSessions.length;
    const finalPresent = hasAttendanceRecords
      ? presentCount
      : maxSessions > 0
      ? Math.min(m.attendancePresent ?? 0, maxSessions)
      : (m.attendancePresent ?? 0);
    const finalLate = hasAttendanceRecords ? lateCount : 0;
    const finalAbsent = hasAttendanceRecords ? absentCount : 0;

    // 2. Điểm thi đua (Competition Points)
    let plusSum = 0;
    let minusSum = 0;
    let hasCompRecords = false;

    competitionRecords.forEach((c) => {
      if (
        c.studentId === m.id ||
        (c.studentName && c.studentName.trim().toLowerCase() === m.name.trim().toLowerCase())
      ) {
        hasCompRecords = true;
        if (c.type === 'plus') {
          plusSum += Math.abs(c.points);
        } else {
          minusSum += Math.abs(c.points);
        }
      }
    });

    const finalPlus = hasCompRecords ? parseFloat(plusSum.toFixed(2)) : (m.plusPoints ?? 0);
    const finalMinus = hasCompRecords ? parseFloat(minusSum.toFixed(2)) : (m.minusPoints ?? 0);
    const finalNet = parseFloat((finalPlus - finalMinus).toFixed(2));

    // 3. Bài nộp & Nhiệm vụ xong
    const studentSubs = submissions.filter(
      (s) =>
        s.studentId === m.id ||
        (s.studentName && s.studentName.trim().toLowerCase() === m.name.trim().toLowerCase())
    );
    const finalSubmitted = studentSubs.length;
    const finalCompleted = studentSubs.filter((s) =>
      ['completed', 'reviewed', 'submitted'].includes(s.status)
    ).length;

    // 4. Sản phẩm học tập
    const studentProds = products.filter(
      (p) =>
        (p.creatorName && p.creatorName.trim().toLowerCase() === m.name.trim().toLowerCase()) ||
        p.participants?.some((part) => part.trim().toLowerCase() === m.name.trim().toLowerCase()) ||
        (p.authorGroup && p.authorGroup.trim().toLowerCase() === m.groupName.trim().toLowerCase())
    );
    const finalProducts = studentProds.length;

    return {
      ...m,
      attendancePresent: finalPresent,
      attendanceLate: finalLate,
      attendanceAbsent: finalAbsent,
      plusPoints: finalPlus,
      minusPoints: finalMinus,
      netPoints: finalNet,
      completedTasks: finalCompleted,
      submittedCount: finalSubmitted,
      productCount: finalProducts,
    };
  });
}

export function saveMembers(data: Member[]) {
  localStorage.setItem(KEYS.MEMBERS, JSON.stringify(data));
}

export function loadDocuments(): DocumentItem[] {
  const raw = localStorage.getItem(KEYS.DOCUMENTS);
  if (!raw) {
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
    return INITIAL_DOCUMENTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

export function saveDocuments(data: DocumentItem[]) {
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(data));
}

export function loadAssignments(): Assignment[] {
  const raw = localStorage.getItem(KEYS.ASSIGNMENTS);
  let list: Assignment[];
  if (!raw) {
    list = INITIAL_ASSIGNMENTS;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_ASSIGNMENTS;
    }
  }

  // Thay người phụ trách task Năng lượng Xanh (thay Nguyễn Văn Út bằng Lê Hoàng Nam)
  let updated = false;
  list = list.map((a) => {
    if (
      (a.id === 'task_2' || a.title?.includes('Năng lượng Xanh')) &&
      (a.assignerName?.includes('Nguyễn Văn Út') || !a.assignerName)
    ) {
      updated = true;
      return { ...a, assignerName: 'Lê Hoàng Nam' };
    }
    return a;
  });

  if (updated || !raw) {
    localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(list));
  }
  return list;
}

export function saveAssignments(data: Assignment[]) {
  localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(data));
}

export function loadSubmissions(): Submission[] {
  const raw = localStorage.getItem(KEYS.SUBMISSIONS);
  if (!raw) {
    localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    return INITIAL_SUBMISSIONS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_SUBMISSIONS;
  }
}

export function saveSubmissions(data: Submission[]) {
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(data));
}

export function loadProducts(): ProductItem[] {
  const raw = localStorage.getItem(KEYS.PRODUCTS);
  let list: ProductItem[];
  if (!raw) {
    list = INITIAL_PRODUCTS;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_PRODUCTS;
    }
  }

  // Tự động loại bỏ các tên mẫu không thuộc tổ và chuẩn hóa danh sách thành viên tham gia
  let changed = false;
  const cleaned = list.map((p) => {
    const validParts = (p.participants || []).filter((name) => !isExcludedDemoMember(name));
    if (validParts.length !== (p.participants || []).length) {
      changed = true;
      return {
        ...p,
        participants: validParts.length > 0 ? validParts : ['Trần Công Minh'],
      };
    }
    return p;
  });

  if (changed) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveProducts(data: ProductItem[]) {
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data));
}

export function loadGroups(): StudyGroup[] {
  const raw = localStorage.getItem(KEYS.GROUPS);
  let list: StudyGroup[];
  if (!raw) {
    list = INITIAL_GROUPS;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_GROUPS;
    }
  }

  let changed = false;
  const cleaned = list.map((g) => {
    const newMembers = g.members.filter((name) => !isExcludedDemoMember(name));
    let newLeader = g.leaderName;
    if (isExcludedDemoMember(newLeader)) {
      newLeader = 'Trần Công Minh (Phụ trách)';
      changed = true;
    }
    if (newMembers.length !== g.members.length) {
      changed = true;
    }
    return { ...g, leaderName: newLeader, members: newMembers };
  });

  if (changed) {
    localStorage.setItem(KEYS.GROUPS, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveGroups(data: StudyGroup[]) {
  localStorage.setItem(KEYS.GROUPS, JSON.stringify(data));
}

export function sanitizeDiscussions(
  posts: DiscussionPost[],
  validMembers?: Member[]
): { cleaned: DiscussionPost[]; changed: boolean } {
  const members = validMembers && validMembers.length > 0 ? validMembers : loadMembers();
  if (!members || members.length === 0) {
    return { cleaned: posts, changed: false };
  }

  const validMemberNames = members.map((m) => m.name.trim().toLowerCase());
  const defaultMember = members[0];
  let changed = false;

  const cleaned = posts.map((post, postIdx) => {
    let p = { ...post };
    const pAuthorNorm = p.authorName ? p.authorName.trim().toLowerCase() : '';
    const isAuthorValid =
      validMemberNames.includes(pAuthorNorm) && !isExcludedDemoMember(p.authorName);

    if (!isAuthorValid) {
      const targetMember =
        members.find((m) => m.id === p.authorId) ||
        members[postIdx % members.length] ||
        defaultMember;
      p = {
        ...p,
        authorId: targetMember.id,
        authorName: targetMember.name,
        authorRole: targetMember.role,
        authorAvatar: targetMember.avatar,
      };
      changed = true;
    } else {
      const matchingMember = members.find(
        (m) => m.name.trim().toLowerCase() === pAuthorNorm
      );
      if (matchingMember) {
        if (
          p.authorAvatar !== matchingMember.avatar ||
          p.authorRole !== matchingMember.role ||
          p.authorId !== matchingMember.id
        ) {
          p = {
            ...p,
            authorId: matchingMember.id,
            authorAvatar: matchingMember.avatar,
            authorRole: matchingMember.role,
          };
          changed = true;
        }
      }
    }

    if (p.comments && p.comments.length > 0) {
      const cleanedComments = p.comments.map((c, cIdx) => {
        let comment = { ...c };
        const cAuthorNorm = comment.authorName ? comment.authorName.trim().toLowerCase() : '';
        const isCommentAuthorValid =
          validMemberNames.includes(cAuthorNorm) &&
          !isExcludedDemoMember(comment.authorName);

        if (!isCommentAuthorValid) {
          const targetMember =
            members.find((m) => m.id === comment.authorId) ||
            members[(postIdx + cIdx + 1) % members.length] ||
            defaultMember;
          comment = {
            ...comment,
            authorId: targetMember.id,
            authorName: targetMember.name,
            authorRole: targetMember.role,
            authorAvatar: targetMember.avatar,
          };
          changed = true;
        } else {
          const matchingMember = members.find(
            (m) => m.name.trim().toLowerCase() === cAuthorNorm
          );
          if (matchingMember) {
            if (
              comment.authorAvatar !== matchingMember.avatar ||
              comment.authorRole !== matchingMember.role ||
              comment.authorId !== matchingMember.id
            ) {
              comment = {
                ...comment,
                authorId: matchingMember.id,
                authorAvatar: matchingMember.avatar,
                authorRole: matchingMember.role,
              };
              changed = true;
            }
          }
        }
        return comment;
      });

      p = {
        ...p,
        comments: cleanedComments,
      };
    }

    return p;
  });

  return { cleaned, changed };
}

export function loadDiscussions(): DiscussionPost[] {
  const raw = localStorage.getItem(KEYS.DISCUSSIONS);
  let list: DiscussionPost[];
  if (!raw) {
    list = INITIAL_DISCUSSIONS;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_DISCUSSIONS;
    }
  }

  const { cleaned, changed } = sanitizeDiscussions(list);
  if (changed || !raw) {
    localStorage.setItem(KEYS.DISCUSSIONS, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveDiscussions(data: DiscussionPost[]) {
  const { cleaned } = sanitizeDiscussions(data);
  localStorage.setItem(KEYS.DISCUSSIONS, JSON.stringify(cleaned));
}

export function loadAttendance(): AttendanceSession[] {
  const raw = localStorage.getItem(KEYS.ATTENDANCE);
  let list: AttendanceSession[];
  if (!raw) {
    list = INITIAL_ATTENDANCE;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_ATTENDANCE;
    }
  }

  let changed = false;
  const cleaned = list.map((session) => {
    let s = session;
    if (s.weekNumber === 26) {
      s = { ...s, weekNumber: 3 };
      changed = true;
    }
    const newRecords = s.records.filter((r) => !isExcludedDemoMember(r.studentName));
    if (newRecords.length !== s.records.length) {
      changed = true;
    }
    return { ...s, records: newRecords };
  });

  if (changed) {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveAttendance(data: AttendanceSession[]) {
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(data));
}

export function loadCompetition(): CompetitionRecord[] {
  const raw = localStorage.getItem(KEYS.COMPETITION);
  let list: CompetitionRecord[];
  if (!raw) {
    list = INITIAL_COMPETITION;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_COMPETITION;
    }
  }

  const cleaned = list.filter((c) => !isExcludedDemoMember(c.studentName));

  if (cleaned.length !== list.length) {
    localStorage.setItem(KEYS.COMPETITION, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveCompetition(data: CompetitionRecord[]) {
  localStorage.setItem(KEYS.COMPETITION, JSON.stringify(data));
}

export function loadReports(): WeeklyReport[] {
  const raw = localStorage.getItem(KEYS.REPORTS);
  let list: WeeklyReport[];
  if (!raw) {
    list = INITIAL_REPORTS;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_REPORTS;
    }
  }

  let changed = false;

  // 1. Loại bỏ hoàn toàn Tuần 25 theo yêu cầu người dùng ("bỏ tuần 25 đi")
  const filtered = list.filter(
    (r) => r.weekNumber !== 25 && r.id !== 'rep_w25' && r.weekNumber !== 26 && r.id !== 'rep_w26'
  );
  if (filtered.length !== list.length) {
    changed = true;
    list = filtered;
  }

  // 2. Chuẩn hóa Tuần 3: Bắt đầu 21/09/2026 đến 27/09/2026
  const updated = list.map((r) => {
    if (r.weekNumber === 3 || r.id === 'rep_w3') {
      if (r.startDate !== '21/09/2026' || r.endDate !== '27/09/2026') {
        changed = true;
        return {
          ...r,
          weekNumber: 3,
          startDate: '21/09/2026',
          endDate: '27/09/2026',
        };
      }
    }
    return r;
  });

  const finalReports = updated.length > 0 ? updated : INITIAL_REPORTS;

  if (changed || !raw) {
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(finalReports));
  }
  return finalReports;
}

export function saveReports(data: WeeklyReport[]) {
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(data));
}

export function loadActivities(): ActivityLog[] {
  const raw = localStorage.getItem(KEYS.ACTIVITIES);
  let list: ActivityLog[];
  if (!raw) {
    list = INITIAL_ACTIVITIES;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = INITIAL_ACTIVITIES;
    }
  }

  const cleaned = list.filter((act) => !isExcludedDemoMember(act.actorName));
  if (cleaned.length !== list.length) {
    localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveActivities(data: ActivityLog[]) {
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(data));
}

export function loadCurrentMemberId(): string {
  const id = localStorage.getItem(KEYS.CURRENT_USER_ID);
  if (!id) {
    localStorage.setItem(KEYS.CURRENT_USER_ID, 'm1');
    return 'm1';
  }
  return id;
}

export function saveCurrentMemberId(id: string) {
  localStorage.setItem(KEYS.CURRENT_USER_ID, id);
}

export function resetAllToDemoData() {
  localStorage.setItem(KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
  localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(INITIAL_DOCUMENTS));
  localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
  localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(KEYS.GROUPS, JSON.stringify(INITIAL_GROUPS));
  localStorage.setItem(KEYS.DISCUSSIONS, JSON.stringify(INITIAL_DISCUSSIONS));
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  localStorage.setItem(KEYS.COMPETITION, JSON.stringify(INITIAL_COMPETITION));
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  localStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
  localStorage.setItem(KEYS.CURRENT_USER_ID, 'm1');
  resetAIStorageToDemo();
}

export function clearAllStorage() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  clearAIStorage();
}

export function exportDataToJSON() {
  const backup = {
    exportedAt: new Date().toISOString(),
    className: APP_CONFIG.CLASS_NAME,
    groupName: APP_CONFIG.GROUP_NAME,
    members: loadMembers(),
    documents: loadDocuments(),
    assignments: loadAssignments(),
    submissions: loadSubmissions(),
    products: loadProducts(),
    groups: loadGroups(),
    discussions: loadDiscussions(),
    attendance: loadAttendance(),
    competition: loadCompetition(),
    reports: loadReports(),
    activities: loadActivities(),
    questionBank: loadQuestionBank(),
    assessmentTests: loadAssessmentTests(),
    assessmentAttempts: loadAssessmentAttempts(),
    learningEvents: loadLearningEvents(),
    researchData: loadResearchData(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `to3_11a1_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromJSON(file: File, onSuccess: () => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (data.members) saveMembers(data.members);
      if (data.documents) saveDocuments(data.documents);
      if (data.assignments) saveAssignments(data.assignments);
      if (data.submissions) saveSubmissions(data.submissions);
      if (data.products) saveProducts(data.products);
      if (data.groups) saveGroups(data.groups);
      if (data.discussions) saveDiscussions(data.discussions);
      if (data.attendance) saveAttendance(data.attendance);
      if (data.competition) saveCompetition(data.competition);
      if (data.reports) saveReports(data.reports);
      if (data.activities) saveActivities(data.activities);
      if (data.questionBank) saveQuestionBank(data.questionBank);
      if (data.assessmentTests) saveAssessmentTests(data.assessmentTests);
      if (data.assessmentAttempts) saveAssessmentAttempts(data.assessmentAttempts);
      if (data.learningEvents) saveLearningEvents(data.learningEvents);
      if (data.researchData) saveResearchData(data.researchData);
      onSuccess();
    } catch (err) {
      alert('Tệp dữ liệu không hợp lệ!');
    }
  };
  reader.readAsText(file);
}

/**
 * Helper chuyển File từ người dùng thành FileItem lưu trữ an toàn
 */
export async function processUploadedFile(file: File): Promise<FileItem> {
  const fileType = detectFileType(file.name, file.type);
  const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();

  let previewUrl: string | undefined = undefined;
  let contentPreview: string | undefined = undefined;

  // Đối với ảnh nhỏ và text: tạo DataURL hoặc đọc nội dung preview
  if (fileType === 'image' && file.size < 5 * 1024 * 1024) {
    try {
      previewUrl = await fileToDataURL(file);
    } catch {
      previewUrl = URL.createObjectURL(file);
    }
  } else if (fileType === 'text' && file.size < 500 * 1024) {
    try {
      contentPreview = await fileToText(file);
    } catch {
      contentPreview = `Tệp văn bản: ${file.name}`;
    }
  } else if (['audio', 'video', 'pdf'].includes(fileType)) {
    previewUrl = URL.createObjectURL(file);
  }

  return {
    id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: file.name,
    size: file.size,
    sizeFormatted: formatBytes(file.size),
    type: fileType,
    extension: ext,
    url: previewUrl,
    mimeType: file.type,
    contentPreview: contentPreview,
  };
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
