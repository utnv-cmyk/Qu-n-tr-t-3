import React, { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight, FileText, Presentation, CheckCircle, School, BookOpen } from 'lucide-react';
import { FileItem } from '../types';
import { FileIconBadge } from './FileIconBadge';
import { downloadFile } from '../utils/fileDownloader';
import { APP_CONFIG } from '../config';

interface Props {
  file: FileItem | null;
  onClose: () => void;
}

export const FileViewerModal: React.FC<Props> = ({ file, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 3;

  if (!file) return null;

  const handleDownload = () => {
    downloadFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIconBadge type={file.type} extension={file.extension} size="md" />
            <div className="truncate">
              <h3 className="text-base font-bold text-gray-900 truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-gray-500">
                Kích thước: <span className="font-semibold text-gray-700">{file.sizeFormatted}</span> • Loại: <span className="uppercase font-semibold text-blue-600">{file.extension}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Download size={14} />
              Tải xuống
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content - Renderer based on supported types */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex items-center justify-center min-h-[350px]">
          {/* PDF Viewer */}
          {file.type === 'pdf' && (
            <div className="w-full h-[65vh] flex flex-col bg-white rounded-xl shadow-inner border border-gray-300 overflow-hidden">
              {file.url ? (
                <iframe
                  src={file.url}
                  className="w-full h-full border-0"
                  title={file.name}
                />
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                    <FileIconBadge type="pdf" size="lg" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Trình xem tài liệu PDF</h4>
                  <p className="text-sm text-gray-600 max-w-md mb-6">
                    {file.contentPreview || 'Tài liệu PDF định dạng chuẩn đã sẵn sàng. Bạn có thể mở trực tiếp hoặc tải về máy để xem trên Adobe Acrobat.'}
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm shadow-md flex items-center gap-2"
                  >
                    <Download size={16} /> Tải file PDF về máy
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Viewer */}
          {file.type === 'image' && (
            <div className="flex flex-col items-center justify-center max-w-full">
              <img
                src={file.url || 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80'}
                alt={file.name}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg border border-gray-300 bg-white"
              />
              <p className="mt-3 text-xs text-gray-500 font-medium">{file.name}</p>
            </div>
          )}

          {/* Video Player */}
          {file.type === 'video' && (
            <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-xl">
              <video
                controls
                autoPlay={false}
                className="w-full max-h-[60vh] bg-black"
                src={file.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
              >
                Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
              </video>
              <div className="p-3 bg-gray-900 text-white text-xs flex justify-between items-center">
                <span>{file.name}</span>
                <span className="text-gray-400">{file.sizeFormatted}</span>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {file.type === 'audio' && (
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-pink-100 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg mb-4 animate-pulse">
                <FileIconBadge type="audio" size="lg" />
              </div>
              <h4 className="text-base font-bold text-gray-900 text-center mb-1">{file.name}</h4>
              <p className="text-xs text-pink-600 font-medium mb-5">Phát bài hát / Ghi âm dự án học tập</p>
              
              <audio
                controls
                className="w-full mb-3"
                src={file.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}
              >
                Trình duyệt không hỗ trợ audio.
              </audio>
              <p className="text-[11px] text-gray-400 text-center">Định dạng {file.extension.toUpperCase()} • Kích thước: {file.sizeFormatted}</p>
            </div>
          )}

          {/* Text / Markdown Viewer */}
          {file.type === 'text' && (
            <div className="w-full h-[60vh] bg-white rounded-xl shadow-inner border border-gray-300 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {file.contentPreview || 'Nội dung tệp tin văn bản trống hoặc đang cập nhật.'}
            </div>
          )}

          {/* PowerPoint Slide Deck Viewer */}
          {file.type === 'powerpoint' && (
            <div className="w-full max-w-3xl flex flex-col items-center">
              {/* Slide Card */}
              <div className="w-full aspect-[16/9] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/30 flex flex-col justify-between relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Slide Top Bar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-indigo-300 uppercase tracking-wider">
                    <School size={14} className="text-indigo-400" />
                    <span>THPT Dương Minh Châu • Tổ 3 Lớp {APP_CONFIG.CLASS_NAME}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/60 text-white font-bold text-[10px]">
                    Báo Cáo Dự Án Học Tập
                  </span>
                </div>

                {/* Slide Content by Index */}
                {currentSlide === 1 && (
                  <div className="my-auto space-y-3 animate-fade-in">
                    <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold block">
                      Slide 1: Trang Bìa Thuyết Trình
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
                    </h2>
                    <p className="text-sm text-slate-300 max-w-xl">
                      {file.contentPreview || 'Báo cáo chuyên đề học tập sáng tạo của Tổ 3 – Bám sát yêu cầu cần đạt SGK Kết nối tri thức.'}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-xs text-indigo-200 mt-2">
                      <Presentation size={14} />
                      <span>Nhóm thực hiện: Toàn thể thành viên Tổ 3</span>
                    </div>
                  </div>
                )}

                {currentSlide === 2 && (
                  <div className="my-auto space-y-3 animate-fade-in">
                    <span className="text-xs uppercase tracking-widest text-sky-400 font-bold block">
                      Slide 2: Mục Tiêu & Thuyết Minh Dự Án
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-sky-200">
                      Nội dung trọng tâm & Phương pháp thực hiện
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200 mt-2">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="font-bold text-sky-300 block mb-1">🎯 Mục tiêu đạt được:</span>
                        <p className="text-slate-300">
                          Hệ thống hóa kiến thức lý thuyết, ứng dụng thực hành giải quyết bài toán thực tế và rèn luyện tư duy phản biện.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="font-bold text-amber-300 block mb-1">💡 Điểm nổi bật:</span>
                        <p className="text-slate-300">
                          Phân công nhiệm vụ rõ ràng, kết hợp công nghệ thông tin và học liệu số trực quan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentSlide === 3 && (
                  <div className="my-auto space-y-3 text-center animate-fade-in">
                    <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
                      Slide 3: Kết Quả & Đánh Giá
                    </span>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle size={28} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-emerald-200">
                      Hoàn Thành Xuất Sắc Dự Án Học Tập
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      Cảm ơn Thầy Cô và các bạn học sinh đã theo dõi bài thuyết trình. Học liệu được lưu trữ chính thức trong Thư viện Tổ 3.
                    </p>
                    <p className="text-xs font-bold text-emerald-400">
                      Tổ 3 – Đoàn kết, Sáng tạo & Dẫn đầu thi đua!
                    </p>
                  </div>
                )}

                {/* Slide Controls Bar */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentSlide === 1}
                      onClick={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors cursor-pointer text-white"
                      title="Slide trước"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-mono text-white text-xs px-2">
                      Slide {currentSlide} / {totalSlides}
                    </span>
                    <button
                      type="button"
                      disabled={currentSlide === totalSlides}
                      onClick={() => setCurrentSlide((prev) => Math.min(totalSlides, prev + 1))}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors cursor-pointer text-white"
                      title="Slide tiếp theo"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Tải file slide (.ppt)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Word Document A4 Paper Viewer */}
          {file.type === 'word' && (
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 p-8 sm:p-12 text-slate-900 font-serif leading-relaxed max-h-[75vh] overflow-y-auto">
              <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
                <p className="text-xs uppercase font-sans font-bold tracking-wider text-slate-500">
                  TRƯỜNG THPT DƯƠNG MINH CHÂU – LỚP {APP_CONFIG.CLASS_NAME}
                </p>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  TỔ 3 • NĂM HỌC {APP_CONFIG.SCHOOL_YEAR}
                </p>
                <h3 className="text-xl font-bold uppercase mt-4 text-blue-900">
                  {file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
                </h3>
              </div>

              <div className="space-y-4 text-sm font-sans">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Tên tệp tin:</span>
                    <span className="font-bold text-slate-800">{file.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Dung lượng:</span>
                    <span className="font-bold text-slate-800">{file.sizeFormatted}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Thực hiện bởi:</span>
                    <span className="font-bold text-emerald-700">Các thành viên dự án Tổ 3</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1">
                    I. Thuyết Minh & Nội Dung Chi Tiết
                  </h4>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {file.contentPreview || 'Báo cáo thuyết minh sản phẩm học tập hoàn chỉnh của Tổ 3. Bám sát yêu cầu cần đạt của Chương trình Giáo dục phổ thông 2018 (SGK Kết nối tri thức).'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1">
                    II. Đánh Giá & Kết Quả
                  </h4>
                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                    Sản phẩm đạt yêu cầu chuẩn đầu ra về kiến thức, kỹ năng và thái độ học tập. Đã được thẩm định và lưu trữ vào Thư viện Sản phẩm của Tổ 3.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                  <div className="text-center">
                    <span className="font-bold text-slate-700 block">TỔ TRƯỞNG TỔ 3</span>
                    <span className="text-[11px] italic">(Đã ký duyệt)</span>
                    <p className="mt-8 font-bold text-slate-800">{APP_CONFIG.LEADER_NAME}</p>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-slate-700 block">ĐẠI DIỆN NHÓM DỰ ÁN</span>
                    <span className="text-[11px] italic">(Đã ký)</span>
                    <p className="mt-8 font-bold text-slate-800">Thành viên tham gia</p>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <Download size={14} /> Tải file Word (.doc) về máy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Excel / Other Office Files */}
          {['excel', 'archive', 'other'].includes(file.type) && (
            <div className="w-full max-w-lg bg-white rounded-2xl p-8 shadow-xl border border-gray-200 text-center">
              <div className="flex justify-center mb-4">
                <FileIconBadge type={file.type} extension={file.extension} size="lg" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">{file.name}</h4>
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full mb-4">
                Định dạng: .{file.extension} ({file.sizeFormatted})
              </span>

              {file.contentPreview && (
                <div className="mb-6 text-left bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <div className="font-semibold text-slate-700 mb-1">Mô tả tóm tắt nội dung:</div>
                  <p className="italic">{file.contentPreview}</p>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <Download size={16} /> Tải file về thiết bị (Mở được 100%)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-white border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>Hệ thống Tổ 3 - Lớp 11A1 THPT Dương Minh Châu</span>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 font-medium text-xs underline"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
