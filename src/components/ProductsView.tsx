import React, { useState, useRef } from 'react';
import {
  Clapperboard,
  Search,
  Plus,
  Eye,
  Download,
  Edit2,
  Trash2,
  Sparkles,
  Users,
  X,
  Play,
  Music,
  Image as ImageIcon,
  Upload,
  Paperclip,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
import { FileItem, Member, ProductItem } from '../types';
import { APP_CONFIG, SUBJECTS, formatBytes, isLeaderMember, isTeacherMember } from '../config';
import { FileIconBadge } from './FileIconBadge';
import { processUploadedFile } from '../storage';
import {
  downloadFile,
  downloadTextAsFile,
  downloadProductSheet,
} from '../utils/fileDownloader';

interface Props {
  products: ProductItem[];
  members: Member[];
  currentMember: Member;
  onUpdateProducts: (prods: ProductItem[]) => void;
  onDeleteProduct?: (prod: ProductItem) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  onViewFile: (file: FileItem) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const ProductsView: React.FC<Props> = ({
  products,
  members,
  currentMember,
  onUpdateProducts,
  onDeleteProduct,
  onOpenTrash,
  trashCount = 0,
  onViewFile,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Modal tạo / sửa sản phẩm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<ProductItem | null>(null);

  const [title, setTitle] = useState('');
  const [authorGroup, setAuthorGroup] = useState('Nhóm 1 - Tự nhiên');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([currentMember.name]);
  const [productFileType, setProductFileType] = useState<'video' | 'audio' | 'image' | 'powerpoint' | 'pdf' | 'word'>('video');
  const [productAttachedFiles, setProductAttachedFiles] = useState<FileItem[]>([]);
  const [onlineUrl, setOnlineUrl] = useState('');

  const prodFileInputRef = useRef<HTMLInputElement>(null);

  const handleProductFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: FileItem[] = [];
      const maxBytes = APP_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.size > maxBytes) {
          showToast(`Cảnh báo: Tệp "${file.name}" dung lượng vượt ${APP_CONFIG.MAX_FILE_SIZE_MB}MB!`, 'warning');
        }
        try {
          const item = await processUploadedFile(file);
          newItems.push(item);
        } catch (err) {
          console.error(err);
        }
      }
      setProductAttachedFiles((prev) => [...prev, ...newItems]);
      showToast(`Đã đính kèm ${newItems.length} tệp sản phẩm!`);
    }
  };

  const handleAddSampleProdFile = (type: 'video' | 'audio' | 'image' | 'powerpoint' | 'pdf' | 'word') => {
    const defaultName = title.trim() ? title.trim().replace(/\s+/g, '_') : 'San_Pham_To3';
    const demoFiles: Record<string, FileItem> = {
      video: {
        id: 'pf_' + Date.now(),
        name: `Video_${defaultName}.mp4`,
        size: 24000000,
        sizeFormatted: '22.8 MB',
        type: 'video',
        extension: 'mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        contentPreview: `Video bài giảng & thuyết trình sản phẩm học tập: ${title || 'Chuyên đề Tổ 3'}. Bám sát chuẩn SGK Kết nối tri thức.`,
      },
      audio: {
        id: 'pf_' + Date.now(),
        name: `Audio_${defaultName}.mp3`,
        size: 3800000,
        sizeFormatted: '3.6 MB',
        type: 'audio',
        extension: 'mp3',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        contentPreview: `Ghi âm & âm nhạc dự án học tập: ${title || 'Khúc ca học tập Tổ 3'} do các bạn thành viên tự biên soạn.`,
      },
      image: {
        id: 'pf_' + Date.now(),
        name: `Poster_${defaultName}.png`,
        size: 3100000,
        sizeFormatted: '2.9 MB',
        type: 'image',
        extension: 'png',
        url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80',
        contentPreview: `Poster trực quan & infographic giới thiệu chuyên đề: ${title || 'Sản phẩm học tập Tổ 3'}.`,
      },
      powerpoint: {
        id: 'pf_' + Date.now(),
        name: `Slide_${defaultName}.ppt`,
        size: 5200000,
        sizeFormatted: '4.9 MB',
        type: 'powerpoint',
        extension: 'ppt',
        contentPreview: `Bộ slide trình chiếu báo cáo dự án học tập: ${title || 'Chuyên đề Tổ 3'} gồm 3 slide đầy đủ mở đầu, nội dung và kết luận.`,
      },
      pdf: {
        id: 'pf_' + Date.now(),
        name: `Bao_cao_${defaultName}.pdf`,
        size: 2100000,
        sizeFormatted: '2.0 MB',
        type: 'pdf',
        extension: 'pdf',
        contentPreview: `Tài liệu thuyết minh hoàn chỉnh định dạng PDF: ${title || 'Báo cáo học tập Tổ 3'} đạt chuẩn lưu trữ.`,
      },
      word: {
        id: 'pf_' + Date.now(),
        name: `Thuyet_minh_${defaultName}.doc`,
        size: 1300000,
        sizeFormatted: '1.3 MB',
        type: 'word',
        extension: 'doc',
        contentPreview: `Văn bản Word thuyết minh chi tiết: ${title || 'Bản mô tả dự án Tổ 3'} kèm bảng phân công và đánh giá.`,
      },
    };

    setProductAttachedFiles((prev) => [...prev, demoFiles[type]]);
    showToast(`Đã thêm tệp mẫu mở được 100%: ${demoFiles[type].name}`);
  };

  const handleAddOnlineLink = () => {
    if (!onlineUrl.trim()) {
      showToast('Vui lòng nhập đường liên kết trực tuyến!', 'warning');
      return;
    }
    const defaultName = title.trim() ? title.trim().replace(/\s+/g, '_') : 'Lien_ket';
    const linkItem: FileItem = {
      id: 'pf_link_' + Date.now(),
      name: `Lien_ket_${defaultName}.link`,
      size: 1024,
      sizeFormatted: '1 KB',
      type: 'text',
      extension: 'link',
      url: onlineUrl.trim(),
      contentPreview: `Đường dẫn trực tuyến: ${onlineUrl.trim()}`,
    };
    setProductAttachedFiles((prev) => [...prev, linkItem]);
    setOnlineUrl('');
    showToast('Đã thêm liên kết trực tuyến vào sản phẩm!');
  };

  const handleRemoveProdFile = (fileId: string) => {
    setProductAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.authorGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.participants.some((name) => name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchSub = selectedSubject === 'all' || p.subject === selectedSubject;
    return matchSearch && matchSub;
  });

  // Mở modal sửa sản phẩm - Cho phép cả Tổ trưởng, Người tạo VÀ Thành viên tham gia sửa
  const handleOpenEdit = (prod: ProductItem) => {
    const isParticipant = prod.participants?.some(
      (name) => name.trim().toLowerCase() === currentMember.name.trim().toLowerCase()
    );
    const canEdit = isLeader || prod.creatorName === currentMember.name || isParticipant;
    if (!canEdit) {
      showToast('Chỉ thành viên tham gia, người tạo hoặc Tổ trưởng mới có quyền sửa sản phẩm này!', 'warning');
      return;
    }
    setEditingProd(prod);
    setTitle(prod.title);
    setAuthorGroup(prod.authorGroup);
    setSubject(prod.subject);
    setTopic(prod.topic);
    setDescription(prod.description);
    setSelectedParticipants(
      prod.participants && prod.participants.length > 0
        ? prod.participants
        : [currentMember.name]
    );
    setProductAttachedFiles(prod.files && prod.files.length > 0 ? prod.files : (prod.mainFile ? [prod.mainFile] : []));
    setIsModalOpen(true);
  };

  // Chuẩn hóa danh sách thành viên tham gia theo đúng danh sách Tổ 3 hiện tại
  const handleNormalizeAllParticipants = () => {
    const validMemberNames = members.map((m) => m.name.trim().toLowerCase());
    let fixedCount = 0;

    const normalized = products.map((prod) => {
      // Lọc giữ lại bạn nào có tên trong danh sách tổ
      const validParticipants = prod.participants.filter((pName) =>
        validMemberNames.includes(pName.trim().toLowerCase())
      );

      // Nếu không còn bạn nào trong tổ thì gán cho thành viên hiện tại hoặc người tạo
      const finalParts =
        validParticipants.length > 0
          ? validParticipants
          : [currentMember.name];

      if (
        finalParts.length !== prod.participants.length ||
        !prod.participants.every((n, i) => n === finalParts[i])
      ) {
        fixedCount++;
        return {
          ...prod,
          participants: finalParts,
        };
      }
      return prod;
    });

    if (fixedCount > 0) {
      onUpdateProducts(normalized);
      showToast(
        `Đã chuẩn hóa thành viên tham gia cho ${fixedCount} sản phẩm theo đúng danh sách Tổ 3!`,
        'success'
      );
    } else {
      showToast('Tất cả sản phẩm đã khớp chuẩn với danh sách thành viên Tổ 3!', 'success');
    }
  };

  const handleDelete = (prod: ProductItem) => {
    const canDelete = isLeader || prod.creatorName === currentMember.name;
    if (!canDelete) {
      showToast('Chỉ người tạo hoặc Tổ trưởng mới được xóa sản phẩm này!', 'error');
      return;
    }
    if (onDeleteProduct) {
      onDeleteProduct(prod);
    } else {
      onUpdateProducts(products.filter((p) => p.id !== prod.id));
    }
    showToast(`Đã chuyển sản phẩm "${prod.title}" vào Thùng rác. Có thể khôi phục bất cứ lúc nào!`, 'success');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tên sản phẩm!', 'warning');
      return;
    }

    // Đảm bảo có ít nhất 1 thành viên tham gia
    const finalParticipants =
      selectedParticipants.length > 0 ? selectedParticipants : [currentMember.name];

    // Nếu chưa đính kèm tệp nào, tự tạo tệp theo định dạng đã chọn với nội dung mở được 100%
    let finalFiles = [...productAttachedFiles];
    if (finalFiles.length === 0) {
      const defaultName = title.trim().replace(/\s+/g, '_');
      const ext =
        productFileType === 'powerpoint'
          ? 'ppt'
          : productFileType === 'image'
          ? 'png'
          : productFileType === 'audio'
          ? 'mp3'
          : productFileType === 'pdf'
          ? 'pdf'
          : productFileType === 'word'
          ? 'doc'
          : 'mp4';

      const fallbackFile: FileItem = {
        id: 'pf_' + Date.now(),
        name: `SanPham_${defaultName}.${ext}`,
        size: 4500000,
        sizeFormatted: '4.5 MB',
        type: productFileType as any,
        extension: ext,
        url:
          productFileType === 'video'
            ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
            : productFileType === 'audio'
            ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
            : productFileType === 'image'
            ? 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80'
            : undefined,
        contentPreview: `Sản phẩm học tập: ${title.trim()} (${subject}) do nhóm ${authorGroup} thực hiện. Thành viên tham gia: ${finalParticipants.join(', ')}.`,
      };
      finalFiles = [fallbackFile];
    }

    if (editingProd) {
      const updated = products.map((p) =>
        p.id === editingProd.id
          ? {
              ...p,
              title: title.trim(),
              authorGroup,
              subject,
              topic: topic.trim() || 'Học kỳ II',
              description: description.trim(),
              participants: finalParticipants,
              mainFile: finalFiles[0],
              files: finalFiles,
            }
          : p
      );
      onUpdateProducts(updated);
      showToast(`Đã cập nhật sản phẩm "${title}" thành công!`);
    } else {
      const newProduct: ProductItem = {
        id: 'prod_' + Date.now(),
        title: title.trim(),
        subject: subject,
        topic: topic.trim() || 'Học kỳ II',
        description: description.trim() || 'Sản phẩm học tập xuất sắc của các thành viên Tổ 3.',
        authorGroup: authorGroup,
        participants: finalParticipants,
        creatorName: currentMember.name,
        createdAt: new Date().toISOString().split('T')[0],
        mainFile: finalFiles[0],
        files: finalFiles,
      };

      onUpdateProducts([newProduct, ...products]);
      showToast('Đã lưu sản phẩm học tập vào thư viện thành công (Tải về mở được 100%)!');
    }

    setIsModalOpen(false);
    setEditingProd(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">🎬 Thư Viện Sản Phẩm Học Tập Tổ 3</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
              {products.length} sản phẩm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Không gian trưng bày video thuyết trình, bài hát dự án, poster, slide và mô hình học tập
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Nút tải danh mục sản phẩm */}
          <button
            onClick={() => {
              const summary = `DANH MỤC SẢN PHẨM HỌC TẬP TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME} (${APP_CONFIG.SCHOOL_YEAR})\nTổng số: ${products.length} sản phẩm dự án\n\n` +
                products.map((p, i) => `${i + 1}. [${p.subject}] ${p.title}\n   - Thể loại: ${p.category} | Nhóm: ${p.authorGroup}\n   - Thành viên tham gia: ${p.participants.join(', ')}\n   - Tệp chính: ${p.mainFile?.name || 'Đa phương tiện'}\n   - Người đăng: ${p.creatorName} (${p.createdAt})\n   - Mô tả: ${p.description}\n`).join('\n');
              downloadTextAsFile(`Danh_Muc_San_Pham_To3_${new Date().toISOString().split('T')[0]}.txt`, summary);
              showToast('Đã tải xuống danh mục sản phẩm học tập!');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-xs cursor-pointer"
            title="Tải toàn bộ danh mục sản phẩm học tập dạng văn bản"
          >
            <Download size={15} className="text-emerald-600" />
            <span>Tải danh mục (.txt)</span>
          </button>

          {/* Nút rà soát & chuẩn hóa danh sách thành viên tham gia */}
          <button
            onClick={handleNormalizeAllParticipants}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors shadow-xs cursor-pointer"
            title="Rà soát danh sách thành viên: giữ lại bạn có tên trong tổ, sửa lại bạn chưa đúng"
          >
            <Users size={15} className="text-purple-600" />
            <span>Chuẩn hóa thành viên tổ</span>
          </button>

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              title="Xem và khôi phục sản phẩm đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingProd(null);
              setTitle('');
              setDescription('');
              setTopic('');
              setSelectedParticipants([currentMember.name]);
              setProductAttachedFiles([]);
              setOnlineUrl('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Đăng sản phẩm mới
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
            placeholder="Tìm tên sản phẩm, tác giả, nhóm..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
        >
          <option value="all">📚 Tất cả các môn học</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid (Section XV) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => {
          const mainFile = prod.files[0];
          const isParticipant = prod.participants?.some(
            (name) => name.trim().toLowerCase() === currentMember.name.trim().toLowerCase()
          );
          const canEdit = isLeader || prod.creatorName === currentMember.name || isParticipant;
          const canDelete = isLeader || prod.creatorName === currentMember.name;

          return (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              {/* Product Media Preview Banner */}
              <div className="relative h-44 bg-slate-900 overflow-hidden flex items-center justify-center">
                {mainFile?.type === 'image' ? (
                  <img
                    src={mainFile.url || 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80'}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : mainFile?.type === 'video' ? (
                  <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80"
                      alt="video thumbnail"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute w-12 h-12 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Play size={20} className="ml-1" />
                    </div>
                  </div>
                ) : mainFile?.type === 'audio' ? (
                  <div className="w-full h-full bg-gradient-to-tr from-pink-600 to-rose-700 flex flex-col items-center justify-center text-white p-4">
                    <Music size={40} className="mb-2 animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-wider">Bài hát / Bản thu âm</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-700 to-purple-800 flex flex-col items-center justify-center text-white p-4">
                    <FileIconBadge type={mainFile?.type || 'powerpoint'} size="lg" />
                    <span className="text-xs font-bold uppercase tracking-wider mt-2">Dự án học tập</span>
                  </div>
                )}

                {/* Badges on top */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-[10px]">
                    {prod.subject}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-slate-800 font-bold text-[10px]">
                    {prod.authorGroup}
                  </span>
                </div>
              </div>

              {/* Product Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 mb-1.5" title={prod.title}>
                    {prod.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {prod.description}
                  </p>

                  {/* Participants Tags */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Thành viên tham gia:
                      </span>
                      {isParticipant && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[9px] font-bold border border-purple-200">
                          Bạn có quyền sửa
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {prod.participants.map((name) => {
                        const isMemberInRoster = members.some(
                          (m) => m.name.trim().toLowerCase() === name.trim().toLowerCase()
                        );
                        return (
                          <span
                            key={name}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium inline-flex items-center gap-1 ${
                              isMemberInRoster
                                ? name.trim().toLowerCase() === currentMember.name.trim().toLowerCase()
                                  ? 'bg-purple-100 text-purple-800 font-bold border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                            title={
                              isMemberInRoster
                                ? 'Thành viên chính thức của Tổ 3'
                                : 'Tên này không có trong danh sách tổ, cần sửa lại'
                            }
                          >
                            {!isMemberInRoster && <span className="text-amber-600 font-bold">⚠️</span>}
                            <span>{name}</span>
                            {!isMemberInRoster && (
                              <span className="text-[9px] text-amber-700 font-bold">(Ngoài tổ)</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danh sách tệp đính kèm của sản phẩm (nếu có nhiều hơn 1 tệp hoặc có tệp riêng biệt) */}
                  {prod.files && prod.files.length > 0 && (
                    <div className="space-y-1.5 mb-3 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        Tệp tin & Học liệu ({prod.files.length} tệp):
                      </span>
                      <div className="space-y-1">
                        {prod.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                              <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                              <span className="font-semibold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">({file.sizeFormatted})</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {file.url && (
                                <button
                                  type="button"
                                  onClick={() => onViewFile(file)}
                                  className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer"
                                  title="Xem tệp"
                                >
                                  <Eye size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  downloadFile(file, {
                                    title: prod.title,
                                    subject: prod.subject,
                                    authorGroup: prod.authorGroup,
                                    participants: prod.participants,
                                    description: prod.description,
                                  });
                                  showToast(`Đang tải tệp: ${file.name} (Mở được 100%)`);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                title="Tải tệp này về máy (Mở được 100%)"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {mainFile && (
                      <button
                        type="button"
                        onClick={() => onViewFile(mainFile)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye size={13} /> Xem chính
                      </button>
                    )}
                    {mainFile && (
                      <button
                        type="button"
                        onClick={() => {
                          downloadFile(mainFile, {
                            title: prod.title,
                            subject: prod.subject,
                            authorGroup: prod.authorGroup,
                            participants: prod.participants,
                            description: prod.description,
                          });
                          showToast(`Đang tải tệp: ${mainFile.name} (Chuẩn mở được 100%)`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
                        title="Tải tệp sản phẩm về máy (Mở được 100%)"
                      >
                        <Download size={13} className="text-emerald-600" /> Tải tệp
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        downloadProductSheet(prod);
                        showToast(`Đã tải phiếu thông tin sản phẩm: ${prod.title}`);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                      title="Tải phiếu thông tin & thuyết minh sản phẩm dạng .txt"
                    >
                      <FileText size={13} className="text-slate-500" /> Tải phiếu (.txt)
                    </button>
                  </div>

                  {/* Actions: Thành viên tham gia, Người tạo VÀ Tổ trưởng đều sửa được */}
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        title={
                          isParticipant && !isLeader && prod.creatorName !== currentMember.name
                            ? 'Bạn là thành viên tham gia - Nhấn để sửa sản phẩm'
                            : 'Sửa thông tin sản phẩm'
                        }
                      >
                        <Edit2 size={13} />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(prod)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa sản phẩm này (Chuyển vào thùng rác)"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Đăng / Sửa Sản Phẩm */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg my-8 p-6 border border-slate-200 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingProd ? '✏️ Chỉnh Sửa Sản Phẩm Học Tập' : '🎬 Đăng Sản Phẩm Học Tập Mới'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingProd(null); }} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên sản phẩm học tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Video mô phỏng thí nghiệm Hóa học..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm tác giả</label>
                  <select
                    value={authorGroup}
                    onChange={(e) => setAuthorGroup(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  >
                    <option value="Toàn thể Tổ 3">Toàn thể Tổ 3</option>
                    <option value="Nhóm 1 - Tự nhiên">Nhóm 1 - Tự nhiên</option>
                    <option value="Nhóm 2 - Xã hội">Nhóm 2 - Xã hội</option>
                    <option value="Nhóm 3 - Ngoại ngữ & Tin">Nhóm 3 - Ngoại ngữ & Tin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 👥 Thành viên trong tổ tham gia thực hiện */}
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Users size={14} className="text-purple-600" />
                      <span>Thành viên trong tổ tham gia thực hiện (*)</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                        {selectedParticipants.length} bạn
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bạn nào có tên trong danh sách tổ thì để, bạn nào không có hoặc chưa đúng thì sửa lại cho đúng.
                    </p>
                  </div>

                  {/* Nút thao tác nhanh */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParticipants(members.map((m) => m.name));
                        showToast(`Đã chọn toàn bộ ${members.length} thành viên trong Tổ 3!`);
                      }}
                      className="px-2 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Chọn cả tổ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParticipants([currentMember.name]);
                        showToast(`Đã đặt người thực hiện là: ${currentMember.name}`);
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      Chỉ mình tôi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const validOnly = selectedParticipants.filter((p) =>
                          members.some((m) => m.name.trim().toLowerCase() === p.trim().toLowerCase())
                        );
                        setSelectedParticipants(validOnly.length > 0 ? validOnly : [currentMember.name]);
                        showToast('Đã lọc chỉ giữ lại thành viên có tên trong danh sách Tổ 3!');
                      }}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      title="Gỡ bỏ tên các bạn không có trong danh sách tổ"
                    >
                      ⚡ Lọc tên trong tổ
                    </button>
                  </div>
                </div>

                {/* Danh sách các bạn trong tổ với checkbox & avatar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isSelected = selectedParticipants.some(
                      (name) => name.trim().toLowerCase() === m.name.trim().toLowerCase()
                    );
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              if (selectedParticipants.length === 1) {
                                showToast('Sản phẩm phải có ít nhất 1 thành viên tham gia!', 'warning');
                                return;
                              }
                              setSelectedParticipants((prev) =>
                                prev.filter((n) => n.trim().toLowerCase() !== m.name.trim().toLowerCase())
                              );
                            } else {
                              setSelectedParticipants((prev) => [...prev, m.name]);
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                        />
                        <img
                          src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={m.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 truncate">
                          <span className="truncate block font-medium">{m.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {isTeacherMember(m) ? '⭐ GVCN / Cố vấn' : isLeaderMember(m) ? '👑 Tổ trưởng' : m.groupName}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Cảnh báo và xử lý tên không thuộc danh sách tổ nếu phát hiện */}
                {(() => {
                  const invalidParticipants = selectedParticipants.filter(
                    (name) => !members.some((m) => m.name.trim().toLowerCase() === name.trim().toLowerCase())
                  );
                  if (invalidParticipants.length === 0) return null;

                  return (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Có {invalidParticipants.length} tên chưa đúng danh sách Tổ 3 hiện tại:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParticipants((prev) =>
                              prev.filter((name) =>
                                members.some((m) => m.name.trim().toLowerCase() === name.trim().toLowerCase())
                              )
                            );
                            showToast('Đã xóa tất cả tên ngoài danh sách tổ!');
                          }}
                          className="text-[10px] font-bold text-amber-900 underline hover:text-amber-700 cursor-pointer"
                        >
                          Xóa tất cả tên này
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {invalidParticipants.map((badName) => (
                          <div
                            key={badName}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-1.5 rounded-lg bg-white border border-amber-200 text-xs gap-1"
                          >
                            <span className="font-semibold text-rose-700 line-through truncate max-w-[160px]">
                              {badName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500">Sửa thành:</span>
                              <select
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  if (!newName) return;
                                  setSelectedParticipants((prev) =>
                                    prev.map((n) => (n === badName ? newName : n))
                                  );
                                  showToast(`Đã sửa "${badName}" thành "${newName}"!`);
                                }}
                                defaultValue=""
                                className="px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded-md font-medium outline-none"
                              >
                                <option value="" disabled>
                                  -- Chọn bạn trong tổ --
                                </option>
                                {members.map((m) => (
                                  <option key={m.id} value={m.name}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedParticipants((prev) => prev.filter((n) => n !== badName))
                                }
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Xóa tên này"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại định dạng sản phẩm chính</label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'video', label: '🎬 Video' },
                    { id: 'audio', label: '🎵 Bài hát' },
                    { id: 'image', label: '🖼 Poster' },
                    { id: 'powerpoint', label: '📽 Slide' },
                    { id: 'pdf', label: '📕 Báo cáo' },
                    { id: 'word', label: '📄 Word' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setProductFileType(t.id as any);
                        handleAddSampleProdFile(t.id as any);
                      }}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        productFileType === t.id
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phần lưu trữ & đính kèm tệp sản phẩm */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Paperclip size={14} className="text-purple-600" />
                      <span>Tệp tin sản phẩm & Minh chứng ({productAttachedFiles.length} tệp)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tải lên tệp từ máy tính (.mp4, .mp3, .pptx, .pdf, .png...) hoặc gắn link trực tuyến
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => prodFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Chọn tệp từ máy</span>
                  </button>
                  <input
                    ref={prodFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleProductFileUpload}
                  />
                </div>

                {/* Nhập link trực tuyến */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={onlineUrl}
                      onChange={(e) => setOnlineUrl(e.target.value)}
                      placeholder="Hoặc dán liên kết Google Drive, YouTube, Canva..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOnlineLink}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    + Thêm link
                  </button>
                </div>

                {/* Danh sách tệp đính kèm hiện tại */}
                {productAttachedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {productAttachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <FileIconBadge type={file.type} extension={file.extension} size="sm" />
                          <span className="font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">({file.sizeFormatted})</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              downloadFile(file);
                              showToast(`Đang tải tệp: ${file.name}`);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            title="Tải tệp này về máy"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProdFile(file.id)}
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả quá trình thực hiện, điểm nổi bật..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl outline-none resize-none"
                />
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
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>{editingProd ? 'Lưu thay đổi sản phẩm' : 'Lưu sản phẩm học tập'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
