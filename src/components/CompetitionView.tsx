import React, { useState, useEffect } from 'react';
import {
  Trophy,
  PlusCircle,
  MinusCircle,
  Lock,
  History,
  Trash2,
  Medal,
  Award,
  Sparkles,
  AlertCircle,
  FileCheck,
  Edit3,
  X,
  RotateCcw,
  Save,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { CompetitionRecord, Member } from '../types';
import { PREDEFINED_CRITERIA, getTeamLeaderMember, getMemberDisplayRole } from '../config';
import {
  ALL_SCHOOL_WEEKS,
  getSchoolWeekInfo,
  getWeekFromDate,
  TOTAL_SCHOOL_WEEKS,
} from '../utils/schoolWeeks';
import {
  formatScore,
  formatScoreWithoutSign,
  parseScore,
} from '../utils/scoreUtils';

interface Props {
  members: Member[];
  competitionRecords: CompetitionRecord[];
  currentMember: Member;
  onUpdateCompetition: (records: CompetitionRecord[], updatedMembers: Member[]) => void;
  onDeleteCompetitionRecord?: (record: CompetitionRecord, updatedMembers: Member[]) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onSwitchUser?: (memberId: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const CompetitionView: React.FC<Props> = ({
  members,
  competitionRecords,
  currentMember,
  onUpdateCompetition,
  onDeleteCompetitionRecord,
  onOpenTrash,
  trashCount = 0,
  onSwitchUser,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';

  // Mode ghi nhận: 'record' (Ghi nhận tiêu chí) | 'direct' (Điều chỉnh trực tiếp điểm học sinh)
  const [activeMode, setActiveMode] = useState<'record' | 'direct'>('record');

  // State ghi điểm mới (Chỉ TT)
  const [selectedStudentId, setSelectedStudentId] = useState(members[0]?.id || '');
  const [recordType, setRecordType] = useState<'plus' | 'minus'>('plus');
  const [pointAmount, setPointAmount] = useState<number>(0.25);
  const [pointAmountInput, setPointAmountInput] = useState<string>('0.25');
  const [selectedCriteriaId, setSelectedCriteriaId] = useState(
    PREDEFINED_CRITERIA.find((c) => c.type === 'plus')?.id || PREDEFINED_CRITERIA[0].id
  );
  const [customNote, setCustomNote] = useState('');

  // State điều chỉnh trực tiếp điểm học sinh
  const [directPlusPoints, setDirectPlusPoints] = useState<number>(0);
  const [directMinusPoints, setDirectMinusPoints] = useState<number>(0);
  const [directReason, setDirectReason] = useState<string>('');

  // Khi đổi học sinh, đồng bộ điểm điều chỉnh trực tiếp
  useEffect(() => {
    const student = members.find((m) => m.id === selectedStudentId);
    if (student) {
      setDirectPlusPoints(student.plusPoints);
      setDirectMinusPoints(student.minusPoints);
    }
  }, [selectedStudentId, members]);

  // State sửa lượt ghi nhận
  const [editingRecord, setEditingRecord] = useState<CompetitionRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<CompetitionRecord | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editPoints, setEditPoints] = useState<number>(0.25);
  const [editPointsInput, setEditPointsInput] = useState<string>('0.25');
  const [editType, setEditType] = useState<'plus' | 'minus'>('plus');
  const [editWeek, setEditWeek] = useState<number>(3);

  // Bộ chọn Tuần theo dõi thi đua (1 - 35 hoặc 'all')
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>(3);
  // Tuần ghi nhận khi cộng/trừ điểm (1 - 35)
  const [recordWeek, setRecordWeek] = useState<number>(3);

  // Thống kê điểm thi đua theo tuần được chọn (hoặc lũy kế cả kỳ)
  const memberWeekStats = React.useMemo(() => {
    const stats: Record<
      string,
      { plus: number; minus: number; net: number; weekRecordCount: number }
    > = {};

    members.forEach((m) => {
      if (selectedWeek === 'all') {
        stats[m.id] = {
          plus: m.plusPoints,
          minus: m.minusPoints,
          net: m.netPoints,
          weekRecordCount: competitionRecords.filter(
            (r) =>
              r.studentId === m.id ||
              (r.studentName && r.studentName.trim().toLowerCase() === m.name.trim().toLowerCase())
          ).length,
        };
      } else {
        const studentWeekRecords = competitionRecords.filter(
          (r) =>
            (r.studentId === m.id ||
              (r.studentName &&
                r.studentName.trim().toLowerCase() === m.name.trim().toLowerCase())) &&
            ((r.weekNumber || getWeekFromDate(r.createdAt)) === selectedWeek)
        );
        const plus = studentWeekRecords
          .filter((r) => r.type === 'plus')
          .reduce((sum, r) => sum + Math.abs(r.points), 0);
        const minus = studentWeekRecords
          .filter((r) => r.type === 'minus')
          .reduce((sum, r) => sum + Math.abs(r.points), 0);
        const roundedPlus = Math.round(plus * 100) / 100;
        const roundedMinus = Math.round(minus * 100) / 100;
        const net = Math.round((roundedPlus - roundedMinus) * 100) / 100;
        stats[m.id] = {
          plus: roundedPlus,
          minus: roundedMinus,
          net: net,
          weekRecordCount: studentWeekRecords.length,
        };
      }
    });

    return stats;
  }, [members, competitionRecords, selectedWeek]);

  // Tổng điểm tổ theo tuần được chọn
  const totalGroupPoints = React.useMemo(() => {
    return Object.values(memberWeekStats).reduce((sum, s) => sum + s.net, 0);
  }, [memberWeekStats]);

  // Tổng điểm cộng của tuần được chọn
  const totalWeekPlus = React.useMemo(() => {
    const sum = Object.values(memberWeekStats).reduce((acc, s) => acc + s.plus, 0);
    return Math.round(sum * 100) / 100;
  }, [memberWeekStats]);

  // Tổng điểm trừ của tuần được chọn
  const totalWeekMinus = React.useMemo(() => {
    const sum = Object.values(memberWeekStats).reduce((acc, s) => acc + s.minus, 0);
    return Math.round(sum * 100) / 100;
  }, [memberWeekStats]);

  // Sắp xếp bảng xếp hạng thi đua theo điểm tuần được chọn
  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const netA = memberWeekStats[a.id]?.net ?? 0;
      const netB = memberWeekStats[b.id]?.net ?? 0;
      if (netB !== netA) return netB - netA;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [members, memberWeekStats]);

  // Học sinh đứng đầu tuần
  const topWeekMember = sortedMembers[0];

  // Danh sách lượt ghi nhận theo tuần đã chọn
  const filteredRecords = React.useMemo(() => {
    if (selectedWeek === 'all') return competitionRecords;
    return competitionRecords.filter(
      (r) => (r.weekNumber || getWeekFromDate(r.createdAt)) === selectedWeek
    );
  }, [competitionRecords, selectedWeek]);

  // Điều hướng chạy theo tuần
  const handleSelectWeek = (w: number | 'all') => {
    setSelectedWeek(w);
    if (w !== 'all') {
      setRecordWeek(w);
    }
  };

  const handlePrevWeek = () => {
    if (selectedWeek === 'all') {
      setSelectedWeek(TOTAL_SCHOOL_WEEKS);
      setRecordWeek(TOTAL_SCHOOL_WEEKS);
    } else if (selectedWeek > 1) {
      const prev = selectedWeek - 1;
      setSelectedWeek(prev);
      setRecordWeek(prev);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek === 'all') {
      setSelectedWeek(1);
      setRecordWeek(1);
    } else if (selectedWeek < TOTAL_SCHOOL_WEEKS) {
      const next = selectedWeek + 1;
      setSelectedWeek(next);
      setRecordWeek(next);
    }
  };

  const selectedStudent = members.find((m) => m.id === selectedStudentId) || members[0];

  const handleTypeChange = (type: 'plus' | 'minus') => {
    setRecordType(type);
    const matching = PREDEFINED_CRITERIA.filter((c) => c.type === type);
    if (matching.length > 0 && !matching.some((c) => c.id === selectedCriteriaId)) {
      setSelectedCriteriaId(matching[0].id);
    }
  };

  // Nút LƯU THAY ĐỔI chính cho phần Ghi nhận Điểm Thi Đua (Toàn quyền Tổ trưởng)
  const handleSaveCompetition = () => {
    if (!isLeader) {
      showToast(
        'Chỉ Tổ trưởng mới có quyền lưu thay đổi điểm thi đua! Vui lòng chuyển sang tài khoản Tổ trưởng.',
        'error'
      );
      return;
    }

    const student = members.find((m) => m.id === selectedStudentId);
    if (!student) {
      showToast('Vui lòng chọn học sinh!', 'warning');
      return;
    }

    if (activeMode === 'record') {
      const criteria = PREDEFINED_CRITERIA.find((c) => c.id === selectedCriteriaId);
      const points = Math.abs(pointAmount) || 0.25;
      const signedPoints = recordType === 'plus' ? points : -points;
      const reasonText = criteria && selectedCriteriaId !== 'custom'
        ? `${criteria.label}${customNote ? ' (' + customNote.trim() + ')' : ''}`
        : customNote.trim() || (recordType === 'plus' ? 'Khen thưởng thi đua' : 'Ghi nhận vi phạm');

      const newRecord: CompetitionRecord = {
        id: 'comp_' + Date.now(),
        studentId: student.id,
        studentName: student.name,
        points: signedPoints,
        type: recordType,
        reason: reasonText,
        recordedBy: currentMember.name + ' (Tổ trưởng)',
        createdAt: new Date().toLocaleString('vi-VN'),
        weekNumber: recordWeek,
      };

      const updatedMembers = members.map((m) => {
        if (m.id === student.id) {
          const newPlus = recordType === 'plus' ? m.plusPoints + points : m.plusPoints;
          const newMinus = recordType === 'minus' ? m.minusPoints + points : m.minusPoints;
          const newNet = newPlus - newMinus;
          return {
            ...m,
            plusPoints: parseFloat(newPlus.toFixed(2)),
            minusPoints: parseFloat(newMinus.toFixed(2)),
            netPoints: parseFloat(newNet.toFixed(2)),
          };
        }
        return m;
      });

      onUpdateCompetition([newRecord, ...competitionRecords], updatedMembers);
      showToast(
        `Đã lưu thay đổi: ${formatScore(signedPoints)} cho "${student.name}"!`,
        'success'
      );
      setCustomNote('');
    } else {
      // Chế độ điều chỉnh trực tiếp điểm số
      const newPlus = Math.max(0, directPlusPoints);
      const newMinus = Math.max(0, directMinusPoints);
      const newNet = parseFloat((newPlus - newMinus).toFixed(2));
      const pDiff = parseFloat((newPlus - student.plusPoints).toFixed(2));
      const mDiff = parseFloat((newMinus - student.minusPoints).toFixed(2));

      if (pDiff === 0 && mDiff === 0) {
        showToast('Điểm số không có thay đổi so với hiện tại.', 'warning');
        return;
      }

      const newRecords: CompetitionRecord[] = [];
      if (pDiff !== 0) {
        newRecords.push({
          id: 'comp_' + Date.now() + '_p',
          studentId: student.id,
          studentName: student.name,
          points: pDiff,
          type: pDiff >= 0 ? 'plus' : 'minus',
          reason: directReason.trim()
            ? `Điều chỉnh điểm cộng: ${directReason.trim()}`
            : `Tổ trưởng điều chỉnh điểm cộng tích lũy (${formatScore(pDiff)})`,
          recordedBy: currentMember.name + ' (Tổ trưởng)',
          createdAt: new Date().toLocaleString('vi-VN'),
          weekNumber: recordWeek,
        });
      }

      if (mDiff !== 0) {
        newRecords.push({
          id: 'comp_' + Date.now() + '_m',
          studentId: student.id,
          studentName: student.name,
          points: mDiff,
          type: 'minus',
          reason: directReason.trim()
            ? `Điều chỉnh điểm trừ: ${directReason.trim()}`
            : `Tổ trưởng điều chỉnh điểm trừ tích lũy (${formatScore(-Math.abs(mDiff))})`,
          recordedBy: currentMember.name + ' (Tổ trưởng)',
          createdAt: new Date().toLocaleString('vi-VN'),
          weekNumber: recordWeek,
        });
      }

      const updatedMembers = members.map((m) => {
        if (m.id === student.id) {
          return {
            ...m,
            plusPoints: parseFloat(newPlus.toFixed(2)),
            minusPoints: parseFloat(newMinus.toFixed(2)),
            netPoints: newNet,
          };
        }
        return m;
      });

      onUpdateCompetition([...newRecords, ...competitionRecords], updatedMembers);
      showToast(`Đã lưu thay đổi điểm học sinh "${student.name}" thành công!`, 'success');
      setDirectReason('');
    }
  };

  const handleRecordPoint = (type: 'plus' | 'minus') => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới được ghi nhận điểm thi đua!', 'error');
      return;
    }

    const student = members.find((m) => m.id === selectedStudentId);
    if (!student) {
      showToast('Vui lòng chọn học sinh!', 'warning');
      return;
    }

    const criteria = PREDEFINED_CRITERIA.find((c) => c.id === selectedCriteriaId);
    const pointValue = type === 'plus' ? 0.25 : -0.25;
    const reasonText = criteria
      ? `${criteria.label}${customNote ? ' (' + customNote.trim() + ')' : ''}`
      : customNote.trim() || (type === 'plus' ? 'Khen thưởng thi đua' : 'Ghi nhận vi phạm');

    const newRecord: CompetitionRecord = {
      id: 'comp_' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      points: pointValue,
      type: type,
      reason: reasonText,
      recordedBy: currentMember.name + ' (Tổ trưởng)',
      createdAt: new Date().toLocaleString('vi-VN'),
      weekNumber: recordWeek,
    };

    // Cập nhật điểm thành viên tương ứng
    const updatedMembers = members.map((m) => {
      if (m.id === student.id) {
        const newPlus = type === 'plus' ? m.plusPoints + 0.25 : m.plusPoints;
        const newMinus = type === 'minus' ? m.minusPoints + 0.25 : m.minusPoints;
        const newNet = newPlus - newMinus;
        return {
          ...m,
          plusPoints: parseFloat(newPlus.toFixed(2)),
          minusPoints: parseFloat(newMinus.toFixed(2)),
          netPoints: parseFloat(newNet.toFixed(2)),
        };
      }
      return m;
    });

    onUpdateCompetition([newRecord, ...competitionRecords], updatedMembers);
    showToast(`Đã lưu thay đổi: ${formatScore(pointValue)} cho ${student.name}`, 'success');
    setCustomNote('');
  };

  const handleDeleteRecord = (record: CompetitionRecord) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền xóa lượt ghi nhận!', 'error');
      return;
    }
    setRecordToDelete(record);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền xóa lượt ghi nhận!', 'error');
      setRecordToDelete(null);
      return;
    }

    const record = recordToDelete;
    // Hoàn tác điểm
    const updatedMembers = members.map((m) => {
      const isMatch =
        m.id === record.studentId ||
        (record.studentName &&
          m.name.trim().toLowerCase() === record.studentName.trim().toLowerCase());
      if (isMatch) {
        const newPlus = record.type === 'plus' ? Math.max(0, m.plusPoints - Math.abs(record.points)) : m.plusPoints;
        const newMinus = record.type === 'minus' ? Math.max(0, m.minusPoints - Math.abs(record.points)) : m.minusPoints;
        const newNet = newPlus - newMinus;
        return {
          ...m,
          plusPoints: parseFloat(newPlus.toFixed(2)),
          minusPoints: parseFloat(newMinus.toFixed(2)),
          netPoints: parseFloat(newNet.toFixed(2)),
        };
      }
      return m;
    });

    if (onDeleteCompetitionRecord) {
      onDeleteCompetitionRecord(record, updatedMembers);
    } else {
      const updatedRecords = competitionRecords.filter((r) => r.id !== record.id);
      onUpdateCompetition(updatedRecords, updatedMembers);
    }

    showToast(`Đã xóa lượt ghi sai "${record.reason}" của ${record.studentName} và hoàn tác điểm thành công (Đã chuyển vào Thùng rác).`, 'success');
    setRecordToDelete(null);
    if (editingRecord?.id === record.id) {
      setEditingRecord(null);
    }
  };

  const handleOpenEditRecord = (record: CompetitionRecord) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền sửa lượt ghi nhận!', 'warning');
      return;
    }
    const absPts = Math.abs(record.points);
    setEditingRecord(record);
    setEditReason(record.reason);
    setEditPoints(absPts);
    setEditPointsInput(absPts.toString());
    setEditType(record.type);
    setEditWeek(record.weekNumber || getWeekFromDate(record.createdAt) || 3);
  };

  const handleSaveEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!editReason.trim()) {
      showToast('Vui lòng nhập nội dung lý do!', 'warning');
      return;
    }

    const diffPoints = editPoints;
    const signedDiff = editType === 'plus' ? diffPoints : -diffPoints;

    // Recalculate member points: first revert old, then apply new
    const updatedMembers = members.map((m) => {
      const isMatch =
        m.id === editingRecord.studentId ||
        (editingRecord.studentName &&
          m.name.trim().toLowerCase() === editingRecord.studentName.trim().toLowerCase());
      if (isMatch) {
        let pPlus = editingRecord.type === 'plus' ? Math.max(0, m.plusPoints - Math.abs(editingRecord.points)) : m.plusPoints;
        let pMinus = editingRecord.type === 'minus' ? Math.max(0, m.minusPoints - Math.abs(editingRecord.points)) : m.minusPoints;
        pPlus = editType === 'plus' ? pPlus + diffPoints : pPlus;
        pMinus = editType === 'minus' ? pMinus + diffPoints : pMinus;
        const pNet = pPlus - pMinus;
        return {
          ...m,
          plusPoints: parseFloat(pPlus.toFixed(2)),
          minusPoints: parseFloat(pMinus.toFixed(2)),
          netPoints: parseFloat(pNet.toFixed(2)),
        };
      }
      return m;
    });

    const updatedRecords = competitionRecords.map((r) =>
      r.id === editingRecord.id
        ? {
            ...r,
            reason: editReason.trim(),
            points: signedDiff,
            type: editType,
            weekNumber: editWeek,
          }
        : r
    );

    onUpdateCompetition(updatedRecords, updatedMembers);
    showToast('Đã cập nhật lượt ghi nhận thi đua thành công!');
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Week Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900">🏆 Quản lý Thi đua & Khen thưởng</h2>
            {!isLeader && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                <Lock size={12} /> Chế độ xem (Thành viên)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi và ghi nhận thi đua chạy theo tuần học • Quy định chuẩn ±0.25đ / lượt
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Week Selector */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3.5 py-2 rounded-2xl border border-blue-200 shadow-2xs">
            <Calendar size={18} className="text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] text-blue-700 font-extrabold uppercase block tracking-wider">
                Theo dõi theo tuần
              </span>
              <select
                value={selectedWeek}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setSelectedWeek(val);
                  if (val !== 'all') {
                    setRecordWeek(val);
                  }
                }}
                className="bg-transparent font-black text-xs text-blue-950 outline-none cursor-pointer pr-1"
                title="Chọn tuần học để xem số liệu đồng nhất"
              >
                <option value="all">🌟 Toàn bộ học kỳ (Lũy kế 35 tuần)</option>
                {Array.from({ length: TOTAL_SCHOOL_WEEKS }, (_, i) => i + 1).map((w) => {
                  const info = getSchoolWeekInfo(w);
                  return (
                    <option key={w} value={w}>
                      Tuần {w} ({info.startDate} - {info.endDate}) {w === 3 ? '• Hiện tại' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
              title="Xem và khôi phục các lượt ghi nhận đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-amber-900">
            <Trophy size={20} className="text-amber-600" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 block">
                {selectedWeek === 'all' ? 'Tổng điểm lũy kế' : `Tổng điểm Tuần ${selectedWeek}`}
              </span>
              <span className="text-base font-black">
                {formatScore(totalGroupPoints)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leader's Point Recorder (Section XXI - Chỉ Tổ Trưởng) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h3 className="text-base font-extrabold text-slate-900">
                Ghi nhận Điểm Thi Đua (Toàn quyền Tổ trưởng)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn quyền ghi nhận điểm cộng/trừ và điều chỉnh trực tiếp điểm thi đua của các thành viên.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isLeader ? (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveMode('record')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeMode === 'record'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ghi nhận theo tiêu chí
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('direct')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeMode === 'direct'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Điều chỉnh trực tiếp điểm số
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <Lock size={13} /> Chế độ xem: Chỉ Tổ trưởng mới có quyền ghi nhận & lưu điểm
                </span>
                {onSwitchUser && (
                  <button
                    type="button"
                    onClick={() => {
                      const leader = getTeamLeaderMember(members) || members[0];
                      if (leader) onSwitchUser(leader.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title="Chuyển sang quyền Tổ trưởng để ghi nhận và lưu thay đổi điểm"
                  >
                    👑 Chuyển sang quyền Tổ trưởng
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thẻ thông tin học sinh được chọn */}
        {selectedStudent && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-3">
              <img
                src={selectedStudent.avatar}
                alt={selectedStudent.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{selectedStudent.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {selectedStudent.groupName}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {getMemberDisplayRole(selectedStudent, 'with_icon')} • {selectedStudent.groupName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {selectedWeek === 'all' ? 'Tổng cộng: ' : `Cộng T${selectedWeek}: `}
                {formatScore(memberWeekStats[selectedStudent.id]?.plus ?? 0)}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                {selectedWeek === 'all' ? 'Tổng trừ: ' : `Trừ T${selectedWeek}: `}
                {formatScore(-Math.abs(memberWeekStats[selectedStudent.id]?.minus ?? 0))}
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-black">
                {selectedWeek === 'all' ? 'Tổng kết kỳ: ' : `Tổng kết T${selectedWeek}: `}
                {formatScore(memberWeekStats[selectedStudent.id]?.net ?? 0)}
              </span>
              {selectedWeek !== 'all' && (
                <span className="text-[11px] text-slate-500 font-semibold pl-1">
                  (Lũy kế cả kỳ: <b>{formatScore(selectedStudent.netPoints)}</b>)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Form Mode 1: Ghi nhận theo tiêu chí */}
        {activeMode === 'record' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Áp dụng cho Tuần
                </label>
                <select
                  disabled={!isLeader}
                  value={recordWeek}
                  onChange={(e) => setRecordWeek(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-900 outline-none focus:bg-white focus:border-blue-500"
                >
                  {Array.from({ length: TOTAL_SCHOOL_WEEKS }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Tuần {w} {w === 3 ? '(Hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1. Chọn học sinh
                </label>
                <select
                  disabled={!isLeader}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:bg-white focus:border-blue-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatScore(memberWeekStats[m.id]?.net ?? m.netPoints)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  2. Loại ghi nhận
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={!isLeader}
                    onClick={() => handleTypeChange('plus')}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                      recordType === 'plus'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle size={14} /> + Cộng
                  </button>
                  <button
                    type="button"
                    disabled={!isLeader}
                    onClick={() => handleTypeChange('minus')}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border transition-all ${
                      recordType === 'minus'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MinusCircle size={14} /> - Trừ
                  </button>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  3. Mức điểm (chuẩn ±0.25đ)
                </label>
                <div className="flex items-center gap-1 flex-wrap">
                  {[0.25, 0.5, 0.75, 1.0, 1.25].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={!isLeader}
                      onClick={() => {
                        setPointAmount(amt);
                        setPointAmountInput(amt.toString());
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        pointAmount === amt
                          ? recordType === 'plus'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-extrabold shadow-2xs'
                            : 'bg-rose-100 text-rose-900 border-rose-400 font-extrabold shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {formatScoreWithoutSign(amt)}
                    </button>
                  ))}
                  <input
                    type="text"
                    disabled={!isLeader}
                    value={pointAmountInput}
                    onChange={(e) => {
                      setPointAmountInput(e.target.value);
                      const parsed = parseScore(e.target.value, { defaultValue: 0.25, min: 0.25, max: 10 });
                      setPointAmount(parsed);
                    }}
                    onBlur={() => {
                      const parsed = parseScore(pointAmountInput, { defaultValue: 0.25, min: 0.25, max: 10, roundToQuarter: true });
                      setPointAmount(parsed);
                      setPointAmountInput(parsed.toString());
                    }}
                    className="w-14 px-1.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none text-center"
                    placeholder="0.25"
                    title="Nhập số điểm (hỗ trợ cả 0,25 và 0.25)"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  4. Tiêu chí chuẩn của tổ
                </label>
                <select
                  disabled={!isLeader}
                  value={selectedCriteriaId}
                  onChange={(e) => setSelectedCriteriaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:bg-white focus:border-blue-500"
                >
                  {PREDEFINED_CRITERIA.filter((c) => c.type === recordType).map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatScore(c.type === 'plus' ? Math.abs(c.points) : -Math.abs(c.points))} — {c.label} ({c.description})
                    </option>
                  ))}
                  <option value="custom">✏️ Khác / Nhập lý do tùy chỉnh vào ô ghi chú</option>
                </select>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  5. Ghi chú chi tiết thêm
                </label>
                <input
                  disabled={!isLeader}
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="VD: Tiết Hóa ngày 24/09, phát biểu giải phương trình Benzen..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            {/* Hàng nút hành động: NÚT LƯU THAY ĐỔI nổi bật */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {selectedStudent && (
                  <span>
                    Dự kiến sau khi lưu:{' '}
                    <strong className="text-slate-800">
                      {selectedStudent.name}:{' '}
                      {formatScore(
                        recordType === 'plus'
                          ? selectedStudent.netPoints + pointAmount
                          : selectedStudent.netPoints - pointAmount
                      )}{' '}
                      <span className={recordType === 'plus' ? 'text-emerald-600' : 'text-rose-600'}>
                        {recordType === 'plus'
                          ? `(Tăng ${formatScore(pointAmount)})`
                          : `(Giảm ${formatScore(-Math.abs(pointAmount))})`}
                      </span>
                    </strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isLeader}
                  onClick={() => handleRecordPoint('plus')}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all flex items-center gap-1 shadow-2xs"
                  title="Ghi nhận nhanh +0.25đ"
                >
                  <PlusCircle size={14} /> +0.25đ Nhanh
                </button>

                <button
                  type="button"
                  disabled={!isLeader}
                  onClick={() => handleRecordPoint('minus')}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1 shadow-2xs"
                  title="Ghi nhận nhanh -0.25đ"
                >
                  <MinusCircle size={14} /> -0.25đ Nhanh
                </button>

                <button
                  type="button"
                  onClick={handleSaveCompetition}
                  className={`px-7 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isLeader
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white hover:scale-102 active:scale-98 shadow-blue-500/25 cursor-pointer'
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-300 cursor-pointer'
                  }`}
                  title="Lưu thay đổi điểm thi đua cho học sinh này"
                >
                  <Save size={18} />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Mode 2: Điều chỉnh trực tiếp điểm số */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1. Học sinh cần điều chỉnh
                </label>
                <select
                  disabled={!isLeader}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.groupName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">
                  2. Điểm cộng tích lũy (+)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="100"
                  disabled={!isLeader}
                  value={directPlusPoints}
                  onChange={(e) => setDirectPlusPoints(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 outline-none focus:bg-white"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-rose-800 mb-1.5">
                  3. Điểm trừ tích lũy (-)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="100"
                  disabled={!isLeader}
                  value={directMinusPoints}
                  onChange={(e) => setDirectMinusPoints(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-rose-50/60 border border-rose-300 rounded-xl text-xs font-bold text-rose-900 outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                4. Lý do điều chỉnh điểm thi đua
              </label>
              <input
                disabled={!isLeader}
                type="text"
                value={directReason}
                onChange={(e) => setDirectReason(e.target.value)}
                placeholder="Nhập lý do điều chỉnh trực tiếp điểm (VD: Cập nhật lại điểm thi đua tuần 3...)"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600 font-semibold">
                Điểm tổng kết sau điều chỉnh:{' '}
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-black">
                  {formatScore(directPlusPoints - directMinusPoints)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveCompetition}
                className={`px-7 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isLeader
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white hover:scale-102 active:scale-98 shadow-blue-500/25 cursor-pointer'
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300 cursor-pointer'
                }`}
                title="Lưu thay đổi điểm số học sinh"
              >
                <Save size={18} />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bảng xếp hạng & Liên kết học tập (Section XXII) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Bảng Điểm Thi Đua & Đối Chiếu Học Tập
              </h3>
              <p className="text-xs text-slate-500">
                {selectedWeek === 'all'
                  ? 'Số liệu lũy kế toàn bộ học kỳ (35 tuần học)'
                  : `Số liệu đồng nhất theo ${getSchoolWeekInfo(selectedWeek).label}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Calendar size={13} />
                {selectedWeek === 'all' ? 'Lũy kế cả học kỳ' : `Tuần ${selectedWeek}`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3 pl-2">Hạng</th>
                  <th className="pb-3">Thành viên</th>
                  <th className="pb-3 text-center">Nhiệm vụ</th>
                  <th className="pb-3 text-center">Bài nộp</th>
                  <th className="pb-3 text-center">Sản phẩm</th>
                  <th className="pb-3 text-right">Cộng / Trừ</th>
                  <th className="pb-3 pr-2 text-right">Tổng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedMembers.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-2 font-bold text-slate-700">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[10px] text-slate-400">{m.groupName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center font-medium text-slate-700">
                      {m.completedTasks}
                    </td>
                    <td className="py-3 text-center font-medium text-slate-700">
                      {m.submittedCount}
                    </td>
                    <td className="py-3 text-center font-medium text-slate-700">
                      {m.productCount}
                    </td>
                    <td className="py-3 text-right font-medium">
                      <span className="text-emerald-600 font-bold">
                        {formatScore(memberWeekStats[m.id]?.plus ?? 0)}
                      </span>{' '}
                      /{' '}
                      <span className="text-rose-600 font-bold">
                        {formatScore(-Math.abs(memberWeekStats[m.id]?.minus ?? 0))}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-black text-xs border border-amber-200">
                        {formatScore(memberWeekStats[m.id]?.net ?? 0)}
                      </span>
                      {selectedWeek !== 'all' && (
                        <span className="text-[10px] text-slate-400 block mt-0.5" title="Điểm lũy kế toàn học kỳ">
                          Kỳ: {formatScore(m.netPoints)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lịch sử thi đua */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History size={18} className="text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Lịch sử ghi nhận {selectedWeek === 'all' ? '(Toàn khóa)' : `Tuần ${selectedWeek}`}
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-lg">
                {filteredRecords.length} lượt
              </span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded font-black text-xs shrink-0 ${
                          r.type === 'plus'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {formatScore(r.type === 'plus' ? Math.abs(r.points) : -Math.abs(r.points))}
                      </span>

                      <div>
                        <p className="font-bold text-slate-800">{r.studentName}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{r.reason}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Tuần {r.weekNumber || getWeekFromDate(r.createdAt)} • {r.createdAt} • Bởi: {r.recordedBy}
                        </span>
                      </div>
                    </div>

                    {isLeader && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditRecord(r)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Chỉnh sửa lượt ghi nhận này"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(r)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa lượt ghi nhận này khi ghi sai (Hoàn tác điểm & chuyển vào Thùng rác)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-semibold">Chưa có lượt ghi nhận thi đua nào trong Tuần {selectedWeek}.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Chọn tuần khác hoặc ghi nhận điểm mới ở phía trên.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
            * Dữ liệu học tập và thi đua được lưu trữ theo quy chế quản lý Tổ 3 - THPT Dương Minh Châu.
          </div>
        </div>
      </div>

      {/* Modal Chỉnh Sửa Lượt Ghi Nhận Thi Đua */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md my-8 p-6 border border-slate-200 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                ✏️ Chỉnh Sửa Lượt Ghi Nhận Thi Đua
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditRecord} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tuần học áp dụng:
                </label>
                <select
                  value={editWeek}
                  onChange={(e) => setEditWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-blue-900"
                >
                  {Array.from({ length: TOTAL_SCHOOL_WEEKS }, (_, i) => i + 1).map((w) => {
                    const info = getSchoolWeekInfo(w);
                    return (
                      <option key={w} value={w}>
                        Tuần {w} ({info.startDate} - {info.endDate})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Loại ghi nhận:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('plus')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      editType === 'plus'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    + Điểm cộng
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('minus')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      editType === 'minus'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    - Điểm trừ
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mức điểm (chuẩn 0.25đ hoặc tùy chỉnh):
                </label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {[0.25, 0.5, 0.75, 1.0, 1.25].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setEditPoints(amt);
                        setEditPointsInput(amt.toString());
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        editPoints === amt
                          ? 'bg-blue-100 text-blue-900 border-blue-400 font-black'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {formatScoreWithoutSign(amt)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editPointsInput}
                  onChange={(e) => {
                    setEditPointsInput(e.target.value);
                    const parsed = parseScore(e.target.value, { defaultValue: 0.25, min: 0.25, max: 10 });
                    setEditPoints(parsed);
                  }}
                  onBlur={() => {
                    const parsed = parseScore(editPointsInput, { defaultValue: 0.25, min: 0.25, max: 10, roundToQuarter: true });
                    setEditPoints(parsed);
                    setEditPointsInput(parsed.toString());
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  placeholder="0.25"
                  title="Nhập số điểm (chấp nhận cả 0,25 và 0.25)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do / Hành vi ghi nhận:
                </label>
                <textarea
                  rows={3}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium resize-none"
                  placeholder="Nhập lý do..."
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (editingRecord) {
                      setRecordToDelete(editingRecord);
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                  title="Xóa lượt ghi nhận này vì ghi sai (Hoàn tác điểm & chuyển vào Thùng rác)"
                >
                  <Trash2 size={14} />
                  <span>Xóa lượt này (Ghi sai)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa Lượt Ghi Nhận Thi Đua (Khi ghi sai) */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200 animate-scale-up text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Trash2 size={18} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Xác Nhận Xóa Lượt Ghi Nhận
                </h3>
              </div>
              <button
                onClick={() => setRecordToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                <AlertCircle size={15} /> Xóa lượt ghi sai & Hoàn tác điểm số
              </p>
              <p className="text-[11px] text-amber-700/90 leading-relaxed">
                Số điểm của học sinh sẽ được tự động hoàn tác (trừ lại điểm nếu là điểm cộng, hoàn lại điểm nếu là điểm trừ). Lượt xóa sẽ được lưu an toàn trong <b>Thùng rác</b> và có thể khôi phục lại bất kỳ lúc nào.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Học sinh:</span>
                <span className="font-black text-slate-900 text-sm">{recordToDelete.studentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Loại & Mức điểm:</span>
                <span
                  className={`font-black px-2 py-0.5 rounded-md text-xs ${
                    recordToDelete.type === 'plus'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {formatScore(recordToDelete.type === 'plus' ? Math.abs(recordToDelete.points) : -Math.abs(recordToDelete.points))} ({recordToDelete.type === 'plus' ? 'Điểm cộng' : 'Điểm trừ'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Tuần áp dụng:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Tuần {recordToDelete.weekNumber || getWeekFromDate(recordToDelete.createdAt)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold block mb-0.5">Lý do / Hành vi đã ghi:</span>
                <p className="font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                  {recordToDelete.reason}
                </p>
              </div>
              <div className="text-[10px] text-slate-400">
                Ghi nhận lúc: {recordToDelete.createdAt} • Bởi: {recordToDelete.recordedBy}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98 cursor-pointer text-xs"
              >
                <Trash2 size={15} />
                <span>Xác nhận xóa & Hoàn tác điểm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
