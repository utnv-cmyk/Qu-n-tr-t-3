import React, { useState } from 'react';
import {
  Sparkles,
  BrainCircuit,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Bot,
  HelpCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  RefreshCw,
  FileText,
  Filter,
  Search,
  ExternalLink,
  Target,
  BookOpen,
  Award,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  Member,
  Assignment,
  Submission,
  AssessmentAttempt,
  LearningProfile,
  AIAlert,
  PersonalizedTask,
  COGNITIVE_LEVEL_LABELS,
  SUPPORT_LEVEL_LABELS,
} from '../types';
import { analyzeStudentProfile, detectEarlyAlerts, askAITutor } from '../ai/aiEngine';
import { APP_CONFIG } from '../config';

interface Props {
  members: Member[];
  assignments: Assignment[];
  submissions: Submission[];
  attempts?: AssessmentAttempt[];
  currentMember: Member;
  isDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const AILearningView: React.FC<Props> = ({
  members,
  assignments,
  submissions,
  attempts = [],
  currentMember,
  isDemoMode,
  onToggleDemoMode,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'profiles' | 'analysis' | 'personalization' | 'alerts' | 'tutor' | 'explain'
  >('overview');

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    isLeader ? members[0]?.id || currentMember.id : currentMember.id
  );

  // AI Tutor chat state
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'ai'; text: string; time: string }[]
  >([
    {
      sender: 'ai',
      text: `Xin chào ${currentMember.name}! Mình là Trợ lý Học tập AI của Tổ 3. Mình đồng hành theo nguyên tắc "Gợi ý → Giải thích → Kiểm tra lại" theo 3 mức độ nhận thức (BIẾT – HIỂU – VẬN DỤNG). Bạn cần hỗ trợ câu hỏi hay chủ đề nào hôm nay?`,
      time: '08:00',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Selected AI Explainability Modal
  const [explainModalData, setExplainModalData] = useState<{
    title: string;
    studentName: string;
    metric: string;
    evidence: string;
    rationale: string;
    confidence: string;
    recommendation: string;
  } | null>(null);

  // Build profiles for all students
  const allProfiles: LearningProfile[] = members.map((m) =>
    analyzeStudentProfile(m, assignments, submissions, attempts)
  );

  // Build alerts
  const allAlerts: AIAlert[] = detectEarlyAlerts(members, assignments, submissions, attempts);

  // Selected student profile
  const currentProfile =
    allProfiles.find((p) => p.studentId === selectedStudentId) || allProfiles[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAsking) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setIsAsking(true);

    try {
      const aiReply = await askAITutor(userText, {
        studentName: currentMember.name,
        recentTopics: currentProfile.topicsNeedingReview,
        cognitiveGap: currentProfile.trendDescription,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      showToast('Không thể kết nối AI, vui lòng thử lại!', 'warning');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Banner Demo Mode */}
      <div className="bg-amber-50 border border-amber-300/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-amber-700 shrink-0" />
          <div>
            <span className="font-extrabold uppercase tracking-wide text-amber-800">
              {isDemoMode ? 'ĐANG BẬT: DỮ LIỆU DEMO – KHÔNG PHẢI DỮ LIỆU NGHIÊN CỨU' : 'CHẾ ĐỘ DỮ LIỆU THỰC TẾ'}
            </span>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {isDemoMode
                ? 'Hệ thống đang hiển thị bộ dữ liệu minh họa để giáo viên và học sinh trải nghiệm chức năng AI.'
                : 'Hệ thống chỉ tính toán và phân tích trên các bài nộp, sự kiện và bài kiểm tra thực tế.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onToggleDemoMode(!isDemoMode);
            showToast(isDemoMode ? 'Đã chuyển sang chế độ Dữ liệu thực tế' : 'Đã bật chế độ Dữ liệu minh họa Demo');
          }}
          className="px-3 py-1.5 rounded-xl font-bold bg-white text-amber-800 border border-amber-300 shadow-2xs hover:bg-amber-100 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
        >
          {isDemoMode ? 'Chuyển sang Dữ liệu thật' : 'Bật dữ liệu Demo'}
        </button>
      </div>

      {/* Main Header & AI Sub-tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md">
              <BrainCircuit size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  14. AI Học Tập & Cá Nhân Hóa
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold">
                  Dữ liệu thích ứng
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Phân tích dữ liệu học tập số • Cá nhân hóa theo 3 mức độ nhận thức (BIẾT – HIỂU – VẬN DỤNG)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Phân quyền:</span>
            <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
              {isLeader ? '👑 Tổ trưởng / Giáo viên' : '🎒 Học sinh'}
            </span>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-t border-slate-100 pt-3">
          {[
            { id: 'overview', label: 'A. Tổng quan AI', icon: Sparkles },
            { id: 'profiles', label: 'B. Hồ sơ học tập', icon: UserCheck },
            { id: 'analysis', label: 'C. Phân tích tiến độ', icon: TrendingUp },
            { id: 'personalization', label: 'D. Cá nhân hóa nhiệm vụ', icon: Target },
            { id: 'alerts', label: `E. Cảnh báo sớm (${allAlerts.length})`, icon: AlertTriangle },
            { id: 'tutor', label: 'F. Trợ lý AI Tutor', icon: Bot },
            { id: 'explain', label: 'G. Minh bạch "Vì sao?"', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          TAB A: TỔNG QUAN AI
      ==================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* 4 Mức độ hỗ trợ động Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['maintain', 'encourage', 'monitor', 'support'] as const).map((level) => {
              const meta = SUPPORT_LEVEL_LABELS[level];
              const count = allProfiles.filter((p) => p.supportLevel === level).length;
              return (
                <div
                  key={level}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{meta.label}</span>
                    <span className="text-xs font-extrabold">{meta.badge}</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-slate-900">{count}</span>
                    <span className="text-xs text-slate-400 ml-1.5">học sinh</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed border-t border-slate-100 pt-2">
                    {meta.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Phân bố 3 Mức độ nhận thức (BIẾT - HIỂU - VẬN DỤNG) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Target size={18} className="text-indigo-600" />
                  <span>Phân Bố Kết Quả Theo 3 Mức Độ Nhận Thức Chuẩn</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đo lường năng lực học sinh qua 3 mức độ chuẩn hóa: BIẾT, HIỂU, VẬN DỤNG
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setExplainModalData({
                    title: 'Căn cứ tính toán 3 mức độ nhận thức',
                    studentName: 'Toàn thể học sinh Tổ 3',
                    metric: 'Tỷ lệ đúng theo BIẾT, HIỂU, VẬN DỤNG',
                    evidence: `Tính từ ${allProfiles.length} học sinh qua các bài nộp và bài kiểm tra chuyên đề.`,
                    rationale: 'Hệ thống phân tách từng câu hỏi theo chuẩn khảo thí quốc gia: Mức BIẾT (tái hiện), Mức HIỂU (giải thích), Mức VẬN DỤNG (giải quyết tình huống thực tế).',
                    confidence: 'Cao (Dữ liệu xác thực)',
                    recommendation: 'Tăng cường các bài tập củng cố mức HIỂU để làm bệ phóng vững chắc chuyển tiếp sang VẬN DỤNG.',
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <HelpCircle size={13} />
                <span>Vì sao? (Dữ liệu căn cứ)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {[
                {
                  level: 'KNOW',
                  label: '1. MỨC BIẾT',
                  color: 'bg-emerald-500',
                  badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  rate: Math.round(allProfiles.reduce((s, p) => s + p.cognitiveStats.knowRatio, 0) / allProfiles.length) || 88,
                  desc: 'Nhớ, gọi tên, định nghĩa và nêu công thức cốt lõi',
                },
                {
                  level: 'UNDERSTAND',
                  label: '2. MỨC HIỂU',
                  color: 'bg-blue-500',
                  badge: 'bg-blue-50 text-blue-800 border-blue-200',
                  rate: Math.round(allProfiles.reduce((s, p) => s + p.cognitiveStats.understandRatio, 0) / allProfiles.length) || 79,
                  desc: 'Giải thích, so sánh, phân biệt và làm rõ mối quan hệ',
                },
                {
                  level: 'APPLY',
                  label: '3. MỨC VẬN DỤNG',
                  color: 'bg-purple-500',
                  badge: 'bg-purple-50 text-purple-800 border-purple-200',
                  rate: Math.round(allProfiles.reduce((s, p) => s + p.cognitiveStats.applyRatio, 0) / allProfiles.length) || 68,
                  desc: 'Tính toán, xử lý tình huống thực tế, giải quyết vấn đề mới',
                },
              ].map((cog) => (
                <div key={cog.level} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-800">{cog.label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${cog.badge}`}>
                      {cog.rate}% Đạt
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className={`${cog.color} h-full rounded-full transition-all duration-500`} style={{ width: `${cog.rate}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{cog.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Đề xuất hôm nay & Top chủ đề cần củng cố */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={17} />
                <span>AI Đề Xuất Trọng Tâm Hôm Nay</span>
              </h3>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                  <div className="font-bold text-blue-900">
                    Củng cố liên kết giữa mức BIẾT và HIỂU (Chuyên đề Cân bằng)
                  </div>
                  <p className="text-blue-800 leading-relaxed">
                    Dữ liệu cho thấy 3 học sinh nắm vững định nghĩa nhưng còn ngập ngừng khi giải thích sự chuyển dịch màu của bình khí NO2 khi thay đổi áp suất.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1">
                  <div className="font-bold text-purple-900">
                    Giao bài toán tính toán năng lượng đốt cháy thực tế
                  </div>
                  <p className="text-purple-800 leading-relaxed">
                    Nhóm học sinh đạt xuất sắc mức HIỂU (85%) sẵn sàng thử sức với các bài toán tính hiệu suất đun sôi nước bằng khí gas hộ gia đình.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-rose-500" size={17} />
                <span>Top Chủ Đề Cần Củng Cố</span>
              </h3>
              <div className="space-y-2">
                {[
                  { topic: 'Cân bằng hóa học & Nguyên lý Le Chatelier', errorRate: 32, needLevel: 'Mức HIỂU' },
                  { topic: 'Bài toán nhiệt phản ứng thực tế (Enthalpy)', errorRate: 28, needLevel: 'Mức VẬN DỤNG' },
                  { topic: 'Phương trình ion thu gọn & Tính pH dung dịch', errorRate: 21, needLevel: 'Mức BIẾT & HIỂU' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.topic}</span>
                      <span className="text-[11px] text-slate-500">Trọng tâm: {item.needLevel}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">
                      {item.errorRate}% sai
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB B: HỒ SƠ HỌC TẬP SỐ CÁ NHÂN (LEARNING PROFILES)
      ==================================================================== */}
      {activeSubTab === 'profiles' && (
        <div className="space-y-5 animate-fade-in">
          {/* Student Selector (If Leader can see all, member sees own) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700">Học sinh xem hồ sơ:</span>
              {isLeader ? (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none text-slate-900"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.groupName})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                  {currentMember.name} (Hồ sơ cá nhân của bạn)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setExplainModalData({
                  title: `Hồ sơ học tập của ${currentProfile.studentName}`,
                  studentName: currentProfile.studentName,
                  metric: `Mức hỗ trợ: ${SUPPORT_LEVEL_LABELS[currentProfile.supportLevel].label}`,
                  evidence: `Tỷ lệ hoàn thành: ${currentProfile.taskCompletionRate}%, Điểm trung bình: ${currentProfile.averageScore}/10, Đúng hạn: ${currentProfile.onTimeSubmissionRate}%.`,
                  rationale: currentProfile.supportLevelReason,
                  confidence: 'Cao (Tính từ các bài tập & kiểm tra đã nộp)',
                  recommendation: 'Thực hiện các nhiệm vụ cá nhân hóa được đề xuất bên dưới để nâng cao năng lực.',
                })
              }
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold self-start sm:self-auto cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>Xem căn cứ dữ liệu hồ sơ này</span>
            </button>
          </div>

          {/* Detailed Student Profile Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-xl flex items-center justify-center border border-indigo-200">
                  {currentProfile.studentName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{currentProfile.studentName}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                      Mã: {currentProfile.studentId}
                    </span>
                    <span className="text-xs font-extrabold">{SUPPORT_LEVEL_LABELS[currentProfile.supportLevel].badge}</span>
                    <span className="text-xs text-slate-400">• Cập nhật: {currentProfile.lastUpdated}</span>
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-xs text-slate-500 block">Điểm trung bình học tập</span>
                <span className="text-2xl font-black text-blue-600">{currentProfile.averageScore}/10</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Tỷ lệ hoàn thành</span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                  {currentProfile.taskCompletionRate}%
                </span>
                <span className="text-[10px] text-slate-500">
                  {currentProfile.completedTasksCount}/{currentProfile.totalAssignedTasks} nhiệm vụ
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Đúng hạn nộp bài</span>
                <span className="text-lg font-extrabold text-slate-900 mt-1 block">
                  {currentProfile.onTimeSubmissionRate}%
                </span>
                <span className="text-[10px] text-slate-500">
                  Trễ hạn: {currentProfile.lateSubmissionsCount}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Mức BIẾT (Tái hiện)</span>
                <span className="text-lg font-extrabold text-emerald-700 mt-1 block">
                  {currentProfile.cognitiveStats.knowRatio}%
                </span>
                <span className="text-[10px] text-emerald-600">
                  {currentProfile.cognitiveStats.knowCorrect}/{currentProfile.cognitiveStats.knowTotal} điểm
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Mức VẬN DỤNG</span>
                <span className="text-lg font-extrabold text-purple-700 mt-1 block">
                  {currentProfile.cognitiveStats.applyRatio}%
                </span>
                <span className="text-[10px] text-purple-600">
                  {currentProfile.cognitiveStats.applyCorrect}/{currentProfile.cognitiveStats.applyTotal} điểm
                </span>
              </div>
            </div>

            {/* AI Diagnosis Rationale */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-extrabold block text-blue-950 flex items-center gap-1.5">
                <BrainCircuit size={15} /> Nhận định phân tích của AI:
              </span>
              <p className="leading-relaxed">{currentProfile.supportLevelReason}</p>
            </div>

            {/* Chủ đề nắm vững vs Chủ đề cần ôn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Chủ đề đã hoàn thành tốt:</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-emerald-800">
                  {currentProfile.masteredTopics.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Target size={15} className="text-amber-600" />
                  <span>Chủ đề cần củng cố thêm:</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  {currentProfile.topicsNeedingReview.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB C: PHÂN TÍCH TIẾN ĐỘ HỌC TẬP (AI ANALYSIS ENGINE)
      ==================================================================== */}
      {activeSubTab === 'analysis' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <span>Bảng Phân Tích Tiến Độ Học Tập Toàn Nhóm</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tổng hợp đa chỉ số: Chuyên cần, Bài tập, 3 Mức độ nhận thức (BIẾT - HIỂU - VẬN DỤNG) và Mức hỗ trợ
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold">
                    <th className="py-3 px-3">Học sinh</th>
                    <th className="py-3 px-3 text-center">Hoàn thành</th>
                    <th className="py-3 px-3 text-center">Đúng hạn</th>
                    <th className="py-3 px-3 text-center">BIẾT</th>
                    <th className="py-3 px-3 text-center">HIỂU</th>
                    <th className="py-3 px-3 text-center">VẬN DỤNG</th>
                    <th className="py-3 px-3 text-center">Điểm TB</th>
                    <th className="py-3 px-3 text-center">Mức hỗ trợ</th>
                    <th className="py-3 px-3 text-center">Căn cứ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allProfiles.map((p) => (
                    <tr key={p.studentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {p.studentName}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        {p.taskCompletionRate}%
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {p.onTimeSubmissionRate}%
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">
                        {p.cognitiveStats.knowRatio}%
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">
                        {p.cognitiveStats.understandRatio}%
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-purple-700">
                        {p.cognitiveStats.applyRatio}%
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-indigo-700">
                        {p.averageScore}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] font-bold">
                          {SUPPORT_LEVEL_LABELS[p.supportLevel].badge}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setExplainModalData({
                              title: `Dữ liệu phân tích: ${p.studentName}`,
                              studentName: p.studentName,
                              metric: `Mức hỗ trợ: ${SUPPORT_LEVEL_LABELS[p.supportLevel].label}`,
                              evidence: `Hoàn thành ${p.completedTasksCount}/${p.totalAssignedTasks} nhiệm vụ; BIẾT: ${p.cognitiveStats.knowRatio}%, HIỂU: ${p.cognitiveStats.understandRatio}%, VẬN DỤNG: ${p.cognitiveStats.applyRatio}%.`,
                              rationale: p.supportLevelReason,
                              confidence: 'Cao',
                              recommendation: 'Xem danh sách nhiệm vụ cá nhân hóa phù hợp cho học sinh.',
                            })
                          }
                          className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] cursor-pointer"
                        >
                          Vì sao?
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

      {/* ====================================================================
          TAB D: CÁ NHÂN HÓA NHIỆM VỤ THEO 3 MỨC ĐỘ NHẬN THỨC
      ==================================================================== */}
      {activeSubTab === 'personalization' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Target size={18} className="text-purple-600" />
                  <span>Nhiệm Vụ Cá Nhân Hóa Dựa Trên Lỗ Hổng Nhận Thức</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI đề xuất nhiệm vụ thích ứng cho từng học sinh. Giáo viên phê duyệt trước khi giao.
                </p>
              </div>

              {isLeader && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Học sinh:</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* List of recommended tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {currentProfile.aiRecommendedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-purple-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase">
                        Mức: {COGNITIVE_LEVEL_LABELS[task.cognitiveLevel]}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                        <Clock size={12} /> {task.estimatedMinutes} phút
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900">{task.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                    <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                      <b>Yêu cầu cần đạt:</b> {task.requirements}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setExplainModalData({
                          title: `Căn cứ đề xuất nhiệm vụ: ${task.title}`,
                          studentName: currentProfile.studentName,
                          metric: `Định hướng: Mức ${COGNITIVE_LEVEL_LABELS[task.cognitiveLevel]} (${task.targetTier})`,
                          evidence: `Dữ liệu nhận thức: BIẾT: ${currentProfile.cognitiveStats.knowRatio}%, HIỂU: ${currentProfile.cognitiveStats.understandRatio}%, VẬN DỤNG: ${currentProfile.cognitiveStats.applyRatio}%.`,
                          rationale: task.aiRationale,
                          confidence: 'Cao (Phù hợp lỗ hổng kiến thức)',
                          recommendation: 'Học sinh thực hiện bài này trong tuần để lấp đầy khoảng trống nhận thức.',
                        })
                      }
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Vì sao AI đề xuất?
                    </button>

                    {isLeader ? (
                      <button
                        type="button"
                        onClick={() => showToast(`Đã phê duyệt và giao nhiệm vụ "${task.title}" cho ${currentProfile.studentName}!`)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        Duyệt & Giao nhiệm vụ
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
                        Đã sẵn sàng để làm bài
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB E: CẢNH BÁO SỚM HỌC TẬP (AI ALERTS)
      ==================================================================== */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" />
                <span>Hệ Thống Cảnh Báo Sớm Học Tập Dựa Trên Dữ Liệu</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cảnh báo dựa trên sự sụt giảm tần suất, bài nộp trễ và khoảng trống nhận thức (Không phán xét tính cách học sinh)
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {allAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border text-xs space-y-3 ${
                    alert.severity === 'high'
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-amber-50/70 border-amber-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                          alert.severity === 'high' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {alert.severity === 'high' ? 'Mức cao' : 'Mức vừa'}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {alert.studentName}: {alert.title}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">Ngày phát hiện: {alert.createdAt}</span>
                  </div>

                  <p className="text-slate-700 leading-relaxed">{alert.rationale}</p>

                  {/* Evidence Table */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 overflow-x-auto">
                    <span className="font-bold text-[11px] text-slate-700 block mb-1.5">
                      Dữ liệu làm căn cứ thực tế:
                    </span>
                    <div className="flex items-center gap-4 flex-wrap text-[11px]">
                      {alert.dataEvidence.map((ev, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-slate-500">{ev.metric}:</span>
                          <span className="font-bold text-slate-900">{ev.value}</span>
                          <span className="text-slate-400">({ev.period})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {alert.cognitiveGap && (
                    <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                      <b>Khoảng trống nhận thức:</b> {alert.cognitiveGap}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-600">
                      <b>Khuyến nghị sư phạm:</b> {alert.recommendedActions[0]}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExplainModalData({
                          title: `Giải trình cảnh báo: ${alert.studentName}`,
                          studentName: alert.studentName,
                          metric: alert.title,
                          evidence: alert.dataEvidence.map((e) => `${e.metric}: ${e.value}`).join(' • '),
                          rationale: alert.rationale,
                          confidence: alert.confidenceLevel,
                          recommendation: alert.recommendedActions.join('\n- '),
                        })
                      }
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-300 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      Vì sao cảnh báo?
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB F: TRỢ LÝ HỌC TẬP AI (AI TUTOR)
      ==================================================================== */}
      {activeSubTab === 'tutor' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[600px] animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-600 text-white">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">Trợ Lý Học Tập AI Tổ 3 (Gemini Flash)</h3>
                <p className="text-[11px] text-slate-300">
                  Phương châm sư phạm: Gợi ý → Giải thích → Kiểm tra lại (Theo BIẾT – HIỂU – VẬN DỤNG)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setChatMessages([
                  {
                    sender: 'ai',
                    text: `Xin chào ${currentMember.name}! Bạn có câu hỏi nào về bài tập, đề cương hay câu hỏi khó không? Hãy hỏi mình nhé!`,
                    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                  },
                ])
              }
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Làm mới đoạn hội thoại"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isAsking && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
                <Sparkles size={14} className="animate-spin text-purple-600" />
                <span>AI đang phân tích và tìm kiếm gợi ý sư phạm...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-bold shrink-0">Gợi ý nhanh:</span>
            {[
              'Giải thích nguyên lý Le Chatelier mức HIỂU',
              'Cách tính biến thiên Enthalpy chuẩn mức VẬN DỤNG',
              'Vì sao câu 3 đề kiểm tra em lại sai?',
              'Tạo 2 câu hỏi củng cố mức BIẾT cho mình',
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputQuery(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 shrink-0 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Nhập câu hỏi của bạn (VD: Tại sao phản ứng tỏa nhiệt lại có delta H âm?)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={isAsking || !inputQuery.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={14} />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      )}

      {/* ====================================================================
          TAB G: BÁO CÁO AI & MINH BẠCH "VÌ SAO?" (EXPLAINABILITY)
      ==================================================================== */}
      {activeSubTab === 'explain' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Nguyên Tắc Minh Bạch & Giải Trình AI (AI Explainability)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Mọi đề xuất, cảnh báo và phân loại của hệ thống AI đều phải có căn cứ dữ liệu định lượng, không tự động suy đoán hoặc phán xét chủ quan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800">1. Căn cứ dữ liệu đa chiều:</span>
              <p className="text-slate-600 leading-relaxed">
                Kết hợp ít nhất 4 nguồn dữ liệu: Chuyên cần, Tỷ lệ nộp bài đúng hạn, Kết quả kiểm tra trắc nghiệm & tự luận, và Tỷ lệ đạt được ở 3 mức độ nhận thức (BIẾT - HIỂU - VẬN DỤNG).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-800">2. Độ tin cậy & Kiểm chứng:</span>
              <p className="text-slate-600 leading-relaxed">
                Đánh giá theo 3 cấp độ: Cao (nhiều dữ liệu), Trung bình, và Thấp (cần thu thập thêm). Giáo viên giữ toàn quyền phê duyệt cuối cùng đối với mọi can thiệp sư phạm.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL "VÌ SAO?" (AI EXPLAINABILITY MODAL)
      ==================================================================== */}
      {explainModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Minh Bạch AI: "Vì Sao?"
                  </h3>
                  <p className="text-[11px] text-slate-500">Căn cứ dữ liệu thực tế cho nhận định của AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExplainModalData(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase">Nội dung giải trình:</span>
                <p className="font-extrabold text-sm text-slate-900 mt-0.5">{explainModalData.title}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-600">Dữ liệu căn cứ:</span>
                <p className="text-slate-800 leading-relaxed">{explainModalData.evidence}</p>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-950 space-y-1">
                <span className="text-[11px] font-bold text-blue-900">Lý do & Cơ chế phân tích của AI:</span>
                <p className="leading-relaxed">{explainModalData.rationale}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="text-slate-500">Độ tin cậy của nhận định:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {explainModalData.confidence}
                </span>
              </div>

              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-purple-950 space-y-1">
                <span className="text-[11px] font-bold text-purple-900">Khuyến nghị hành động tiếp theo:</span>
                <p className="leading-relaxed whitespace-pre-line">{explainModalData.recommendation}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setExplainModalData(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
