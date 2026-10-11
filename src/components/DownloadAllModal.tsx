import React, { useState } from 'react';
import {
  FileText,
  Printer,
  X,
  Download,
} from 'lucide-react';
import {
  downloadAllAppContentsDoc,
  getAllAppData,
} from '../utils/fullAppExport';
import { APP_CONFIG } from '../config';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const DownloadAllModal: React.FC<Props> = ({ isOpen, onClose, showToast }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const data = getAllAppData();

  const handleDownloadDoc = () => {
    setIsExporting(true);
    downloadAllAppContentsDoc();
    showToast('Đang tải Hồ sơ văn bản (.doc) chuẩn thể thức Bộ GD&ĐT về máy!', 'success');
    setTimeout(() => {
      setIsExporting(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in text-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-6 border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-amber-300 shadow-xs shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] uppercase">
                  Hồ Sơ Văn Bản Toàn Diện
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px]">
                  Bộ GD&ĐT
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-0.5">
                Tải Tất Cả Các Nội Dung Trong Ứng Dụng
              </h3>
              <p className="text-blue-100 text-[11px] mt-0.5">
                Trường THPT Dương Minh Châu • Lớp {APP_CONFIG.CLASS_NAME} – Tổ 3 ({APP_CONFIG.SCHOOL_YEAR})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body: CHỈ GIỮ LẠI Hồ Sơ Văn Bản (.doc) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Statistics summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="font-extrabold text-slate-800 block text-xs">
              📊 Khối Lượng Dữ Liệu Tích Hợp Trong Hồ Sơ:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-slate-400 block text-[10px]">Thành viên & Nhóm</span>
                <span className="font-black text-blue-700 text-sm">
                  {data.members.length} hs • {data.groups.length} nhóm
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-slate-400 block text-[10px]">Đề kiểm tra</span>
                <span className="font-black text-purple-700 text-sm">
                  {data.tests.length} đề thi
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-slate-400 block text-[10px]">Ngân hàng câu hỏi</span>
                <span className="font-black text-emerald-700 text-sm">
                  {data.questionBank.length} câu hỏi
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-slate-400 block text-[10px]">Nhiệm vụ & Bài nộp</span>
                <span className="font-black text-amber-700 text-sm">
                  {data.assignments.length} nv • {data.submissions.length} bài
                </span>
              </div>
            </div>
          </div>

          {/* CHỈ GIỮ LẠI Hồ Sơ Văn Bản (.doc) */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-white rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                <FileText size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    Hồ Sơ Văn Bản (.doc)
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-extrabold text-[10px]">
                    Chuẩn Word (.doc)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Hồ sơ tổng hợp chuẩn thể thức Bộ GD&ĐT, đầy đủ bảng biểu, danh sách thành viên, nhiệm vụ, đề thi để in và lưu trữ.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadDoc}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 active:scale-98 transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>{isExporting ? 'Đang khởi tạo tệp Word...' : 'Tải Word (.doc)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={13} />
            <span>In tài liệu</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
