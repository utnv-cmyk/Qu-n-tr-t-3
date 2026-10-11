/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  FileText,
  Download,
  Copy,
  CheckCircle,
  Printer,
  Sparkles,
  Trophy,
  Users,
  Award,
  Edit3,
  Trash2,
  Plus,
  X,
  Lock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Member, WeeklyReport, CompetitionRecord } from '../types';
import {
  APP_CONFIG,
  getStudentMembers,
  getMemberDisplayRole,
  isTeacherMember,
  isLeaderMember,
} from '../config';
import {
  ALL_SCHOOL_WEEKS,
  getSchoolWeekInfo,
  getWeekFromDate,
  TOTAL_SCHOOL_WEEKS,
} from '../utils/schoolWeeks';
import { formatScore } from '../utils/scoreUtils';
import { downloadAllAppContentsDoc } from '../utils/fullAppExport';

interface Props {
  reports: WeeklyReport[];
  members: Member[];
  currentMember: Member;
  competitionRecords?: CompetitionRecord[];
  onSaveReport: (report: WeeklyReport) => void;
  onDeleteReport?: (report: WeeklyReport) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ReportsView: React.FC<Props> = ({
  reports,
  members,
  currentMember,
  competitionRecords = [],
  onSaveReport,
  onDeleteReport,
  onOpenTrash,
  trashCount = 0,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';

  // 1. Loại bỏ hoàn toàn Tuần 25 theo yêu cầu người dùng ("bỏ tuần 25 đi")
  const validReports = reports
    .filter((r) => r.weekNumber !== 25 && r.id !== 'rep_w25' && r.weekNumber !== 26 && r.id !== 'rep_w26')
    .map((r) => {
      // Chuẩn hóa tuần 3: 21/09/2026 - 27/09/2026
      if (r.weekNumber === 3) {
        return {
          ...r,
          startDate: '21/09/2026',
          endDate: '27/09/2026',
        };
      }
      return r;
    });

  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const found = validReports.find((r) => r.weekNumber === 3);
    return found ? 3 : (validReports[0]?.weekNumber || 3);
  });

  // Modal Sửa/Tạo Báo Cáo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<WeeklyReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<WeeklyReport | null>(null);

  // Form Fields
  const [weekNumber, setWeekNumber] = useState<number>(3);
  const [startDate, setStartDate] = useState('21/09/2026');
  const [endDate, setEndDate] = useState('27/09/2026');
  const [attendanceSummary, setAttendanceSummary] = useState('');
  const [academicSummary, setAcademicSummary] = useState('');
  const [disciplineSummary, setDisciplineSummary] = useState('');
  const [shortcomings, setShortcomings] = useState('');
  const [proposals, setProposals] = useState('');

  const activeReport =
    validReports.find((r) => r.weekNumber === selectedWeek) ||
    validReports[0] || {
      id: 'rep_w3',
      weekNumber: 3,
      startDate: '21/09/2026',
      endDate: '27/09/2026',
      createdByName: 'Trần Công Minh (Tổ trưởng)',
      createdAt: '2026-09-24 11:30',
      attendanceSummary: 'Sĩ số đầy đủ 100%. Tác phong đồng phục nghiêm chỉnh, đúng giờ.',
      academicSummary: 'Tổ đã hoàn thành các nhiệm vụ được giao; tích cực chuẩn bị bài học các môn.',
      disciplineSummary: 'Tích cực tham gia phát biểu xây dựng bài trong các tiết học.',
      shortcomings: 'Tiếp tục duy trì nề nếp học tập và hoàn thiện bài tập các môn sớm.',
      proposals: 'Kính mong Thầy Nguyễn Văn Út tổ chức buổi thảo luận chuyên đề Toán hình giải tích cho lớp.',
    };

  // Calculated totals across all members in Tổ 3 for the active week
  const weekCompetitionRecords = React.useMemo(() => {
    return (competitionRecords || []).filter(
      (c) => (c.weekNumber || getWeekFromDate(c.createdAt)) === activeReport.weekNumber
    );
  }, [competitionRecords, activeReport.weekNumber]);

  const totalAttendance = members.reduce((s, m) => s + (m.attendancePresent || 0), 0);
  const totalTasks = members.reduce((s, m) => s + (m.completedTasks || 0), 0);
  const totalPlus = weekCompetitionRecords.length > 0
    ? weekCompetitionRecords.filter((c) => c.type === 'plus').reduce((s, c) => s + Math.abs(c.points), 0)
    : members.reduce((s, m) => s + (m.plusPoints || 0), 0);
  const totalMinus = weekCompetitionRecords.length > 0
    ? weekCompetitionRecords.filter((c) => c.type === 'minus').reduce((s, c) => s + Math.abs(c.points), 0)
    : members.reduce((s, m) => s + (m.minusPoints || 0), 0);
  const totalNet = Math.round((totalPlus - totalMinus) * 100) / 100;

  const handleWeekSelectChange = (w: number) => {
    setWeekNumber(w);
    const info = getSchoolWeekInfo(w);
    setStartDate(info.startDate);
    setEndDate(info.endDate);
  };

  const handleOpenEdit = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền sửa báo cáo tuần!', 'warning');
      return;
    }
    if (!activeReport) return;
    setEditingReport(activeReport);
    setWeekNumber(activeReport.weekNumber || 3);
    const weekInfo = getSchoolWeekInfo(activeReport.weekNumber || 3);
    setStartDate(activeReport.weekNumber === 3 ? '21/09/2026' : (activeReport.startDate || weekInfo.startDate));
    setEndDate(activeReport.weekNumber === 3 ? '27/09/2026' : (activeReport.endDate || weekInfo.endDate));
    setAttendanceSummary(activeReport.attendanceSummary);
    setAcademicSummary(activeReport.academicSummary);
    setDisciplineSummary(activeReport.disciplineSummary);
    setShortcomings(activeReport.shortcomings);
    setProposals(activeReport.proposals);
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền lập báo cáo tuần mới!', 'warning');
      return;
    }
    setEditingReport(null);
    // Gợi ý tuần tiếp theo chưa có báo cáo (trong phạm vi 1 - 35)
    let nextWeek = 3;
    const existingWeeks = validReports.map((r) => r.weekNumber);
    for (let i = 1; i <= TOTAL_SCHOOL_WEEKS; i++) {
      if (!existingWeeks.includes(i)) {
        nextWeek = i;
        break;
      }
    }

    const weekInfo = getSchoolWeekInfo(nextWeek);
    setWeekNumber(nextWeek);
    setStartDate(weekInfo.startDate);
    setEndDate(weekInfo.endDate);
    setAttendanceSummary('Tổ 3 duy trì sĩ số tốt 100%, không bạn nào vắng không phép.');
    setAcademicSummary('100% thành viên hoàn thành bài tập các môn Toán, Văn, Anh đầy đủ.');
    setDisciplineSummary('Tổ tích cực xung phong phát biểu xây dựng bài trong các tiết học.');
    setShortcomings('Cần lưu ý chuẩn bị tài liệu sớm hơn trước khi vào tiết.');
    setProposals('Đề xuất GVCN tiếp tục động viên tinh thần học tập nhóm của tổ.');
    setIsEditModalOpen(true);
  };

  const handleInitiateDelete = (report: WeeklyReport) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền xóa báo cáo!', 'error');
      return;
    }
    setReportToDelete(report);
  };

  const handleConfirmDelete = () => {
    if (!reportToDelete) return;
    if (onDeleteReport) {
      onDeleteReport(reportToDelete);
    }
    showToast(`Đã xóa báo cáo Tuần ${reportToDelete.weekNumber} (Đã chuyển vào Thùng rác).`);
    const remaining = reports.filter((r) => r.id !== reportToDelete.id);
    if (remaining.length > 0) {
      setSelectedWeek(remaining[0].weekNumber);
    }
    setReportToDelete(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWeek = Number(weekNumber) || 3;
    const updated: WeeklyReport = {
      id: editingReport ? editingReport.id : 'rep_' + Date.now(),
      weekNumber: finalWeek,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      attendanceSummary: attendanceSummary.trim(),
      academicSummary: academicSummary.trim(),
      disciplineSummary: disciplineSummary.trim(),
      shortcomings: shortcomings.trim(),
      proposals: proposals.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      createdByName: currentMember.name + (isLeader ? ' (Tổ trưởng)' : ''),
    };

    onSaveReport(updated);
    setSelectedWeek(updated.weekNumber);
    setIsEditModalOpen(false);
    showToast(`Đã lưu báo cáo Tuần ${updated.weekNumber} thành công!`);
  };

  // Sao chép tóm tắt ĐẦY ĐỦ kèm BẢNG ĐIỂM CHI TIẾT và NỘI DUNG CỘNG / TRỪ CỤ THỂ
  const handleCopySummary = () => {
    if (!activeReport) return;

    // Chi tiết từng thành viên kèm nội dung cộng/trừ cụ thể theo tuần báo cáo
    const memberRows = members
      .map((m, idx) => {
        const studentComp = (competitionRecords || []).filter(
          (c) =>
            (c.studentId === m.id ||
              (c.studentName &&
                c.studentName.trim().toLowerCase() === m.name.trim().toLowerCase())) &&
            ((c.weekNumber || getWeekFromDate(c.createdAt)) === activeReport.weekNumber)
        );

        const plusItems = studentComp
          .filter((c) => c.type === 'plus')
          .map((c) => `+${c.points}đ (${c.reason})`);

        const minusItems = studentComp
          .filter((c) => c.type === 'minus')
          .map((c) => `-${c.points}đ (${c.reason})`);

        const studentWeekPlus = plusItems.length > 0
          ? studentComp.filter((c) => c.type === 'plus').reduce((s, c) => s + Math.abs(c.points), 0)
          : (m.plusPoints || 0);
        const studentWeekMinus = minusItems.length > 0
          ? studentComp.filter((c) => c.type === 'minus').reduce((s, c) => s + Math.abs(c.points), 0)
          : (m.minusPoints || 0);
        const studentWeekNet = Math.round((studentWeekPlus - studentWeekMinus) * 100) / 100;

        const plusDetail =
          plusItems.length > 0
            ? plusItems.join('; ')
            : (m.plusPoints || 0) > 0
            ? `${formatScore(m.plusPoints)} (Điểm cộng tích lũy thi đua)`
            : 'Không có (+0đ)';

        const minusDetail =
          minusItems.length > 0
            ? minusItems.join('; ')
            : (m.minusPoints || 0) > 0
            ? `${formatScore(-Math.abs(m.minusPoints))} (Điểm trừ vi phạm)`
            : 'Không vi phạm (0đ)';

        return `  ${idx + 1}. ${m.name.padEnd(20)} | Nhóm: ${(m.groupName || 'Tổ 3').padEnd(16)}
     • Chuyên cần: ${String(m.attendancePresent || 0)} buổi tốt | Nhiệm vụ: ${String(m.completedTasks || 0)} hoàn thành
     • Chi tiết CỘNG ĐIỂM (${formatScore(studentWeekPlus)}): ${plusDetail}
     • Chi tiết TRỪ ĐIỂM (${formatScore(-Math.abs(studentWeekMinus))}): ${minusDetail}
     • TỔNG KẾT ĐIỂM THI ĐUA TUẦN: ${formatScore(studentWeekNet, { unit: ' điểm' })}`;
      })
      .join('\n\n');

    const summaryText = `======================================================================
BÁO CÁO THI ĐUA & HOẠT ĐỘNG HỌC TẬP TUẦN ${activeReport.weekNumber}
NĂM HỌC: ${APP_CONFIG.SCHOOL_YEAR}
TỔ: ${APP_CONFIG.GROUP_NAME} – LỚP: ${APP_CONFIG.CLASS_NAME} | TRƯỜNG: ${APP_CONFIG.SCHOOL_NAME}
GVCN: ${APP_CONFIG.HOMEROOM_TEACHER} | Người lập: ${activeReport.createdByName}
Thời gian: Từ ngày ${activeReport.startDate} đến ngày ${activeReport.endDate}
======================================================================

I. TỔNG HỢP NỘI DUNG TUẦN ${activeReport.weekNumber}:
1. Tình hình chuyên cần & Tác phong:
   ${activeReport.attendanceSummary}

2. Tình hình học tập, nhiệm vụ & sản phẩm:
   ${activeReport.academicSummary}

3. Thi đua, phát biểu & hoạt động phong trào:
   ${activeReport.disciplineSummary}

4. Tồn tại cần khắc phục:
   ${activeReport.shortcomings}

5. Kiến nghị & Đề xuất với GVCN:
   ${activeReport.proposals}

======================================================================
II. BẢNG ĐIỂM CHI TIẾT TỪNG THÀNH VIÊN VÀ NỘI DUNG CỘNG/TRỪ TUẦN ${activeReport.weekNumber}:
----------------------------------------------------------------------
${memberRows}

----------------------------------------------------------------------
TỔNG CỘNG TOÀN TỔ (${members.length} thành viên):
- Tổng số buổi chuyên cần: ${totalAttendance} buổi
- Tổng số nhiệm vụ hoàn thành: ${totalTasks} lượt
- Tổng điểm cộng thi đua: ${formatScore(totalPlus, { unit: ' điểm' })}
- Tổng điểm trừ vi phạm: ${formatScore(-Math.abs(totalMinus), { unit: ' điểm' })}
- TỔNG KẾT ĐIỂM THI ĐUA CHUNG TOÀN TỔ: ${formatScore(totalNet, { unit: ' ĐIỂM' })}
======================================================================`;

    navigator.clipboard.writeText(summaryText);
    showToast(`Đã sao chép đầy đủ báo cáo Tuần ${activeReport.weekNumber} kèm bảng điểm chi tiết vào Clipboard!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={24} />
              Báo Cáo Tuần & Thống Kê Học Tập
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              Kính gửi GVCN: {APP_CONFIG.HOMEROOM_TEACHER}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              Năm học {APP_CONFIG.SCHOOL_YEAR}
            </span>
            {!isLeader && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                <Lock size={12} /> Chế độ xem (Thành viên)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp chuyên cần, học tập, nhiệm vụ và kết quả thi đua của {APP_CONFIG.GROUP_NAME} – Lớp {APP_CONFIG.CLASS_NAME} ({APP_CONFIG.SCHOOL_YEAR})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors shadow-xs cursor-pointer"
              title="Xem và khôi phục báo cáo đã xóa"
            >
              <Trash2 size={14} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          {isLeader && (
            <>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-102 cursor-pointer"
                title="Lập báo cáo tuần mới"
              >
                <Plus size={14} /> Lập báo cáo mới
              </button>

              {activeReport && (
                <>
                  <button
                    onClick={handleOpenEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors cursor-pointer"
                    title="Chỉnh sửa nội dung báo cáo tuần này"
                  >
                    <Edit3 size={14} /> Sửa báo cáo
                  </button>

                  <button
                    onClick={() => handleInitiateDelete(activeReport)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    title="Xóa báo cáo này (Chuyển vào thùng rác)"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
            title="Sao chép toàn bộ báo cáo và bảng điểm chi tiết từng thành viên vào Clipboard"
          >
            <Copy size={14} className="text-emerald-600" />
            <span>Sao chép tóm tắt</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer size={14} /> In báo cáo
          </button>
        </div>
      </div>

      {/* Hồ Sơ Văn Bản (.doc) chuẩn thể thức Bộ GD&ĐT */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-700/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-black text-[10px] uppercase tracking-wider">
              Văn Bản Chuẩn Bộ GD&ĐT
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px]">
              Tổ 3 – Lớp {APP_CONFIG.CLASS_NAME}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <FileText size={22} className="text-blue-300" />
            <span>Hồ Sơ Văn Bản (.doc)</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Hồ sơ tổng hợp chuẩn thể thức Bộ GD&ĐT, đầy đủ bảng biểu, danh sách thành viên, nhiệm vụ, đề thi để in và lưu trữ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            downloadAllAppContentsDoc();
            showToast('Đang tải Hồ sơ văn bản (.doc) chuẩn thể thức Bộ GD&ĐT về máy!', 'success');
          }}
          className="relative z-10 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Download size={18} />
          <span>Tải Word (.doc)</span>
        </button>
      </div>

      {/* Week Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {validReports.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedWeek(r.weekNumber)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedWeek === r.weekNumber
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tuần {r.weekNumber} ({r.startDate} - {r.endDate})
          </button>
        ))}
      </div>

      {/* Detailed Report Document */}
      {activeReport ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          {/* Report Head */}
          <div className="text-center border-b border-slate-200 pb-6">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase">
              BÁO CÁO THI ĐUA & HOẠT ĐỘNG HỌC TẬP TUẦN {activeReport.weekNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Thời gian: Từ ngày {activeReport.startDate} đến ngày {activeReport.endDate}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-700 mt-3">
              <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg">
                TỔ 3 – LỚP {APP_CONFIG.CLASS_NAME}
              </span>
              <span>•</span>
              <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-lg border border-blue-200">
                Năm học: {APP_CONFIG.SCHOOL_YEAR}
              </span>
              <span>•</span>
              <span>GVCN: {APP_CONFIG.HOMEROOM_TEACHER}</span>
              <span>•</span>
              <span>Người lập: {activeReport.createdByName}</span>
            </div>
          </div>

          {/* Core KPI metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">Sĩ số tổ</span>
              <span className="text-base font-bold text-slate-900">{getStudentMembers(members).length} bạn (100%)</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Điểm thi đua tuần</span>
              <span className="text-base font-bold text-amber-600">
                {formatScore(totalNet)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Nhiệm vụ hoàn thành</span>
              <span className="text-base font-bold text-blue-600">{totalTasks} lượt xong</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Xếp hạng đề xuất</span>
              <span className="text-base font-bold text-emerald-600">Hạng Nhất (1/4)</span>
            </div>
          </div>

          {/* Sectional Summaries */}
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100">
              <h4 className="font-bold text-blue-900 uppercase tracking-wide text-xs mb-1">
                1. Tình hình chuyên cần & Tác phong:
              </h4>
              <p className="text-slate-700 leading-relaxed">{activeReport.attendanceSummary}</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <h4 className="font-bold text-emerald-900 uppercase tracking-wide text-xs mb-1">
                2. Tình hình học tập, nhiệm vụ & sản phẩm:
              </h4>
              <p className="text-slate-700 leading-relaxed">{activeReport.academicSummary}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
              <h4 className="font-bold text-amber-900 uppercase tracking-wide text-xs mb-1">
                3. Thi đua, phát biểu & hoạt động phong trào:
              </h4>
              <p className="text-slate-700 leading-relaxed">{activeReport.disciplineSummary}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs mb-1">
                4. Tồn tại cần khắc phục:
              </h4>
              <p className="text-slate-700 leading-relaxed">{activeReport.shortcomings}</p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
              <h4 className="font-bold text-indigo-900 uppercase tracking-wide text-xs mb-1">
                5. Kiến nghị & Đề xuất với GVCN:
              </h4>
              <p className="text-slate-700 leading-relaxed">{activeReport.proposals}</p>
            </div>
          </div>

          {/* Member Score Breakdown Table with Detailed Plus and Minus Reasons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                <span>📋 Bảng điểm chi tiết từng thành viên Tuần {activeReport.weekNumber}</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({getStudentMembers(members).length} học sinh)
                </span>
                <span className="text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                  Ghi rõ nội dung cộng & trừ điểm
                </span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Năm học: <strong>{APP_CONFIG.SCHOOL_YEAR}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2 text-center w-8">STT</th>
                    <th className="py-3 px-3 min-w-[160px]">Học sinh & Nhóm</th>
                    <th className="py-3 px-2 text-center min-w-[65px]">Chuyên cần</th>
                    <th className="py-3 px-2 text-center min-w-[65px]">Nhiệm vụ</th>
                    <th className="py-3 px-3.5 min-w-[250px]">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <Sparkles size={14} className="text-emerald-600 shrink-0" />
                        <span>Nội dung được Cộng điểm (+)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3.5 min-w-[250px]">
                      <div className="flex items-center gap-1.5 text-rose-800">
                        <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                        <span>Nội dung bị Trừ điểm (-)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right min-w-[95px]">Tổng kết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getStudentMembers(members).map((m, idx) => {
                    const studentRecords = (competitionRecords || []).filter(
                      (c) =>
                        (c.studentId === m.id ||
                          (c.studentName &&
                            c.studentName.trim().toLowerCase() === m.name.trim().toLowerCase())) &&
                        ((c.weekNumber || getWeekFromDate(c.createdAt)) === activeReport.weekNumber)
                    );
                    const plusList = studentRecords.filter((c) => c.type === 'plus');
                    const minusList = studentRecords.filter((c) => c.type === 'minus');
                    const studentWeekPlus = plusList.length > 0
                      ? plusList.reduce((s, c) => s + Math.abs(c.points), 0)
                      : (m.plusPoints || 0);
                    const studentWeekMinus = minusList.length > 0
                      ? minusList.reduce((s, c) => s + Math.abs(c.points), 0)
                      : (m.minusPoints || 0);
                    const studentWeekNet = Math.round((studentWeekPlus - studentWeekMinus) * 100) / 100;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* STT */}
                        <td className="py-3 px-2 text-center text-slate-400 font-bold align-top">
                          {idx + 1}
                        </td>

                        {/* Học sinh & Nhóm */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-start gap-2.5">
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{m.name}</span>
                                {isLeaderMember(m) && (
                                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                                    Tổ trưởng
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {m.groupName || 'Tổ 3'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Chuyên cần */}
                        <td className="py-3 px-2 text-center text-emerald-700 font-bold align-top">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                            {m.attendancePresent || 0} tốt
                          </span>
                        </td>

                        {/* Nhiệm vụ */}
                        <td className="py-3 px-2 text-center text-blue-700 font-bold align-top">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                            {m.completedTasks || 0} xong
                          </span>
                        </td>

                        {/* Chi tiết Điểm cộng & Lý do khen thưởng */}
                        <td className="py-3 px-3.5 align-top">
                          {plusList.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 font-extrabold text-emerald-700 text-xs">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300">
                                  {formatScore(m.plusPoints || 0)}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({plusList.length} lượt cộng)
                                </span>
                              </div>
                              <div className="space-y-1">
                                {plusList.map((c) => (
                                  <div
                                    key={c.id}
                                    className="text-[11px] bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-1.5 flex items-start gap-1.5 leading-snug"
                                  >
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black text-[10px] shrink-0 mt-0.5">
                                      {formatScore(c.points)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-slate-800 break-words">
                                        {c.reason}
                                      </p>
                                      {c.createdAt && (
                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                          🕒 {c.createdAt}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (m.plusPoints || 0) > 0 ? (
                            <div className="text-[11px] bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-1.5 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                                {formatScore(m.plusPoints)}
                              </span>
                              <span className="font-medium text-slate-700">
                                Điểm cộng thi đua tích lũy
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] block py-1">
                              Không có điểm cộng (+0đ)
                            </span>
                          )}
                        </td>

                        {/* Chi tiết Điểm trừ & Lý do vi phạm */}
                        <td className="py-3 px-3.5 align-top">
                          {minusList.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 font-extrabold text-rose-700 text-xs">
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 border border-rose-300">
                                  {formatScore(-Math.abs(m.minusPoints || 0))}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({minusList.length} lượt trừ)
                                </span>
                              </div>
                              <div className="space-y-1">
                                {minusList.map((c) => (
                                  <div
                                    key={c.id}
                                    className="text-[11px] bg-rose-50/70 border border-rose-200/80 rounded-lg p-1.5 flex items-start gap-1.5 leading-snug"
                                  >
                                    <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-black text-[10px] shrink-0 mt-0.5">
                                      {formatScore(-Math.abs(c.points))}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-rose-900 break-words">
                                        {c.reason}
                                      </p>
                                      {c.createdAt && (
                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                          🕒 {c.createdAt}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (m.minusPoints || 0) > 0 ? (
                            <div className="text-[11px] bg-rose-50/70 border border-rose-200/80 rounded-lg p-1.5 flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                                {formatScore(-Math.abs(m.minusPoints))}
                              </span>
                              <span className="font-medium text-rose-800">
                                Điểm trừ vi phạm nề nếp
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-semibold my-1">
                              <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                              <span>Không vi phạm (0đ)</span>
                            </div>
                          )}
                        </td>

                        {/* Tổng kết */}
                        <td className="py-3 px-3 text-right align-top">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl font-black text-xs shadow-2xs ${
                              studentWeekNet >= 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {formatScore(studentWeekNet)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* TFOOT: Tổng cộng/trừ và tổng điểm toàn tổ ở dưới bảng */}
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-blue-50/70 font-bold text-slate-900">
                    <td className="py-3 px-2 text-center text-slate-400 font-bold">Σ</td>
                    <td className="py-3 px-3 font-black uppercase text-blue-900 text-xs">
                      TỔNG CỘNG TOÀN TỔ ({members.length} học sinh)
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-800 font-black">
                      {totalAttendance} buổi
                    </td>
                    <td className="py-3 px-2 text-center text-blue-800 font-black">
                      {totalTasks} xong
                    </td>
                    <td className="py-3 px-3.5 font-black text-emerald-800">
                      <span>Tổng cộng: {formatScore(totalPlus)}</span>
                    </td>
                    <td className="py-3 px-3.5 font-black text-rose-800">
                      <span>Tổng trừ: {formatScore(-Math.abs(totalMinus))}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block px-3 py-1 rounded-xl bg-amber-500 text-white font-black text-xs shadow-xs">
                        {formatScore(totalNet)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Highlight Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-blue-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-600 shrink-0" />
                <span className="font-extrabold text-slate-900">
                  Tổng kết thi đua Tuần {activeReport.weekNumber} (Năm học {APP_CONFIG.SCHOOL_YEAR}):
                </span>
              </div>
              <div className="flex items-center gap-3 font-bold text-xs flex-wrap">
                <span className="text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  ✨ Tổng điểm cộng: {formatScore(totalPlus, { unit: '' })}
                </span>
                <span className="text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                  ⚠️ Tổng điểm trừ: {formatScore(-Math.abs(totalMinus), { unit: '' })}
                </span>
                <span className="text-blue-900 bg-amber-400 text-slate-900 px-3 py-1 rounded-lg font-black shadow-2xs">
                  🏆 Tổng kết: {formatScore(totalNet, { unit: ' điểm' })}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700 uppercase">Giáo viên chủ nhiệm</p>
              <p className="text-[11px] text-slate-400 mt-1">(Ký và duyệt)</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900">{APP_CONFIG.HOMEROOM_TEACHER}</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 uppercase">Tổ trưởng lập báo cáo</p>
              <p className="text-[11px] text-slate-400 mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900">{activeReport.createdByName}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <p className="text-slate-500 font-medium">Chưa có báo cáo tuần nào.</p>
          {isLeader && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Lập báo cáo tuần mới
            </button>
          )}
        </div>
      )}

      {/* Modal Lập / Sửa Báo Cáo Tuần */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl my-8 p-6 border border-slate-200 animate-scale-up text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingReport
                      ? `✏️ Chỉnh Sửa Báo Cáo Tuần ${weekNumber}`
                      : '✨ Lập Báo Cáo Tuần Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tổ 3 – Lớp 11A1 (Năm học {APP_CONFIG.SCHOOL_YEAR})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    🏷️ Tuần học (Tuần 1 - 35) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={weekNumber}
                    onChange={(e) => handleWeekSelectChange(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-xs"
                  >
                    {ALL_SCHOOL_WEEKS.map((w) => (
                      <option key={w.weekNumber} value={w.weekNumber}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">📅 Từ ngày (Thứ Hai)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 21/09/2026"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">📅 Đến ngày (Chủ Nhật)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 27/09/2026"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-3 text-[11px] text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                  📌 Báo cáo Tuần {weekNumber}: Khung thời gian từ <b>{startDate}</b> đến <b>{endDate}</b> (Năm học {APP_CONFIG.SCHOOL_YEAR})
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Tình hình chuyên cần & Tác phong:
                </label>
                <textarea
                  rows={2}
                  value={attendanceSummary}
                  onChange={(e) => setAttendanceSummary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none font-medium resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Tình hình học tập, nhiệm vụ & sản phẩm:
                </label>
                <textarea
                  rows={2}
                  value={academicSummary}
                  onChange={(e) => setAcademicSummary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none font-medium resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Thi đua, phát biểu & hoạt động:
                </label>
                <textarea
                  rows={2}
                  value={disciplineSummary}
                  onChange={(e) => setDisciplineSummary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none font-medium resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Tồn tại cần khắc phục:</label>
                <textarea
                  rows={2}
                  value={shortcomings}
                  onChange={(e) => setShortcomings(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none font-medium resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">5. Kiến nghị & Đề xuất với GVCN:</label>
                <textarea
                  rows={2}
                  value={proposals}
                  onChange={(e) => setProposals(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none font-medium resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingReport ? 'Lưu thay đổi báo cáo' : 'Lập báo cáo tuần'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa Báo Cáo */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Xác nhận xóa báo cáo Tuần {reportToDelete.weekNumber}?
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Báo cáo sẽ được chuyển an toàn vào Thùng rác
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-slate-700 space-y-2">
              <p>
                <strong>Thời gian:</strong> {reportToDelete.startDate} - {reportToDelete.endDate}
              </p>
              <p>
                <strong>Người lập:</strong> {reportToDelete.createdByName}
              </p>
              <p>
                <strong>Chuyên cần:</strong> {reportToDelete.attendanceSummary}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200 text-slate-500 flex items-center gap-1">
                <Info size={13} className="text-blue-500 shrink-0" />
                <span>Bạn có thể khôi phục lại bất kỳ lúc nào từ Thùng rác.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Xóa và chuyển vào Thùng rác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
