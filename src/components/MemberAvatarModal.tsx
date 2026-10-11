import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  Check,
  RefreshCw,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { Member } from '../types';
import {
  STUDENT_AVATAR_PRESETS,
  getDefaultAvatar,
  compressAndReadImage,
} from '../utils/imageUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSaveAvatar: (memberId: string, newAvatarUrl: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const MemberAvatarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  member,
  onSaveAvatar,
  showToast,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(member.avatar || getDefaultAvatar(member.name));
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update internal state when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(member.avatar || getDefaultAvatar(member.name));
      setUrlInput('');
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsProcessing(true);
    try {
      const base64 = await compressAndReadImage(file, 260);
      setSelectedAvatar(base64);
      showToast('Đã tải ảnh lên thành công! Nhấn "Lưu thay đổi" để áp dụng.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Không thể đọc tệp ảnh!', 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      showToast('Vui lòng nhập đường dẫn (URL) hình ảnh!', 'warning');
      return;
    }
    setSelectedAvatar(urlInput.trim());
    showToast('Đã cập nhật ảnh từ liên kết URL!', 'success');
  };

  const handleResetToDefault = () => {
    const defaultUrl = getDefaultAvatar(member.name);
    setSelectedAvatar(defaultUrl);
    showToast(`Đã xóa ảnh tùy chỉnh và quay về ảnh mặc định cho "${member.name}"!`, 'info');
  };

  const handleSave = () => {
    onSaveAvatar(member.id, selectedAvatar);
    showToast(`Đã cập nhật ảnh đại diện cho "${member.name}"!`, 'success');
    onClose();
  };

  const handleRandomPreset = () => {
    const randomIndex = Math.floor(Math.random() * STUDENT_AVATAR_PRESETS.length);
    setSelectedAvatar(STUDENT_AVATAR_PRESETS[randomIndex]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 transition-all my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tùy chỉnh ảnh đại diện
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Học sinh: <span className="font-bold text-slate-800">{member.name}</span> • {member.groupName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current / Preview Avatar Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80">
            <div className="relative">
              <img
                src={selectedAvatar}
                alt={member.name}
                className="w-24 h-24 rounded-2xl object-cover border-3 border-white shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDefaultAvatar(member.name);
                }}
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                Xem trước
              </span>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{member.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bạn có thể tải ảnh mới từ thiết bị, chọn ảnh mẫu hoặc xóa về ảnh mặc định.
                </p>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-2 pt-1 flex-wrap justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleRandomPreset}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors"
                >
                  <RefreshCw size={12} className="text-slate-500" />
                  <span>Đổi ngẫu nhiên</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                  title="Xóa ảnh và dùng ảnh đại diện mặc định"
                >
                  <Trash2 size={12} />
                  <span>Xóa ảnh (Về mặc định)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload size={14} />
              <span>Tải ảnh từ máy</span>
            </button>
            <button
              onClick={() => setActiveTab('preset')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={14} />
              <span>Ảnh mẫu học sinh ({STUDENT_AVATAR_PRESETS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon size={14} />
              <span>Liên kết URL</span>
            </button>
          </div>

          {/* Tab 1: Upload from device */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <div className="font-bold text-slate-800 text-sm">
                  {isProcessing ? 'Đang xử lý hình ảnh...' : 'Nhấn để chọn ảnh từ máy tính hoặc điện thoại'}
                </div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Hỗ trợ định dạng JPG, PNG, WEBP, GIF. Ảnh sẽ tự động được tối ưu và cắt vuông chuẩn nét.
                </p>
                <button
                  type="button"
                  className="mt-2 px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700"
                >
                  Chọn tệp ảnh
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Curated student avatar presets */}
          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Nhấp vào một trong các hình ảnh mẫu học sinh bên dưới để chọn ngay:
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
                {STUDENT_AVATAR_PRESETS.map((avatarUrl, idx) => {
                  const isSelected = selectedAvatar === avatarUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(avatarUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        isSelected
                          ? 'border-blue-600 ring-3 ring-blue-400/40 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={avatarUrl}
                        alt={`Mẫu ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                          <Check size={18} className="drop-shadow-md stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: URL input */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Dán đường dẫn ảnh trực tiếp (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                >
                  Áp dụng
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Gợi ý: Bạn có thể sao chép liên kết hình ảnh từ Google Drive, Imgur, Facebook hoặc mạng xã hội.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <Trash2 size={14} />
            <span>Xóa ảnh này</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Check size={14} />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
