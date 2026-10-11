import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldAlert,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Save,
  Lock,
  Sparkles,
  School,
  FileCheck,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Member, AppConfig } from '../types';
import { DEFAULT_APP_CONFIG } from '../storage';

interface Props {
  currentMember: Member;
  config: AppConfig;
  onSaveConfig: (cfg: AppConfig) => void;
  onOpenTrash: () => void;
  trashCount: number;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const SettingsView: React.FC<Props> = ({
  currentMember,
  config,
  onSaveConfig,
  onOpenTrash,
  trashCount,
  onResetDemoData,
  onClearAllData,
  onExportData,
  onImportData,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';

  // Config form state initialized from config prop
  const [formData, setFormData] = useState<AppConfig>(config);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (field: keyof AppConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanged(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.CLASS_NAME.trim() || !formData.GROUP_NAME.trim()) {
      showToast('Tên lớp và tên tổ không được để trống!', 'warning');
      return;
    }
    onSaveConfig(formData);
    setHasChanged(false);
    showToast('✅ Đã lưu cấu hình thông tin thành công!', 'success');
  };

  const handleResetToDefault = () => {
    if (confirm('Khôi phục lại thông tin cấu hình ban đầu của Tổ 3 - 11A1?')) {
      setFormData(DEFAULT_APP_CONFIG);
      onSaveConfig(DEFAULT_APP_CONFIG);
      setHasChanged(false);
      showToast('Đã khôi phục thông tin cấu hình mặc định.');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              ⚙️ Cài Đặt Thông Tin & Dữ Liệu
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
              Đồng bộ thời gian thực
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chỉnh sửa thông tin lớp, tổ, ban cán sự, tiêu đề và quản lý thùng rác khôi phục dữ liệu
          </p>
        </div>

        {/* Nút Thùng rác nhanh */}
        <button
          onClick={onOpenTrash}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition-all hover:scale-105 shadow-xs"
        >
          <Trash2 size={16} />
          <span>Thùng rác & Khôi phục</span>
          {trashCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold">
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* Form Cài đặt thông tin chung */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <School size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thông Tin Đơn Vị, Lớp & Ban Cán Sự
              </h3>
              <p className="text-xs text-slate-500">
                Thay đổi các trường bên dưới và bấm nút "Lưu thay đổi"
              </p>
            </div>
          </div>

          {hasChanged && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 animate-pulse">
              ● Có thay đổi chưa lưu
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Tên Trường THPT
              </label>
              <input
                type="text"
                value={formData.SCHOOL_NAME}
                onChange={(e) => handleChange('SCHOOL_NAME', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800 transition-all"
                placeholder="VD: THPT Dương Minh Châu"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Tên Lớp
              </label>
              <input
                type="text"
                value={formData.CLASS_NAME}
                onChange={(e) => handleChange('CLASS_NAME', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800 transition-all"
                placeholder="VD: 11A1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Tên Tổ
              </label>
              <input
                type="text"
                value={formData.GROUP_NAME}
                onChange={(e) => handleChange('GROUP_NAME', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800 transition-all"
                placeholder="VD: Tổ 3"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Tổ trưởng phụ trách
              </label>
              <input
                type="text"
                value={formData.LEADER_NAME}
                onChange={(e) => handleChange('LEADER_NAME', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800 transition-all"
                placeholder="VD: Trần Công Minh"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Giáo viên chủ nhiệm (GVCN)
              </label>
              <input
                type="text"
                value={formData.HOMEROOM_TEACHER}
                onChange={(e) => handleChange('HOMEROOM_TEACHER', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800 transition-all"
                placeholder="VD: Nguyễn Văn Út"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Năm học & Học kỳ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.SCHOOL_YEAR}
                  onChange={(e) => handleChange('SCHOOL_YEAR', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800"
                  placeholder="2026 - 2027"
                />
                <input
                  type="text"
                  value={formData.SEMESTER}
                  onChange={(e) => handleChange('SEMESTER', e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800"
                  placeholder="Học kỳ II"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Tiêu đề ứng dụng
            </label>
            <input
              type="text"
              value={formData.APP_TITLE}
              onChange={(e) => handleChange('APP_TITLE', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800"
              placeholder="QUẢN LÝ TỔ 3 – HỌC TẬP & THI ĐUA – LỚP 11A1"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Khẩu hiệu / Giới thiệu tổ
            </label>
            <input
              type="text"
              value={formData.APP_SUBTITLE}
              onChange={(e) => handleChange('APP_SUBTITLE', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-medium text-slate-800"
              placeholder="Không gian học tập, cộng tác và thi đua của Tổ 3"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} /> Khôi phục mặc định ban đầu
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Save size={15} />
              <span>Lưu thay đổi thông tin</span>
            </button>
          </div>
        </form>
      </div>

      {/* Thùng rác & Quản lý khôi phục */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thùng Rác & Khôi Phục Dữ Liệu Đã Xóa
              </h3>
              <p className="text-xs text-slate-500">
                Mọi mục bạn đã xóa (thành viên, bài tập, tài liệu, điểm danh...) đều được lưu giữ tại đây
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTrash}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={14} />
            <span>Mở Thùng rác ({trashCount})</span>
          </button>
        </div>
      </div>

      {/* Sao lưu & Phục hồi dữ liệu JSON */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Sao Lưu & Nhập Dữ Liệu (JSON Dự Phòng)
          </h3>
          <p className="text-xs text-slate-500">
            Dữ liệu học tập, thi đua, điểm danh và bài nộp được lưu trữ an toàn trên trình duyệt máy bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onExportData}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Download size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Xuất dữ liệu dự phòng</h4>
              <p className="text-[11px] text-slate-500">Tải file JSON chứa toàn bộ dữ liệu tổ</p>
            </div>
          </button>

          <label className="p-4 rounded-2xl border bg-slate-50 hover:bg-blue-50/50 border-slate-200 hover:border-blue-300 transition-all flex items-center gap-3 text-left cursor-pointer group">
            <input
              type="file"
              accept=".json"
              onChange={onImportData}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Upload size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Nhập dữ liệu từ file JSON</h4>
              <p className="text-[11px] text-slate-500">
                Khôi phục lại toàn bộ dữ liệu từ bản sao lưu trước đó
              </p>
            </div>
          </label>
        </div>

        {/* Xóa toàn bộ dữ liệu */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onResetDemoData}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={15} /> Khôi phục dữ liệu mẫu chuẩn
          </button>

          <button
            onClick={onClearAllData}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            <Trash2 size={15} />
            <span>Xóa sạch dữ liệu làm lại từ đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
