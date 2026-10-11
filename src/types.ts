export type Role = 'leader' | 'member';

export type FileTypeCategory = 
  | 'word' 
  | 'pdf' 
  | 'excel' 
  | 'powerpoint' 
  | 'video' 
  | 'audio' 
  | 'image' 
  | 'text' 
  | 'archive' 
  | 'other';

export interface FileItem {
  id: string;
  name: string;
  size: number; // bytes
  sizeFormatted: string;
  type: FileTypeCategory;
  extension: string;
  url?: string;
  mimeType?: string;
  contentPreview?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  uploaderName?: string;
  isSimulated?: boolean;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  avatar: string;
  groupName: string;
  attendancePresent: number;
  attendanceLate: number;
  attendanceAbsent: number;
  plusPoints: number;
  minusPoints: number;
  netPoints: number;
  completedTasks: number;
  submittedCount: number;
  productCount: number;
}

export type DocumentCategory = 
  | '📘 Học tập'
  | '📕 Bài tập'
  | '📗 Đề cương'
  | '📙 Ôn tập'
  | '📒 Tham khảo'
  | '🎬 Video'
  | '🎵 Âm thanh'
  | '📊 Dữ liệu'
  | '📁 Khác';

export type DocumentPermission = 'view_only' | 'can_edit' | 'group' | 'whole_team';

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  category: DocumentCategory;
  subject: string;
  topic: string;
  permission: DocumentPermission;
  file: FileItem;
}

export type TaskStatus = 'in_progress' | 'urgent' | 'overdue' | 'completed';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  requirements: string;
  assignerName: string;
  assignedDate: string;
  dueDate: string;
  format: string;
  attachedFiles: FileItem[];
  status: TaskStatus;
  isLocked?: boolean;
}

export type SubmissionStatus = 
  | 'not_submitted' 
  | 'draft' 
  | 'submitted' 
  | 'reviewed' 
  | 'completed' 
  | 'need_resubmit';

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  notes?: string;
  files: FileItem[];
  status: SubmissionStatus;
  submittedAt: string;
  updatedAt?: string;
  score?: number;
  feedback?: string;
  reviewerName?: string;
}

export interface ProductItem {
  id: string;
  title: string;
  authorGroup: string;
  subject: string;
  topic: string;
  description: string;
  files: FileItem[];
  createdAt: string;
  creatorName: string;
  participants: string[];
  mainFile?: FileItem;
  category?: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  leaderName: string;
  members: string[];
  tasks: string[];
  description: string;
}

export interface DiscussionComment {
  id: string;
  authorName: string;
  authorRole?: Role;
  authorAvatar?: string;
  authorId?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DiscussionPost {
  id: string;
  authorId?: string;
  authorName: string;
  authorRole: Role;
  authorAvatar: string;
  title?: string;
  content: string;
  createdAt: string;
  attachedFiles?: FileItem[];
  attachment?: FileItem;
  likes: number;
  isLiked?: boolean;
  hasLiked?: boolean;
  comments: DiscussionComment[];
}

export interface WeeklyReport {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  createdByName: string;
  createdAt: string;
  attendanceSummary: string;
  academicSummary: string;
  disciplineSummary: string;
  shortcomings: string;
  proposals: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent_excused' | 'absent_unexcused';

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  weekNumber: number;
  records: AttendanceEntry[];
  note?: string;
  recordedBy: string;
}

export interface CompetitionCriteria {
  id: string;
  label: string;
  points: number; // e.g. 0.25 or -0.25
  type: 'plus' | 'minus';
  description?: string;
}

export interface CompetitionRecord {
  id: string;
  studentId: string;
  studentName: string;
  points: number;
  type: 'plus' | 'minus';
  reason: string;
  recordedBy: string;
  createdAt: string;
  weekNumber?: number; // Tuần học (1 - 35)
}

export interface ActivityLog {
  id: string;
  actorName: string;
  action: string;
  targetTitle: string;
  timestamp: string;
  type: 'task' | 'document' | 'submission' | 'competition' | 'attendance' | 'product' | 'group' | 'discussion' | 'member';
}

export interface AppConfig {
  CLASS_NAME: string;
  GROUP_NAME: string;
  LEADER_NAME: string;
  HOMEROOM_TEACHER: string;
  SCHOOL_NAME: string;
  SCHOOL_YEAR: string;
  SEMESTER: string;
  APP_TITLE: string;
  APP_SUBTITLE: string;
  MAX_FILE_SIZE_MB: number;
}

export type TrashItemType =
  | 'member'
  | 'document'
  | 'assignment'
  | 'submission'
  | 'product'
  | 'competition'
  | 'attendance'
  | 'report'
  | 'discussion'
  | 'group';

export interface TrashItem {
  id: string;
  originalId: string;
  type: TrashItemType;
  typeLabel: string;
  title: string;
  subtitle?: string;
  deletedAt: string;
  deletedBy: string;
  data: any;
}

// ======================================================================
// HỆ THỐNG AI & 3 MỨC ĐỘ NHẬN THỨC BẮT BUỘC (KNOW - UNDERSTAND - APPLY)
// ======================================================================

/**
 * 3 Mức độ nhận thức chuẩn hóa xuyên suốt toàn hệ thống:
 * - KNOW = BIẾT
 * - UNDERSTAND = HIỂU
 * - APPLY = VẬN DỤNG
 */
export type CognitiveLevel = 'KNOW' | 'UNDERSTAND' | 'APPLY';

export const COGNITIVE_LEVEL_LABELS: Record<CognitiveLevel, string> = {
  KNOW: 'BIẾT',
  UNDERSTAND: 'HIỂU',
  APPLY: 'VẬN DỤNG',
};

/**
 * 4 Mức độ hỗ trợ học tập động (Không gắn nhãn tiêu cực):
 * 1. maintain: Mức 1 – DUY TRÌ (Học tập ổn định)
 * 2. encourage: Mức 2 – KHUYẾN KHÍCH (Có một số chỉ số cần cải thiện)
 * 3. monitor: Mức 3 – CẦN THEO DÕI (Có nhiều dấu hiệu giảm tiến độ hoặc chưa hoàn thành)
 * 4. support: Mức 4 – CẦN HỖ TRỢ (Cần giáo viên hỗ trợ kịp thời)
 */
export type SupportLevel = 'maintain' | 'encourage' | 'monitor' | 'support';

export const SUPPORT_LEVEL_LABELS: Record<SupportLevel, { label: string; badge: string; color: string; desc: string }> = {
  maintain: {
    label: 'Mức 1 – Duy trì',
    badge: '🟢 DUY TRÌ',
    color: 'emerald',
    desc: 'Học tập ổn định, hoàn thành tốt nhiệm vụ',
  },
  encourage: {
    label: 'Mức 2 – Khuyến khích',
    badge: '🔵 KHUYẾN KHÍCH',
    color: 'blue',
    desc: 'Có tiềm năng tiến bộ, cần thêm thử thách vận dụng',
  },
  monitor: {
    label: 'Mức 3 – Cần theo dõi',
    badge: '🟡 CẦN THEO DÕI',
    color: 'amber',
    desc: 'Có dấu hiệu giảm tiến độ hoặc còn nhiệm vụ chưa hoàn thành',
  },
  support: {
    label: 'Mức 4 – Cần hỗ trợ',
    badge: '🔴 CẦN HỖ TRỢ',
    color: 'rose',
    desc: 'Dữ liệu cho thấy đang cần giáo viên hướng dẫn trực tiếp',
  },
};

// ======================================================================
// HỆ THỐNG SỰ KIỆN HỌC TẬP (LEARNING EVENTS)
// ======================================================================

export type LearningEventType =
  | 'login'
  | 'open_document'
  | 'view_document'
  | 'open_video'
  | 'start_task'
  | 'complete_task'
  | 'submit_assignment'
  | 'late_submit'
  | 'view_feedback'
  | 'resubmit'
  | 'retry'
  | 'complete_test'
  | 'test_result'
  | 'group_activity'
  | 'submit_product'
  | 'receive_personalized_task'
  | 'complete_personalized_task';

export interface LearningEvent {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string; // ISO string
  type: LearningEventType;
  subject: string;
  topic?: string;
  taskId?: string;
  taskTitle?: string;
  status?: string;
  resultScore?: number;
  durationMinutes?: number;
  deadline?: string;
  attemptNumber?: number;
  cognitiveLevel?: CognitiveLevel;
  metadata?: Record<string, any>;
}

// ======================================================================
// HỒ SƠ HỌC TẬP CÁ NHÂN (LEARNING PROFILES)
// ======================================================================

export interface CognitiveStats {
  knowRatio: number; // 0-100%
  understandRatio: number; // 0-100%
  applyRatio: number; // 0-100%
  knowCorrect: number;
  knowTotal: number;
  understandCorrect: number;
  understandTotal: number;
  applyCorrect: number;
  applyTotal: number;
}

export interface LearningProfile {
  studentId: string;
  studentName: string;
  supportLevel: SupportLevel;
  supportLevelReason: string;
  lastUpdated: string;
  // Tiến độ & Tỷ lệ
  taskCompletionRate: number; // 0-100%
  onTimeSubmissionRate: number; // 0-100%
  totalAssignedTasks: number;
  completedTasksCount: number;
  lateSubmissionsCount: number;
  overdueTasksCount: number;
  averageScore: number; // thang 10
  // 3 Mức độ nhận thức
  cognitiveStats: CognitiveStats;
  // Chủ đề
  masteredTopics: string[];
  topicsNeedingReview: string[];
  frequentMistakes: string[];
  // Xu hướng tiến bộ: 'improving' | 'stable' | 'declining'
  progressTrend: 'improving' | 'stable' | 'declining';
  trendDescription: string;
  // Khuyến nghị AI
  aiRecommendedTasks: PersonalizedTask[];
  // Lịch sử can thiệp sư phạm
  supportHistory: InterventionLog[];
}

export interface PersonalizedTask {
  id: string;
  title: string;
  subject: string;
  topic: string;
  cognitiveLevel: CognitiveLevel; // BIẾT | HIỂU | VẬN DỤNG
  targetTier: 'củng cố nền tảng' | 'đạt chuẩn' | 'vận dụng' | 'mở rộng';
  description: string;
  requirements: string;
  estimatedMinutes: number;
  createdDate: string;
  isApprovedByTeacher: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  aiRationale: string; // Lý do vì sao AI đề xuất
}

export interface AIAlert {
  id: string;
  studentId: string;
  studentName: string;
  createdAt: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  rationale: string; // Dữ liệu căn cứ cụ thể
  dataEvidence: {
    metric: string;
    value: string | number;
    benchmark: string | number;
    period: string;
  }[];
  cognitiveGap?: string; // Khoảng trống từ BIẾT -> HIỂU -> VẬN DỤNG
  confidenceLevel: 'Cao' | 'Trung bình' | 'Thấp';
  recommendedActions: string[];
  isResolved: boolean;
}

// ======================================================================
// NGÂN HÀNG CÂU HỎI & AI TẠO ĐỀ KIỂM TRA (4 PHẦN & 3 MỨC ĐỘ)
// ======================================================================

export type QuestionType =
  | 'multiple_choice' // Phần I - Trắc nghiệm 4 lựa chọn (A, B, C, D)
  | 'true_false' // Phần II - Đúng / Sai (a, b, c, d)
  | 'short_answer' // Phần III - Trả lời ngắn
  | 'essay'; // Phần IV - Tự luận

export interface QuestionOption {
  key: string; // A, B, C, D hoặc a, b, c, d
  text: string;
  isCorrect: boolean;
  explanation?: string;
  cognitiveLevel?: CognitiveLevel; // Cho đúng/sai từng ý
}

export interface QualityCheckIssue {
  type: 'content' | 'clarity' | 'answers' | 'scores' | 'duplicate' | 'data' | 'expression' | 'cognitive_level' | 'matrix_consistency';
  title: string;
  message: string;
  severity: 'pass' | 'warning' | 'error';
  suggestion?: string;
  questionCode?: string;
}

export interface QualityCheckReport {
  overallStatus: 'pass' | 'warning' | 'error';
  summary: string;
  issues: QualityCheckIssue[];
  checkedAt: string;
  checkerName: string;
}

export interface QuestionBankItem {
  id: string;
  code: string; // VD: CH-HOA-11-001
  subject: string;
  grade: string; // VD: 11
  topic: string;
  type: QuestionType;
  cognitiveLevel: CognitiveLevel; // BẮT BUỘC: KNOW | UNDERSTAND | APPLY
  cognitive_level?: CognitiveLevel; // Trường chuẩn hóa CSDL theo yêu cầu
  content: string;
  options?: QuestionOption[]; // Dùng cho multiple_choice và true_false
  correctAnswerText?: string; // Dùng cho short_answer
  acceptedAnswers?: string[]; // Dùng cho short_answer
  unit?: string;
  essayRubric?: {
    step: string;
    points: number;
    criteria: string;
  }[];
  points: number;
  creatorName: string;
  createdAt: string;
  qualityStatus: 'valid' | 'needs_review' | 'error';
  qualityNotes?: string;
}

export interface MatrixRow {
  topic: string;
  content: string;
  knowQuestions: number;
  knowPoints: number;
  understandQuestions: number;
  understandPoints: number;
  applyQuestions: number;
  applyPoints: number;
  totalQuestions: number;
  totalPoints: number;
  percentage: number;
}

export interface TestMatrix {
  id: string;
  title: string;
  subject: string;
  grade: string;
  rows: MatrixRow[];
  totalQuestions: number;
  totalPoints: number;
  knowRatio: number; // e.g. 40%
  understandRatio: number; // e.g. 40%
  applyRatio: number; // e.g. 20%
  isValid: boolean; // Tổng tỉ lệ = 100%
}

export interface TestSpecificationItem {
  id: string;
  topic: string;
  content: string;
  learningOutcome: string; // Yêu cầu cần đạt
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  questionCount: number;
  points: number;
}

export interface AttachedKnowledgeMaterial {
  id: string;
  name: string;
  type: 'image' | 'document';
  sizeFormatted: string;
  dataUrl?: string;
  contentPreview?: string;
}

export interface AssessmentTest {
  id: string;
  code: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  knowledgeContent?: string; // Nội dung kiến thức chi tiết
  teacherRequirements?: string; // Yêu cầu riêng của giáo viên
  attachedMaterials?: AttachedKnowledgeMaterial[]; // Tài liệu & ảnh đính kèm phục vụ tạo đề
  durationMinutes: number;
  totalPoints: number;
  // Tỉ lệ 3 mức độ nhận thức (Bắt buộc = 100%)
  knowRatio: number;
  understandRatio: number;
  applyRatio: number;
  // Cấu trúc 4 phần
  questions: QuestionBankItem[];
  matrix?: TestMatrix;
  specifications?: TestSpecificationItem[];
  // Kết quả kiểm tra chất lượng đề bằng AI
  qualityCheckResult?: QualityCheckReport;
  // Trạng thái phê duyệt
  status: 'draft' | 'approved' | 'assigned' | 'archived';
  isApprovedByTeacher: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  creatorName: string;
  // Liên kết kiểm tra nghiên cứu
  researchCategory?: 'pre_test' | 'post_test' | 'delayed_test' | 'regular';
}

export interface StudentAnswer {
  questionId: string;
  questionType: QuestionType;
  cognitiveLevel?: CognitiveLevel;
  selectedOptionKey?: string; // A, B, C, D
  selectedTrueFalse?: Record<string, boolean>; // { a: true, b: false, ... }
  tfAnswers?: Record<string, boolean>; // alias
  textAnswer?: string;
  isCorrect?: boolean;
  awardedScore?: number;
  score?: number; // alias
  maxScore?: number;
  aiGradingSuggestion?: {
    suggestedScore: number;
    feedback: string;
    rubricMatch: string;
    levelAchieved?: 'EMPTY' | 'KNOW' | 'UNDERSTAND' | 'APPLY';
  };
  teacherFeedback?: string;
}

export interface WrongQuestionItem {
  questionIndex: number; // 1, 2, 3...
  questionId: string;
  questionCode: string;
  cognitiveLevel: CognitiveLevel;
  content: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  pointsLost: number;
}

export interface AssessmentAttempt {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  answers: StudentAnswer[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  // Thống kê số lượng câu
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  // Danh sách câu làm sai chi tiết phục vụ phân tích & cá nhân hóa
  wrongQuestions?: WrongQuestionItem[];
  // Điểm theo 3 mức độ nhận thức
  knowScore: number;
  knowMaxScore: number;
  understandScore: number;
  understandMaxScore: number;
  applyScore: number;
  applyMaxScore: number;
  // Nhận xét cá nhân hóa có cấu trúc từ AI (Mục 9)
  aiFeedbackOverall?: string;
  knowFeedback?: string;
  understandFeedback?: string;
  applyFeedback?: string;
  recommendedImprovements?: string;
  // Chấm & Phê duyệt
  isGraded?: boolean;
  gradedBy?: string;
  gradedAt?: string;
  teacherNotes?: string;
}

// ======================================================================
// HỆ THỐNG AI CHAT TÍCH HỢP & LỊCH SỬ (MỤC 13 - 16)
// ======================================================================

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export interface AIChatConversation {
  id: string;
  title: string;
  topic?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  messages: AIChatMessage[];
  contextType?: 'none' | 'test' | 'student' | 'class_analytics' | 'remedial';
  contextTitle?: string;
  contextSnippet?: string;
}

// ======================================================================
// HỆ THỐNG NGHIÊN CỨU GIÁO DỤC (RESEARCH DASHBOARD)
// ======================================================================

export interface ResearchGroup {
  id: string;
  code: string; // VD: TN01, ĐC01
  name: string;
  type: 'experimental' | 'control'; // Thực nghiệm vs Đối chứng
  studentIds: string[];
  description: string;
}

export interface InterventionLog {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  issueDetected: string;
  supportGiven: string;
  taskAssigned: string;
  studentResponse: string;
  outcomeAfterSupport: string;
  recordedBy: string;
  cognitiveFocus?: CognitiveLevel;
}

export interface SelfLearningSurveyItem {
  id: string;
  indicator: string; // 1-8 chỉ báo
  label: string;
  scorePre: number; // 1-5
  scorePost: number; // 1-5
}

export interface DigitalCompetencySurveyItem {
  id: string;
  indicator: string; // 1-7 chỉ báo
  label: string;
  scorePre: number; // 1-5
  scorePost: number; // 1-5
}

export interface ResearchSessionData {
  id: string;
  title: string;
  schoolYear: string;
  className: string;
  sampleSize: number;
  startDate: string;
  endDate: string;
  experimentalGroup: ResearchGroup;
  controlGroup: ResearchGroup;
  // Kết quả kiểm tra Trước - Sau - Trì hoãn
  preTestAverage: {
    experimental: { overall: number; know: number; understand: number; apply: number };
    control: { overall: number; know: number; understand: number; apply: number };
  };
  postTestAverage: {
    experimental: { overall: number; know: number; understand: number; apply: number };
    control: { overall: number; know: number; understand: number; apply: number };
  };
  delayedTestAverage: {
    experimental: { overall: number; know: number; understand: number; apply: number };
    control: { overall: number; know: number; understand: number; apply: number };
  };
  // Khảo sát năng lực
  selfLearningScores: {
    indicator: string;
    preExp: number;
    postExp: number;
    preCtrl: number;
    postCtrl: number;
  }[];
  digitalCompetencyScores: {
    indicator: string;
    preExp: number;
    postExp: number;
    preCtrl: number;
    postCtrl: number;
  }[];
  // Nhật ký can thiệp
  interventions: InterventionLog[];
}

