import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Copy,
  Send,
  Search,
  MessageSquare,
  Clock,
  User,
  Bot,
  Layers,
  Edit2,
  Check,
  X,
  FileCheck2,
  Users,
  Target,
  BookOpen,
} from 'lucide-react';
import { Member, AssessmentTest, AssessmentAttempt, AIChatConversation, AIChatMessage } from '../types';
import { executeAIChat } from '../ai/aiEngine';
import { loadAIChatHistory, saveAIChatHistory } from '../storageAI';

export interface InitialChatContext {
  prompt?: string;
  contextType?: 'none' | 'test' | 'student' | 'class_analytics' | 'remedial';
  testId?: string;
  studentId?: string;
}

interface Props {
  currentMember: Member;
  members: Member[];
  tests: AssessmentTest[];
  attempts: AssessmentAttempt[];
  initialContext?: InitialChatContext;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const AIChatView: React.FC<Props> = ({
  currentMember,
  members,
  tests,
  attempts,
  initialContext,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';

  // Lịch sử AI Chat
  const [conversations, setConversations] = useState<AIChatConversation[]>(() => loadAIChatHistory());
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const list = loadAIChatHistory();
    return list[0]?.id || 'conv_new';
  });

  // Tìm kiếm lịch sử
  const [historySearch, setHistorySearch] = useState('');

  // Cuộc trò chuyện đang mở
  const activeConv = conversations.find((c) => c.id === activeConvId) || {
    id: activeConvId,
    title: 'Cuộc trò chuyện mới',
    topic: 'Học tập & Khảo thí',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: currentMember.id,
    userName: currentMember.name,
    messages: [
      {
        id: 'msg_init',
        sender: 'ai' as const,
        text: `Xin chào ${currentMember.name}! Tôi là Trợ lý AI Khảo Thí & Học Tập số của Tổ 3. Tôi sẵn sàng hỗ trợ giải đáp kiến thức theo 3 mức độ nhận thức (BIẾT - HIỂU - VẬN DỤNG), phân tích kết quả kiểm tra, gợi ý câu hỏi và kế hoạch phụ đạo. Bạn cần trợ giúp nội dung nào hôm nay?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };

  const [messages, setMessages] = useState<AIChatMessage[]>(activeConv.messages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ngữ cảnh liên kết (Mục 16)
  const [contextType, setContextType] = useState<'none' | 'test' | 'student' | 'class_analytics' | 'remedial'>('none');
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(members[0]?.id || '');

  // Lắng nghe context chuyển từ các phân hệ khác (Mục 13 & 16)
  useEffect(() => {
    if (initialContext) {
      if (initialContext.contextType) setContextType(initialContext.contextType);
      if (initialContext.testId) setSelectedTestId(initialContext.testId);
      if (initialContext.studentId) setSelectedStudentId(initialContext.studentId);
      if (initialContext.prompt) {
        setInputText(initialContext.prompt);
      }
    }
  }, [initialContext]);

  // Trạng thái modal xác nhận xóa cuộc trò chuyện (Mục 15)
  const [deleteConfirmConvId, setDeleteConfirmConvId] = useState<string | null>(null);

  // Trạng thái đổi tên cuộc trò chuyện
  const [editingTitleConvId, setEditingTitleConvId] = useState<string | null>(null);
  const [newTitleText, setNewTitleText] = useState('');

  // Chuyển cuộc trò chuyện
  const handleSelectConv = (conv: AIChatConversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages);
    if (conv.contextType) setContextType(conv.contextType);
  };

  // 1. NÚT: + Cuộc trò chuyện mới (Mục 14)
  const handleNewConversation = () => {
    const newId = 'conv_' + Date.now();
    const newConv: AIChatConversation = {
      id: newId,
      title: 'Cuộc trò chuyện mới',
      topic: 'Học tập & Khảo thí',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: currentMember.id,
      userName: currentMember.name,
      messages: [
        {
          id: 'msg_' + Date.now(),
          sender: 'ai',
          text: `Chào ${currentMember.name}! Tôi đã sẵn sàng cho chủ đề mới. Bạn có thể chọn ngữ cảnh đề kiểm tra hoặc đặt câu hỏi trực tiếp.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      contextType: 'none',
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveAIChatHistory(updated);
    setActiveConvId(newId);
    setMessages(newConv.messages);
    showToast('Đã mở cuộc trò chuyện mới!');
  };

  // 2. NÚT: 💾 LƯU (Mục 14 & 15)
  const handleSaveConversation = () => {
    // Tự động tạo tiêu đề nếu còn tiêu đề mặc định
    let titleToSave = activeConv.title;
    if (titleToSave === 'Cuộc trò chuyện mới' && messages.length > 1) {
      const firstUserMsg = messages.find((m) => m.sender === 'user');
      if (firstUserMsg) {
        titleToSave = firstUserMsg.text.slice(0, 50) + (firstUserMsg.text.length > 50 ? '...' : '');
      }
    }

    const updatedConv: AIChatConversation = {
      ...activeConv,
      title: titleToSave,
      messages,
      updatedAt: new Date().toISOString(),
      contextType,
      contextTitle:
        contextType === 'test'
          ? tests.find((t) => t.id === selectedTestId)?.title
          : contextType === 'student'
          ? members.find((m) => m.id === selectedStudentId)?.name
          : undefined,
    };

    const exists = conversations.some((c) => c.id === activeConvId);
    let updated: AIChatConversation[];
    if (exists) {
      updated = conversations.map((c) => (c.id === activeConvId ? updatedConv : c));
    } else {
      updated = [updatedConv, ...conversations];
    }

    setConversations(updated);
    saveAIChatHistory(updated);
    showToast('Đã lưu cuộc trò chuyện vào Lịch sử AI Chat!');
  };

  // 3. NÚT: 🗑 XÓA (Mục 14 & 15 - Có hộp thoại xác nhận bắt buộc)
  const handleRequestDelete = (convId: string) => {
    setDeleteConfirmConvId(convId);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmConvId) return;
    const next = conversations.filter((c) => c.id !== deleteConfirmConvId);
    setConversations(next);
    saveAIChatHistory(next);
    setDeleteConfirmConvId(null);

    if (activeConvId === deleteConfirmConvId) {
      if (next.length > 0) {
        setActiveConvId(next[0].id);
        setMessages(next[0].messages);
      } else {
        handleNewConversation();
      }
    }
    showToast('Đã xóa cuộc trò chuyện khỏi Lịch sử AI Chat!');
  };

  // 4. NÚT: ↻ TẠO LẠI (Mục 14)
  const handleRegenerate = async () => {
    // Tìm câu hỏi user gần nhất
    const userMsgs = messages.filter((m) => m.sender === 'user');
    if (userMsgs.length === 0) {
      showToast('Chưa có câu hỏi nào để tạo lại phản hồi!', 'warning');
      return;
    }
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    setIsLoading(true);

    try {
      const selectedTest = tests.find((t) => t.id === selectedTestId);
      const selectedStudent = members.find((m) => m.id === selectedStudentId);

      const responseText = await executeAIChat({
        userQuery: lastUserMsg.text,
        contextType,
        contextData: contextType === 'test' ? selectedTest : contextType === 'student' ? selectedStudent : undefined,
        conversationHistory: messages.slice(0, -1),
        userRole: currentMember.role,
      });

      const updatedMsgs = [
        ...messages.slice(0, -1),
        {
          id: 'msg_' + Date.now(),
          sender: 'ai' as const,
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];

      setMessages(updatedMsgs);
      showToast('Đã tạo lại câu trả lời thành công!');
    } catch {
      showToast('Không thể tạo lại câu trả lời lúc này!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. NÚT: 📋 SAO CHÉP (Mục 14)
  const handleCopyChatContent = (textToCopy?: string) => {
    const fullText =
      textToCopy ||
      messages
        .map((m) => `[${m.sender === 'user' ? currentMember.name : 'AI'}] (${m.timestamp}):\n${m.text}`)
        .join('\n\n');

    navigator.clipboard
      .writeText(fullText)
      .then(() => showToast('Đã sao chép nội dung vào bộ nhớ tạm!'))
      .catch(() => showToast('Không thể sao chép!', 'error'));
  };

  // Đổi tên cuộc trò chuyện
  const handleSaveRename = (convId: string) => {
    if (!newTitleText.trim()) return;
    const next = conversations.map((c) => (c.id === convId ? { ...c, title: newTitleText.trim() } : c));
    setConversations(next);
    saveAIChatHistory(next);
    setEditingTitleConvId(null);
    setNewTitleText('');
    showToast('Đã cập nhật tên cuộc trò chuyện!');
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: AIChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMsgList = [...messages, userMsg];
    setMessages(newMsgList);
    setInputText('');
    setIsLoading(true);

    try {
      const selectedTest = tests.find((t) => t.id === selectedTestId);
      const selectedStudent = members.find((m) => m.id === selectedStudentId);

      const responseText = await executeAIChat({
        userQuery: query,
        contextType,
        contextData:
          contextType === 'test'
            ? selectedTest
            : contextType === 'student'
            ? selectedStudent
            : contextType === 'class_analytics'
            ? {
                averageScore: 8.2,
                knowRatio: 88,
                understandRatio: 76,
                applyRatio: 58,
                weakTopics: 'Vận dụng tính toán hằng số cân bằng và bài toán thực tế',
              }
            : undefined,
        conversationHistory: newMsgList,
        userRole: currentMember.role,
      });

      const aiMsg: AIChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalMessages = [...newMsgList, aiMsg];
      setMessages(finalMessages);

      // Tự động cập nhật tiêu đề nếu đang là "Cuộc trò chuyện mới"
      if (activeConv.title === 'Cuộc trò chuyện mới') {
        const autoTitle = query.slice(0, 45) + (query.length > 45 ? '...' : '');
        const updatedConv: AIChatConversation = {
          ...activeConv,
          title: autoTitle,
          messages: finalMessages,
          updatedAt: new Date().toISOString(),
          contextType,
        };
        const updatedList = conversations.map((c) => (c.id === activeConvId ? updatedConv : c));
        setConversations(updatedList);
        saveAIChatHistory(updatedList);
      }
    } catch {
      showToast('Có lỗi xảy ra khi trao đổi với AI, vui lòng thử lại!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      (c.topic && c.topic.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header Phân hệ AI CHAT */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">AI CHAT TRỰC TIẾP</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold">
                  Tích hợp ngữ cảnh kiểm tra & lớp học
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Trợ lý AI hỗ trợ giải thích 3 mức độ (BIẾT - HIỂU - VẬN DỤNG), phân tích bài kiểm tra, tạo câu hỏi và gợi ý phụ đạo
              </p>
            </div>
          </div>

          {/* 5 NÚT CHỨC NĂNG BẮT BUỘC (Mục 14) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleNewConversation}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Tạo cuộc trò chuyện mới"
            >
              <Plus size={14} />
              <span>+ Cuộc trò chuyện mới</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConversation}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Lưu cuộc trò chuyện vào Lịch sử AI Chat"
            >
              <Save size={14} />
              <span>💾 LƯU</span>
            </button>

            <button
              type="button"
              onClick={() => handleRequestDelete(activeConvId)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Xóa cuộc trò chuyện này"
            >
              <Trash2 size={14} />
              <span>🗑 XÓA</span>
            </button>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Tạo lại câu trả lời gần nhất"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>↻ TẠO LẠI</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopyChatContent()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Sao chép toàn bộ nội dung trò chuyện"
            >
              <Copy size={14} />
              <span>📋 SAO CHÉP</span>
            </button>
          </div>
        </div>

        {/* Thanh kết nối ngữ cảnh với hệ thống kiểm tra & lớp học (Mục 16) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-700 flex items-center gap-1">
              <Layers size={14} className="text-indigo-600" />
              <span>Ngữ cảnh AI:</span>
            </span>

            <select
              value={contextType}
              onChange={(e) => setContextType(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            >
              <option value="none">🌐 Chat tự do (Học tập THPT chung)</option>
              <option value="test">📝 Liên kết đề kiểm tra đang chọn</option>
              <option value="class_analytics">📊 Dữ liệu phân tích bài kiểm tra của lớp</option>
              <option value="student">👤 Dữ liệu học sinh cụ thể</option>
              <option value="remedial">💡 Kế hoạch phụ đạo 3 mức độ</option>
            </select>

            {contextType === 'test' && (
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl font-bold text-blue-900 outline-none"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    Đề: {t.title} ({t.subject} {t.grade})
                  </option>
                ))}
              </select>
            )}

            {contextType === 'student' && (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl font-bold text-purple-900 outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    Học sinh: {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            Tài khoản: <b>{currentMember.name}</b> ({isLeader ? 'Giáo viên/Tổ trưởng' : 'Học sinh'})
          </span>
        </div>
      </div>

      {/* Main Chat Layout: Left Sidebar (Lịch sử) + Right Panel (Cửa sổ chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI: LỊCH SỬ AI CHAT (Mục 15) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs h-[650px] flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <span>LỊCH SỬ AI CHAT ({conversations.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleNewConversation}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 font-bold text-[11px] cursor-pointer"
              title="Cuộc trò chuyện mới"
            >
              + Tạo mới
            </button>
          </div>

          {/* Tìm kiếm trong lịch sử */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
          </div>

          {/* Danh sách các cuộc trò chuyện đã lưu */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredHistory.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl">
                Không tìm thấy cuộc trò chuyện nào.
              </div>
            ) : (
              filteredHistory.map((conv) => {
                const isActive = conv.id === activeConvId;
                const isEditing = editingTitleConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => !isEditing && handleSelectConv(conv)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isActive
                        ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={newTitleText}
                          onChange={(e) => setNewTitleText(e.target.value)}
                          className="flex-1 px-2 py-1 bg-white border border-blue-400 rounded-lg text-xs font-bold"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(conv.id)}
                          className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTitleConvId(null)}
                          className="p-1 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-xs truncate" title={conv.title}>
                            {conv.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(conv.updatedAt).toLocaleDateString('vi-VN')} • {conv.messages.length} tin nhắn
                          </span>
                        </div>

                        {/* Nút thao tác nhanh trên lịch sử: Đổi tên / Xóa */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleConvId(conv.id);
                              setNewTitleText(conv.title);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            title="Đổi tên cuộc trò chuyện"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDelete(conv.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Xóa cuộc trò chuyện này"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG TRÒ CHUYỆN TRỰC TIẾP */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Header hội thoại đang chọn */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Bot size={16} />
              </span>
              <div className="truncate">
                <h3 className="font-black text-slate-900 truncate">{activeConv.title}</h3>
                <span className="text-[11px] text-slate-500">
                  {contextType === 'test'
                    ? `Ngữ cảnh: Đề kiểm tra (${tests.find((t) => t.id === selectedTestId)?.title})`
                    : contextType === 'student'
                    ? `Ngữ cảnh: Học sinh (${members.find((m) => m.id === selectedStudentId)?.name})`
                    : contextType === 'class_analytics'
                    ? 'Ngữ cảnh: Dữ liệu phân tích lớp học'
                    : 'Chế độ trò chuyện chung'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyChatContent()}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                title="Sao chép toàn bộ"
              >
                <Copy size={12} /> Sao chép
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips (Gợi ý câu hỏi sư phạm theo Mục 16) */}
          <div className="p-2.5 bg-slate-100/70 border-b border-slate-200/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="font-bold text-slate-500 shrink-0">Gợi ý nhanh:</span>
            {[
              'Phân tích kết quả bài kiểm tra này',
              'Hãy tạo 10 câu hỏi để củng cố phần Vận dụng mà lớp đang yếu',
              'Hãy nhận xét riêng học sinh này',
              'Gợi ý cách phân bổ ma trận 3 mức độ chuẩn',
              'Hướng dẫn bài tập tình huống thực tiễn',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendMessage(undefined, chip)}
                className="px-3 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold rounded-lg border border-slate-200 whitespace-nowrap transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    m.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white shadow-xs'
                  }`}
                >
                  {m.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>

                <div
                  className={`p-4 rounded-2xl space-y-1.5 shadow-2xs leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-900 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  <div
                    className={`flex items-center justify-between pt-1 text-[10px] ${
                      m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyChatContent(m.text)}
                      className="hover:underline flex items-center gap-0.5 cursor-pointer ml-3"
                    >
                      <Copy size={10} /> Sao chép
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2">
                  <Sparkles size={14} className="animate-spin text-indigo-600" />
                  <span className="font-semibold text-xs">AI đang phân tích dữ liệu & soạn câu trả lời...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form nhập tin nhắn */}
          <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi hoặc yêu cầu AI phân tích, tạo câu hỏi, ma trận..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium text-xs focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Send size={14} />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>

      {/* HỘP THOẠI XÁC NHẬN XÓA CUỘC TRÒ CHUYỆN (BẮT BUỘC THEO MỤC 15) */}
      {deleteConfirmConvId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Xác Nhận Xóa Cuộc Trò Chuyện</h3>
                <p className="text-slate-500 mt-0.5">Thao tác này chỉ xóa phiên trò chuyện, không ảnh hưởng dữ liệu khác</p>
              </div>
            </div>

            <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-semibold leading-relaxed">
              “Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?”
            </p>

            {/* BẮT BUỘC 2 NÚT: HỦY VÀ XÓA (MỤC 15) */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmConvId(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl font-black text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
