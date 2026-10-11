import React, { useState, useRef } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  Lock,
  Share2,
  BookOpen,
  FileCheck,
  X,
  Upload,
} from 'lucide-react';
import {
  DocumentItem,
  DocumentCategory,
  DocumentPermission,
  FileItem,
  Member,
  FileTypeCategory,
} from '../types';
import { APP_CONFIG, DOCUMENT_CATEGORIES, SUBJECTS, formatBytes } from '../config';
import { FileIconBadge } from './FileIconBadge';
import { processUploadedFile } from '../storage';
import { downloadFile, downloadTextAsFile } from '../utils/fileDownloader';

interface Props {
  documents: DocumentItem[];
  currentMember: Member;
  onUpdateDocuments: (docs: DocumentItem[]) => void;
  onDeleteDocument?: (doc: DocumentItem) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onViewFile: (file: FileItem) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const DocumentsView: React.FC<Props> = ({
  documents,
  currentMember,
  onUpdateDocuments,
  onDeleteDocument,
  onOpenTrash,
  trashCount = 0,
  onViewFile,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');

  // Modal tạo/sửa tài liệu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('📘 Học tập');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [permission, setPermission] = useState<DocumentPermission>('whole_team');
  const [attachedFile, setAttachedFile] = useState<FileItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const filteredDocs = documents.filter((doc) => {
    const matchSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.topic.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchSubject = selectedSubject === 'all' || doc.subject === selectedSubject;
    const matchFileType = selectedFileType === 'all' || doc.file.type === selectedFileType;

    return matchSearch && matchCategory && matchSubject && matchFileType;
  });

  const handleOpenCreate = () => {
    setEditingDoc(null);
    setTitle('');
    setDescription('');
    setCategory('📘 Học tập');
    setSubject(SUBJECTS[0]);
    setTopic('');
    setPermission('whole_team');
    // Default sample attached file
    setAttachedFile({
      id: 'f_' + Date.now(),
      name: 'Tai_lieu_hoc_tap_To3.docx',
      size: 1100000,
      sizeFormatted: '1.1 MB',
      type: 'word',
      extension: 'docx',
      contentPreview: 'Tài liệu học tập chia sẻ chung cho các thành viên Tổ 3.',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: DocumentItem) => {
    // Kiểm tra quyền chỉnh sửa
    const canEdit = isLeader || doc.creatorId === currentMember.id || doc.permission === 'can_edit';
    if (!canEdit) {
      showToast('Bạn không có quyền chỉnh sửa tài liệu này!', 'warning');
      return;
    }

    setEditingDoc(doc);
    setTitle(doc.title);
    setDescription(doc.description);
    setCategory(doc.category);
    setSubject(doc.subject);
    setTopic(doc.topic);
    setPermission(doc.permission);
    setAttachedFile(doc.file);
    setIsModalOpen(true);
  };

  const handleDelete = (doc: DocumentItem) => {
    const canDelete = isLeader || doc.creatorId === currentMember.id;
    if (!canDelete) {
      showToast('Chỉ người tải lên hoặc Tổ trưởng mới có quyền xóa tài liệu này!', 'warning');
      return;
    }

    if (onDeleteDocument) {
      onDeleteDocument(doc);
    } else {
      onUpdateDocuments(documents.filter((d) => d.id !== doc.id));
    }
    showToast(`Đã chuyển tài liệu "${doc.title}" vào Thùng rác. Có thể khôi phục bất cứ lúc nào!`, 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxBytes = APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
      if (file.size > maxBytes) {
        showToast(
          `Cảnh báo: Tệp "${file.name}" dung lượng (${formatBytes(file.size)}) vượt mức cấu hình ${APP_CONFIG.MAX_FILE_SIZE_MB}MB!`,
          'warning'
        );
      }
      const processed = await processUploadedFile(file);
      setAttachedFile(processed);
      showToast(`Đã đính kèm tệp: ${file.name}`);
    }
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tên tài liệu!', 'warning');
      return;
    }
    if (!attachedFile) {
      showToast('Vui lòng đính kèm tệp tin tài liệu!', 'warning');
      return;
    }

    if (editingDoc) {
      const updated = documents.map((d) =>
        d.id === editingDoc.id
          ? {
              ...d,
              title: title.trim(),
              description: description.trim(),
              category: category,
              subject: subject,
              topic: topic.trim(),
              permission: permission,
              file: attachedFile,
            }
          : d
      );
      onUpdateDocuments(updated);
      showToast('Đã cập nhật tài liệu thành công!');
    } else {
      const newDoc: DocumentItem = {
        id: 'doc_' + Date.now(),
        title: title.trim(),
        description: description.trim(),
        creatorId: currentMember.id,
        creatorName: currentMember.name,
        createdAt: new Date().toLocaleString('vi-VN'),
        category: category,
        subject: subject,
        topic: topic.trim(),
        permission: permission,
        file: attachedFile,
      };
      onUpdateDocuments([newDoc, ...documents]);
      showToast('Đã tải tài liệu lên thành công!');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">📂 Kho Tài Liệu Học Tập Tổ 3</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              {documents.length} tệp
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hỗ trợ Word, PDF, Excel, PowerPoint, Video, Audio bài giảng, hình ảnh và tệp nén
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Nút Tải toàn bộ danh mục tài liệu */}
          <button
            onClick={() => {
              const summary = `DANH MỤC TÀI LIỆU HỌC TẬP TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME} (${APP_CONFIG.SCHOOL_YEAR})\nTổng số: ${documents.length} tài liệu\n\n` +
                documents.map((d, i) => `${i + 1}. [${d.subject}] ${d.title}\n   - Danh mục: ${d.category}\n   - Tệp tin: ${d.file.name} (${d.file.sizeFormatted})\n   - Người tải lên: ${d.creatorName} (${d.createdAt})\n   - Mô tả: ${d.description}\n`).join('\n');
              downloadTextAsFile(`Danh_Muc_Tai_Lieu_To3_${new Date().toISOString().split('T')[0]}.txt`, summary);
              showToast('Đã tải xuống danh mục tài liệu học tập!');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-xs cursor-pointer"
            title="Tải toàn bộ danh mục tài liệu học tập dạng văn bản"
          >
            <Download size={15} className="text-emerald-600" />
            <span>Tải danh mục (.txt)</span>
          </button>

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
              title="Xem và khôi phục tài liệu đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Thêm tài liệu mới
          </button>
        </div>
      </div>

      {/* Filter Bar (Section XIX & XX) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tài liệu, chủ đề, người tạo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">📂 Tất cả phân loại ({DOCUMENT_CATEGORIES.length})</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">📚 Tất cả môn học</option>
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* File Type Filter */}
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">📎 Tất cả loại file</option>
            <option value="word">📄 Word (.docx)</option>
            <option value="pdf">📕 PDF (.pdf)</option>
            <option value="excel">📊 Excel (.xlsx)</option>
            <option value="powerpoint">📽 PowerPoint (.pptx)</option>
            <option value="video">🎬 Video (.mp4)</option>
            <option value="audio">🎵 Âm thanh (.mp3)</option>
            <option value="image">🖼 Hình ảnh</option>
            <option value="text">📝 Văn bản (.txt)</option>
            <option value="archive">📦 File nén (.zip)</option>
          </select>
        </div>

        {/* Quick file format chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1 pb-1">
          <span className="text-slate-400 font-semibold shrink-0">Định dạng nhanh:</span>
          {['all', 'word', 'pdf', 'excel', 'powerpoint', 'video', 'audio', 'image'].map((typeKey) => (
            <button
              key={typeKey}
              onClick={() => setSelectedFileType(typeKey)}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors uppercase ${
                selectedFileType === typeKey
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {typeKey === 'all' ? 'Tất cả' : typeKey}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid (Section VII & VIII) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => {
          const canEdit = isLeader || doc.creatorId === currentMember.id || doc.permission === 'can_edit';
          const canDelete = isLeader || doc.creatorId === currentMember.id;

          let permBadge = '🌐 Toàn tổ';
          if (doc.permission === 'view_only') permBadge = '🔒 Chỉ xem';
          if (doc.permission === 'can_edit') permBadge = '✏ Cho phép sửa';
          if (doc.permission === 'group') permBadge = '👥 Nhóm học';

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileIconBadge type={doc.file.type} extension={doc.file.extension} size="md" />
                    <div className="truncate">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {doc.subject}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium ml-1.5">
                        {doc.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0"
                    title={`Quyền tài liệu: ${permBadge}`}
                  >
                    {permBadge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1.5" title={doc.title}>
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {doc.description}
                </p>

                {/* File Attachment Card */}
                <div
                  onClick={() => onViewFile(doc.file)}
                  className="cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIconBadge type={doc.file.type} extension={doc.file.extension} size="sm" />
                    <span className="font-semibold text-slate-800 truncate" title={doc.file.name}>
                      {doc.file.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">
                    {doc.file.sizeFormatted}
                  </span>
                </div>

                {/* Metadata */}
                <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Tạo bởi: <b className="text-slate-600">{doc.creatorName}</b></span>
                  <span>{doc.createdAt}</span>
                </div>
              </div>

              {/* Action Buttons (Section VII) */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Nút Xem (Mở viewer tương thích) */}
                  <button
                    onClick={() => onViewFile(doc.file)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye size={13} /> Xem
                  </button>

                  {/* Nút Tải xuống tệp tin trực tiếp */}
                  <button
                    onClick={() => {
                      downloadFile(doc.file);
                      showToast(`Đang tải tệp tin "${doc.file.name}" về thiết bị...`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg transition-colors border border-emerald-200 shadow-2xs cursor-pointer"
                    title={`Tải tệp tin ${doc.file.name} về máy tính`}
                  >
                    <Download size={13} /> Tải về
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Nút Sửa (Nếu có quyền) */}
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      canEdit
                        ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title={canEdit ? 'Chỉnh sửa tài liệu' : 'Bạn không có quyền sửa tài liệu này'}
                  >
                    {canEdit ? <Edit2 size={15} /> : <Lock size={13} />}
                  </button>

                  {/* Nút Xóa (Chỉ người tạo hoặc Tổ trưởng) */}
                  <button
                    onClick={() => handleDelete(doc)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      canDelete
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title={canDelete ? 'Xóa tài liệu' : 'Chỉ người tải lên hoặc Tổ trưởng mới được xóa'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <FolderArchive size={40} className="text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">Không tìm thấy tài liệu phù hợp</h4>
          <p className="text-xs text-slate-500 mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.</p>
        </div>
      )}

      {/* Modal Thêm / Chỉnh sửa Tài liệu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl my-8 p-6 border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingDoc ? 'Chỉnh sửa thông tin tài liệu' : 'Đăng tải tài liệu học tập mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên tài liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Đề cương ôn tập Toán 11 HK2..."
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
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  >
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đề / Chuyên đề</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="VD: Đạo hàm & Tiếp tuyến, Quang hình học..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nội dung tài liệu..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quyền truy cập (Section XVII)</label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as DocumentPermission)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                >
                  <option value="whole_team">🌐 Chia sẻ toàn tổ (Tất cả thành viên đều được xem & tải)</option>
                  <option value="can_edit">✏ Có thể chỉnh sửa (Thành viên được cập nhật nội dung)</option>
                  <option value="group">👥 Cộng tác nhóm (Chỉ nhóm học tập liên quan)</option>
                  <option value="view_only">🔒 Chỉ xem (Chỉ người tạo/Tổ trưởng được chỉnh sửa)</option>
                </select>
              </div>

              {/* Tệp đính kèm */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn tệp tin tài liệu từ máy tính <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 p-4 rounded-2xl text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-colors"
                >
                  {attachedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileIconBadge type={attachedFile.type} extension={attachedFile.extension} size="sm" />
                      <div className="text-left">
                        <p className="font-bold text-slate-800">{attachedFile.name}</p>
                        <p className="text-slate-500 text-[10px]">{attachedFile.sizeFormatted} • Bấm để đổi file khác</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={20} className="mx-auto text-blue-600 mb-1" />
                      <span className="font-bold text-blue-600">Bấm để tải tệp lên</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Word, PDF, PPTX, Excel, Video, MP3...</p>
                    </div>
                  )}
                </div>
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
                  <span>{editingDoc ? 'Lưu thay đổi tài liệu' : 'Lưu tài liệu vào kho'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
