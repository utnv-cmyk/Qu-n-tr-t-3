import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Lock,
  Mail,
  Phone,
  Upload,
  Camera,
  RefreshCw,
  X,
  Sparkles,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { Member, Role } from '../types';
import { ImportMembersModal } from './ImportMembersModal';
import { MemberAvatarModal } from './MemberAvatarModal';
import {
  STUDENT_AVATAR_PRESETS,
  getDefaultAvatar,
  compressAndReadImage,
} from '../utils/imageUtils';
import { formatScore } from '../utils/scoreUtils';
import {
  APP_CONFIG,
  getMemberDisplayRole,
  getStudentMembers,
} from '../config';

interface Props {
  members: Member[];
  currentMember: Member;
  onUpdateMembers: (newMembers: Member[]) => void;
  onDeleteMember?: (member: Member) => void;
  onOpenTrash?: () => void;
  trashCount?: number;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const MembersView: React.FC<Props> = ({
  members,
  currentMember,
  onUpdateMembers,
  onDeleteMember,
  onOpenTrash,
  trashCount = 0,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Avatar Management State
  const [avatarModalMember, setAvatarModalMember] = useState<Member | null>(null);
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  // Contact Phone Quick Edit State
  const [editingPhoneMemberId, setEditingPhoneMemberId] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    role: Role;
    email: string;
    phone: string;
    groupName: string;
    avatar: string;
  }>({
    name: '',
    role: 'member',
    email: '',
    phone: '',
    groupName: 'Nhóm 1 - Tự nhiên',
    avatar: STUDENT_AVATAR_PRESETS[0],
  });

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trigger file upload directly from member card
  const handleTriggerUpload = (memberId: string) => {
    setUploadingMemberId(memberId);
    if (directFileInputRef.current) {
      directFileInputRef.current.value = '';
      directFileInputRef.current.click();
    }
  };

  // Handle direct file change for member card upload
  const handleDirectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingMemberId) return;

    try {
      const compressed = await compressAndReadImage(file, 260);
      const targetMember = members.find((m) => m.id === uploadingMemberId);
      const updated = members.map((m) =>
        m.id === uploadingMemberId ? { ...m, avatar: compressed } : m
      );
      onUpdateMembers(updated);
      showToast(
        `Đã tải lại ảnh đại diện mới cho học sinh "${targetMember?.name || ''}"!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đọc file ảnh!', 'error');
    } finally {
      setUploadingMemberId(null);
    }
  };

  // Remove avatar -> reset to default
  const handleRemoveAvatar = (member: Member) => {
    const defaultUrl = getDefaultAvatar(member.name);
    const updated = members.map((m) =>
      m.id === member.id ? { ...m, avatar: defaultUrl } : m
    );
    onUpdateMembers(updated);
    showToast(`Đã gỡ ảnh đại diện của "${member.name}" (quay về ảnh mặc định).`, 'info');
  };

  // Quick cycle avatar to next preset
  const handleCycleAvatar = (member: Member) => {
    const currentIdx = STUDENT_AVATAR_PRESETS.indexOf(member.avatar);
    const nextIdx = (currentIdx + 1) % STUDENT_AVATAR_PRESETS.length;
    const newAvatar = STUDENT_AVATAR_PRESETS[nextIdx];
    const updated = members.map((m) =>
      m.id === member.id ? { ...m, avatar: newAvatar } : m
    );
    onUpdateMembers(updated);
    showToast(`Đã đổi ảnh đại diện khác cho "${member.name}"!`, 'success');
  };

  // Save avatar from detailed modal
  const handleSaveAvatarFromModal = (memberId: string, newAvatarUrl: string) => {
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, avatar: newAvatarUrl } : m
    );
    onUpdateMembers(updated);
  };

  const handleStartEditPhone = (member: Member, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const canEdit = isLeader || currentMember.id === member.id;
    if (!canEdit) {
      showToast('Chỉ Tổ trưởng hoặc chính học sinh mới có thể sửa số điện thoại!', 'warning');
      return;
    }
    setEditingPhoneMemberId(member.id);
    setTempPhone(member.phone || '');
  };

  const handleSavePhone = (memberId: string) => {
    const cleanPhone = tempPhone.trim();
    if (!cleanPhone) {
      showToast('Số điện thoại không được để trống!', 'warning');
      return;
    }
    const targetMember = members.find((m) => m.id === memberId);
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, phone: cleanPhone } : m
    );
    onUpdateMembers(updated);
    showToast(`Đã lưu số điện thoại mới cho "${targetMember?.name || 'học sinh'}": ${cleanPhone}`, 'success');
    setEditingPhoneMemberId(null);
  };

  const handleOpenAdd = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới được thực hiện thao tác này', 'warning');
      return;
    }
    const randomAvatar =
      STUDENT_AVATAR_PRESETS[Math.floor(Math.random() * STUDENT_AVATAR_PRESETS.length)];
    setFormData({
      name: '',
      role: 'member',
      email: '',
      phone: '',
      groupName: 'Nhóm 1 - Tự nhiên',
      avatar: randomAvatar,
    });
    setIsAddingNew(true);
  };

  const handleOpenImport = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền nhập thành viên từ file!', 'warning');
      return;
    }
    setIsImportModalOpen(true);
  };

  const handleImportMembers = (newMembers: Member[]) => {
    onUpdateMembers([...members, ...newMembers]);
  };

  const handleOpenEdit = (member: Member) => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới được thực hiện thao tác này', 'warning');
      return;
    }
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      groupName: member.groupName,
      avatar: member.avatar || getDefaultAvatar(member.name),
    });
  };

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete) return;
    const target = memberToDelete;
    if (onDeleteMember) {
      onDeleteMember(target);
    } else {
      const updated = members.filter((m) => m.id !== target.id);
      onUpdateMembers(updated);
    }
    showToast(`Đã xóa thành viên "${target.name}" thành công (Đã chuyển vào Thùng rác).`, 'success');
    setMemberToDelete(null);
    if (editingMember?.id === target.id) {
      setEditingMember(null);
    }
  };

  // Form Avatar Upload
  const handleFormFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAndReadImage(file, 260);
      setFormData((prev) => ({ ...prev, avatar: compressed }));
      showToast('Đã tải lên ảnh đại diện mới!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đọc file ảnh!', 'error');
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới được thực hiện thao tác này', 'error');
      return;
    }
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập họ và tên thành viên!', 'warning');
      return;
    }

    if (isAddingNew) {
      const newMember: Member = {
        id: 'm_' + Date.now(),
        name: formData.name.trim(),
        role: formData.role,
        email:
          formData.email.trim() ||
          `${formData.name.toLowerCase().replace(/\s+/g, '')}@thptduongminhchau.edu.vn`,
        phone: formData.phone.trim() || '0900.000.000',
        avatar: formData.avatar || getDefaultAvatar(formData.name),
        groupName: formData.groupName,
        attendancePresent: 28,
        attendanceLate: 0,
        attendanceAbsent: 0,
        plusPoints: 0,
        minusPoints: 0,
        netPoints: 0,
        completedTasks: 0,
        submittedCount: 0,
        productCount: 0,
      };
      onUpdateMembers([...members, newMember]);
      showToast('Đã thêm thành viên mới thành công!');
      setIsAddingNew(false);
    } else if (editingMember) {
      const updated = members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: formData.name.trim(),
              role: formData.role,
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              groupName: formData.groupName,
              avatar: formData.avatar || getDefaultAvatar(formData.name),
            }
          : m
      );
      onUpdateMembers(updated);
      showToast('Đã cập nhật thông tin thành viên!');
      setEditingMember(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden file input for direct upload from any member card */}
      <input
        type="file"
        ref={directFileInputRef}
        accept="image/*"
        onChange={handleDirectFileChange}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">👥 Danh sách Thành viên Tổ 3</h2>
            {!isLeader && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
                <Lock size={12} /> Chế độ xem (Thành viên)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng sĩ số: <b>{getStudentMembers(members).length} học sinh</b> • Tổ trưởng: <b>{APP_CONFIG.LEADER_NAME}</b> • GVCN: <b>{APP_CONFIG.HOMEROOM_TEACHER}</b> • Lớp 11A1 THPT Dương Minh Châu
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên, nhóm..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none w-44 sm:w-56"
            />
          </div>

          {/* Thùng rác */}
          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
              title="Xem và khôi phục thành viên đã xóa"
            >
              <Trash2 size={15} />
              <span>Thùng rác ({trashCount})</span>
            </button>
          )}

          {/* Import from File */}
          <button
            onClick={handleOpenImport}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border ${
              isLeader
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:scale-105 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
            }`}
            title={
              isLeader
                ? 'Tải lên danh sách học sinh từ file Excel, Word, PDF'
                : 'Chỉ Tổ trưởng mới có quyền nhập thành viên từ file'
            }
          >
            {isLeader ? <Upload size={15} /> : <Lock size={13} />}
            <span>Tải lên từ File</span>
            <span className="hidden lg:inline-block px-1.5 py-0.5 rounded-md bg-emerald-700/60 text-[10px] font-medium">
              Word / Excel / PDF
            </span>
          </button>

          {/* Add member manually */}
          <button
            onClick={handleOpenAdd}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isLeader
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={isLeader ? 'Thêm thủ công 1 học sinh mới vào tổ' : 'Chỉ Tổ trưởng mới có quyền thêm thành viên'}
          >
            {isLeader ? <UserPlus size={15} /> : <Lock size={13} />}
            <span>Thêm thủ công</span>
            {!isLeader && <span className="text-[10px] text-amber-600 font-bold">(🔒 Chỉ TT)</span>}
          </button>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Member Top Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  {/* Avatar Container with Quick Control Buttons */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="relative group">
                      <img
                        src={member.avatar || getDefaultAvatar(member.name)}
                        alt={member.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs group-hover:ring-2 group-hover:ring-blue-400 transition-all cursor-pointer"
                        onClick={() => setAvatarModalMember(member)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getDefaultAvatar(member.name);
                        }}
                      />
                      {/* Hover action overlay */}
                      <button
                        type="button"
                        onClick={() => setAvatarModalMember(member)}
                        className="absolute inset-0 bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold gap-0.5 cursor-pointer"
                        title="Tùy chỉnh ảnh đại diện"
                      >
                        <Camera size={18} />
                        <span>Đổi ảnh</span>
                      </button>
                    </div>

                    {/* Dedicated action buttons for each member's photo: Thay, Xóa, Tải lại ảnh khác */}
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(member.id)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 transition-all hover:scale-105 active:scale-95 shadow-2xs"
                        title="Tải lại ảnh khác từ máy tính hoặc điện thoại"
                      >
                        <Upload size={10} /> Tải lại
                      </button>

                      <button
                        type="button"
                        onClick={() => setAvatarModalMember(member)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 transition-all hover:scale-105 active:scale-95"
                        title="Thay đổi ảnh khác từ thư viện ảnh học sinh hoặc URL"
                      >
                        <RefreshCw size={10} /> Thay
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveAvatar(member)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold border border-slate-200 transition-all hover:scale-105 active:scale-95"
                        title="Gỡ ảnh cá nhân và quay về ảnh đại diện mặc định"
                      >
                        <ImageIcon size={10} /> Gỡ ảnh
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{member.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {member.id === 'm0' || member.email.includes('utnv') || member.name.toLowerCase().includes('nguyễn văn út') ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] border border-purple-300">
                          👑 GVCN / Cố vấn
                        </span>
                      ) : member.role === 'leader' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                          👑 Tổ trưởng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                          🎒 Thành viên
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium">{member.groupName}</span>
                    </div>
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Sửa thông tin thành viên"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleDeleteClick(member)}
                    className="p-1.5 rounded-lg transition-colors text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    title={`Xóa học sinh ${member.name} khỏi tổ`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 truncate">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center justify-between gap-1 group/phone">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    {editingPhoneMemberId === member.id ? (
                      <div className="flex items-center gap-1 flex-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={tempPhone}
                          autoFocus
                          onChange={(e) => setTempPhone(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePhone(member.id);
                            if (e.key === 'Escape') setEditingPhoneMemberId(null);
                          }}
                          className="w-full px-2 py-0.5 bg-blue-50 border border-blue-400 rounded-lg text-xs font-bold text-blue-900 outline-none"
                          placeholder="0912.xxx.xxx"
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePhone(member.id)}
                          className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                          title="Lưu số điện thoại"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhoneMemberId(null)}
                          className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors cursor-pointer"
                          title="Hủy bỏ"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span
                          onClick={() => handleStartEditPhone(member)}
                          className={`font-semibold truncate ${
                            isLeader || currentMember.id === member.id
                              ? 'cursor-pointer hover:text-blue-600 hover:underline'
                              : ''
                          }`}
                          title={
                            isLeader || currentMember.id === member.id
                              ? 'Bấm vào để sửa nhanh số điện thoại'
                              : member.phone
                          }
                        >
                          {member.phone || 'Chưa cập nhật SĐT'}
                        </span>
                        {(isLeader || currentMember.id === member.id) && (
                          <button
                            type="button"
                            onClick={(e) => handleStartEditPhone(member, e)}
                            className="opacity-70 group-hover/phone:opacity-100 text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition-all cursor-pointer flex items-center gap-0.5"
                            title="Sửa số điện thoại"
                          >
                            <Edit2 size={10} />
                            <span>Sửa SĐT</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">Điểm thi đua</span>
                  <span className="text-xs font-bold text-amber-600">
                    {formatScore(member.netPoints)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Nhiệm vụ xong</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {member.completedTasks}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Bài đã nộp</span>
                  <span className="text-xs font-bold text-blue-600">
                    {member.submittedCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance indicator */}
            <div className="mt-3 pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
              <span>Chuyên cần: {member.attendancePresent} buổi</span>
              {member.attendanceLate > 0 && (
                <span className="text-amber-600 font-semibold">({member.attendanceLate} trễ)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Member (Only for leader) */}
      {(isAddingNew || editingMember) && isLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {isAddingNew ? 'Thêm thành viên mới' : `Sửa thông tin: ${editingMember?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingMember(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {isAddingNew && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Upload size={16} className="shrink-0 text-emerald-600" />
                  <span className="text-[11px] font-medium leading-tight">
                    Có sẵn danh sách từ <b>Word (.docx, .doc), Excel (.xlsx)</b> hoặc <b>PDF</b>?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setIsImportModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs shrink-0 transition-colors"
                >
                  Tải lên tệp ngay
                </button>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Avatar Selector inside Form */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ảnh đại diện
                </label>
                <input
                  type="file"
                  ref={formFileInputRef}
                  accept="image/*"
                  onChange={handleFormFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <img
                    src={formData.avatar || getDefaultAvatar(formData.name || 'Học sinh')}
                    alt="Ảnh đại diện"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getDefaultAvatar(
                        formData.name || 'Học sinh'
                      );
                    }}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => formFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs"
                      >
                        <Upload size={12} /> Tải ảnh từ máy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const randomUrl =
                            STUDENT_AVATAR_PRESETS[
                              Math.floor(Math.random() * STUDENT_AVATAR_PRESETS.length)
                            ];
                          setFormData((prev) => ({ ...prev, avatar: randomUrl }));
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 shadow-2xs"
                      >
                        <RefreshCw size={11} /> Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            avatar: getDefaultAvatar(formData.name || 'Học sinh'),
                          }));
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold border border-rose-100"
                      >
                        <Trash2 size={11} /> Xóa
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Hỗ trợ tải tệp ảnh từ máy, chọn ảnh mẫu hoặc xóa ảnh
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="VD: Nguyễn Văn Nam"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="member">🎒 Thành viên tổ</option>
                  <option value="leader">👑 Tổ trưởng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phân nhóm học tập</label>
                <select
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Nhóm 1 - Tự nhiên">Nhóm 1 - Tự nhiên</option>
                  <option value="Nhóm 2 - Xã hội">Nhóm 2 - Xã hội</option>
                  <option value="Nhóm 3 - Ngoại ngữ & Tin">Nhóm 3 - Ngoại ngữ & Tin</option>
                  <option value="Nhóm 4 - Dự án">Nhóm 4 - Dự án</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email học sinh</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="name@thptduongminhchau.edu.vn"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại / Zalo</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0912.xxx.xxx"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingMember ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = editingMember;
                      setEditingMember(null);
                      setMemberToDelete(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} /> Xóa học sinh này
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingMember(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Lưu thành viên
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Member Avatar Customization Modal */}
      {avatarModalMember && (
        <MemberAvatarModal
          isOpen={!!avatarModalMember}
          onClose={() => setAvatarModalMember(null)}
          member={avatarModalMember}
          onSaveAvatar={handleSaveAvatarFromModal}
          showToast={showToast}
        />
      )}

      {/* Import Members Modal for Word, Excel, PDF */}
      <ImportMembersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingMembers={members}
        onImportMembers={handleImportMembers}
        showToast={showToast}
      />

      {/* Confirmation Modal to Delete Member safely */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <Trash2 size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa thành viên
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa học sinh <strong className="text-rose-600 font-bold">{memberToDelete.name}</strong> khỏi danh sách Tổ 3?
                </p>
              </div>
              <button
                onClick={() => setMemberToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <img
                src={memberToDelete.avatar || getDefaultAvatar(memberToDelete.name)}
                alt={memberToDelete.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{memberToDelete.name}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {getMemberDisplayRole(memberToDelete, 'with_icon')} • {memberToDelete.groupName}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{memberToDelete.email}</div>
              </div>
            </div>

            <div className="mt-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 leading-snug flex items-start gap-2">
              <Sparkles size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <b>An tâm:</b> Thành viên đã xóa sẽ được lưu vào <b>Thùng rác</b>. Bạn có thể mở mục "Thùng rác" ở góc trên để khôi phục lại bất kỳ lúc nào mà không sợ mất dữ liệu.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                <Trash2 size={14} />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
