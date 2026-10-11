import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { Assignment, FileItem, Member, Submission } from '../types';
import { APP_CONFIG, detectFileType, formatBytes } from '../config';
import { processUploadedFile } from '../storage';
import { FileIconBadge } from './FileIconBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  members: Member[];
  currentMember: Member;
  preselectedAssignmentId?: string;
  onSaveSubmission: (submission: Submission) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const SubmitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  assignments,
  members,
  currentMember,
  preselectedAssignmentId,
  onSaveSubmission,
  showToast,
}) => {
  if (!isOpen) return null;

  const [studentId, setStudentId] = useState<string>(currentMember.id);
  const [assignmentId, setAssignmentId] = useState<string>(
    preselectedAssignmentId || (assignments.length > 0 ? assignments[0].id : '')
  );
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedStudent = members.find((m) => m.id === studentId) || currentMember;
  const selectedAssignment = assignments.find((a) => a.id === assignmentId);

  // File upload processing
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    const newFiles: FileItem[] = [];
    const maxBytes = APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > maxBytes) {
        showToast(
          `Cảnh báo: Tệp "${file.name}" dung lượng (${formatBytes(file.size)}) vượt mức tối ưu ${APP_CONFIG.MAX_FILE_SIZE_MB}MB!`,
          'warning'
        );
      }
      try {
        const item = await processUploadedFile(file);
        newFiles.push(item);
      } catch (err) {
        console.error(err);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setIsProcessing(false);
    showToast(`Đã thêm ${newFiles.length} tệp tin vào bài nộp`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleQuickAddDemoFile = (type: 'docx' | 'pptx' | 'mp4' | 'xlsx' | 'pdf' | 'mp3' | 'png') => {
    const demoItems: Record<string, FileItem> = {
      docx: {
        id: 'f_demo_' + Date.now(),
        name: `Bao_cao_Chuyen_de_${selectedStudent.name.replace(/\s+/g, '_')}.docx`,
        size: 1150000,
        sizeFormatted: '1.1 MB',
        type: 'word',
        extension: 'docx',
        contentPreview: 'Bản báo cáo chi tiết nhiệm vụ học tập nhóm môn học.',
      },
      pptx: {
        id: 'f_demo_' + Date.now(),
        name: `Slide_Thuyet_trinh_To3.pptx`,
        size: 4600000,
        sizeFormatted: '4.4 MB',
        type: 'powerpoint',
        extension: 'pptx',
      },
      mp4: {
        id: 'f_demo_' + Date.now(),
        name: `Video_Thuc_hanh_Thuyet_trinh.mp4`,
        size: 16500000,
        sizeFormatted: '15.7 MB',
        type: 'video',
        extension: 'mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      xlsx: {
        id: 'f_demo_' + Date.now(),
        name: `Bang_so_lieu_khao_sat.xlsx`,
        size: 420000,
        sizeFormatted: '410 KB',
        type: 'excel',
        extension: 'xlsx',
      },
      pdf: {
        id: 'f_demo_' + Date.now(),
        name: `Bai_tap_Tu_luan_Dap_an.pdf`,
        size: 890000,
        sizeFormatted: '870 KB',
        type: 'pdf',
        extension: 'pdf',
      },
      mp3: {
        id: 'f_demo_' + Date.now(),
        name: `Ghi_am_Phan_bien_Thuyet_trinh.mp3`,
        size: 3400000,
        sizeFormatted: '3.2 MB',
        type: 'audio',
        extension: 'mp3',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      png: {
        id: 'f_demo_' + Date.now(),
        name: `Poster_Infographic_To3.png`,
        size: 2800000,
        sizeFormatted: '2.7 MB',
        type: 'image',
        extension: 'png',
        url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80',
      },
    };

    const item = demoItems[type];
    if (item) {
      setFiles((prev) => [...prev, item]);
      showToast(`Đã thêm mẫu tệp .${type.toUpperCase()}`);
    }
  };

  const handleSubmit = (isDraft = false) => {
    if (!assignmentId) {
      showToast('Vui lòng chọn nhiệm vụ cần nộp!', 'warning');
      return;
    }
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài nộp!', 'warning');
      return;
    }
    if (files.length === 0 && !isDraft) {
      showToast('Vui lòng đính kèm ít nhất một tệp tin bài làm!', 'warning');
      return;
    }

    const newSub: Submission = {
      id: 'sub_' + Date.now(),
      assignmentId: assignmentId,
      assignmentTitle: selectedAssignment?.title || 'Nhiệm vụ học tập',
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      title: title.trim(),
      description: description.trim(),
      notes: notes.trim(),
      files: files,
      status: isDraft ? 'draft' : 'submitted',
      submittedAt: new Date().toLocaleString('vi-VN'),
    };

    onSaveSubmission(newSub);
    showToast(isDraft ? 'Đã lưu bản nháp bài nộp thành công' : 'Đã nộp bài thành công!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-gray-200 animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Upload size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">NỘP SẢN PHẨM HỌC TẬP</h2>
              <p className="text-xs text-blue-100">
                Không gian nộp bài đa phương tiện - Tổ 3 Lớp 11A1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Student & Task selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Họ và tên thành viên nộp
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role === 'leader' ? 'Tổ trưởng' : 'Thành viên'}) - {m.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Chọn nhiệm vụ học tập <span className="text-red-500">*</span>
              </label>
              <select
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.subject}] {a.title} {a.isLocked ? '(🔒 Đã khóa)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Assignment Info Snippet */}
          {selectedAssignment && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-3">
              <div className="mt-0.5">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-blue-950 mb-0.5">
                  Yêu cầu từ nhiệm vụ:
                </div>
                <p className="text-blue-800">{selectedAssignment.requirements || selectedAssignment.description}</p>
                <div className="mt-1 flex items-center gap-3 text-blue-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Hạn nộp: {selectedAssignment.dueDate}
                  </span>
                  <span>• Hình thức: {selectedAssignment.format}</span>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Tiêu đề bài nộp / Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Báo cáo chuyên đề Hidrocacbon thơm - Nhóm 1..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nội dung tóm tắt / Mô tả bài làm
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt ngắn gọn phương pháp thực hiện, kết quả đạt được..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Multi-file Upload Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Đính kèm tệp tin bài làm <span className="text-red-500">* (Đa dạng định dạng)</span>
              </label>
              <span className="text-[11px] text-gray-500 font-medium">
                Hỗ trợ Word, PDF, Excel, PowerPoint, Video, Audio, Ảnh, Zip
              </span>
            </div>

            {/* Dropzone container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                  : 'border-gray-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Upload size={24} />
              </div>

              <h4 className="text-sm font-semibold text-gray-800 mb-1">
                Kéo thả file vào đây hoặc <span className="text-blue-600 underline">bấm để chọn từ máy</span>
              </h4>
              <p className="text-xs text-gray-500">
                Cho phép chọn nhiều file cùng một lúc. Giữ nguyên vẹn tên tiếng Việt có dấu.
              </p>

              {/* Supported badges banner */}
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">📄 WORD (.docx)</span>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">📕 PDF (.pdf)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">📊 EXCEL (.xlsx)</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">📽 POWERPOINT (.pptx)</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">🎬 VIDEO (.mp4)</span>
                <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-800 text-[10px] font-bold">🎵 ÂM THANH (.mp3)</span>
                <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">🖼 ẢNH (.png/.jpg)</span>
                <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-900 text-[10px] font-bold">📦 ZIP/RAR</span>
              </div>
            </div>

            {/* Quick demo files buttons if testing without local files */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
              <span className="font-semibold text-gray-600">Thêm nhanh file mẫu thử:</span>
              <button
                type="button"
                onClick={() => handleQuickAddDemoFile('docx')}
                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs"
              >
                + Word .docx
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDemoFile('pptx')}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs"
              >
                + PowerPoint .pptx
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDemoFile('mp4')}
                className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-xs"
              >
                + Video .mp4
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDemoFile('xlsx')}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs"
              >
                + Excel .xlsx
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDemoFile('mp3')}
                className="px-2 py-0.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded text-xs"
              >
                + Audio .mp3
              </button>
            </div>
          </div>

          {/* List of files added to submission */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase">
                  Danh sách tệp trong bài nộp này ({files.length} tệp):
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Plus size={14} /> + Thêm file khác
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIconBadge type={f.type} extension={f.extension} size="sm" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={f.name}>
                          {f.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {f.sizeFormatted} • {f.type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa tệp khỏi bài nộp"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Ghi chú thêm gửi Tổ trưởng / GVCN
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Em gửi kèm file dữ liệu gốc để kiểm tra đối chiếu..."
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-colors border border-amber-300 shadow-xs"
          >
            Lưu bản nháp
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSubmit(false)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <FileCheck size={16} />
              Nộp bài chính thức
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
