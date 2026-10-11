import React from 'react';
import { Lock } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number | string;
  adminOnly?: boolean;
  description?: string;
}

interface TabLayoutProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isLeader?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}

export const TabLayout: React.FC<TabLayoutProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isLeader = false,
  title,
  subtitle,
  icon: HeaderIcon,
  extraActions,
  children,
}) => {
  // Filter tabs by permission: adminOnly tabs are only visible to leaders
  const visibleTabs = tabs.filter((t) => !t.adminOnly || isLeader);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Optional Top Section Header */}
      {(title || extraActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3.5">
            {HeaderIcon && (
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                <HeaderIcon size={22} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {title}
                </h2>
                {!isLeader && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                    <Lock size={11} /> Thành viên
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
          </div>

          {extraActions && (
            <div className="flex items-center gap-2 flex-wrap">{extraActions}</div>
          )}
        </div>
      )}

      {/* Horizontal Scrollable Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <nav
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5"
          aria-label="Tabs"
        >
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`group shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                }`}
              >
                {Icon && (
                  <Icon
                    size={16}
                    className={`transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                )}
                <span className="whitespace-nowrap">{tab.label}</span>

                {/* Badge if provided */}
                {tab.badge !== undefined && tab.badge !== '' && (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-extrabold rounded-md leading-none ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Admin lock indicator if tab is restricted */}
                {tab.adminOnly && isLeader && (
                  <span
                    className={`text-[10px] px-1 py-0.5 rounded font-extrabold uppercase ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                    title="Chỉ Tổ trưởng thấy"
                  >
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panel Content */}
      <div className="tab-content focus:outline-hidden">{children}</div>
    </div>
  );
};
