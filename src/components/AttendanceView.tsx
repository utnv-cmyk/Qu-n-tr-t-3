/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClipboardCheck,
  Calendar,
  UserCheck,
  Clock,
  UserX,
  Plus,
  Lock,
  CheckCircle2,
  Trash2,
  Edit3,
  RotateCcw,
  X,
  AlertTriangle,
  FileText,
  UserMinus,
  Sparkles,
  Info,
} from 'lucide-react';
import { AttendanceSession, AttendanceStatus, Member } from '../types';
import { isLeaderMember, isTeacherMember } from '../config';
import {
  ALL_SCHOOL_WEEKS,
  getSchoolWeekInfo,
  getWeekFromDate,
  TOTAL_SCHOOL_WEEKS,
  formatDateVN,
} from '../utils/schoolWeeks';

interface Props {
  attendanceSessions: AttendanceSession[];
  members: Member[];
  currentMember: Member;
  onSaveAttendance: (sessions: AttendanceSession[]) => void;
  onDeleteAttendanceSession?: (session: AttendanceSession) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const AttendanceView: React.FC<Props> = ({
  attendanceSessions,
  members,
  currentMember,
  onSaveAttendance,
  onDeleteAttendanceSession,
  onOpenTrash,
  trashCount = 0,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';

  // Filter week in history
  const [filterWeek, setFilterWeek] = useState<number | 'all'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null);

  // Form states
  const [date, setDate] = useState(() => {
    // Default to school week 3 (e.g. 2026-09-24)
    return '2026-09-24';
  });
  const [weekNumber, setWeekNumber] = useState<number>(() => getWeekFromDate('2026-09-24'));
  const [note, setNote] = useState('');
  const [recordedBy, setRecordedBy] = useState(`${currentMember.name} (Tổ trưởng)`);
  const [tempRecords, setTempRecords] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});

  // Khi thay đổi ngày: Tự động tính số tuần học chính xác (Tuần 1 - 35)
  // Ví dụ: 20/09/2026 -> Tuần 2; 21/09/2026 đến 27/09/2026 -> Tuần 3
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate) {
      const autoWeek = getWeekFromDate(newDate);
      setWeekNumber(autoWeek);
    }
  };

  // Khi chọn tuần học (1 - 35): Tự động gán ngày bắt đầu của tuần đó
  const handleWeekChange = (newWeek: number) => {
    const safeW = Math.max(1, Math.min(TOTAL_SCHOOL_WEEKS, newWeek));
    setWeekNumber(safeW);
    const info = getSchoolWeekInfo(safeW);
    // Nếu ngày hiện tại nằm ngoài tuần đã chọn, chuyển ngày sang Thứ Hai của tuần đó
    const curWeekOfDate = getWeekFromDate(date);
    if (curWeekOfDate !== safeW) {
      setDate(info.startDateISO);
    }
  };

  // Open modal for NEW roll call
  const handleStartRollCall = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền ghi nhận điểm danh!', 'warning');
      return;
    }
    const init: Record<string, { status: AttendanceStatus; note: string }> = {};
    members.forEach((m) => {
      init[m.id] = { status: 'present', note: '' };
    });

    const initDate = '2026-09-24';
    const initWeek = getWeekFromDate(initDate);

    setEditingSession(null);
    setTempRecords(init);
    setDate(initDate);
    setWeekNumber(initWeek);
    setNote('');
    setRecordedBy(`${currentMember.name} (Tổ trưởng)`);
    setIsModalOpen(true);
  };

  // Open modal for EDITING existing session
  const handleOpenEditSession = (session: AttendanceSession) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền chỉnh sửa buổi điểm danh!', 'warning');
      return;
    }

    const init: Record<string, { status: AttendanceStatus; note: string }> = {};

    // Map existing members from session records or fallback to present
    members.forEach((m) => {
      const found = session.records.find(
        (r) =>
          r.studentId === m.id ||
          r.studentName.toLowerCase().trim() === m.name.toLowerCase().trim()
      );
      init[m.id] = {
        status: found ? found.status : 'present',
        note: found?.note || '',
      };
    });

    // Also include any records in session that might have been for students no longer in members
    session.records.forEach((r) => {
      if (!init[r.studentId]) {
        init[r.studentId] = {
          status: r.status,
          note: r.note || '',
        };
      }
    });

    const detectedWeek = session.weekNumber || getWeekFromDate(session.date);

    setEditingSession(session);
    setTempRecords(init);
    setDate(session.date);
    setWeekNumber(detectedWeek);
    setNote(session.note || '');
    setRecordedBy(session.recordedBy || `${currentMember.name} (Tổ trưởng)`);
    setIsModalOpen(true);
  };

  // Quick action: Mark all as present
  const handleMarkAllPresent = () => {
    setTempRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        updated[k] = { ...updated[k], status: 'present' };
      });
      return updated;
    });
    showToast('Đã đánh dấu tất cả thành viên: Có mặt');
  };

  // Save roll call (New or Edit)
  const handleSaveRollCall = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới được lưu điểm danh!', 'error');
      return;
    }

    if (!date) {
      showToast('Vui lòng chọn ngày điểm danh!', 'warning');
      return;
    }

    const parsedWeek = Number(weekNumber) || 3;
    const finalNote = note.trim() || 'Điểm danh chuyên cần';
    const finalRecordedBy = recordedBy.trim() || `${currentMember.name} (Tổ trưởng)`;

    // Compile records matching the members list
    const compiledRecords = members.map((m) => ({
      studentId: m.id,
      studentName: m.name,
      status: tempRecords[m.id]?.status || 'present',
      note: tempRecords[m.id]?.note?.trim() || '',
    }));

    if (editingSession) {
      const updatedSessions = attendanceSessions.map((s) =>
        s.id === editingSession.id
          ? {
              ...s,
              date,
              weekNumber: parsedWeek,
              note: finalNote,
              recordedBy: finalRecordedBy,
              records: compiledRecords,
            }
          : s
      );
      onSaveAttendance(updatedSessions);
      showToast(`Đã cập nhật buổi điểm danh ngày ${date} (Tuần ${parsedWeek}) thành công!`);
    } else {
      const newSession: AttendanceSession = {
        id: 'att_' + Date.now(),
        date,
        weekNumber: parsedWeek,
        note: finalNote,
        recordedBy: finalRecordedBy,
        records: compiledRecords,
      };
      onSaveAttendance([newSession, ...attendanceSessions]);
      showToast(`Đã lưu bảng điểm danh ngày ${date} (Tuần ${parsedWeek}) thành công!`);
    }

    setIsModalOpen(false);
    setEditingSession(null);
  };

  // Delete session handler (Opens in-app confirmation modal)
  const handleInitiateDelete = (session: AttendanceSession) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền xóa dữ liệu điểm danh!', 'warning');
      return;
    }
    setSessionToDelete(session);
  };

  const handleConfirmDelete = () => {
    if (!sessionToDelete) return;

    if (onDeleteAttendanceSession) {
      onDeleteAttendanceSession(sessionToDelete);
    } else {
      onSaveAttendance(attendanceSessions.filter((s) => s.id !== sessionToDelete.id));
    }

    showToast(`Đã xóa buổi điểm danh ngày ${sessionToDelete.date} (Đã chuyển vào Thùng rác).`);
    setSessionToDelete(null);
  };

  // Status counters for the current modal form
  const modalPresentCount = members.filter(
    (m) => (tempRecords[m.id]?.status || 'present') === 'present'
  ).length;
  const modalLateCount = members.filter(
    (m) => tempRecords[m.id]?.status === 'late'
  ).length;
  const modalExcusedCount = members.filter(
    (m) => tempRecords[m.id]?.status === 'absent_excused'
  ).length;
  const modalUnexcusedCount = members.filter(
    (m) => tempRecords[m.id]?.status === 'absent_unexcused'
  ).length;

  // Filtered sessions by week
  const displayedSessions =
    filterWeek === 'all'
      ? attendanceSessions
      : attendanceSessions.filter((s) => s.weekNumber === filterWeek);

  // Overall Statistics across all sessions
  const totalSessions = attendanceSessions.length;
  let totalRecordsCount = 0;
  let totalPresentCount = 0;
  let totalLateCount = 0;
  let totalAbsentCount = 0;

  attendanceSessions.forEach((s) => {
    s.records.forEach((r) => {
      totalRecordsCount++;
      if (r.status === 'present') totalPresentCount++;
      else if (r.status === 'late') totalLateCount++;
      else if (r.status.startsWith('absent')) totalAbsentCount++;
    });
  });

  const attendanceRate = totalRecordsCount > 0
    ? Math.round((totalPresentCount / totalRecordsCount) * 100)
    : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="text-blue-600" size={24} />
              Quản lý Điểm danh & Chuyên cần
            </h2>
            {!isLeader && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                <Lock size={12} /> Chế độ xem (Thành viên)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi nề nếp chuyên cần, đi học đúng giờ và tác phong học tập của Tổ 3 - Lớp 11A1
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
              title="Xem và khôi phục các buổi điểm danh đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          <button
            onClick={handleStartRollCall}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isLeader
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-102 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={isLeader ? 'Bắt đầu điểm danh buổi học mới' : 'Chỉ Tổ trưởng mới có quyền điểm danh'}
          >
            {isLeader ? <Plus size={16} /> : <Lock size={14} />}
            <span>Điểm danh buổi mới</span>
            {!isLeader && <span className="text-[10px] text-amber-600 font-bold">(🔒 Chỉ TT)</span>}
          </button>
        </div>
      </div>

      {/* Summary Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng buổi điểm danh</span>
            <Calendar size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalSessions}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Lưu trữ trong hệ thống</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tỉ lệ chuyên cần</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{attendanceRate}%</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Tác phong chuyên cần tốt</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng lượt đi trễ</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{totalLateCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Được ghi nhận & nhắc nhở</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng lượt vắng</span>
            <UserX size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{totalAbsentCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Có phép & Không phép</span>
        </div>
      </div>

      {/* Lịch sử điểm danh các buổi gần đây */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>📋 Lịch sử các buổi điểm danh</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {displayedSessions.length} / {attendanceSessions.length} buổi
              </span>
            </h3>
            <span className="text-xs text-slate-500 hidden md:inline">
              (Năm học 2026 - 2027: Tuần 1 - 35)
            </span>
          </div>

          {/* Bộ lọc theo tuần học */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
              <Calendar size={14} className="text-blue-600" />
              <span>Lọc tuần:</span>
            </label>
            <select
              value={filterWeek}
              onChange={(e) => {
                const val = e.target.value;
                setFilterWeek(val === 'all' ? 'all' : Number(val));
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="all">Tất cả các tuần (Tuần 1 - 35)</option>
              {ALL_SCHOOL_WEEKS.map((w) => (
                <option key={w.weekNumber} value={w.weekNumber}>
                  Tuần {w.weekNumber} ({w.startDate} - {w.endDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        {displayedSessions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
            <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">
              {filterWeek === 'all'
                ? 'Chưa có bản ghi điểm danh nào'
                : `Không có buổi điểm danh nào trong Tuần ${filterWeek}`}
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {filterWeek === 'all'
                ? 'Nhấn vào nút "Điểm danh buổi mới" ở trên để bắt đầu ghi nhận chuyên cần cho Tổ 3.'
                : 'Bạn có thể chọn "Tất cả các tuần" hoặc nhấn "Điểm danh buổi mới" để ghi nhận.'}
            </p>
            {isLeader && (
              <button
                onClick={handleStartRollCall}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer"
              >
                <Plus size={16} /> Bắt đầu điểm danh ngay
              </button>
            )}
          </div>
        ) : (
          displayedSessions.map((session) => {
            // Count for this session
            const present = session.records.filter((r) => r.status === 'present').length;
            const late = session.records.filter((r) => r.status === 'late').length;
            const excused = session.records.filter((r) => r.status === 'absent_excused').length;
            const unexcused = session.records.filter((r) => r.status === 'absent_unexcused').length;

            const sessionWeekInfo = getSchoolWeekInfo(session.weekNumber);
            const formattedDateVN = session.date.includes('-')
              ? session.date.split('-').reverse().join('/')
              : session.date;

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                        📅 Ngày {formattedDateVN}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                        Tuần {session.weekNumber} ({sessionWeekInfo.startDate} - {sessionWeekInfo.endDate})
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        • {session.note}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Người ghi nhận: <span className="font-semibold text-slate-600">{session.recordedBy}</span>
                    </p>
                  </div>

                  {/* Actions & Mini stats */}
                  <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                    {/* Counters Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                      <span className="text-emerald-700" title="Có mặt">✅ {present}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-700" title="Đi trễ">⏰ {late}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-blue-700" title="Nghỉ có phép">📝 {excused}</span>
                      {unexcused > 0 && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span className="text-rose-700" title="Vắng không phép">❌ {unexcused}</span>
                        </>
                      )}
                    </div>

                    {/* Sửa và Xóa buttons */}
                    {isLeader ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSession(session)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border border-blue-200 shadow-2xs cursor-pointer"
                          title="Chỉnh sửa buổi điểm danh ngày này"
                        >
                          <Edit3 size={14} className="text-blue-600" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInitiateDelete(session)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border border-rose-200 shadow-2xs cursor-pointer"
                          title="Xóa lượt điểm danh này (Chuyển vào Thùng rác)"
                        >
                          <Trash2 size={14} className="text-rose-600" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        (🔒 Chỉ Tổ trưởng mới có quyền sửa/xóa)
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid of Student Attendance Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {session.records.map((r) => {
                    let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    let label = 'Có mặt';

                    if (r.status === 'late') {
                      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                      label = 'Đi trễ';
                    } else if (r.status === 'absent_excused') {
                      badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200';
                      label = 'Nghỉ có phép';
                    } else if (r.status === 'absent_unexcused') {
                      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200';
                      label = 'Vắng K.phép';
                    }

                    return (
                      <div
                        key={r.studentId}
                        className={`p-2.5 rounded-xl border text-center transition-all ${badgeStyle}`}
                      >
                        <p className="text-xs font-bold truncate" title={r.studentName}>
                          {r.studentName}
                        </p>
                        <div className="mt-1 flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wide">
                            {label}
                          </span>
                          {r.note && (
                            <span
                              className="text-[10px] text-slate-600 font-medium truncate max-w-full block bg-white/70 px-1.5 py-0.5 rounded"
                              title={r.note}
                            >
                              💬 {r.note}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CHỈNH SỬA HOẶC TẠO MỚI BUỔI ĐIỂM DANH */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  {editingSession ? <Edit3 size={18} /> : <Calendar size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingSession
                      ? `✏️ Chỉnh Sửa Buổi Điểm Danh: Ngày ${date} (Tuần ${weekNumber})`
                      : '✨ Ghi Nhận Buổi Điểm Danh Mới'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {editingSession
                      ? 'Cập nhật lại trạng thái điểm danh và lý do nghỉ/trễ cho từng học sinh'
                      : 'Điểm danh chuyên cần, đúng giờ và tác phong nề nếp của Tổ 3'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSession(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveRollCall} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Meta Fields: Ngày, Tuần, Người ghi nhận */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      📅 Ngày điểm danh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🏷️ Tuần học (Tuần 1 - 35) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={weekNumber}
                      onChange={(e) => handleWeekChange(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                    >
                      {ALL_SCHOOL_WEEKS.map((w) => (
                        <option key={w.weekNumber} value={w.weekNumber}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      👤 Người ghi nhận
                    </label>
                    <input
                      type="text"
                      required
                      value={recordedBy}
                      onChange={(e) => setRecordedBy(e.target.value)}
                      placeholder="Họ tên (Tổ trưởng)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* Thông tin dải ngày của Tuần học theo quy định */}
                  {(() => {
                    const info = getSchoolWeekInfo(weekNumber);
                    const formattedChosenDate = date
                      ? date.includes('-')
                        ? date.split('-').reverse().join('/')
                        : date
                      : '';
                    return (
                      <div className="sm:col-span-3 text-xs bg-blue-50/90 border border-blue-200/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-blue-900">
                          <Calendar size={16} className="text-blue-600 shrink-0" />
                          <span>
                            Khung tuần học:{' '}
                            <span className="text-blue-800 underline decoration-blue-400">
                              Tuần {weekNumber} ({info.startDate} – {info.endDate})
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                          <span className="bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">
                            Ngày điểm danh: {formattedChosenDate}
                          </span>
                          <span>(Tự động tính đúng Tuần 1 - 35)</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      📝 Nội dung / Ghi chú buổi học
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ví dụ: Thứ Hai đầu tuần - Chào cờ đầy đủ tác phong, hoặc Tiết 1 Sinh hoạt lớp..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Quick actions & Live counters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                      <Sparkles size={14} className="text-blue-600" /> Thống kê trực tiếp:
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                      Có mặt: {modalPresentCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                      Đi trễ: {modalLateCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                      Có phép: {modalExcusedCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                      K.phép: {modalUnexcusedCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Chọn tất cả Có mặt</span>
                  </button>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Danh sách học sinh Tổ 3 ({members.length} thành viên)
                  </h4>

                  <div className="space-y-2.5">
                    {members.map((m) => {
                      const record = tempRecords[m.id] || { status: 'present', note: '' };
                      const currentStatus = record.status;

                      return (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors"
                        >
                          {/* Student Info */}
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 shadow-2xs shrink-0"
                            />
                            <div>
                              <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {isTeacherMember(m) ? (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                    GVCN
                                  </span>
                                ) : isLeaderMember(m) ? (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                                    Tổ trưởng
                                  </span>
                                ) : null}
                              </h5>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {m.groupName}
                              </p>
                            </div>
                          </div>

                          {/* 4 Status Toggle Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Có mặt */}
                            <button
                              type="button"
                              onClick={() =>
                                setTempRecords((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], status: 'present' },
                                }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs scale-102'
                                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <UserCheck size={14} /> Có mặt
                            </button>

                            {/* Đi trễ */}
                            <button
                              type="button"
                              onClick={() =>
                                setTempRecords((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], status: 'late' },
                                }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                currentStatus === 'late'
                                  ? 'bg-amber-600 text-white shadow-xs scale-102'
                                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <Clock size={14} /> Đi trễ
                            </button>

                            {/* Nghỉ có phép */}
                            <button
                              type="button"
                              onClick={() =>
                                setTempRecords((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], status: 'absent_excused' },
                                }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                currentStatus === 'absent_excused'
                                  ? 'bg-blue-600 text-white shadow-xs scale-102'
                                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <UserMinus size={14} /> Có phép
                            </button>

                            {/* Vắng không phép */}
                            <button
                              type="button"
                              onClick={() =>
                                setTempRecords((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], status: 'absent_unexcused' },
                                }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                currentStatus === 'absent_unexcused'
                                  ? 'bg-rose-600 text-white shadow-xs scale-102'
                                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              <UserX size={14} /> K.Phép
                            </button>
                          </div>

                          {/* Student Note / Lý do input */}
                          <div className="w-full md:w-56 shrink-0">
                            <input
                              type="text"
                              placeholder="Lý do / Ghi chú (VD: Cảm sốt, kẹt xe...)"
                              value={record.note}
                              onChange={(e) =>
                                setTempRecords((prev) => ({
                                  ...prev,
                                  [m.id]: { ...prev[m.id], note: e.target.value },
                                }))
                              }
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSession(null);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {editingSession
                      ? 'Lưu thay đổi buổi điểm danh'
                      : 'Lưu bảng điểm danh mới'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XÁC NHẬN XÓA BUỔI ĐIỂM DANH (AN TOÀN - CHUYỂN VÀO THÙNG RÁC) */}
      {/* ========================================================================= */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Xác nhận xóa buổi điểm danh?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu sẽ được chuyển an toàn vào Thùng rác
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-2">
              <p>
                <strong>Ngày:</strong> {sessionToDelete.date} (Tuần {sessionToDelete.weekNumber})
              </p>
              <p>
                <strong>Ghi chú:</strong> {sessionToDelete.note}
              </p>
              <p>
                <strong>Người ghi nhận:</strong> {sessionToDelete.recordedBy}
              </p>
              <p>
                <strong>Sĩ số ghi nhận:</strong> {sessionToDelete.records.length} học sinh
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200 text-slate-500 flex items-center gap-1">
                <Info size={13} className="text-blue-500 shrink-0" />
                <span>Bạn có thể khôi phục lại bất kỳ lúc nào từ Thùng rác.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
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
