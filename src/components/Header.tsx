import React from 'react';
import {
  Search,
  Upload,
  ShieldAlert,
  UserCheck,
  Crown,
  Menu,
  Sparkles,
  School,
} from 'lucide-react';
import { Member } from '../types';
import { APP_CONFIG } from '../config';

interface Props {
  currentMember: Member;
  members: Member[];
  onSwitchUser: (memberId: string) => void;
  onOpenSubmitModal: () => void;
  onNavigateToSubmissions?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<Props> = ({
  currentMember,
  members,
  onSwitchUser,
  onOpenSubmitModal,
  onNavigateToSubmissions,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
}) => {
  const isLeader = currentMember.role === 'leader';

  const handleClickSubmit = () => {
    if (onNavigateToSubmissions) {
      onNavigateToSubmissions();
    }
    onOpenSubmitModal();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile menu button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Mở menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-base tracking-wider">
              T3
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                  TỔ 3 – LỚP {APP_CONFIG.CLASS_NAME}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {APP_CONFIG.SCHOOL_YEAR}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                GVCN: {APP_CONFIG.HOMEROOM_TEACHER} • TT: {APP_CONFIG.LEADER_NAME}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar (Section XIX) */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="🔎 Tìm kiếm tài liệu, nhiệm vụ, bài nộp, thành viên..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Right actions: Prominent Submit Button + Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent "📤 NỘP BÀI" button (Section XI) */}
          <button
            onClick={handleClickSubmit}
            className="group relative inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 active:scale-95 transition-all"
            title="Mở cửa sổ nộp sản phẩm học tập đa phương tiện"
          >
            <Upload size={17} className="group-hover:-translate-y-0.5 transition-transform" />
            <span>NỘP BÀI</span>
            <span className="hidden xl:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-normal">
              Đa tệp tin
            </span>
          </button>

          {/* User & Role Switcher Dropdown */}
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 gap-1">
            <div className="flex items-center gap-1.5 pl-2 pr-1">
              {currentMember.id === 'm0' || currentMember.email.includes('utnv') ? (
                <div
                  className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100/90 px-2 py-1 rounded-lg"
                  title="Vai trò GVCN - Toàn quyền quản trị & duyệt đề"
                >
                  <Crown size={14} className="text-purple-600" />
                  <span className="hidden sm:inline">GVCN</span>
                </div>
              ) : isLeader ? (
                <div
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-1 rounded-lg"
                  title="Vai trò Tổ trưởng - Quản trị tổ & khảo thí"
                >
                  <Crown size={14} className="text-amber-600" />
                  <span className="hidden sm:inline">TỔ TRƯỞNG</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-1 rounded-lg"
                  title="Vai trò Học sinh - Học tập & làm bài khảo thí"
                >
                  <UserCheck size={14} className="text-emerald-600" />
                  <span className="hidden sm:inline">HỌC SINH</span>
                </div>
              )}

              {/* Selector to switch between students to test RBAC */}
              <select
                value={currentMember.id}
                onChange={(e) => onSwitchUser(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer py-1 max-w-[130px] sm:max-w-[170px] truncate"
                title="Chọn thành viên để kiểm tra phân quyền thực tế"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}{' '}
                    {m.id === 'm0' || m.email.includes('utnv')
                      ? '⭐ [GVCN]'
                      : m.role === 'leader'
                      ? '👑 [Tổ trưởng]'
                      : '🎒 [Học sinh]'}
                  </option>
                ))}
              </select>
            </div>

            <img
              src={currentMember.avatar}
              alt={currentMember.name}
              className="w-8 h-8 rounded-lg object-cover border border-white shadow-xs"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
