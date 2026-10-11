/**
 * Persistence layer for AI Learning, Question Bank, Assessments, and Research Data
 */

import {
  QuestionBankItem,
  AssessmentTest,
  AssessmentAttempt,
  LearningEvent,
  ResearchSessionData,
  LearningProfile,
} from './types';
import {
  DEMO_QUESTION_BANK,
  DEMO_ASSESSMENT_TESTS,
  DEMO_ASSESSMENT_ATTEMPTS,
  DEMO_LEARNING_EVENTS,
  DEMO_RESEARCH_DATA,
} from './ai/demoDataAI';
import { APP_CONFIG } from './config';

const PREFIX = APP_CONFIG.STORAGE_KEY_PREFIX || 'to3_11a1_';

// ======================================================================
// DEMO MODE TOGGLE (Không trộn dữ liệu thật với Demo)
// ======================================================================

export function loadDemoMode(): boolean {
  const saved = localStorage.getItem(PREFIX + 'demo_mode');
  return saved !== null ? saved === 'true' : true; // Mặc định mở Demo Mode minh họa
}

export function saveDemoMode(isDemo: boolean) {
  localStorage.setItem(PREFIX + 'demo_mode', String(isDemo));
}

// ======================================================================
// NGÂN HÀNG CÂU HỎI
// ======================================================================

export function loadQuestionBank(): QuestionBankItem[] {
  const data = localStorage.getItem(PREFIX + 'question_bank');
  if (!data) {
    saveQuestionBank(DEMO_QUESTION_BANK);
    return DEMO_QUESTION_BANK;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEMO_QUESTION_BANK;
  }
}

export function saveQuestionBank(questions: QuestionBankItem[]) {
  localStorage.setItem(PREFIX + 'question_bank', JSON.stringify(questions));
}

// ======================================================================
// ĐỀ KIỂM TRA & MA TRẬN
// ======================================================================

export function loadAssessmentTests(): AssessmentTest[] {
  const data = localStorage.getItem(PREFIX + 'assessment_tests');
  if (!data) {
    saveAssessmentTests(DEMO_ASSESSMENT_TESTS);
    return DEMO_ASSESSMENT_TESTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEMO_ASSESSMENT_TESTS;
  }
}

export function saveAssessmentTests(tests: AssessmentTest[]) {
  localStorage.setItem(PREFIX + 'assessment_tests', JSON.stringify(tests));
}

// ======================================================================
// BÀI LÀM CỦA HỌC SINH (ATTEMPTS)
// ======================================================================

export function loadAssessmentAttempts(): AssessmentAttempt[] {
  const data = localStorage.getItem(PREFIX + 'assessment_attempts');
  if (!data) {
    saveAssessmentAttempts(DEMO_ASSESSMENT_ATTEMPTS);
    return DEMO_ASSESSMENT_ATTEMPTS;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveAssessmentAttempts(DEMO_ASSESSMENT_ATTEMPTS);
      return DEMO_ASSESSMENT_ATTEMPTS;
    }
    return parsed;
  } catch (e) {
    return DEMO_ASSESSMENT_ATTEMPTS;
  }
}

export function saveAssessmentAttempts(attempts: AssessmentAttempt[]) {
  localStorage.setItem(PREFIX + 'assessment_attempts', JSON.stringify(attempts));
}

// ======================================================================
// LEARNING EVENTS (SỰ KIỆN HỌC TẬP SỐ)
// ======================================================================

export function loadLearningEvents(): LearningEvent[] {
  const data = localStorage.getItem(PREFIX + 'learning_events');
  if (!data) {
    saveLearningEvents(DEMO_LEARNING_EVENTS);
    return DEMO_LEARNING_EVENTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEMO_LEARNING_EVENTS;
  }
}

export function saveLearningEvents(events: LearningEvent[]) {
  localStorage.setItem(PREFIX + 'learning_events', JSON.stringify(events));
}

export function recordLearningEvent(event: Omit<LearningEvent, 'id' | 'timestamp'>) {
  const newEvent: LearningEvent = {
    ...event,
    id: 'le_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
  };
  const current = loadLearningEvents();
  const updated = [newEvent, ...current].slice(0, 500); // Lưu tối đa 500 sự kiện gần nhất
  saveLearningEvents(updated);
}

// ======================================================================
// DỮ LIỆU NGHIÊN CỨU GIÁO DỤC
// ======================================================================

export function loadResearchData(): ResearchSessionData {
  const data = localStorage.getItem(PREFIX + 'research_session_data');
  if (!data) {
    saveResearchData(DEMO_RESEARCH_DATA);
    return DEMO_RESEARCH_DATA;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEMO_RESEARCH_DATA;
  }
}

export function saveResearchData(session: ResearchSessionData) {
  localStorage.setItem(PREFIX + 'research_session_data', JSON.stringify(session));
}

// ======================================================================
// LỊCH SỬ AI CHAT TÍCH HỢP (MỤC 14 - 15)
// ======================================================================

import { AIChatConversation } from './types';

const DEFAULT_AI_CHAT_HISTORY: AIChatConversation[] = [
  {
    id: 'chat_demo_1',
    title: 'Phân tích kết quả kiểm tra chuyên đề Hóa học & Gợi ý phụ đạo',
    topic: 'Cân bằng & Năng lượng hóa học',
    createdAt: '2026-09-24T08:30:00Z',
    updatedAt: '2026-09-24T08:45:00Z',
    userId: 'mem_1',
    userName: 'Trần Công Minh',
    contextType: 'class_analytics',
    contextTitle: 'Kiểm tra chuyên đề Cân bằng & Nhiệt hóa học (Lớp 11A1)',
    messages: [
      {
        id: 'msg_1',
        sender: 'user',
        text: 'AI hãy phân tích kết quả bài kiểm tra chuyên đề Cân bằng hóa học của lớp. Tỷ lệ học sinh đạt ở mức VẬN DỤNG như thế nào và cần phụ đạo dạng bài gì?',
        timestamp: '08:30',
      },
      {
        id: 'msg_2',
        sender: 'ai',
        text: `Chào Thầy/Cô! Dựa trên dữ liệu thực tế bài kiểm tra:
1. 📊 **Tỷ lệ 3 mức độ nhận thức**:
   - Mức **BIẾT**: Đạt 88.5% (Học sinh nắm vững khái niệm hằng số cân bằng Kc, định luật Le Chatelier).
   - Mức **HIỂU**: Đạt 76.2% (Đa số giải thích tốt chiều chuyển dịch khi thay đổi nhiệt độ hoặc áp suất).
   - Mức **VẬN DỤNG**: Đạt 58.4% (Còn 5 học sinh lúng túng khi kết hợp tính hằng số cân bằng với nồng độ ban đầu và hiệu suất phản ứng).

2. 🎯 **Nội dung cần phụ đạo**:
   - Dạng bài toán tính toán nồng độ cân bằng của phản ứng tổng hợp NH3 và phản ứng este hóa.
   - Các bài toán có liên hệ thực tiễn về tối ưu hóa điều kiện nhiệt độ/áp suất trong công nghiệp hóa chất.

3. 💡 **Đề xuất hành động**:
   - Tổ chức buổi học nhóm chuyên đề: Nhóm bạn đạt VẬN DỤNG tốt kèm các bạn còn chưa chắc.
   - Giao 5 bài tập tình huống vận dụng có hướng dẫn gợi ý từng bước.`,
        timestamp: '08:31',
      },
    ],
  },
  {
    id: 'chat_demo_2',
    title: 'Xây dựng ma trận & câu hỏi 3 mức độ môn Toán 11',
    topic: 'Đạo hàm và ứng dụng',
    createdAt: '2026-09-25T14:15:00Z',
    updatedAt: '2026-09-25T14:28:00Z',
    userId: 'mem_1',
    userName: 'Trần Công Minh',
    contextType: 'test',
    contextTitle: 'Chuyên đề Đạo hàm & Tiếp tuyến',
    messages: [
      {
        id: 'msg_3',
        sender: 'user',
        text: 'Hãy gợi ý cách phân bổ câu hỏi cho đề 45 phút môn Toán lớp 11 phần Đạo hàm theo đúng 3 mức độ BIẾT (40%), HIỂU (40%), VẬN DỤNG (20%).',
        timestamp: '14:15',
      },
      {
        id: 'msg_4',
        sender: 'ai',
        text: `Dưới đây là cấu trúc ma trận chuẩn hóa 3 mức độ nhận thức theo định hướng Bộ GD&ĐT:

1. 📐 **Mức 1 – BIẾT (40% - 4.0 điểm - 8 câu trắc nghiệm 0.5đ hoặc 16 câu 0.25đ)**:
   - Nhận biết công thức tính đạo hàm các hàm số cơ bản (x^n, sin x, cos x, e^x, ln x).
   - Nhận diện ý nghĩa hình học của đạo hàm (hệ số góc tiếp tuyến k = f'(x0)).

2. 🔍 **Mức 2 – HIỂU (40% - 4.0 điểm - gồm câu hỏi Đúng/Sai và Trả lời ngắn)**:
   - Tính đạo hàm hàm hợp u(x).
   - Viết phương trình tiếp tuyến của đồ thị hàm số tại một điểm cho trước.
   - Phân biệt mối quan hệ giữa dấu đạo hàm f'(x) và tính đơn điệu của hàm số.

3. 🚀 **Mức 3 – VẬN DỤNG (20% - 2.0 điểm - bài toán thực tiễn / tự luận)**:
   - Ứng dụng đạo hàm giải bài toán chuyển động thực tế (vận tốc tức thời v(t) = s'(t), gia tốc a(t) = v'(t)).
   - Bài toán tối ưu chi phí sản xuất hoặc tìm giá trị lớn nhất/nhỏ nhất trong bối cảnh thực tiễn.`,
        timestamp: '14:16',
      },
    ],
  },
];

export function loadAIChatHistory(): AIChatConversation[] {
  const data = localStorage.getItem(PREFIX + 'ai_chat_history');
  if (!data) {
    saveAIChatHistory(DEFAULT_AI_CHAT_HISTORY);
    return DEFAULT_AI_CHAT_HISTORY;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_AI_CHAT_HISTORY;
  }
}

export function saveAIChatHistory(history: AIChatConversation[]) {
  localStorage.setItem(PREFIX + 'ai_chat_history', JSON.stringify(history));
}

export function resetAIStorageToDemo() {
  saveQuestionBank(DEMO_QUESTION_BANK);
  saveAssessmentTests(DEMO_ASSESSMENT_TESTS);
  saveAssessmentAttempts(DEMO_ASSESSMENT_ATTEMPTS);
  saveLearningEvents(DEMO_LEARNING_EVENTS);
  saveResearchData(DEMO_RESEARCH_DATA);
  saveAIChatHistory(DEFAULT_AI_CHAT_HISTORY);
}

export function clearAIStorage() {
  const keys = [
    'demo_mode',
    'question_bank',
    'assessment_tests',
    'assessment_attempts',
    'learning_events',
    'research_session_data',
    'ai_alerts',
    'ai_chat_history',
  ];
  keys.forEach((k) => localStorage.removeItem(PREFIX + k));
}

