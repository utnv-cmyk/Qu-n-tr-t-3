import React, { useState } from 'react';
import {
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Edit,
  Eye,
  Trash2,
  Award,
  MessageSquare,
  Sparkles,
  FileCheck,
  Lock,
  Edit3,
  X,
  Download,
} from 'lucide-react';
import { Assignment, FileItem, Member, Submission, SubmissionStatus } from '../types';
import { APP_CONFIG } from '../config';
import { FileIconBadge } from './FileIconBadge';
import {
  downloadFile,
  downloadSubmissionReceipt,
  downloadTextAsFile,
} from '../utils/fileDownloader';

interface Props {
  submissions: Submission[];
  assignments: Assignment[];
  members: Member[];
  currentMember: Member;
  onUpdateSubmissions: (subs: Submission[]) => void;
  onDeleteSubmission?: (sub: Submission) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onOpenSubmitModal: () => void;
  onViewFile: (file: FileItem) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const SubmissionsView: React.FC<Props> = ({
  submissions,
  assignments,
  members,
  currentMember,
  onUpdateSubmissions,
  onDeleteSubmission,
  onOpenTrash,
  trashCount = 0,
  onOpenSubmitModal,
  onViewFile,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';
  const [activeTab, setActiveTab] = useState<'my_submissions' | 'all_submissions'>('my_submissions');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sửa bài nộp
  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Leader Grading / Feedback Modal
  const [reviewingSub, setReviewingSub] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [statusInput, setStatusInput] = useState<SubmissionStatus>('reviewed');

  // Filter
  const currentList = activeTab === 'my_submissions'
    ? submissions.filter((s) => s.studentId === currentMember.id)
    : submissions;

  const filteredSubmissions = currentList.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'draft':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          text: '🟡 Đã lưu nháp',
        };
      case 'submitted':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
          text: '🔵 Đã nộp',
        };
      case 'reviewed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          text: '🟢 Đã nhận xét',
        };
      case 'completed':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          text: '🟣 Đã hoàn thành',
        };
      case 'need_resubmit':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          text: '🔴 Cần nộp lại',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          text: '⚪ Chưa nộp',
        };
    }
  };

  const handleOpenReview = (sub: Submission) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền đánh giá và chấm điểm bài nộp!', 'warning');
      return;
    }
    setReviewingSub(sub);
    setScoreInput(sub.score ? sub.score.toString() : '9.0');
    setFeedbackInput(sub.feedback || '');
    setStatusInput(sub.status === 'need_resubmit' ? 'need_resubmit' : 'reviewed');
  };

  const handleSaveReview = () => {
    if (!reviewingSub || !isLeader) return;

    const parsedScore = parseFloat(scoreInput);
    const updated = submissions.map((s) =>
      s.id === reviewingSub.id
        ? {
            ...s,
            score: isNaN(parsedScore) ? undefined : parsedScore,
            feedback: feedbackInput.trim(),
            status: statusInput,
            reviewerName: `${currentMember.name} (Tổ trưởng)`,
          }
        : s
    );

    onUpdateSubmissions(updated);
    showToast(`Đã lưu nhận xét và điểm số cho bài nộp của ${reviewingSub.studentName}!`);
    setReviewingSub(null);
  };

  const handleOpenEditSub = (sub: Submission) => {
    const canEdit = isLeader || sub.studentId === currentMember.id;
    if (!canEdit) {
      showToast('Bạn không có quyền chỉnh sửa bài nộp này!', 'warning');
      return;
    }
    setEditingSub(sub);
    setEditTitle(sub.title);
    setEditNotes(sub.notes || '');
  };

  const handleSaveEditSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    if (!editTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề bài nộp!', 'warning');
      return;
    }

    const updated = submissions.map((s) =>
      s.id === editingSub.id
        ? {
            ...s,
            title: editTitle.trim(),
            notes: editNotes.trim(),
          }
        : s
    );
    onUpdateSubmissions(updated);
    showToast(`Đã cập nhật bài nộp "${editTitle}" thành công!`);
    setEditingSub(null);
  };

  const handleDeleteSub = (sub: Submission) => {
    const canDelete = isLeader || sub.studentId === currentMember.id;
    if (!canDelete) {
      showToast('Bạn không có quyền xóa bài nộp này!', 'error');
      return;
    }
    if (onDeleteSubmission) {
      onDeleteSubmission(sub);
    } else {
      onUpdateSubmissions(submissions.filter((s) => s.id !== sub.id));
    }
    showToast(`Đã chuyển bài nộp "${sub.title}" vào Thùng rác. Có thể khôi phục bất cứ lúc nào!`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">📤 Quản Lý Bài Nộp & Sản Phẩm Học Tập</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {submissions.length} bài
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đính kèm đa tệp (Word, PDF, Excel, PPTX, Video, MP3, Ảnh) với phản hồi chi tiết
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Nút tải danh sách bài nộp */}
          <button
            onClick={() => {
              const summary = `BẢNG TỔNG HỢP BÀI NỘP HỌC TẬP TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME} (${APP_CONFIG.SCHOOL_YEAR})\nTổng số: ${submissions.length} bài nộp\n\n` +
                submissions.map((s, i) => `${i + 1}. [${s.assignmentTitle}] ${s.title}\n   - Học sinh: ${s.studentName}\n   - Thời gian nộp: ${s.submittedAt}\n   - Trạng thái: ${s.status} | Điểm số: ${s.score !== undefined ? `${s.score}/10` : 'Chưa chấm'}\n   - Nhận xét: ${s.feedback || 'Chưa có'}\n   - Tệp đính kèm: ${s.files.map((f) => f.name).join(', ') || 'Không có'}\n`).join('\n');
              downloadTextAsFile(`Tong_Hop_Bai_Nop_To3_${new Date().toISOString().split('T')[0]}.txt`, summary);
              showToast('Đã tải xuống bảng tổng hợp bài nộp học tập!');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-xs cursor-pointer"
            title="Tải toàn bộ bảng tổng hợp bài nộp và điểm số dạng văn bản"
          >
            <Download size={15} className="text-emerald-600" />
            <span>Tải bảng bài nộp (.txt)</span>
          </button>

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs cursor-pointer"
              title="Xem và khôi phục bài nộp đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          <button
            onClick={onOpenSubmitModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Upload size={16} /> Nộp bài tập mới
          </button>
        </div>
      </div>

      {/* Tabs Switcher: "Bài nộp của tôi" vs "Toàn bộ bài nộp" */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my_submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'my_submissions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            📤 Bài nộp của tôi ({submissions.filter((s) => s.studentId === currentMember.id).length})
          </button>
          <button
            onClick={() => setActiveTab('all_submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all_submissions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Toàn bộ bài nộp Tổ 3 ({submissions.length})</span>
            {!isLeader && <span className="text-[10px] text-slate-400 font-normal">(Xem chung)</span>}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề, nhiệm vụ, tên bạn nộp..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filters (Section XIV) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'draft', label: '🟡 Bản nháp' },
            { id: 'submitted', label: '🔵 Đã nộp' },
            { id: 'reviewed', label: '🟢 Đã nhận xét' },
            { id: 'completed', label: '🟣 Hoàn thành' },
            { id: 'need_resubmit', label: '🔴 Cần nộp lại' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-colors ${
                filterStatus === st.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((sub) => {
          const badge = getStatusBadge(sub.status);
          const isOwner = sub.studentId === currentMember.id;
          const canDelete = isLeader || isOwner;

          return (
            <div
              key={sub.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Submission Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-200">
                      {sub.assignmentTitle}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                      {badge.text}
                    </span>
                    {sub.score !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-300 flex items-center gap-1">
                        <Award size={13} className="text-amber-600" />
                        Điểm: {sub.score}/10
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {sub.title}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Người nộp: <b className="text-slate-800">{sub.studentName}</b> • Thời gian nộp: <b>{sub.submittedAt}</b>
                  </p>
                </div>

                {/* Leader Review Action */}
                {isLeader && (
                  <button
                    onClick={() => handleOpenReview(sub)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <Sparkles size={14} />
                    Chấm điểm & Nhận xét
                  </button>
                )}
              </div>

              {/* Description */}
              {sub.description && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {sub.description}
                </p>
              )}

              {/* Multi-file list in submission (Section XII) */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Tệp tin đính kèm ({sub.files.length} tệp):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {sub.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-2 text-xs"
                    >
                      <div
                        onClick={() => onViewFile(file)}
                        className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer"
                        title={`Xem tệp: ${file.name}`}
                      >
                        <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                        <span className="font-semibold text-slate-800 truncate" title={file.name}>
                          {file.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-500 font-bold mr-1">
                          {file.sizeFormatted}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(file);
                            showToast(`Đang tải về: ${file.name}`);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Tải tệp này về máy"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback box */}
              {sub.feedback && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-2.5">
                  <MessageSquare size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">
                      Nhận xét từ {sub.reviewerName || 'Tổ trưởng'}:
                    </span>
                    <p className="text-emerald-900 leading-relaxed">{sub.feedback}</p>
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-400 text-[11px]">
                  {sub.notes ? `Ghi chú: ${sub.notes}` : ''}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Nút tải phiếu xác nhận bài nộp */}
                  <button
                    type="button"
                    onClick={() => {
                      downloadSubmissionReceipt(sub);
                      showToast(`Đã tải về phiếu bài nộp của ${sub.studentName}!`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                    title="Tải phiếu xác nhận bài nộp kèm nhận xét và điểm số về máy"
                  >
                    <Download size={13} className="text-emerald-600" />
                    <span>Tải phiếu bài nộp</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleOpenEditSub(sub)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Chỉnh sửa bài nộp"
                    >
                      <Edit3 size={13} /> <span>Sửa</span>
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={onOpenSubmitModal}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <RotateCcw size={13} /> Nộp lại bài
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteSub(sub)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa bài nộp này (Chuyển vào thùng rác)"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <Upload size={40} className="text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">Chưa có bài nộp nào trong mục này</h4>
            <p className="text-xs text-slate-500 mt-1">Bấm nút "Nộp bài tập mới" để hoàn thành bài tập của bạn.</p>
          </div>
        )}
      </div>

      {/* Modal Chấm điểm & Đánh giá (Chỉ Tổ trưởng) */}
      {reviewingSub && isLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg my-8 p-6 border border-slate-200 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Chấm điểm & Nhận xét bài làm</h3>
                <p className="text-slate-500 text-[11px]">{reviewingSub.title} • {reviewingSub.studentName}</p>
              </div>
              <button onClick={() => setReviewingSub(null)} className="text-slate-400 hover:text-slate-700">
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm số (Thang điểm 10)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  placeholder="VD: 9.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cập nhật trạng thái bài nộp</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as SubmissionStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-semibold"
                >
                  <option value="reviewed">🟢 Đã nhận xét & Đạt yêu cầu</option>
                  <option value="completed">🟣 Đã hoàn thành xuất sắc</option>
                  <option value="need_resubmit">🔴 Yêu cầu nộp lại (chưa đạt/thiếu file)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhận xét chi tiết của Tổ trưởng</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Góp ý về bố cục slide, độ chính xác của số liệu, tác phong làm việc nhóm..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingSub(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Lưu đánh giá & Điểm số</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Chỉnh Sửa Bài Nộp */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg my-8 p-6 border border-slate-200 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">✏️ Chỉnh Sửa Thông Tin Bài Nộp</h3>
              <button onClick={() => setEditingSub(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSub} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhiệm vụ / Bài tập:
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700">
                  {editingSub.assignmentTitle}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Người nộp:
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700">
                  {editingSub.studentName}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề bài nộp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  placeholder="Tiêu đề bài nộp..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ghi chú cho bài nộp:
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium resize-none"
                  placeholder="Ghi chú thêm về nội dung, quá trình thực hiện..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Lưu thay đổi bài nộp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
