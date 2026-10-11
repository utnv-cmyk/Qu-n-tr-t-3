import React from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  GraduationCap,
  Sparkles,
  BarChart3,
  Lock,
  X,
} from 'lucide-react';
import { Member } from '../types';
import { APP_CONFIG } from '../config';

export type SectionKey =
  | 'overview'
  | 'members_hub'
  | 'competition'
  | 'study_hub'
  | 'ai_assistant'
  | 'reports_settings';

// Backward-compatible TabKey for old components
export type TabKey =
  | SectionKey
  | 'members'
  | 'attendance'
  | 'groups'
  | 'documents'
  | 'assignments'
  | 'submissions'
  | 'products'
  | 'discussions'
  | 'reports'
  | 'settings'
  | 'ai_assessment'
  | 'ai_chat';

interface Props {
  currentSection: SectionKey;
  onSelectSection: (section: SectionKey, tab?: string) => void;
  currentMember: Member;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  membersCount?: number;
  pendingTasksCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  currentSection,
  onSelectSection,
  currentMember,
  isOpenMobile,
  onCloseMobile,
  membersCount,
  pendingTasksCount,
}) => {
  const isLeader = currentMember.role === 'leader';

  // Exactly 6 main navigation items as requested
  const menuItems: {
    id: SectionKey;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    description?: string;
  }[] = [
    {
      id: 'overview',
      label: '1. 🏠 Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'members_hub',
      label: '2. 👥 Quản lý Thành viên',
      icon: Users,
      badge: membersCount,
    },
    {
      id: 'competition',
      label: '3. 🏆 Thi đua & Khen thưởng',
      icon: Trophy,
    },
    {
      id: 'study_hub',
      label: '4. 📚 Góc Học tập & Bài nộp',
      icon: GraduationCap,
      badge: pendingTasksCount ? `${pendingTasksCount} bài` : undefined,
    },
    {
      id: 'ai_assistant',
      label: '5. 🤖 Trợ lý AI & Tạo đề',
      icon: Sparkles,
    },
    {
      id: 'reports_settings',
      label: '6. 📊 Báo cáo, Xuất dữ liệu & Quy chế',
      icon: BarChart3,
    },
  ];

  const handleItemClick = (id: SectionKey) => {
    onSelectSection(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Không Gian Số
              </span>
            </div>
            <h1 className="text-base font-extrabold text-white mt-1">
              TỔ 3 – LỚP {APP_CONFIG.CLASS_NAME}
            </h1>
            <p className="text-[11px] text-slate-400">
              THPT Dương Minh Châu • {APP_CONFIG.SCHOOL_YEAR}
            </p>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Role Card in Sidebar */}
        <div className="mx-4 my-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
          <img
            src={currentMember.avatar}
            alt={currentMember.name}
            className="w-10 h-10 rounded-lg object-cover border border-slate-600"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{currentMember.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isLeader ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded border border-amber-600/40">
                  👑 TỔ TRƯỞNG
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded border border-blue-600/40">
                  🎒 THÀNH VIÊN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 6 Core Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
          <div className="px-3 pb-1 pt-2 text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
            Danh mục tính năng (6 Mục)
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    size={18}
                    className={isActive ? 'text-white' : 'text-slate-400'}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Note */}
        <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
            <Sparkles size={13} />
            <span>Quy chế Tổ 3:</span>
          </div>
          <p className="leading-snug text-slate-400 text-[10px]">
            • Điểm chuẩn: <b>0.25đ / lượt</b>
            <br />
            • Quản lý chuyên cần & thi đua do <b>Tổ trưởng</b> phụ trách.
          </p>
        </div>
      </aside>
    </>
  );
};
