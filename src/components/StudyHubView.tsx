import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  FolderArchive,
  BookOpenCheck,
  Upload,
  Clapperboard,
  MessagesSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users2,
  FileCode,
  Layers,
  Download,
  Plus,
  Eye,
  Calendar,
  Clock,
  FileText,
  X,
  Trash2,
  Bookmark,
  Paperclip,
  Edit3,
  Check,
} from 'lucide-react';
import { Assignment, DocumentItem, FileItem, Member, ProductItem, Submission } from '../types';
import { TabKey } from './Sidebar';
import { APP_CONFIG, SUBJECTS, formatBytes } from '../config';
import { FileIconBadge } from './FileIconBadge';
import { processUploadedFile } from '../storage';
import {
  downloadFile,
  downloadAssignmentSheet,
  downloadTextAsFile,
  downloadStudySummaryPackage,
  downloadSubmissionReceipt,
  downloadProductSheet,
} from '../utils/fileDownloader';

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  content: string;
  authorName: string;
  createdAt: string;
  files?: FileItem[];
}

const DEFAULT_STUDY_NOTES: StudyNote[] = [
  {
    id: 'sn_1',
    title: 'Kế hoạch ôn tập chuyên đề Toán & Hóa học tuần 3',
    subject: 'Toán học',
    targetDate: '27/09/2026',
    content: 'Hoàn thành bài tập trắc nghiệm giải tích, chuẩn bị câu hỏi thắc mắc trước tiết ôn tập chuyên đề của Thầy Nguyễn Văn Út.',
    authorName: 'Trần Công Minh (Tổ trưởng)',
    createdAt: '2026-09-22',
    files: [
      {
        id: 'sn_f1',
        name: 'De_Cuong_Giai_Tich_12_Tuan3.pdf',
        size: 1850000,
        sizeFormatted: '1.8 MB',
        type: 'pdf',
        extension: 'pdf',
        uploadDate: '2026-09-22',
        uploaderName: 'Trần Công Minh',
      },
      {
        id: 'sn_f2',
        name: 'Bang_Cong_Thuc_Dao_Ham_Va_Tich_Phan.docx',
        size: 940000,
        sizeFormatted: '940 KB',
        type: 'word',
        extension: 'docx',
        uploadDate: '2026-09-22',
        uploaderName: 'Trần Công Minh',
      },
    ],
  },
  {
    id: 'sn_2',
    title: 'Phân công làm slide thuyết trình Ngữ văn & Lịch sử',
    subject: 'Ngữ văn',
    targetDate: '29/09/2026',
    content: 'Nhóm 1 phụ trách nội dung phân tích; Nhóm 2 thiết kế slide PowerPoint và chuẩn bị video tư liệu minh họa.',
    authorName: 'Trần Công Minh (Tổ trưởng)',
    createdAt: '2026-09-23',
    files: [
      {
        id: 'sn_f3',
        name: 'Slide_Thuyet_Trinh_Ngu_Van_12_To3.pptx',
        size: 3450000,
        sizeFormatted: '3.4 MB',
        type: 'powerpoint',
        extension: 'pptx',
        uploadDate: '2026-09-23',
        uploaderName: 'Trần Công Minh',
      },
    ],
  },
];

interface Props {
  documents: DocumentItem[];
  assignments: Assignment[];
  submissions: Submission[];
  products: ProductItem[];
  currentMember: Member;
  onNavigate: (tab: TabKey) => void;
  onOpenSubmitModal: () => void;
  onViewFile?: (file: FileItem) => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const StudyHubView: React.FC<Props> = ({
  documents,
  assignments,
  submissions,
  products,
  currentMember,
  onNavigate,
  onOpenSubmitModal,
  onViewFile,
  showToast = () => {},
}) => {
  const isLeader = currentMember.role === 'leader';

  // Quản lý ghi chú & kế hoạch học tập lưu trong LocalStorage
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>(() => {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY_PREFIX + 'study_notes');
    if (!raw) return DEFAULT_STUDY_NOTES;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_STUDY_NOTES;
    }
  });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<StudyNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState(SUBJECTS[0]);
  const [noteDate, setNoteDate] = useState('2026-09-27');
  const [noteContent, setNoteContent] = useState('');
  const [noteAttachedFiles, setNoteAttachedFiles] = useState<FileItem[]>([]);
  const noteFileInputRef = useRef<HTMLInputElement>(null);

  // Tab học liệu tiêu biểu
  const [activeResourceTab, setActiveResourceTab] = useState<'docs' | 'tasks' | 'subs' | 'prods'>('docs');

  const handleOpenCreateNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteSubject(SUBJECTS[0]);
    setNoteDate(new Date().toISOString().split('T')[0]);
    setNoteContent('');
    setNoteAttachedFiles([]);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: StudyNote) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteSubject(note.subject);
    setNoteDate(note.targetDate);
    setNoteContent(note.content);
    setNoteAttachedFiles(note.files || []);
    setIsNoteModalOpen(true);
  };

  const handleNoteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    try {
      const processed: FileItem[] = [];
      for (const f of fileList) {
        const item = await processUploadedFile(f);
        item.uploaderName = currentMember.name;
        item.uploadDate = new Date().toISOString().split('T')[0];
        processed.push(item);
      }
      setNoteAttachedFiles((prev) => [...prev, ...processed]);
      showToast(`Đã thêm ${processed.length} tệp đính kèm vào kế hoạch học tập!`, 'success');
    } catch {
      showToast('Không thể xử lý tệp tải lên!', 'error');
    }
    if (noteFileInputRef.current) noteFileInputRef.current.value = '';
  };

  const handleAddSampleStudyFile = (type: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'txt') => {
    const ext = type;
    const nameMap: Record<string, string> = {
      pdf: `Tai_Lieu_On_Tap_${noteSubject}_${Date.now().toString().slice(-4)}.pdf`,
      docx: `De_Cuong_Trong_Tam_${noteSubject}_${Date.now().toString().slice(-4)}.docx`,
      pptx: `Bai_Giang_Chuyen_De_${noteSubject}_${Date.now().toString().slice(-4)}.pptx`,
      xlsx: `Bang_Theo_Doi_Tien_Do_${noteSubject}_${Date.now().toString().slice(-4)}.xlsx`,
      txt: `Ghi_Chu_Kien_Thuc_${noteSubject}_${Date.now().toString().slice(-4)}.txt`,
    };
    const newFile: FileItem = {
      id: 'file_sample_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: nameMap[type] || `Tai_Lieu_${Date.now()}.${ext}`,
      size: 1540000,
      sizeFormatted: '1.5 MB',
      type: type === 'docx' ? 'word' : type === 'pptx' ? 'powerpoint' : type === 'xlsx' ? 'excel' : type === 'txt' ? 'text' : type,
      extension: ext,
      uploadDate: new Date().toISOString().split('T')[0],
      uploaderName: currentMember.name,
      isSimulated: false,
    };
    setNoteAttachedFiles((prev) => [...prev, newFile]);
    showToast(`Đã đính kèm tệp mẫu: ${newFile.name}`);
  };

  const handleRemoveAttachedFile = (fileId: string) => {
    setNoteAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('Đã gỡ tệp đính kèm');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      showToast('Vui lòng nhập tiêu đề kế hoạch học tập!', 'warning');
      return;
    }

    if (editingNote) {
      const updated = studyNotes.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              title: noteTitle.trim(),
              subject: noteSubject,
              targetDate: noteDate,
              content: noteContent.trim() || 'Nội dung kế hoạch học tập trọng tâm.',
              files: noteAttachedFiles,
            }
          : n
      );
      setStudyNotes(updated);
      localStorage.setItem(APP_CONFIG.STORAGE_KEY_PREFIX + 'study_notes', JSON.stringify(updated));
      showToast('Đã cập nhật kế hoạch học tập!');
    } else {
      const newNote: StudyNote = {
        id: 'sn_' + Date.now(),
        title: noteTitle.trim(),
        subject: noteSubject,
        targetDate: noteDate,
        content: noteContent.trim() || 'Nội dung kế hoạch học tập trọng tâm.',
        authorName: currentMember.name + (isLeader ? ' (Tổ trưởng)' : ''),
        createdAt: new Date().toISOString().split('T')[0],
        files: noteAttachedFiles,
      };
      const updated = [newNote, ...studyNotes];
      setStudyNotes(updated);
      localStorage.setItem(APP_CONFIG.STORAGE_KEY_PREFIX + 'study_notes', JSON.stringify(updated));
      showToast('Đã lưu kế hoạch & tệp học tập thành công!');
    }

    setIsNoteModalOpen(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteAttachedFiles([]);
  };

  const handleDeleteNote = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kế hoạch / học liệu học tập này không?')) return;
    const updated = studyNotes.filter((n) => n.id !== id);
    setStudyNotes(updated);
    localStorage.setItem(APP_CONFIG.STORAGE_KEY_PREFIX + 'study_notes', JSON.stringify(updated));
    showToast('Đã xóa kế hoạch học tập!');
  };

  const handleDownloadNote = (note: StudyNote) => {
    const fileListStr =
      note.files && note.files.length > 0
        ? note.files.map((f, i) => `  ${i + 1}. ${f.name} (${f.sizeFormatted})`).join('\n')
        : '  (Không có tệp đính kèm)';

    const text = `======================================================================
KẾ HOẠCH & HỌC LIỆU HỌC TẬP: ${note.title}
TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME} | TRƯỜNG THPT DƯƠNG MINH CHÂU
======================================================================
- Môn học: ${note.subject}
- Ngày hoàn thành dự kiến: ${note.targetDate}
- Người lập kế hoạch: ${note.authorName} (${note.createdAt})

NỘI DUNG TRỌNG TÂM:
${note.content}

DANH SÁCH TỆP TIN HỌC LIỆU ĐÍNH KÈM:
${fileListStr}

======================================================================
Chúc bạn hoàn thành xuất sắc mục tiêu học tập!
======================================================================`;
    downloadTextAsFile(`Ke_Hoach_${note.id}.txt`, text);
    showToast(`Đã tải về kế hoạch học tập: ${note.title}`);
  };

  const hubs = [
    {
      id: 'documents' as TabKey,
      title: '1. Kho Tài liệu dùng chung',
      subtitle: `${documents.length} tài liệu học tập`,
      icon: FolderArchive,
      color: 'from-blue-600 to-cyan-600',
      description: 'Đề cương ôn thi, giáo án Word, file Excel số liệu, slide PowerPoint và video thực nghiệm.',
    },
    {
      id: 'assignments' as TabKey,
      title: '2. Nhiệm vụ & Bài tập',
      subtitle: `${assignments.length} nhiệm vụ được giao`,
      icon: BookOpenCheck,
      color: 'from-amber-500 to-orange-600',
      description: 'Bài tập tuần, chuyên đề học tập, thời hạn nộp bài rõ ràng và trạng thái thực hiện.',
    },
    {
      id: 'submissions' as TabKey,
      title: '3. Nộp bài & Đánh giá',
      subtitle: `${submissions.length} lượt bài nộp đã ghi nhận`,
      icon: Upload,
      color: 'from-emerald-600 to-teal-600',
      description: 'Hỗ trợ nộp nhiều file cùng lúc, theo dõi phản hồi, điểm số và nhận xét từ Tổ trưởng / GVCN.',
    },
    {
      id: 'products' as TabKey,
      title: '4. Thư viện Sản phẩm học tập',
      subtitle: `${products.length} sản phẩm dự án chất lượng`,
      icon: Clapperboard,
      color: 'from-purple-600 to-pink-600',
      description: 'Video phim ngắn, bài hát hóa học, poster tuyên truyền và mô hình dự án của các nhóm.',
    },
    {
      id: 'discussions' as TabKey,
      title: '5. Diễn đàn Trao đổi & Hỏi đáp',
      subtitle: 'Thảo luận bài khó và họp nhóm',
      icon: MessagesSquare,
      color: 'from-indigo-600 to-blue-700',
      description: 'Trao đổi phương pháp giải, giải đáp thắc mắc và đóng góp ý kiến xây dựng nhóm.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Trung tâm Học tập Số */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-7 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-blue-100">
            <Sparkles size={14} className="text-amber-300" />
            <span>HỆ THỐNG QUẢN LÝ HỌC TẬP SỐ TỔ 3 – LỚP {APP_CONFIG.CLASS_NAME}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Trung Tâm Học Tập, Tài Liệu & Nhiệm Vụ Số
          </h2>

          <p className="text-sm text-blue-100/90 leading-relaxed">
            Nơi tập trung toàn bộ dữ liệu học tập của Tổ 3: Lưu trữ tài liệu, giao và nhận nhiệm vụ,
            nộp bài tập trực tuyến, quản lý sản phẩm dự án và thảo luận học tập.
          </p>

          {/* Quick Action Buttons (Chỗ lưu file & Tải file về trực tiếp) */}
          <div className="pt-2 flex flex-wrap gap-2.5 items-center">
            <button
              type="button"
              onClick={handleOpenCreateNote}
              className="px-4 py-2.5 bg-white text-blue-800 font-extrabold text-xs rounded-xl shadow-md hover:bg-blue-50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={15} className="text-blue-600" /> Lưu tệp & Kế hoạch học tập mới
            </button>

            <button
              type="button"
              onClick={() => {
                downloadStudySummaryPackage(documents, assignments, products);
                showToast('Đang tạo và tải về gói tổng hợp học liệu Tổ 3 (.txt)...');
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải tệp tổng hợp toàn bộ tài liệu, nhiệm vụ và sản phẩm Tổ 3"
            >
              <Download size={15} /> Tải toàn bộ học liệu (.txt)
            </button>

            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload size={15} /> Nộp bài tập mới
            </button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <GraduationCap size={320} />
        </div>
      </div>

      {/* Phân khu Kế hoạch & Ghi nhớ học tập đã lưu (Chỗ lưu file, tải file về và xóa được) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bookmark className="text-blue-600" size={18} />
              <span>Kế Hoạch & Tệp Học Tập Đã Lưu ({studyNotes.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lưu trữ tài liệu tự học, đề cương, đính kèm tệp tin và tải về hoặc xóa bất kỳ lúc nào
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateNote}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs cursor-pointer"
            >
              <Plus size={14} /> Thêm kế hoạch / Lưu file mới
            </button>
          </div>
        </div>

        {studyNotes.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Bookmark size={32} className="text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Chưa có kế hoạch học tập nào được lưu</h4>
            <p className="text-xs text-slate-400 mt-1">
              Bấm nút "Thêm kế hoạch / Lưu file mới" để tải lên tài liệu học tập của bạn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studyNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:border-blue-300 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                      {note.subject}
                    </span>
                    <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                      <Clock size={12} /> Hạn: {note.targetDate}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-2">
                    {note.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {note.content}
                  </p>

                  {/* Danh sách tệp đính kèm trong kế hoạch học tập */}
                  {note.files && note.files.length > 0 && (
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tệp tin đính kèm ({note.files.length}):
                      </span>
                      <div className="space-y-1">
                        {note.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                              <span className="font-semibold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                ({file.sizeFormatted})
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {onViewFile && (
                                <button
                                  type="button"
                                  onClick={() => onViewFile(file)}
                                  className="inline-flex items-center gap-0.5 px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  title="Xem trước tệp tin"
                                >
                                  <Eye size={12} /> Xem
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  downloadFile(file);
                                  showToast(`Đang tải tệp: ${file.name}`);
                                }}
                                className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                title="Tải tệp tin này về máy"
                              >
                                <Download size={12} className="text-emerald-600" /> Tải về
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer của Kế hoạch học tập */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Lập bởi: <b className="text-slate-600">{note.authorName}</b>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Tải phiếu kế hoạch */}
                    <button
                      type="button"
                      onClick={() => handleDownloadNote(note)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                      title="Tải toàn bộ kế hoạch này dưới dạng tệp văn bản .txt"
                    >
                      <Download size={12} className="text-emerald-600" />
                      <span>Tải phiếu (.txt)</span>
                    </button>

                    {/* Sửa kế hoạch */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditNote(note)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa nội dung & tệp đính kèm"
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* Xóa kế hoạch */}
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa kế hoạch học tập này khỏi hệ thống"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid 5 Phân khu học tập */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <div
              key={hub.id}
              onClick={() => onNavigate(hub.id)}
              className="group cursor-pointer bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${hub.color} text-white flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon size={24} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {hub.title}
                </h3>
                <span className="text-xs font-semibold text-blue-600 block mt-1">
                  {hub.subtitle}
                </span>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {hub.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-blue-600">
                <span>Vào chi tiết & Quản lý lưu trữ</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Kho Học Liệu & Nhiệm Vụ Tiêu Biểu Có Sẵn Để Tải Về Trực Tiếp */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Download className="text-emerald-600" size={20} />
              <span>Học Liệu, Nhiệm Vụ & Sản Phẩm Tiêu Biểu (Tải Về Trực Tiếp)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bấm "Tải về" để tải ngay tệp tin bài học, bài tập hoặc sản phẩm về máy tính / điện thoại
            </p>
          </div>

          {/* Tab chọn loại học liệu */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveResourceTab('docs')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeResourceTab === 'docs'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tài liệu ({documents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveResourceTab('tasks')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeResourceTab === 'tasks'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nhiệm vụ ({assignments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveResourceTab('subs')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeResourceTab === 'subs'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bài nộp ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveResourceTab('prods')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeResourceTab === 'prods'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sản phẩm ({products.length})
            </button>
          </div>
        </div>

        {/* Nội dung tương ứng theo tab */}
        {activeResourceTab === 'docs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.slice(0, 6).map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:border-blue-300 transition-all space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {doc.subject}
                    </span>
                    <span>{doc.file.sizeFormatted}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 truncate" title={doc.title}>
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {doc.file.name}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                  {onViewFile && (
                    <button
                      type="button"
                      onClick={() => onViewFile(doc.file)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <Eye size={12} /> Xem
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      downloadFile(doc.file);
                      showToast(`Đang tải tài liệu: ${doc.file.name}`);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 cursor-pointer"
                  >
                    <Download size={12} className="text-emerald-600" /> Tải về
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeResourceTab === 'tasks' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignments.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:border-amber-300 transition-all space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {task.subject}
                    </span>
                    <span className="text-slate-500 font-medium">Hạn: {task.dueDate}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 truncate" title={task.title}>
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {task.requirements}
                  </p>

                  {/* Attached files preview */}
                  {task.attachedFiles && task.attachedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {task.attachedFiles.map((f) => (
                        <div key={f.id} className="flex items-center justify-between text-[11px] bg-white p-1 rounded-md border border-slate-200">
                          <span className="truncate text-slate-700 max-w-[140px]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              downloadFile(f);
                              showToast(`Đang tải tệp nhiệm vụ: ${f.name}`);
                            }}
                            className="text-emerald-700 font-bold hover:underline cursor-pointer"
                          >
                            Tải tệp
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => {
                      downloadAssignmentSheet(task);
                      showToast(`Đã tải về phiếu nhiệm vụ: ${task.title}`);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 cursor-pointer"
                  >
                    <Download size={12} className="text-emerald-600" /> Tải phiếu (.txt)
                  </button>

                  <button
                    type="button"
                    onClick={onOpenSubmitModal}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <Upload size={12} /> Nộp bài
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeResourceTab === 'subs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {submissions.slice(0, 6).map((sub) => {
              const file = sub.files && sub.files.length > 0 ? sub.files[0] : null;
              return (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:border-emerald-300 transition-all space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {sub.studentName}
                      </span>
                      {sub.score !== undefined && (
                        <span className="font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {sub.score}/10 điểm
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 truncate" title={sub.assignmentTitle}>
                      {sub.assignmentTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {sub.title || 'Bài làm của học sinh'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => {
                        downloadSubmissionReceipt(sub);
                        showToast(`Đã tải về phiếu bài nộp của ${sub.studentName}!`);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 cursor-pointer"
                    >
                      <Download size={12} className="text-emerald-600" /> Tải phiếu nộp
                    </button>

                    {file && (
                      <button
                        type="button"
                        onClick={() => {
                          downloadFile(file);
                          showToast(`Đang tải tệp bài làm: ${file.name}`);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <Download size={12} /> Tải tệp bài
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeResourceTab === 'prods' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.slice(0, 6).map((prod) => {
              const file = prod.files && prod.files.length > 0 ? prod.files[0] : null;
              return (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:border-purple-300 transition-all space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {prod.subject}
                      </span>
                      <span>{prod.authorGroup}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 truncate" title={prod.title}>
                      {prod.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {prod.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => {
                        downloadProductSheet(prod);
                        showToast(`Đã tải về phiếu sản phẩm: ${prod.title}`);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      <Download size={12} /> Phiếu SP
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (file) {
                          downloadFile(file);
                          showToast(`Đang tải tệp sản phẩm: ${file.name}`);
                        } else {
                          downloadProductSheet(prod);
                          showToast(`Đã tải về tóm tắt sản phẩm: ${prod.title}`);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 cursor-pointer"
                    >
                      <Download size={12} className="text-emerald-600" /> Tải về
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Kế Hoạch & Tệp Học Tập (Chỗ Lưu File & Quản Lý) */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <Bookmark size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingNote ? 'Chỉnh Sửa Kế Hoạch & Tệp Học Tập' : 'Lưu Tệp & Kế Hoạch Học Tập Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lưu trữ tài liệu học tập của bạn, đính kèm tệp tin và tải về hoặc xóa dễ dàng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setEditingNote(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề tài liệu / Kế hoạch học tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Ví dụ: Đề cương ôn tập trắc nghiệm Toán học hoặc Slide Hóa học tuần 3..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hạn hoàn thành / Ngày lưu</label>
                  <input
                    type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung chi tiết & Ghi chú ôn tập
                </label>
                <textarea
                  rows={2}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Ghi chú cụ thể các bài tập cần làm, công thức cần nhớ hoặc hướng dẫn..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Chỗ Lưu File Học Tập: Tải file từ máy tính hoặc đính kèm file */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs">
                    <Paperclip size={14} className="text-blue-600" />
                    <span>Đính kèm tệp học tập (Chỗ lưu file)</span>
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    Đã đính kèm: {noteAttachedFiles.length} tệp
                  </span>
                </div>

                {/* Nút tải tệp thực tế từ máy tính */}
                <input
                  type="file"
                  ref={noteFileInputRef}
                  onChange={handleNoteFileUpload}
                  multiple
                  className="hidden"
                  id="study-note-file-input"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="study-note-file-input"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-2xs text-xs"
                  >
                    <Upload size={13} />
                    <span>Chọn tệp từ máy tính</span>
                  </label>

                  {/* Nút thêm nhanh tệp mẫu */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddSampleStudyFile('pdf')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-bold text-[10px] cursor-pointer"
                    >
                      + PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleStudyFile('docx')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-bold text-[10px] cursor-pointer"
                    >
                      + Word
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSampleStudyFile('pptx')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-bold text-[10px] cursor-pointer"
                    >
                      + Slide
                    </button>
                  </div>
                </div>

                {/* Danh sách tệp đã chọn kèm nút xóa tệp */}
                {noteAttachedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {noteAttachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                          <span className="font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            ({file.sizeFormatted})
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Nút tải về thử nghiệm ngay trong modal */}
                          <button
                            type="button"
                            onClick={() => {
                              downloadFile(file);
                              showToast(`Đang tải thử tệp: ${file.name}`);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Tải tệp này về máy"
                          >
                            <Download size={13} />
                          </button>

                          {/* Nút xóa tệp đính kèm */}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachedFile(file.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa tệp này khỏi danh sách"
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
                  onClick={() => {
                    setIsNoteModalOpen(false);
                    setEditingNote(null);
                  }}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>{editingNote ? 'Cập nhật kế hoạch & tệp' : 'Lưu tệp học tập'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
