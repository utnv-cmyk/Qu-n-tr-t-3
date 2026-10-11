import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Download,
  Users,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Member, Role } from '../types';
import {
  ParsedMemberCandidate,
  parseMembersFromFile,
  downloadSampleExcelTemplate,
  downloadSampleWordGuide,
  convertCandidatesToMembers,
} from '../utils/memberFileParser';
import { formatBytes } from '../config';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  onImportMembers: (newMembers: Member[]) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const ImportMembersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  existingMembers,
  onImportMembers,
  showToast,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [candidates, setCandidates] = useState<ParsedMemberCandidate[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);

    try {
      const parsed = await parseMembersFromFile(file, existingMembers);
      if (parsed.length === 0) {
        setParseError(
          'Không tìm thấy thông tin học sinh nào trong tệp. Vui lòng kiểm tra lại định dạng hoặc tải file mẫu chuẩn bên dưới!'
        );
      } else {
        setCandidates(parsed);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError(
        'Không thể đọc nội dung tệp. Vui lòng đảm bảo tệp không bị mã hóa hoặc thử dùng file mẫu Excel/Word.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: checked })));
  };

  const handleUncheckDuplicates = () => {
    setCandidates((prev) =>
      prev.map((c) => (c.isDuplicate ? { ...c, selected: false } : c))
    );
    showToast('Đã bỏ chọn các học sinh bị trùng tên!');
  };

  const handleToggleCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleUpdateCandidate = (
    id: string,
    field: keyof ParsedMemberCandidate,
    value: any
  ) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setCandidates([]);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    const selectedCandidates = candidates.filter((c) => c.selected);
    if (selectedCandidates.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh để thêm!', 'warning');
      return;
    }

    // Validate that names are not empty
    const invalid = selectedCandidates.find((c) => !c.name.trim());
    if (invalid) {
      showToast('Có dòng học sinh chưa có họ và tên hợp lệ!', 'warning');
      return;
    }

    const newMembers = convertCandidatesToMembers(selectedCandidates);
    onImportMembers(newMembers);
    showToast(
      `Đã thêm thành công ${newMembers.length} thành viên mới vào danh sách Tổ 3!`,
      'success'
    );
    onClose();
  };

  const selectedCount = candidates.filter((c) => c.selected).length;
  const duplicateCount = candidates.filter((c) => c.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-6 border border-slate-200 animate-scale-up flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Tải Lên Thêm Thành Viên Từ File
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hỗ trợ tệp <b>Excel (.xlsx, .xls, .csv)</b>, <b>Word (.docx, .doc)</b> và <b>PDF (.pdf)</b>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Quick template download actions */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 text-xs">
                  Chưa có sẵn file danh sách chuẩn?
                </h4>
                <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                  Tải ngay file mẫu Excel (.xlsx) hoặc mẫu Word (.txt) có sẵn cột: STT, Họ và tên, SĐT, Email, Nhóm, Vai trò.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={downloadSampleExcelTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <FileSpreadsheet size={15} /> Mẫu Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={downloadSampleWordGuide}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl transition-colors"
              >
                <FileText size={15} /> Mẫu Word / Văn bản
              </button>
            </div>
          </div>

          {/* Upload Zone (If no candidates loaded yet) */}
          {!selectedFile || candidates.length === 0 ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.docx,.doc,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-3xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                {isParsing ? (
                  <RefreshCw size={28} className="animate-spin text-blue-600" />
                ) : (
                  <Upload size={28} />
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {isParsing
                  ? 'Đang phân tích dữ liệu tệp tin...'
                  : 'Kéo thả hoặc bấm để chọn tệp danh sách học sinh'}
              </h4>
              <p className="text-slate-500 text-xs max-w-md mb-4 leading-relaxed">
                Hệ thống tự động quét và bóc tách họ tên, số điện thoại, email và phân nhóm học tập từ các tệp Excel, Word và PDF.
              </p>

              {/* Supported Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  <FileSpreadsheet size={13} /> Excel (.xlsx, .xls, .csv)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px]">
                  <FileText size={13} /> Word (.docx, .doc)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px]">
                  <FileCheck size={13} /> PDF (.pdf)
                </span>
              </div>
            </div>
          ) : null}

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{parseError}</p>
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="mt-2 text-rose-700 underline font-bold"
                >
                  Thử lại với tệp khác
                </button>
              </div>
            </div>
          )}

          {/* Candidates Preview Table */}
          {candidates.length > 0 && (
            <div className="space-y-4">
              {/* File Info & Stats Banner */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {selectedFile?.name.split('.').pop() || 'FILE'}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      {selectedFile?.name}
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      Dung lượng: {selectedFile ? formatBytes(selectedFile.size) : '0 B'} • Phát hiện{' '}
                      <b>{candidates.length} học sinh</b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetFile}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition-colors"
                  >
                    <RefreshCw size={12} /> Chọn tệp khác
                  </button>
                </div>
              </div>

              {/* Statistics & Quick Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold block uppercase tracking-wider">
                    Tổng phát hiện
                  </span>
                  <span className="text-base font-extrabold text-blue-900">
                    {candidates.length} bạn
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                    Sẽ thêm vào tổ
                  </span>
                  <span className="text-base font-extrabold text-emerald-900">
                    {selectedCount} bạn
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-bold block uppercase tracking-wider">
                    Trùng tên đã có
                  </span>
                  <span className="text-base font-extrabold text-amber-900">
                    {duplicateCount} bạn
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200">
                  <span className="text-[10px] text-purple-700 font-bold block uppercase tracking-wider">
                    Tổ 3 hiện tại
                  </span>
                  <span className="text-base font-extrabold text-purple-900">
                    {existingMembers.length} bạn
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                  >
                    Bỏ chọn tất cả
                  </button>
                  {duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={handleUncheckDuplicates}
                      className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[11px]"
                    >
                      Bỏ chọn các bạn trùng tên ({duplicateCount})
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-slate-400">
                  Bạn có thể chỉnh sửa trực tiếp thông tin trong bảng trước khi thêm.
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCount === candidates.length && candidates.length > 0}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="p-3">Họ và tên học sinh</th>
                        <th className="p-3">Số điện thoại</th>
                        <th className="p-3">Email trường</th>
                        <th className="p-3">Phân nhóm</th>
                        <th className="p-3">Vai trò</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3 w-10 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {candidates.map((c) => (
                        <tr
                          key={c.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            !c.selected ? 'opacity-50 bg-slate-50/40' : ''
                          } ${c.isDuplicate ? 'bg-amber-50/30' : ''}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={c.selected}
                              onChange={() => handleToggleCandidate(c.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                          </td>

                          {/* Editable Name */}
                          <td className="p-3 min-w-[160px]">
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) =>
                                handleUpdateCandidate(c.id, 'name', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-lg outline-none font-bold text-slate-900"
                            />
                          </td>

                          {/* Editable Phone */}
                          <td className="p-3 min-w-[130px]">
                            <input
                              type="text"
                              value={c.phone}
                              onChange={(e) =>
                                handleUpdateCandidate(c.id, 'phone', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-lg outline-none text-slate-700"
                            />
                          </td>

                          {/* Editable Email */}
                          <td className="p-3 min-w-[190px]">
                            <input
                              type="text"
                              value={c.email}
                              onChange={(e) =>
                                handleUpdateCandidate(c.id, 'email', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-400 rounded-lg outline-none text-slate-700"
                            />
                          </td>

                          {/* Group Selector */}
                          <td className="p-3 min-w-[150px]">
                            <select
                              value={c.groupName}
                              onChange={(e) =>
                                handleUpdateCandidate(c.id, 'groupName', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-800"
                            >
                              <option value="Nhóm 1 - Tự nhiên">Nhóm 1 - Tự nhiên</option>
                              <option value="Nhóm 2 - Xã hội">Nhóm 2 - Xã hội</option>
                              <option value="Nhóm 3 - Ngoại ngữ & Tin">Nhóm 3 - Ngoại ngữ & Tin</option>
                              <option value="Nhóm 4 - Dự án">Nhóm 4 - Dự án</option>
                            </select>
                          </td>

                          {/* Role Selector */}
                          <td className="p-3 min-w-[120px]">
                            <select
                              value={c.role}
                              onChange={(e) =>
                                handleUpdateCandidate(c.id, 'role', e.target.value as Role)
                              }
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-800"
                            >
                              <option value="member">🎒 Thành viên</option>
                              <option value="leader">👑 Tổ trưởng</option>
                            </select>
                          </td>

                          {/* Duplicate badge */}
                          <td className="p-3 whitespace-nowrap">
                            {c.isDuplicate ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1" title={c.duplicateReason}>
                                <AlertTriangle size={11} /> Trùng tên
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 size={11} /> Hợp lệ
                              </span>
                            )}
                          </td>

                          {/* Remove button */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteCandidate(c.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Loại bỏ dòng này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {candidates.length > 0 ? (
              <span>
                Đang chọn: <b className="text-blue-700">{selectedCount}</b> / {candidates.length} học sinh
              </span>
            ) : (
              <span>Chưa có tệp nào được chọn</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Check size={16} /> Thêm {selectedCount} học sinh vào Tổ 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
