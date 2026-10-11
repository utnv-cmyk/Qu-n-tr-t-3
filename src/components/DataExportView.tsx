import React from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Database,
  Sparkles,
  FileJson,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Member, CompetitionRecord, AttendanceSession, Submission } from '../types';
import { getWeekFromDate } from '../utils/schoolWeeks';
import { downloadAllAppContentsDoc, getMemberExportRole } from '../utils/fullAppExport';

interface Props {
  members: Member[];
  competitionRecords: CompetitionRecord[];
  attendanceSessions: AttendanceSession[];
  submissions: Submission[];
  trashCount: number;
  onOpenTrash: () => void;
  onOpenDownloadAll?: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DataExportView: React.FC<Props> = ({
  members,
  competitionRecords,
  attendanceSessions,
  submissions,
  trashCount,
  onOpenTrash,
  onOpenDownloadAll,
  onExportData,
  onImportData,
  showToast,
}) => {
  // Export CSV Helper
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    try {
      const csvContent =
        '\uFEFF' +
        headers.join(',') +
        '\n' +
        rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Đã xuất tệp ${filename}.csv thành công!`, 'success');
    } catch {
      showToast('Có lỗi khi tạo tệp CSV!', 'error');
    }
  };

  // 1. Export Members CSV
  const handleExportMembersCSV = () => {
    const headers = ['STT', 'Mã số', 'Họ và tên', 'Vai trò', 'Nhóm học tập', 'Điểm thi đua', 'Chuyên cần (Buổi)', 'Bài đã nộp', 'Nhiệm vụ xong'];
    const rows = members.map((m, idx) => [
      idx + 1,
      m.id,
      m.name,
      getMemberExportRole(m),
      m.groupName,
      m.netPoints,
      m.attendancePresent,
      m.submittedCount,
      m.completedTasks,
    ]);
    exportToCSV('Danh_sach_thanh_vien_To3', headers, rows);
  };

  // 2. Export Competition CSV
  const handleExportCompetitionCSV = () => {
    const headers = ['STT', 'Tuần', 'Học sinh', 'Loại điểm', 'Số điểm', 'Lý do / Nội dung', 'Người ghi nhận', 'Thời gian'];
    const rows = competitionRecords.map((c, idx) => [
      idx + 1,
      `Tuần ${c.weekNumber || getWeekFromDate(c.createdAt) || 3}`,
      c.studentName,
      c.type === 'plus' ? 'Cộng' : 'Trừ',
      c.points,
      c.reason,
      c.recordedBy,
      c.createdAt,
    ]);
    exportToCSV('Bang_thi_dua_To3', headers, rows);
  };

  // 3. Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    const headers = ['STT', 'Ngày', 'Tuần', 'Học sinh', 'Trạng thái', 'Ghi chú', 'Người điểm danh'];
    const rows: (string | number)[][] = [];
    let count = 1;
    attendanceSessions.forEach((session) => {
      session.records.forEach((rec) => {
        rows.push([
          count++,
          session.date,
          session.weekNumber,
          rec.studentName,
          rec.status === 'present'
            ? 'Có mặt'
            : rec.status === 'late'
            ? 'Đi trễ'
            : rec.status === 'absent_excused'
            ? 'Vắng có phép'
            : 'Vắng không phép',
          rec.note || '',
          session.recordedBy,
        ]);
      });
    });
    exportToCSV('So_diem_danh_To3', headers, rows);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Overview Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              💾 Báo Cáo, Xuất Dữ Liệu & Lưu Trữ
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">
              <CheckCircle2 size={12} /> Hỗ trợ Word (.doc), JSON & Excel/CSV
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu học tập của Tổ 3 được lưu trữ an toàn trong trình duyệt. Bạn có thể xuất hồ sơ văn bản Word chuẩn Bộ GD&ĐT, bản sao lưu JSON hoặc bảng tính Excel/CSV để nộp báo cáo cho Giáo viên.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <button
            onClick={onOpenTrash}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Thùng rác ({trashCount})</span>
          </button>
        </div>
      </div>

      {/* Hồ Sơ Văn Bản (.doc) chuẩn thể thức Bộ GD&ĐT */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-indigo-700/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-black text-[10px] uppercase tracking-wider">
              Văn Bản Chuẩn Bộ GD&ĐT
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px]">
              Tổ 3 – Lớp 11A1
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
            <FileText size={24} className="text-blue-300" />
            <span>Hồ Sơ Văn Bản (.doc)</span>
          </h4>
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

      {/* Primary Backup (JSON Full System) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100 shadow-2xs">
              <FileJson size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Xuất Toàn Bộ Dữ Liệu (JSON)
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tải về tệp <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[11px]">.json</code> chứa 100% dữ liệu: thành viên, bài nộp, ngân hàng đề thi AI, điểm danh, thi đua, tài liệu và hoạt động.
            </p>
          </div>
          <button
            onClick={onExportData}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Download size={16} />
            <span>Tải về bản sao lưu đầy đủ (.json)</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 border border-indigo-100 shadow-2xs">
              <Database size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Khôi Phục Dữ Liệu Từ File JSON
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Nhập tệp sao lưu JSON đã xuất trước đó để khôi phục trạng thái làm việc trên máy khác hoặc sau khi xóa dữ liệu trình duyệt.
            </p>
          </div>

          <label className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer">
            <Upload size={16} />
            <span>Chọn tệp JSON để khôi phục</span>
            <input
              type="file"
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Export to Excel / CSV for Teacher Reports */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-600" />
            <span>Xuất Báo Cáo Định Dạng Bảng Tính (Excel / CSV)</span>
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Xuất các danh sách cụ thể sang tệp CSV hỗ trợ mở bằng Microsoft Excel hoặc Google Sheets để nộp báo cáo cho GVCN hoặc ban thi đua lớp 11A1.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Members */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-900">Danh sách Thành viên</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {members.length} học sinh • Họ tên, nhóm, thi đua, chuyên cần
              </p>
            </div>
            <button
              onClick={handleExportMembersCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} /> Xuất Excel/CSV
            </button>
          </div>

          {/* Competition */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-900">Sổ Điểm Thi Đua</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {competitionRecords.length} lượt ghi nhận điểm cộng/trừ
              </p>
            </div>
            <button
              onClick={handleExportCompetitionCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} /> Xuất Excel/CSV
            </button>
          </div>

          {/* Attendance */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-slate-900">Sổ Theo Dõi Điểm Danh</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {attendanceSessions.length} buổi học • Chi tiết theo ngày & tuần
              </p>
            </div>
            <button
              onClick={handleExportAttendanceCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} /> Xuất Excel/CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
