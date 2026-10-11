import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Trophy,
  BookOpen,
  Clock,
  CheckCircle,
  FileText,
  FolderArchive,
  Clapperboard,
  ArrowUpRight,
  AlertTriangle,
  Upload,
  Sparkles,
  PlusCircle,
  Calendar,
} from 'lucide-react';
import {
  Member,
  DocumentItem,
  Assignment,
  Submission,
  ProductItem,
  ActivityLog,
} from '../types';
import {
  APP_CONFIG,
  getMemberDisplayRole,
  getStudentMembers,
} from '../config';
import { TabKey } from './Sidebar';
import { formatScore } from '../utils/scoreUtils';

interface Props {
  members: Member[];
  documents: DocumentItem[];
  assignments: Assignment[];
  submissions: Submission[];
  products: ProductItem[];
  activities: ActivityLog[];
  currentMember: Member;
  onNavigate: (tab: TabKey) => void;
  onOpenSubmitModal: () => void;
  onOpenNewDocModal: () => void;
  onOpenCompetitionModal?: () => void;
}

export const DashboardView: React.FC<Props> = ({
  members,
  documents,
  assignments,
  submissions,
  products,
  activities,
  currentMember,
  onNavigate,
  onOpenSubmitModal,
  onOpenNewDocModal,
}) => {
  const isLeader = currentMember.role === 'leader';

  // Thống kê nhanh chỉ tính trên 8 học sinh thực tế của Tổ 3 (loại trừ GVCN)
  const studentList = getStudentMembers(members);
  const totalStudents = studentList.length;
  const presentCount = studentList.filter((m) => m.attendanceAbsent === 0).length;
  const absentCount = totalStudents - presentCount;

  const totalPoints = studentList.reduce((sum, m) => sum + m.netPoints, 0);

  const ongoingTasks = assignments.filter((a) => a.status === 'in_progress').length;
  const urgentTasks = assignments.filter((a) => a.status === 'urgent').length;

  const totalSubmissions = submissions.length;
  const mySubmissions = submissions.filter((s) => s.studentId === currentMember.id);
  const myPendingTasks = assignments.filter(
    (a) => !submissions.some((s) => s.assignmentId === a.id && s.studentId === currentMember.id)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Chào mừng theo yêu cầu Section I */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-xs mb-3">
              <Sparkles size={14} className="text-yellow-300" />
              <span>Năm học {APP_CONFIG.SCHOOL_YEAR} • {APP_CONFIG.SEMESTER}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Xin chào, {APP_CONFIG.GROUP_NAME} – Lớp {APP_CONFIG.CLASS_NAME}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-blue-100 font-medium max-w-2xl leading-relaxed">
              {APP_CONFIG.APP_SUBTITLE}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                GVCN: <b className="text-white">{APP_CONFIG.HOMEROOM_TEACHER}</b>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                Tổ trưởng: <b className="text-white">{APP_CONFIG.LEADER_NAME}</b>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                Bạn đang đăng nhập: <b className="text-white">{currentMember.name}</b> ({getMemberDisplayRole(currentMember, 'with_icon')})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenSubmitModal}
              className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Upload size={18} />
              Nộp bài tập ngay
            </button>
            <button
              onClick={onOpenNewDocModal}
              className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded-2xl backdrop-blur-xs flex items-center gap-2 transition-all"
            >
              <PlusCircle size={18} />
              Đăng tài liệu
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 -top-16 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 10 Thông số KPI chính xác theo Section IV */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Sĩ số tổ */}
        <div
          onClick={() => onNavigate('members')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">1. Sĩ số tổ</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <p className="text-[11px] text-slate-500 mt-1">100% học sinh 11A1</p>
        </div>

        {/* 2. Có mặt */}
        <div
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">2. Có mặt tốt</span>
            <UserCheck size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{presentCount}</div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Chuyên cần 100%</p>
        </div>

        {/* 3. Vắng */}
        <div
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-red-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">3. Nghỉ / Trễ</span>
            <UserX size={18} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-700">{absentCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Tuần thứ 3</p>
        </div>

        {/* 4. Điểm thi đua tổ */}
        <div
          onClick={() => onNavigate('competition')}
          className="cursor-pointer bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between text-amber-100 mb-2">
            <span className="text-xs font-bold">4. Điểm thi đua</span>
            <Trophy size={18} className="text-amber-100" />
          </div>
          <div className="text-2xl font-black">{formatScore(totalPoints)}</div>
          <p className="text-[11px] text-amber-100 mt-1">Xếp hạng 1 toàn khối</p>
        </div>

        {/* 5. Nhiệm vụ đang thực hiện */}
        <div
          onClick={() => onNavigate('assignments')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">5. Nhiệm vụ mở</span>
            <BookOpen size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{ongoingTasks}</div>
          <p className="text-[11px] text-slate-500 mt-1">Đang triển khai</p>
        </div>

        {/* 6. Nhiệm vụ sắp hết hạn */}
        <div
          onClick={() => onNavigate('assignments')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">6. Sắp đến hạn</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{urgentTasks}</div>
          <p className="text-[11px] text-amber-700/80 mt-1">Hạn chót trong 48h</p>
        </div>

        {/* 7. Số bài đã nộp */}
        <div
          onClick={() => onNavigate('submissions')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">7. Bài đã nộp</span>
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSubmissions}</div>
          <p className="text-[11px] text-slate-500 mt-1">Bao gồm bản nháp</p>
        </div>

        {/* 8. Bài chưa nộp */}
        <div
          onClick={() => onNavigate('submissions')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">8. Bạn chưa nộp</span>
            <FileText size={18} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{myPendingTasks.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Cá nhân cần nộp</p>
        </div>

        {/* 9. Số tài liệu dùng chung */}
        <div
          onClick={() => onNavigate('documents')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">9. Tài liệu chung</span>
            <FolderArchive size={18} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{documents.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Word, PDF, Video...</p>
        </div>

        {/* 10. Số sản phẩm học tập */}
        <div
          onClick={() => onNavigate('products')}
          className="cursor-pointer bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">10. Sản phẩm tổ</span>
            <Clapperboard size={18} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600">{products.length}</div>
          <p className="text-[11px] text-purple-700/80 mt-1">Kho dự án xuất sắc</p>
        </div>
      </div>

      {/* 2 Khối chính: Việc cần làm (To-Do) & Hoạt động gần đây (Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Khu vực "Việc cần làm" (Section IV) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Việc cần làm của bạn</h3>
                <p className="text-xs text-slate-500">Nhiệm vụ sắp đến hạn, bài chưa nộp, thông báo mới</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Xem tất cả <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {myPendingTasks.length > 0 ? (
              myPendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {task.subject}
                      </span>
                      {task.status === 'urgent' && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                          ⚠️ Sắp đến hạn
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> Hạn chót: <b>{task.dueDate}</b>
                    </p>
                  </div>

                  <button
                    onClick={onOpenSubmitModal}
                    className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload size={14} /> Nộp bài ngay
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Bạn đã hoàn thành tất cả nhiệm vụ!</p>
                <p className="text-xs text-slate-400 mt-1">Không còn bài tập nào chưa nộp trong tuần này.</p>
              </div>
            )}

            {/* Tài liệu & Nhận xét mới */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => onNavigate('documents')}
                className="cursor-pointer p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-50 transition-colors"
              >
                <div className="text-[11px] font-bold text-indigo-700 mb-1">📘 Tài liệu mới được tải lên</div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {documents[0]?.title || 'Đề cương ôn tập Hóa học 11'}
                </p>
                <span className="text-[10px] text-indigo-600 mt-1 block">Bấm để xem và tải về</span>
              </div>

              <div
                onClick={() => onNavigate('submissions')}
                className="cursor-pointer p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors"
              >
                <div className="text-[11px] font-bold text-emerald-700 mb-1">💬 Nhận xét bài nộp mới</div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {submissions.find((s) => s.feedback)?.feedback || 'Bài làm rất công phu, slide trình bày đẹp...'}
                </p>
                <span className="text-[10px] text-emerald-600 mt-1 block">Bởi Tổ trưởng / GVCN</span>
              </div>
            </div>
          </div>
        </div>

        {/* Khu vực "Hoạt động gần đây" (Section IV) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">Hoạt động gần đây</h3>
            <span className="text-[11px] font-bold text-slate-400">Thời gian thực</span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="relative group">
                <span className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                <div>
                  <p className="text-xs text-slate-800 font-medium leading-snug">
                    <span className="font-bold text-slate-900">{act.actorName}</span>{' '}
                    <span className="text-slate-600">{act.action}</span>{' '}
                    <span className="font-semibold text-blue-700">“{act.targetTitle}”</span>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{act.timestamp}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick notice box */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-xs text-blue-900">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" />
              Ghi nhớ từ GVCN Nguyễn Văn Út:
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Tổ 3 duy trì tác phong đúng giờ và nộp bài trước hạn để giữ vững vị trí dẫn đầu thi đua tháng 3!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
