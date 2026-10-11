/**
 * Tiện ích tải tất cả các nội dung trong ứng dụng Tổ 3 – Lớp 11A1
 * Hỗ trợ xuất trọn bộ dữ liệu: JSON bản sao lưu 100%, Excel đa trang tính (.xlsx),
 * và Hồ sơ văn bản tổng hợp toàn diện (.doc)
 */

import * as XLSX from 'xlsx';
import {
  APP_CONFIG,
  getMemberDisplayRole,
  isTeacherMember,
  getStudentMembers,
  isLeaderMember,
} from '../config';
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
  AssessmentTest,
  QuestionBankItem,
  AssessmentAttempt,
} from '../types';
import {
  loadMembers,
  loadDocuments,
  loadAssignments,
  loadSubmissions,
  loadProducts,
  loadGroups,
  loadDiscussions,
  loadAttendance,
  loadCompetition,
  loadReports,
  loadActivities,
  loadTrash,
} from '../storage';
import {
  loadQuestionBank,
  loadAssessmentTests,
  loadAssessmentAttempts,
  loadLearningEvents,
  loadResearchData,
} from '../storageAI';

export interface FullAppDataPayload {
  members: Member[];
  documents: DocumentItem[];
  assignments: Assignment[];
  submissions: Submission[];
  products: ProductItem[];
  groups: StudyGroup[];
  discussions: DiscussionPost[];
  attendanceSessions: AttendanceSession[];
  competitionRecords: CompetitionRecord[];
  reports: WeeklyReport[];
  activities: ActivityLog[];
  tests: AssessmentTest[];
  questionBank: QuestionBankItem[];
  attempts: AssessmentAttempt[];
}

/**
 * Lấy chức vụ/vai trò chuẩn để xuất hồ sơ văn bản và bảng tính:
 * - Thầy Nguyễn Văn Út là Giáo viên chủ nhiệm (GVCN), KHÔNG PHẢI Tổ trưởng
 * - Trần Công Minh (hoặc học sinh được phân công) là Tổ trưởng
 * - Các học sinh còn lại là Thành viên
 */
export function getMemberExportRole(m: Member): string {
  return getMemberDisplayRole(m, 'full');
}

/**
 * Lấy toàn bộ dữ liệu hiện tại trong bộ nhớ ứng dụng
 */
export function getAllAppData(): FullAppDataPayload {
  return {
    members: loadMembers(),
    documents: loadDocuments(),
    assignments: loadAssignments(),
    submissions: loadSubmissions(),
    products: loadProducts(),
    groups: loadGroups(),
    discussions: loadDiscussions(),
    attendanceSessions: loadAttendance(),
    competitionRecords: loadCompetition(),
    reports: loadReports(),
    activities: loadActivities(),
    tests: loadAssessmentTests(),
    questionBank: loadQuestionBank(),
    attempts: loadAssessmentAttempts(),
  };
}

/**
 * 1. TẢI TẤT CẢ NỘI DUNG DƯỚI DẠNG FILE JSON (100% dữ liệu gốc)
 */
export function downloadAllAppContentsJSON() {
  const data = getAllAppData();
  const fullBackup = {
    app: 'Tổ 3 – Lớp ' + APP_CONFIG.CLASS_NAME,
    school: APP_CONFIG.SCHOOL_NAME,
    schoolYear: APP_CONFIG.SCHOOL_YEAR,
    homeroomTeacher: APP_CONFIG.HOMEROOM_TEACHER,
    leader: APP_CONFIG.LEADER_NAME,
    exportedAt: new Date().toISOString(),
    exportedAtFormatted: new Date().toLocaleString('vi-VN'),
    totalSummary: {
      membersCount: data.members.length,
      attendanceSessionsCount: data.attendanceSessions.length,
      competitionRecordsCount: data.competitionRecords.length,
      assignmentsCount: data.assignments.length,
      submissionsCount: data.submissions.length,
      productsCount: data.products.length,
      documentsCount: data.documents.length,
      testsCount: data.tests.length,
      questionBankCount: data.questionBank.length,
      attemptsCount: data.attempts.length,
      discussionsCount: data.discussions.length,
      reportsCount: data.reports.length,
    },
    ...data,
    trash: loadTrash(),
    learningEvents: loadLearningEvents(),
    researchData: loadResearchData(),
  };

  const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `To3_11A1_Tat_Ca_Noi_Dung_App_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 2. TẢI TẤT CẢ NỘI DUNG DƯỚI DẠNG BẢNG TÍNH EXCEL (.xlsx) ĐA TRANG TÍNH
 */
export function downloadAllAppContentsExcel() {
  const data = getAllAppData();
  const wb = XLSX.utils.book_new();

  // Sheet 1: Tổng quan & Thành viên
  const studentList = getStudentMembers(data.members);
  const membersRows = studentList.map((m, idx) => ({
    STT: idx + 1,
    'Mã học sinh': m.id,
    'Họ và tên': m.name,
    'Vai trò': getMemberExportRole(m),
    'Nhóm học tập': m.groupName,
    'Điểm cộng': m.plusPoints,
    'Điểm trừ': m.minusPoints,
    'Điểm thi đua ròng': m.netPoints,
    'Chuyên cần (Buổi có mặt)': m.attendancePresent,
    'Số bài đã nộp': m.submittedCount,
    'Nhiệm vụ hoàn thành': m.completedTasks,
  }));
  const wsMembers = XLSX.utils.json_to_sheet(membersRows);
  XLSX.utils.book_append_sheet(wb, wsMembers, '1. Thành Viên');

  // Sheet 2: Điểm danh chi tiết
  const attendanceRows: any[] = [];
  let attIdx = 1;
  data.attendanceSessions.forEach((s) => {
    s.records.forEach((r) => {
      attendanceRows.push({
        STT: attIdx++,
        'Ngày học': s.date,
        Tuần: s.weekNumber,
        'Họ và tên học sinh': r.studentName,
        'Trạng thái':
          r.status === 'present'
            ? 'Có mặt'
            : r.status === 'late'
            ? 'Đi trễ'
            : r.status === 'absent_excused'
            ? 'Vắng có phép'
            : 'Vắng không phép',
        'Ghi chú': r.note || '',
        'Người điểm danh': s.recordedBy,
      });
    });
  });
  const wsAtt = XLSX.utils.json_to_sheet(attendanceRows);
  XLSX.utils.book_append_sheet(wb, wsAtt, '2. Điểm Danh');

  // Sheet 3: Thi đua
  const compRows = data.competitionRecords.map((c, idx) => ({
    STT: idx + 1,
    'Học sinh': c.studentName,
    'Loại điểm': c.type === 'plus' ? 'Cộng (+)' : 'Trừ (-)',
    'Số điểm': c.points,
    'Lý do / Hành vi': c.reason,
    'Người ghi nhận': c.recordedBy,
    'Thời gian': c.createdAt,
  }));
  const wsComp = XLSX.utils.json_to_sheet(compRows);
  XLSX.utils.book_append_sheet(wb, wsComp, '3. Thi Đua');

  // Sheet 4: Nhiệm vụ
  const taskRows = data.assignments.map((t, idx) => {
    const assigner =
      t.assignerName?.includes('Nguyễn Văn Út') || t.id === 'task_2' || t.title?.includes('Năng lượng Xanh')
        ? 'Lê Hoàng Nam'
        : t.assignerName || 'Tổ trưởng';
    return {
      STT: idx + 1,
      'Tiêu đề nhiệm vụ': t.title,
      'Môn học': t.subject,
      'Người giao': assigner,
      'Hạn chót': t.dueDate,
      'Trạng thái': t.status === 'completed' ? 'Đã xong' : 'Đang thực hiện',
      'Chuyên đề': t.topic || '',
      'Mô tả': t.description,
    };
  });
  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  XLSX.utils.book_append_sheet(wb, wsTasks, '4. Nhiệm Vụ');

  // Sheet 5: Bài nộp
  const subRows = data.submissions.map((s, idx) => ({
    STT: idx + 1,
    'Tiêu đề bài nộp': s.title || s.assignmentTitle,
    'Nhiệm vụ liên quan': s.assignmentTitle,
    'Người nộp': s.studentName,
    'Thời gian nộp': s.submittedAt,
    'Điểm số': s.score ?? 'Chưa chấm',
    'Nhận xét GV': s.feedback || '',
    'Số tệp đính kèm': s.files?.length || 0,
  }));
  const wsSubs = XLSX.utils.json_to_sheet(subRows);
  XLSX.utils.book_append_sheet(wb, wsSubs, '5. Bài Nộp');

  // Sheet 6: Sản phẩm học tập
  const prodRows = data.products.map((p, idx) => ({
    STT: idx + 1,
    'Tên sản phẩm': p.title,
    'Môn học': p.subject,
    'Nhóm thực hiện': p.authorGroup,
    'Danh mục': p.category || 'Học liệu',
    'Ngày nộp': p.createdAt,
    'Thành viên tham gia': p.participants?.join(', ') || '',
    'Mô tả sản phẩm': p.description,
  }));
  const wsProds = XLSX.utils.json_to_sheet(prodRows);
  XLSX.utils.book_append_sheet(wb, wsProds, '6. Sản Phẩm');

  // Sheet 7: Đề kiểm tra
  const testRows = data.tests.map((t, idx) => ({
    STT: idx + 1,
    'Mã đề': t.code,
    'Tên đề kiểm tra': t.title,
    'Môn học': t.subject,
    Khối: t.grade,
    'Chủ đề': t.topic,
    'Thời gian (phút)': t.durationMinutes,
    'Tổng số câu': t.questions?.length || 0,
    'Tổng điểm': t.totalPoints,
    'Tỷ lệ Biết (%)': t.knowRatio,
    'Tỷ lệ Hiểu (%)': t.understandRatio,
    'Tỷ lệ Vận dụng (%)': t.applyRatio,
    'Người tạo': t.creatorName,
  }));
  const wsTests = XLSX.utils.json_to_sheet(testRows);
  XLSX.utils.book_append_sheet(wb, wsTests, '7. Đề Kiểm Tra');

  // Sheet 8: Ngân hàng câu hỏi
  const qRows = data.questionBank.map((q, idx) => ({
    STT: idx + 1,
    'Mã câu': q.code,
    'Dạng câu':
      q.type === 'multiple_choice'
        ? 'Trắc nghiệm 4 lựa chọn'
        : q.type === 'true_false'
        ? 'Đúng / Sai'
        : q.type === 'short_answer'
        ? 'Trả lời ngắn'
        : 'Tự luận',
    'Mức độ nhận thức': q.cognitiveLevel,
    'Môn học': q.subject,
    Khối: q.grade,
    'Chủ đề': q.topic,
    'Điểm số': q.points,
    'Nội dung câu hỏi': q.content,
    'Đáp án chuẩn': q.correctAnswerText || '',
  }));
  const wsQ = XLSX.utils.json_to_sheet(qRows);
  XLSX.utils.book_append_sheet(wb, wsQ, '8. Ngân Hàng Câu Hỏi');

  // Xuất file .xlsx
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `To3_11A1_Bang_Tinh_Tong_Hop_Tat_Ca_${dateStr}.xlsx`);
}

/**
 * 3. TẢI TẤT CẢ NỘI DUNG DƯỚI DẠNG HỒ SƠ VĂN BẢN WORD (.doc)
 */
export function downloadAllAppContentsDoc() {
  const data = getAllAppData();
  const studentList = getStudentMembers(data.members);
  const dateStr = new Date().toLocaleDateString('vi-VN');

  const htmlDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>HỒ SƠ TỔNG HỢP TOÀN BỘ NỘI DUNG TỔ 3 - LỚP ${APP_CONFIG.CLASS_NAME}</title>
<style>
  @page { size: A4; margin: 2cm 2cm 2cm 2cm; }
  body { font-family: 'Times New Roman', 'Arial', serif; font-size: 11.5pt; line-height: 1.4; color: #0f172a; }
  .header-table { width: 100%; border-bottom: 2px solid #0284c7; padding-bottom: 8px; margin-bottom: 15px; }
  .header-table td { vertical-align: top; font-size: 11pt; }
  .doc-title { text-align: center; font-size: 17pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 15px 0 5px 0; }
  .doc-subtitle { text-align: center; font-size: 11pt; font-style: italic; color: #475569; margin-bottom: 20px; }
  .section-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0369a1; background-color: #f0fdf4; border-left: 5px solid #059669; padding: 5px 10px; margin-top: 25px; margin-bottom: 10px; }
  .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 15px; }
  .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10.5pt; text-align: left; }
  .data-table th { background-color: #f8fafc; font-weight: bold; color: #1e293b; text-align: center; }
  .data-table tr:nth-child(even) { background-color: #f8fafc; }
  .stat-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5pt; font-weight: bold; }
  .summary-card { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
</style>
</head>
<body>
  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="width: 50%; text-align: center;">
        TRƯỜNG THPT DƯƠNG MINH CHÂU<br/>
        <strong>TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME}</strong>
      </td>
      <td style="width: 50%; text-align: center;">
        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
        <em>Độc lập – Tự do – Hạnh phúc</em>
      </td>
    </tr>
  </table>

  <div class="doc-title">HỒ SƠ TỔNG HỢP TOÀN BỘ NỘI DUNG HỌC TẬP & KHẢO THÍ</div>
  <div class="doc-subtitle">
    Năm học: ${APP_CONFIG.SCHOOL_YEAR} • Giáo viên chủ nhiệm: ${APP_CONFIG.HOMEROOM_TEACHER} • Tổ trưởng: ${APP_CONFIG.LEADER_NAME}<br/>
    Ngày xuất dữ liệu: ${dateStr}
  </div>

  <!-- Thống kê tổng quan -->
  <div class="summary-card">
    <strong>TỔNG QUAN HỌC LIỆU VÀ HOẠT ĐỘNG:</strong><br/>
    • Sĩ số học sinh: <strong>${studentList.length}</strong> học sinh (100% Tổ 3) | Giáo viên chủ nhiệm: <strong>${APP_CONFIG.HOMEROOM_TEACHER}</strong> | Tổ trưởng: <strong>${APP_CONFIG.LEADER_NAME}</strong><br/>
    • Nhiệm vụ học tập: <strong>${data.assignments.length}</strong> nhiệm vụ | Bài nộp: <strong>${data.submissions.length}</strong> bài | Sản phẩm: <strong>${data.products.length}</strong> sản phẩm<br/>
    • Đề kiểm tra đánh giá: <strong>${data.tests.length}</strong> đề | Ngân hàng câu hỏi: <strong>${data.questionBank.length}</strong> câu hỏi chuẩn 3 mức độ<br/>
    • Sổ điểm danh: <strong>${data.attendanceSessions.length}</strong> buổi | Ghi nhận thi đua: <strong>${data.competitionRecords.length}</strong> lượt
  </div>

  <!-- I. DANH SÁCH THÀNH VIÊN -->
  <div class="section-title">I. DANH SÁCH THÀNH VIÊN TỔ 3 & KẾT QUẢ THI ĐUA (SĨ SỐ: ${studentList.length} HỌC SINH)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px;">STT</th>
        <th>Họ và tên</th>
        <th>Vai trò</th>
        <th>Nhóm</th>
        <th>Chuyên cần</th>
        <th>Điểm cộng</th>
        <th>Điểm trừ</th>
        <th>Điểm ròng</th>
        <th>Bài nộp</th>
      </tr>
    </thead>
    <tbody>
      ${studentList
        .map(
          (m, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${m.name}</strong></td>
          <td>${getMemberExportRole(m)}</td>
          <td>${m.groupName}</td>
          <td style="text-align: center;">${m.attendancePresent} buổi</td>
          <td style="text-align: center; color: #047857;">+${m.plusPoints}</td>
          <td style="text-align: center; color: #b91c1c;">-${m.minusPoints}</td>
          <td style="text-align: center; font-weight: bold;">${m.netPoints > 0 ? '+' : ''}${m.netPoints}</td>
          <td style="text-align: center;">${m.submittedCount}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- II. ĐỀ KIỂM TRA & MA TRẬN ĐÁNH GIÁ -->
  <div class="section-title">II. DANH MỤC ĐỀ KIỂM TRA & MA TRẬN 3 MỨC ĐỘ</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px;">STT</th>
        <th>Mã đề</th>
        <th>Tên đề kiểm tra</th>
        <th>Môn - Khối</th>
        <th>Thời gian</th>
        <th>Số câu</th>
        <th>Điểm</th>
        <th>BIẾT / HIỂU / VẬN DỤNG</th>
      </tr>
    </thead>
    <tbody>
      ${data.tests
        .map(
          (t, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><code>${t.code}</code></td>
          <td><strong>${t.title}</strong></td>
          <td>${t.subject} ${t.grade}</td>
          <td style="text-align: center;">${t.durationMinutes} phút</td>
          <td style="text-align: center;">${t.questions.length} câu</td>
          <td style="text-align: center;"><strong>${t.totalPoints}đ</strong></td>
          <td style="text-align: center;">${t.knowRatio}% / ${t.understandRatio}% / ${t.applyRatio}%</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- III. NGÂN HÀNG CÂU HỎI -->
  <div class="section-title">III. TRÍCH XUẤT NGÂN HÀNG CÂU HỎI KHẢO THÍ (${data.questionBank.length} CÂU)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px;">STT</th>
        <th>Mã câu</th>
        <th>Dạng câu</th>
        <th>Mức độ</th>
        <th>Điểm</th>
        <th>Nội dung câu hỏi & Đáp án</th>
      </tr>
    </thead>
    <tbody>
      ${data.questionBank
        .slice(0, 30)
        .map(
          (q, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><code>${q.code}</code></td>
          <td>${q.type === 'multiple_choice' ? 'TN 4 lựa chọn' : q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'}</td>
          <td style="text-align: center;"><strong>${q.cognitiveLevel}</strong></td>
          <td style="text-align: center;">${q.points}đ</td>
          <td>
            ${q.content}
            ${q.correctAnswerText ? `<div style="color: #065f46; font-size: 9.5pt; margin-top: 3px;">➔ Đáp án: <b>${q.correctAnswerText}</b></div>` : ''}
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- IV. NHIỆM VỤ HỌC TẬP -->
  <div class="section-title">IV. BẢNG PHÂN CÔNG NHIỆM VỤ HỌC TẬP TỔ 3</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px;">STT</th>
        <th>Tiêu đề nhiệm vụ</th>
        <th>Môn học</th>
        <th>Người phụ trách</th>
        <th>Hạn chót</th>
        <th>Trạng thái</th>
      </tr>
    </thead>
    <tbody>
      ${data.assignments
        .map(
          (a, idx) => {
            const assigner =
              a.assignerName?.includes('Nguyễn Văn Út') || a.id === 'task_2' || a.title?.includes('Năng lượng Xanh')
                ? 'Lê Hoàng Nam'
                : a.assignerName || 'Tổ 3';
            return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${a.title}</strong></td>
          <td>${a.subject}</td>
          <td>${assigner}</td>
          <td style="text-align: center;">${a.dueDate}</td>
          <td style="text-align: center;">${a.status === 'completed' ? '✓ Đã xong' : '⏳ Đang làm'}</td>
        </tr>
      `;
          }
        )
        .join('')}
    </tbody>
  </table>

  <div style="margin-top: 40px; width: 100%;">
    <table style="width: 100%;">
      <tr>
        <td style="width: 50%; text-align: center;">
          <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/>
          <em>(Ký và ghi rõ họ tên)</em><br/><br/><br/><br/>
          <strong>${APP_CONFIG.HOMEROOM_TEACHER}</strong>
        </td>
        <td style="width: 50%; text-align: center;">
          <em>Tây Ninh, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em><br/>
          <strong>TỔ TRƯỞNG TỔ 3</strong><br/>
          <em>(Ký và xác nhận dữ liệu)</em><br/><br/><br/><br/>
          <strong>${APP_CONFIG.LEADER_NAME}</strong>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff' + htmlDoc], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateName = new Date().toISOString().split('T')[0];
  a.download = `To3_11A1_Ho_So_Tong_Hop_Toan_Bo_Noi_Dung_${dateName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 4. TẢI TẤT CẢ TRỌN GÓI (MỘT CHẠM):
 * Tự động tải tệp JSON 100% dữ liệu gốc + File Word tổng hợp toàn bộ hồ sơ
 */
export function downloadEverythingBatch() {
  downloadAllAppContentsJSON();
  setTimeout(() => {
    downloadAllAppContentsExcel();
  }, 400);
  setTimeout(() => {
    downloadAllAppContentsDoc();
  }, 800);
}
