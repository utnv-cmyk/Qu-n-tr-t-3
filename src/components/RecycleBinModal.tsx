import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  X,
  Search,
  Users,
  FolderArchive,
  BookOpenCheck,
  Upload,
  Clapperboard,
  Trophy,
  ClipboardCheck,
  BarChart3,
  MessagesSquare,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { TrashItem, TrashItemType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trashItems: TrashItem[];
  onRestore: (item: TrashItem) => void;
  onRestoreAll: () => void;
  onPermanentDelete: (id: string) => void;
  onClearAllTrash: () => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const RecycleBinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  trashItems,
  onRestore,
  onRestoreAll,
  onPermanentDelete,
  onClearAllTrash,
  showToast,
}) => {
  const [activeType, setActiveType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // In-app confirmation dialog states
  const [itemToDelete, setItemToDelete] = useState<TrashItem | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [isConfirmingBatchDelete, setIsConfirmingBatchDelete] = useState(false);

  if (!isOpen) return null;

  const getTypeIcon = (type: TrashItemType) => {
    switch (type) {
      case 'member':
        return <Users size={16} className="text-blue-600" />;
      case 'document':
        return <FolderArchive size={16} className="text-indigo-600" />;
      case 'assignment':
        return <BookOpenCheck size={16} className="text-emerald-600" />;
      case 'submission':
        return <Upload size={16} className="text-purple-600" />;
      case 'product':
        return <Clapperboard size={16} className="text-pink-600" />;
      case 'competition':
        return <Trophy size={16} className="text-amber-600" />;
      case 'attendance':
        return <ClipboardCheck size={16} className="text-cyan-600" />;
      case 'report':
        return <BarChart3 size={16} className="text-orange-600" />;
      case 'discussion':
        return <MessagesSquare size={16} className="text-teal-600" />;
      case 'group':
        return <Users size={16} className="text-sky-600" />;
      default:
        return <Trash2 size={16} className="text-slate-600" />;
    }
  };

  const tabs: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: trashItems.length },
    {
      id: 'member',
      label: 'Thành viên',
      count: trashItems.filter((i) => i.type === 'member').length,
    },
    {
      id: 'group',
      label: 'Nhóm',
      count: trashItems.filter((i) => i.type === 'group').length,
    },
    {
      id: 'document',
      label: 'Tài liệu',
      count: trashItems.filter((i) => i.type === 'document').length,
    },
    {
      id: 'assignment',
      label: 'Nhiệm vụ',
      count: trashItems.filter((i) => i.type === 'assignment').length,
    },
    {
      id: 'submission',
      label: 'Bài nộp',
      count: trashItems.filter((i) => i.type === 'submission').length,
    },
    {
      id: 'product',
      label: 'Sản phẩm',
      count: trashItems.filter((i) => i.type === 'product').length,
    },
    {
      id: 'competition',
      label: 'Thi đua',
      count: trashItems.filter((i) => i.type === 'competition').length,
    },
    {
      id: 'attendance',
      label: 'Điểm danh',
      count: trashItems.filter((i) => i.type === 'attendance').length,
    },
    {
      id: 'report',
      label: 'Báo cáo',
      count: trashItems.filter((i) => i.type === 'report').length,
    },
    {
      id: 'discussion',
      label: 'Thảo luận',
      count: trashItems.filter((i) => i.type === 'discussion').length,
    },
  ];

  const filteredItems = trashItems.filter((item) => {
    const matchType = activeType === 'all' || item.type === activeType;
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.typeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  // Toggle single item selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all filtered items
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  // 1. DỌN SẠCH 1 MỤC (XÓA VĨNH VIỄN)
  const handleExecuteSingleDelete = (item: TrashItem) => {
    const deletedTitle = item.title;
    onPermanentDelete(item.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    setItemToDelete(null);
    showToast(`Đã dọn sạch vĩnh viễn "${deletedTitle}" khỏi thùng rác!`, 'success');
  };

  // 2. DỌN SẠCH TOÀN BỘ THÙNG RÁC
  const handleExecuteClearAll = () => {
    onClearAllTrash();
    setSelectedIds(new Set());
    setIsConfirmingClearAll(false);
    showToast('Đã dọn sạch toàn bộ thùng rác thành công!', 'success');
  };

  // 3. DỌN SẠCH CÁC MỤC ĐÃ CHỌN (BATCH DELETE)
  const handleExecuteBatchDelete = () => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => {
      onPermanentDelete(id);
    });
    setSelectedIds(new Set());
    setIsConfirmingBatchDelete(false);
    showToast(`Đã dọn sạch ${count} mục đã chọn khỏi thùng rác!`, 'success');
  };

  // 4. KHÔI PHỤC DỮ LIỆU CÁC MỤC ĐÃ CHỌN
  const handleBatchRestore = () => {
    const itemsToRestore = trashItems.filter((i) => selectedIds.has(i.id));
    itemsToRestore.forEach((item) => {
      onRestore(item);
    });
    setSelectedIds(new Set());
    showToast(`Đã khôi phục ${itemsToRestore.length} mục dữ liệu về ứng dụng thành công!`, 'success');
  };

  // 5. KHÔI PHỤC TOÀN BỘ DỮ LIỆU
  const handleRestoreAllData = () => {
    onRestoreAll();
    setSelectedIds(new Set());
    showToast('Đã khôi phục toàn bộ dữ liệu từ thùng rác về ứng dụng thành công!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in text-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-6 border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
              <Trash2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Thùng Rác & Khôi Phục Dữ Liệu
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold">
                  {trashItems.length} mục đã xóa
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quản lý dữ liệu đã xóa: chọn <b>Khôi phục dữ liệu</b> để đưa về ứng dụng hoặc <b>Dọn sạch</b> để xóa vĩnh viễn khỏi bộ nhớ.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Tìm kiếm, Khôi phục dữ liệu và Dọn sạch */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔎 Tìm kiếm mục đã xóa theo tên, mô tả..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Chỉ có 2 chức năng chính: KHÔI PHỤC DỮ LIỆU và DỌN SẠCH */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Khi có chọn mục cụ thể */}
              {selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleBatchRestore}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Khôi phục các mục dữ liệu đã chọn về ứng dụng"
                  >
                    <RotateCcw size={13} />
                    <span>Khôi phục dữ liệu ({selectedIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmingBatchDelete(true)}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Dọn sạch vĩnh viễn các mục đã chọn"
                  >
                    <Trash2 size={13} />
                    <span>Dọn sạch ({selectedIds.size})</span>
                  </button>
                </>
              )}

              {/* Khi không chọn riêng mục nào và thùng rác có dữ liệu */}
              {trashItems.length > 0 && selectedIds.size === 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleRestoreAllData}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Khôi phục toàn bộ các mục về ứng dụng"
                  >
                    <RotateCcw size={14} />
                    <span>Khôi phục dữ liệu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmingClearAll(true)}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Dọn sạch toàn bộ thùng rác"
                  >
                    <Trash2 size={14} />
                    <span>Dọn sạch thùng rác</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {tabs
              .filter((t) => t.count > 0 || t.id === 'all')
              .map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveType(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeType === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      activeType === tab.id ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
          </div>

          {/* Select All Checkbox bar */}
          {filteredItems.length > 0 && (
            <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-500 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                  onChange={handleToggleSelectAll}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  {selectedIds.size === filteredItems.length
                    ? 'Bỏ chọn tất cả'
                    : `Chọn tất cả (${filteredItems.length} mục)`}
                </span>
              </label>

              {selectedIds.size > 0 && (
                <span className="font-extrabold text-blue-600">
                  Đã chọn {selectedIds.size} / {filteredItems.length} mục
                </span>
              )}
            </div>
          )}
        </div>

        {/* List of Deleted Items */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Trash2 size={28} />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-700">
                  Thùng rác hiện đang sạch sẽ (Trống)
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Khi bạn xóa bất kỳ dữ liệu nào trong ứng dụng, mục đó sẽ được chuyển vào đây để bạn có thể <b>Khôi phục dữ liệu</b> hoặc <b>Dọn sạch</b> bất cứ lúc nào.
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3.5 bg-white border rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/25 shadow-xs ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(item.id)}
                      className="mt-1.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                    />

                    <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {item.typeLabel}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.subtitle}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>Đã xóa lúc: {item.deletedAt}</span>
                        <span>• Bởi: {item.deletedBy}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions: Khôi phục dữ liệu / Dọn sạch (Xóa vĩnh viễn) */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onRestore(item);
                        showToast(`Đã khôi phục "${item.title}" về ứng dụng thành công!`, 'success');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                      title="Khôi phục lại mục này vào ứng dụng"
                    >
                      <RotateCcw size={13} />
                      <span>Khôi phục</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                      title="Dọn sạch vĩnh viễn mục này"
                    >
                      <Trash2 size={13} />
                      <span>Dọn sạch</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer: Chỉ gồm thông tin, Khôi phục, Dọn sạch và Đóng */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>
              Tổng số: <b>{trashItems.length}</b> mục trong thùng rác
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {trashItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleRestoreAllData}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Khôi phục toàn bộ dữ liệu về ứng dụng"
                >
                  <RotateCcw size={13} />
                  <span>Khôi phục dữ liệu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmingClearAll(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Dọn sạch toàn bộ thùng rác"
                >
                  <Trash2 size={13} />
                  <span>Dọn sạch thùng rác</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* ==============================================================
          HỘP THOẠI XÁC NHẬN: DỌN SẠCH 1 MỤC
      ============================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  Xác Nhận Dọn Sạch Mục Này?
                </h4>
                <p className="text-xs text-slate-500">
                  Mục này sẽ bị xóa vĩnh viễn khỏi bộ nhớ và không thể khôi phục
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="font-extrabold text-slate-900 line-clamp-2">
                {itemToDelete.title}
              </div>
              <div className="text-[11px] text-slate-500">
                Loại: <b>{itemToDelete.typeLabel}</b> • Đã xóa lúc: {itemToDelete.deletedAt}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleExecuteSingleDelete(itemToDelete)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 cursor-pointer transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Đồng Ý Dọn Sạch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          HỘP THOẠI XÁC NHẬN: DỌN SẠCH TOÀN BỘ THÙNG RÁC
      ============================================================== */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-300 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  Dọn Sạch Toàn Bộ Thùng Rác?
                </h4>
                <p className="text-xs text-slate-500">
                  Xóa sạch toàn bộ {trashItems.length} mục đã xóa trong thùng rác
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Thao tác này sẽ làm sạch hoàn toàn bộ nhớ thùng rác. Tất cả <b>{trashItems.length} mục</b> sẽ bị xóa vĩnh viễn và không thể khôi phục lại.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteClearAll}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 cursor-pointer transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Xác Nhận Dọn Sạch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          HỘP THOẠI XÁC NHẬN: DỌN SẠCH CÁC MỤC ĐÃ CHỌN (BATCH)
      ============================================================== */}
      {isConfirmingBatchDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-300 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  Dọn Sạch {selectedIds.size} Mục Đã Chọn?
                </h4>
                <p className="text-xs text-slate-500">
                  Các mục được đánh dấu sẽ bị xóa vĩnh viễn khỏi thùng rác
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn dọn sạch <b>{selectedIds.size} mục</b> đã chọn? Những mục này sẽ không thể khôi phục lại.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingBatchDelete(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md cursor-pointer transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Dọn Sạch {selectedIds.size} Mục</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
