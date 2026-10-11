import React, { useState, useRef } from 'react';
import {
  BookOpenCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Plus,
  Lock,
  Unlock,
  Users,
  Search,
  X,
  FileText,
  Trash2,
  Edit3,
  RotateCcw,
  Paperclip,
  Eye,
} from 'lucide-react';
import { Assignment, FileItem, Member, Submission, TaskStatus } from '../types';
import { APP_CONFIG, SUBJECTS, formatBytes } from '../config';
import { FileIconBadge } from './FileIconBadge';
import { processUploadedFile } from '../storage';
import {
  downloadFile,
  downloadAssignmentSheet,
  downloadTextAsFile,
} from '../utils/fileDownloader';

interface Props {
  assignments: Assignment[];
  submissions: Submission[];
  members: Member[];
  currentMember: Member;
  onUpdateAssignments: (tasks: Assignment[]) => void;
  onDeleteTask?: (task: Assignment) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onOpenSubmitModalWithTask: (taskId: string) => void;
  onViewFile: (file: FileItem) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const AssignmentsView: React.FC<Props> = ({
  assignments,
  submissions,
  members,
  currentMember,
  onUpdateAssignments,
  onDeleteTask,
  onOpenTrash,
  trashCount = 0,
  onOpenSubmitModalWithTask,
  onViewFile,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal tạo / sửa nhiệm vụ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Assignment | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [format, setFormat] = useState('Word (.docx), PDF (.pdf)');
  const [taskAttachedFiles, setTaskAttachedFiles] = useState<FileItem[]>([]);

  const taskFileInputRef = useRef<HTMLInputElement>(null);

  const handleTaskFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: FileItem[] = [];
      const maxBytes = APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.size > maxBytes) {
          showToast(`Cảnh báo: Tệp "${file.name}" vượt ${APP_CONFIG.MAX_FILE_SIZE_MB}MB!`, 'warning');
        }
        try {
          const item = await processUploadedFile(file);
          newItems.push(item);
        } catch (err) {
          console.error(err);
        }
      }
      setTaskAttachedFiles((prev) => [...prev, ...newItems]);
      showToast(`Đã đính kèm ${newItems.length} tệp tin hướng dẫn vào nhiệm vụ!`);
    }
  };

  const handleAddSampleTaskFile = (ext: 'docx' | 'pdf' | 'pptx' | 'xlsx') => {
    const samples: Record<string, FileItem> = {
      docx: {
        id: 'tf_' + Date.now(),
        name: `De_cuong_huong_dan_${subject}.docx`,
        size: 980000,
        sizeFormatted: '980 KB',
        type: 'word',
        extension: 'docx',
        contentPreview: `Đề cương và yêu cầu chi tiết cho nhiệm vụ môn ${subject}. Học sinh thực hiện theo hướng dẫn.`,
      },
      pdf: {
        id: 'tf_' + Date.now(),
        name: `Phieu_bai_tap_chuyen_de_${subject}.pdf`,
        size: 1450000,
        sizeFormatted: '1.4 MB',
        type: 'pdf',
        extension: 'pdf',
        contentPreview: `Phiếu bài tập tự luận và câu hỏi trắc nghiệm ôn tập môn ${subject}.`,
      },
      pptx: {
        id: 'tf_' + Date.now(),
        name: `Slide_mau_thuyet_trinh_${subject}.pptx`,
        size: 3200000,
        sizeFormatted: '3.1 MB',
        type: 'powerpoint',
        extension: 'pptx',
      },
      xlsx: {
        id: 'tf_' + Date.now(),
        name: `Bang_so_lieu_mau_${subject}.xlsx`,
        size: 350000,
        sizeFormatted: '350 KB',
        type: 'excel',
        extension: 'xlsx',
      },
    };
    setTaskAttachedFiles((prev) => [...prev, samples[ext]]);
    showToast(`Đã đính kèm tệp mẫu: ${samples[ext].name}`);
  };

  const handleRemoveTaskFile = (fileId: string) => {
    setTaskAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleOpenCreateTask = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền tạo và giao nhiệm vụ mới!', 'warning');
      return;
    }
    setEditingTask(null);
    setTitle('');
    setSubject(SUBJECTS[0]);
    setTopic('');
    setDescription('');
    setRequirements('');
    setDueDate('');
    setFormat('Word (.docx), PDF (.pdf)');
    setTaskAttachedFiles([]);
    setIsModalOpen(true);
  };

  const filteredTasks = assignments.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.topic.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleToggleLock = (task: Assignment) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền khóa/mở nhiệm vụ!', 'warning');
      return;
    }
    const updated = assignments.map((t) =>
      t.id === task.id ? { ...t, isLocked: !t.isLocked } : t
    );
    onUpdateAssignments(updated);
    showToast(task.isLocked ? `Đã mở khóa nhiệm vụ: ${task.title}` : `Đã khóa nhiệm vụ: ${task.title}`);
  };

  const handleOpenEdit = (task: Assignment) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền chỉnh sửa nhiệm vụ!', 'warning');
      return;
    }
    setEditingTask(task);
    setTitle(task.title);
    setSubject(task.subject);
    setTopic(task.topic);
    setDescription(task.description);
    setRequirements(task.requirements);
    setDueDate(task.dueDate);
    setFormat(task.format);
    setTaskAttachedFiles(task.attachedFiles || []);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (task: Assignment) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền xóa nhiệm vụ!', 'error');
      return;
    }
    if (onDeleteTask) {
      onDeleteTask(task);
    } else {
      onUpdateAssignments(assignments.filter((t) => t.id !== task.id));
    }
    showToast(`Đã chuyển nhiệm vụ "${task.title}" vào Thùng rác. Có thể khôi phục bất cứ lúc nào!`, 'success');
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền giao hoặc sửa nhiệm vụ!', 'error');
      return;
    }
    if (!title.trim() || !dueDate) {
      showToast('Vui lòng nhập tên nhiệm vụ và thời hạn nộp!', 'warning');
      return;
    }

    if (editingTask) {
      const updated = assignments.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: title.trim(),
              subject,
              topic: topic.trim() || 'Học kỳ II',
              description: description.trim(),
              requirements: requirements.trim() || 'Nộp đúng hạn và chuẩn định dạng yêu cầu.',
              dueDate,
              format,
              attachedFiles: taskAttachedFiles,
            }
          : t
      );
      onUpdateAssignments(updated);
      showToast(`Đã cập nhật thông tin nhiệm vụ: ${title}`);
    } else {
      const newTask: Assignment = {
        id: 'task_' + Date.now(),
        title: title.trim(),
        subject: subject,
        topic: topic.trim() || 'Học kỳ II',
        description: description.trim(),
        requirements: requirements.trim() || 'Nộp đúng hạn và chuẩn định dạng yêu cầu.',
        assignerName: `${currentMember.name} (Tổ trưởng)`,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate,
        format: format,
        attachedFiles: taskAttachedFiles,
        status: 'in_progress',
        isLocked: false,
      };
      onUpdateAssignments([newTask, ...assignments]);
      showToast('Đã tạo và giao nhiệm vụ mới kèm tài liệu thành công!');
    }

    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">📝 Nhiệm Vụ Học Tập Tổ 3</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {assignments.length} nhiệm vụ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Giao bài, nhận nhiệm vụ, theo dõi tiến độ và trạng thái nộp bài của từng thành viên
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút tải danh sách nhiệm vụ */}
          <button
            onClick={() => {
              const summary = `DANH SÁCH NHIỆM VỤ HỌC TẬP TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME} (${APP_CONFIG.SCHOOL_YEAR})\nTổng số: ${assignments.length} nhiệm vụ\n\n` +
                assignments.map((a, i) => `${i + 1}. [${a.subject}] ${a.title}\n   - Hình thức: ${a.format} | Hạn nộp: ${a.dueDate} (${a.isLocked ? 'ĐÃ KHÓA' : 'ĐANG MỞ'})\n   - Người giao: ${a.assignerName} (${a.assignedDate})\n   - Yêu cầu: ${a.requirements}\n   - Mô tả: ${a.description}\n`).join('\n');
              downloadTextAsFile(`Danh_Sach_Nhiem_Vu_To3_${new Date().toISOString().split('T')[0]}.txt`, summary);
              showToast('Đã tải xuống danh sách nhiệm vụ học tập!');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-xs cursor-pointer"
            title="Tải toàn bộ danh sách nhiệm vụ học tập dạng văn bản"
          >
            <Download size={15} className="text-emerald-600" />
            <span>Tải danh sách (.txt)</span>
          </button>

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              title="Xem và khôi phục các nhiệm vụ đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          {/* Nút giao nhiệm vụ (Chỉ Tổ trưởng) */}
          <button
            onClick={handleOpenCreateTask}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isLeader
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={isLeader ? 'Tạo nhiệm vụ học tập mới' : 'Chỉ Tổ trưởng mới được giao nhiệm vụ'}
          >
            {isLeader ? <Plus size={16} /> : <Lock size={14} />}
            <span>Giao nhiệm vụ mới</span>
            {!isLeader && <span className="text-[10px] text-amber-600 font-bold">(🔒 Chỉ TT)</span>}
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
            placeholder="Tìm tên nhiệm vụ, môn học..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status filters (Section XX) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'in_progress', label: '🟢 Đang làm' },
            { id: 'urgent', label: '🟡 Sắp hết hạn' },
            { id: 'completed', label: '🔵 Đã hoàn thành' },
            { id: 'overdue', label: '🔴 Quá hạn' },
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

      {/* Task List (Section X) */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          // Calculate submissions for this assignment
          const taskSubmissions = submissions.filter((s) => s.assignmentId === task.id);
          const submittedCount = taskSubmissions.length;
          const unsubmittedCount = Math.max(0, members.length - submittedCount);
          const hasUserSubmitted = taskSubmissions.some((s) => s.studentId === currentMember.id);

          let statusBadge = {
            bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            icon: CheckCircle2,
            text: '🟢 Đang thực hiện',
          };
          if (task.status === 'urgent') {
            statusBadge = {
              bg: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse',
              icon: AlertTriangle,
              text: '🟡 Sắp đến hạn',
            };
          } else if (task.status === 'completed') {
            statusBadge = {
              bg: 'bg-blue-100 text-blue-800 border-blue-300',
              icon: CheckCircle2,
              text: '🔵 Đã hoàn thành',
            };
          } else if (task.status === 'overdue') {
            statusBadge = {
              bg: 'bg-rose-100 text-rose-800 border-rose-300',
              icon: AlertTriangle,
              text: '🔴 Quá hạn',
            };
          }

          return (
            <div
              key={task.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs hover:shadow-md transition-all space-y-4 ${
                task.isLocked ? 'border-slate-300 bg-slate-50/50' : 'border-slate-200/90'
              }`}
            >
              {/* Task Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200">
                      {task.subject}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">• {task.topic}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg}`}
                    >
                      {statusBadge.text}
                    </span>
                    {task.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                        <Lock size={11} /> Đã khóa nộp
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                </div>

                {/* Leader Lock / Edit / Delete Controls */}
                {isLeader && (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Sửa nhiệm vụ */}
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
                      title="Chỉnh sửa thông tin nhiệm vụ"
                    >
                      <Edit3 size={15} />
                      <span className="hidden sm:inline">Sửa</span>
                    </button>

                    <button
                      onClick={() => handleToggleLock(task)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                        task.isLocked
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={task.isLocked ? 'Mở khóa nhận bài' : 'Khóa không nhận bài'}
                    >
                      {task.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                      <span className="hidden sm:inline">{task.isLocked ? 'Mở khóa' : 'Khóa'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Xóa nhiệm vụ (Chuyển vào thùng rác)"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Task Details */}
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p><b>Mô tả:</b> {task.description}</p>
                <p><b>Yêu cầu:</b> <span className="text-slate-800 font-medium">{task.requirements}</span></p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Hình thức: <b className="text-blue-700">{task.format}</b></span>
                  <span>• Người giao: <b>{task.assignerName}</b></span>
                  <span>• Ngày giao: {task.assignedDate}</span>
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Clock size={13} /> Hạn nộp: {task.dueDate}
                  </span>
                </div>
              </div>

              {/* Attached task guidance files */}
              {task.attachedFiles.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-xs font-semibold text-slate-500">Tài liệu hướng dẫn đính kèm:</span>
                  {task.attachedFiles.map((f) => (
                    <div key={f.id} className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => onViewFile(f)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 hover:text-blue-700 text-xs font-medium transition-colors cursor-pointer"
                        title="Xem tài liệu"
                      >
                        <FileIconBadge type={f.type} extension={f.extension} size="sm" />
                        <span>{f.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          downloadFile(f);
                          showToast(`Đang tải về tệp tin: ${f.name}`);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Tải tệp này về máy"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submission stats & Action footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 size={16} />
                    <span>{submittedCount} đã nộp</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="text-slate-500">
                    <span>{unsubmittedCount} chưa nộp</span>
                  </div>
                  {hasUserSubmitted && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ✓ Bạn đã nộp bài
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Nút tải phiếu nhiệm vụ học tập */}
                  <button
                    type="button"
                    onClick={() => {
                      downloadAssignmentSheet(task);
                      showToast(`Đã tải về phiếu nhiệm vụ: ${task.title}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                    title="Tải văn bản hướng dẫn và yêu cầu nhiệm vụ này về máy"
                  >
                    <Download size={14} className="text-emerald-600" />
                    <span>Tải phiếu nhiệm vụ</span>
                  </button>

                  <button
                    disabled={task.isLocked}
                    onClick={() => onOpenSubmitModalWithTask(task.id)}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      task.isLocked
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Upload size={14} />
                    <span>{hasUserSubmitted ? 'Nộp lại / Cập nhật bài' : 'Làm bài & Nộp bài'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Giao / Sửa nhiệm vụ (Chỉ Tổ trưởng) */}
      {isModalOpen && isLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl my-8 p-6 border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingTask ? '✏️ Chỉnh Sửa Nhiệm Vụ Học Tập' : '📝 Giao Nhiệm Vụ Học Tập Mới'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingTask(null); }} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên nhiệm vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Nghiên cứu chuyên đề..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thời hạn nộp (Deadline) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đề bài học</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VD: Chương 4 - Hidrocacbon..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả nhiệm vụ</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nội dung cần thực hiện..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Yêu cầu & Tiêu chí hoàn thành</label>
                <input
                  type="text"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="VD: File Word tối thiểu 3 trang, kèm slide PowerPoint..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Định dạng file cho phép</label>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="Word (.docx), PowerPoint (.pptx), Video (.mp4)..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              {/* Phần lưu trữ tài liệu hướng dẫn đính kèm */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Paperclip size={14} className="text-blue-600" />
                      <span>Đính kèm tệp tin tài liệu / hướng dẫn ({taskAttachedFiles.length} tệp)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tải lên đề cương, phiếu bài tập hoặc slide hướng dẫn để thành viên tải về học tập
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => taskFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Chọn tệp từ máy</span>
                  </button>
                  <input
                    ref={taskFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleTaskFileUpload}
                  />
                </div>

                {/* Quick add sample guidance files */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                  <span className="text-slate-400 font-semibold">Tạo nhanh tệp mẫu:</span>
                  <button
                    type="button"
                    onClick={() => handleAddSampleTaskFile('docx')}
                    className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold transition-colors cursor-pointer"
                  >
                    + Đề cương .docx
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSampleTaskFile('pdf')}
                    className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-colors cursor-pointer"
                  >
                    + Phiếu bài tập .pdf
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSampleTaskFile('pptx')}
                    className="px-2 py-0.5 rounded bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold transition-colors cursor-pointer"
                  >
                    + Slide mẫu .pptx
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSampleTaskFile('xlsx')}
                    className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-colors cursor-pointer"
                  >
                    + Bảng mẫu .xlsx
                  </button>
                </div>

                {/* Danh sách tệp đính kèm hiện tại */}
                {taskAttachedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {taskAttachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                          <span className="font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400">({file.sizeFormatted})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              downloadFile(file);
                              showToast(`Đang tải tệp: ${file.name}`);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            title="Tải tệp này"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTaskFile(file.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Xóa tệp này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>{editingTask ? 'Lưu thay đổi nhiệm vụ' : 'Lưu & Giao nhiệm vụ học tập'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
