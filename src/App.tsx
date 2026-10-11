/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, SectionKey, TabKey } from './components/Sidebar';
import { TabLayout, TabItem } from './components/TabLayout';
import { DataExportView } from './components/DataExportView';
import { SubmissionsProductsView } from './components/SubmissionsProductsView';
import {
  parseRoute,
  syncUrl,
  LEGACY_REDIRECTS,
  SLUG_TO_SECTION,
  DEFAULT_TABS,
} from './utils/navigation';

import { DashboardView } from './components/DashboardView';
import { MembersView } from './components/MembersView';
import { AttendanceView } from './components/AttendanceView';
import { CompetitionView } from './components/CompetitionView';
import { StudyHubView } from './components/StudyHubView';
import { DocumentsView } from './components/DocumentsView';
import { AssignmentsView } from './components/AssignmentsView';
import { SubmissionsView } from './components/SubmissionsView';
import { ProductsView } from './components/ProductsView';
import { GroupsView } from './components/GroupsView';
import { DiscussionView } from './components/DiscussionView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AIAssessmentView } from './components/AIAssessmentView';
import { AIChatView } from './components/AIChatView';

import { SubmitModal } from './components/SubmitModal';
import { FileViewerModal } from './components/FileViewerModal';
import { RecycleBinModal } from './components/RecycleBinModal';
import { DownloadAllModal } from './components/DownloadAllModal';

import {
  Member,
  DocumentItem,
  Assignment,
  Submission,
  ProductItem,
  StudyGroup,
  ActivityLog,
  AttendanceSession,
  CompetitionRecord,
  WeeklyReport,
  DiscussionPost,
  FileItem,
  TrashItem,
  AppConfig,
  AssessmentTest,
  QuestionBankItem,
  AssessmentAttempt,
  CognitiveLevel,
} from './types';

import {
  loadAssessmentTests,
  saveAssessmentTests,
  loadQuestionBank,
  saveQuestionBank,
  loadAssessmentAttempts,
  saveAssessmentAttempts,
} from './storageAI';

import {
  loadMembers,
  saveMembers,
  loadDocuments,
  saveDocuments,
  loadAssignments,
  saveAssignments,
  loadSubmissions,
  saveSubmissions,
  loadProducts,
  saveProducts,
  loadGroups,
  saveGroups,
  loadActivities,
  saveActivities,
  loadAttendance,
  saveAttendance,
  loadCompetition,
  saveCompetition,
  loadReports,
  saveReports,
  loadDiscussions,
  saveDiscussions,
  loadCurrentMemberId,
  saveCurrentMemberId,
  syncMembersWithAllData,
  loadAppConfig,
  saveAppConfig,
  loadTrash,
  addToTrash,
  removeFromTrash,
  clearAllTrash,
  resetAllToDemoData,
  clearAllStorage,
  exportDataToJSON,
  importDataFromJSON,
} from './storage';
import { APP_CONFIG } from './config';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ClipboardCheck,
  Users,
  Users2,
  GraduationCap,
  BookOpenCheck,
  FolderArchive,
  Upload,
  MessagesSquare,
  FileCheck2,
  Sparkles,
  BarChart3,
  Database,
  Settings,
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export default function App() {
  // App State loaded from LocalStorage
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [documents, setDocuments] = useState<DocumentItem[]>(() => loadDocuments());
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadAssignments());
  const [submissions, setSubmissions] = useState<Submission[]>(() => loadSubmissions());
  const [products, setProducts] = useState<ProductItem[]>(() => loadProducts());
  const [groups, setGroups] = useState<StudyGroup[]>(() => loadGroups());
  const [activities, setActivities] = useState<ActivityLog[]>(() => loadActivities());
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() =>
    loadAttendance()
  );
  const [competitionRecords, setCompetitionRecords] = useState<CompetitionRecord[]>(() =>
    loadCompetition()
  );
  const [reports, setReports] = useState<WeeklyReport[]>(() => loadReports());
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(() => loadDiscussions());

  // Recycle Bin & App Config State
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => loadTrash());
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isDownloadAllModalOpen, setIsDownloadAllModalOpen] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>(() => loadAppConfig());

  // AI Assessment & Testing State (Mục 1 - 12)
  const [tests, setTests] = useState<AssessmentTest[]>(() => loadAssessmentTests());
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(() => loadQuestionBank());
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>(() => loadAssessmentAttempts());

  // Context truyền vào AI Chat (Mục 13 - 16)
  const [aiChatInitialContext, setAiChatInitialContext] = useState<{
    prompt?: string;
    contextType?: 'none' | 'test' | 'student' | 'class_analytics' | 'remedial';
    testId?: string;
    studentId?: string;
  } | undefined>(undefined);

  // Current active user
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => loadCurrentMemberId());

  // Switch Active User (Tổ trưởng / Thành viên)
  const currentMember =
    members.find((m) => m.id === currentMemberId) ||
    members[0] || {
      id: 'm1',
      name: 'Trần Công Minh',
      role: 'leader',
      email: 'congminh.to3@thptduongminhchau.edu.vn',
      phone: '0912.345.678',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      groupName: 'Nhóm 1 - Tự nhiên',
      attendancePresent: 28,
      attendanceLate: 0,
      attendanceAbsent: 0,
      plusPoints: 2.5,
      minusPoints: 0,
      netPoints: 2.5,
      completedTasks: 4,
      submittedCount: 4,
      productCount: 3,
    };

  const isLeader = currentMember.role === 'leader';

  // Navigation & UI state: 6 Sections with Sub-Tabs & URL sync
  const [currentSection, setCurrentSection] = useState<SectionKey>(() => parseRoute(isLeader).section);
  const [currentTab, setCurrentTab] = useState<string>(() => parseRoute(isLeader).tab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<string | undefined>(undefined);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Handle URL changes & popstate
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute(isLeader);
      setCurrentSection(route.section);
      setCurrentTab(route.tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isLeader]);

  // Enforce permissions: if non-admin tries to open settings tab, redirect to reports
  useEffect(() => {
    if (!isLeader && currentSection === 'reports_settings' && currentTab === 'settings') {
      setCurrentTab('reports');
      syncUrl('reports_settings', 'reports');
    }
  }, [isLeader, currentSection, currentTab]);

  // Universal navigation function with support for legacy views and direct tab routing
  const navigateTo = (sectionOrLegacy: string, tab?: string) => {
    let targetSection: SectionKey = 'overview';
    let targetTab = tab || '';

    // Check legacy view key
    if (LEGACY_REDIRECTS[sectionOrLegacy]) {
      const redirect = LEGACY_REDIRECTS[sectionOrLegacy];
      targetSection = redirect.section;
      targetTab = tab || redirect.tab || DEFAULT_TABS[redirect.section];
    } else if (SLUG_TO_SECTION[sectionOrLegacy]) {
      targetSection = SLUG_TO_SECTION[sectionOrLegacy];
      targetTab = tab || DEFAULT_TABS[targetSection];
    } else if (
      [
        'overview',
        'members_hub',
        'competition',
        'study_hub',
        'ai_assistant',
        'reports_settings',
      ].includes(sectionOrLegacy)
    ) {
      targetSection = sectionOrLegacy as SectionKey;
      targetTab = tab || DEFAULT_TABS[targetSection];
    }

    // Permission enforcement: if tab is settings and not leader, fallback to reports
    if (targetSection === 'reports_settings' && targetTab === 'settings' && !isLeader) {
      targetTab = 'reports';
    }

    setCurrentSection(targetSection);
    setCurrentTab(targetTab);
    syncUrl(targetSection, targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchUser = (memberId: string) => {
    setCurrentMemberId(memberId);
    saveCurrentMemberId(memberId);
    const target = members.find((m) => m.id === memberId);
    if (target) {
      showToast(
        `Đã chuyển sang tài khoản: ${target.name} (${target.role === 'leader' ? 'Tổ trưởng' : 'Thành viên'})`
      );
    }
  };

  // Đồng bộ hóa thống nhất toàn diện các số liệu: Chuyên cần, Thi đua, Bài nộp, Sản phẩm học tập
  useEffect(() => {
    setMembers((prevMembers) => {
      const synced = syncMembersWithAllData(
        prevMembers,
        attendanceSessions,
        competitionRecords,
        submissions,
        products
      );
      // Chỉ cập nhật và lưu nếu có số liệu bị lệch
      const hasDiff = synced.some((m, idx) => {
        const old = prevMembers[idx];
        if (!old) return true;
        return (
          m.attendancePresent !== old.attendancePresent ||
          m.attendanceLate !== old.attendanceLate ||
          m.attendanceAbsent !== old.attendanceAbsent ||
          m.plusPoints !== old.plusPoints ||
          m.minusPoints !== old.minusPoints ||
          m.netPoints !== old.netPoints ||
          m.completedTasks !== old.completedTasks ||
          m.submittedCount !== old.submittedCount ||
          m.productCount !== old.productCount
        );
      });
      if (hasDiff) {
        saveMembers(synced);
        return synced;
      }
      return prevMembers;
    });
  }, [attendanceSessions, competitionRecords, submissions, products]);

  // State Updaters with LocalStorage persistence
  const handleUpdateMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    saveMembers(newMembers);
  };

  const handleUpdateDocuments = (newDocs: DocumentItem[]) => {
    setDocuments(newDocs);
    saveDocuments(newDocs);
  };

  const handleUpdateAssignments = (newTasks: Assignment[]) => {
    setAssignments(newTasks);
    saveAssignments(newTasks);
  };

  const handleUpdateSubmissions = (newSubs: Submission[]) => {
    setSubmissions(newSubs);
    saveSubmissions(newSubs);
  };

  const handleUpdateProducts = (newProds: ProductItem[]) => {
    setProducts(newProds);
    saveProducts(newProds);
  };

  const handleUpdateGroups = (newGroups: StudyGroup[]) => {
    setGroups(newGroups);
    saveGroups(newGroups);
  };

  const handleUpdateAttendance = (sessions: AttendanceSession[]) => {
    setAttendanceSessions(sessions);
    saveAttendance(sessions);
  };

  const handleUpdateCompetition = (
    records: CompetitionRecord[],
    updatedMembers: Member[]
  ) => {
    setCompetitionRecords(records);
    saveCompetition(records);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);
  };

  const handleUpdateDiscussions = (posts: DiscussionPost[]) => {
    setDiscussions(posts);
    saveDiscussions(posts);
  };

  // AI Assessment & Question Bank Handlers (Mục 1 - 12)
  const handleUpdateTests = (newTests: AssessmentTest[]) => {
    setTests(newTests);
    saveAssessmentTests(newTests);
  };

  const handleUpdateQuestionBank = (newBank: QuestionBankItem[]) => {
    setQuestionBank(newBank);
    saveQuestionBank(newBank);
  };

  const handleUpdateAttempts = (newAttempts: AssessmentAttempt[]) => {
    setAttempts(newAttempts);
    saveAssessmentAttempts(newAttempts);
  };

  const handleAssignPersonalizedTask = (taskTitle: string, studentId: string, level: CognitiveLevel) => {
    const student = members.find((m) => m.id === studentId);
    const newTask: Assignment = {
      id: 'task_remedial_' + Date.now(),
      title: `[Phụ đạo ${level}] ${taskTitle}`,
      subject: 'Hóa học',
      topic: 'Củng cố kiến thức theo đề xuất AI',
      description: `Nhiệm vụ phụ đạo cá nhân hóa dành cho học sinh ${student?.name || ''} để cải thiện năng lực mức độ ${level}.`,
      requirements: '1. Xem lại bài giảng và tài liệu hướng dẫn.\n2. Hoàn thành các bài tập củng cố.\n3. Nộp bài trực tiếp trên hệ thống.',
      assignerName: currentMember.name,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      format: 'Tự luận / Trắc nghiệm / File nộp',
      attachedFiles: [],
      status: 'in_progress',
    };
    const updated = [newTask, ...assignments];
    setAssignments(updated);
    saveAssignments(updated);
    showToast(`Đã giao nhiệm vụ phụ đạo "${newTask.title}" cho học sinh ${student?.name || ''}!`);
  };

  const handleNavigateToAIChat = (
    prompt?: string,
    contextType?: 'none' | 'test' | 'student' | 'class_analytics' | 'remedial',
    testId?: string,
    studentId?: string
  ) => {
    setAiChatInitialContext({ prompt, contextType, testId, studentId });
    navigateTo('ai_assistant', 'chat');
  };

  // Trash & Soft Delete Handlers
  const handleDeleteMember = (member: Member) => {
    addToTrash({
      originalId: member.id,
      type: 'member',
      typeLabel: 'Thành viên',
      title: member.name,
      subtitle: `${member.role === 'leader' ? 'Tổ trưởng' : 'Thành viên'} • ${member.groupName}`,
      deletedBy: currentMember.name,
      data: member,
    });
    setTrashItems(loadTrash());
    const next = members.filter((m) => m.id !== member.id);
    setMembers(next);
    saveMembers(next);
    if (currentMemberId === member.id && next.length > 0) {
      setCurrentMemberId(next[0].id);
      saveCurrentMemberId(next[0].id);
    }
  };

  const handleDeleteDocument = (doc: DocumentItem) => {
    addToTrash({
      originalId: doc.id,
      type: 'document',
      typeLabel: 'Tài liệu',
      title: doc.title,
      subtitle: `${doc.subject} • ${doc.category}`,
      deletedBy: currentMember.name,
      data: doc,
    });
    setTrashItems(loadTrash());
    const next = documents.filter((d) => d.id !== doc.id);
    setDocuments(next);
    saveDocuments(next);
  };

  const handleDeleteAssignment = (task: Assignment) => {
    addToTrash({
      originalId: task.id,
      type: 'assignment',
      typeLabel: 'Nhiệm vụ',
      title: task.title,
      subtitle: `${task.subject} • Hạn: ${task.dueDate}`,
      deletedBy: currentMember.name,
      data: task,
    });
    setTrashItems(loadTrash());
    const next = assignments.filter((a) => a.id !== task.id);
    setAssignments(next);
    saveAssignments(next);
  };

  const handleDeleteSubmission = (sub: Submission) => {
    addToTrash({
      originalId: sub.id,
      type: 'submission',
      typeLabel: 'Bài nộp',
      title: sub.title,
      subtitle: `Tác giả: ${sub.studentName} • Nhiệm vụ: ${sub.assignmentTitle}`,
      deletedBy: currentMember.name,
      data: sub,
    });
    setTrashItems(loadTrash());
    const next = submissions.filter((s) => s.id !== sub.id);
    setSubmissions(next);
    saveSubmissions(next);
  };

  const handleDeleteProduct = (prod: ProductItem) => {
    addToTrash({
      originalId: prod.id,
      type: 'product',
      typeLabel: 'Sản phẩm',
      title: prod.title,
      subtitle: `${prod.subject} • ${prod.topic || prod.authorGroup}`,
      deletedBy: currentMember.name,
      data: prod,
    });
    setTrashItems(loadTrash());
    const next = products.filter((p) => p.id !== prod.id);
    setProducts(next);
    saveProducts(next);
  };

  const handleDeleteGroup = (group: StudyGroup) => {
    addToTrash({
      originalId: group.id,
      type: 'group',
      typeLabel: 'Nhóm học tập',
      title: group.name,
      subtitle: `Trưởng nhóm: ${group.leaderName} • ${group.members.length} thành viên`,
      deletedBy: currentMember.name,
      data: group,
    });
    setTrashItems(loadTrash());
    const next = groups.filter((g) => g.id !== group.id);
    setGroups(next);
    saveGroups(next);
  };

  const handleDeleteAttendanceSession = (session: AttendanceSession) => {
    addToTrash({
      originalId: session.id,
      type: 'attendance',
      typeLabel: 'Điểm danh',
      title: `Điểm danh ngày ${session.date}`,
      subtitle: `Ghi nhận bởi: ${session.recordedBy} • ${session.records.length} học sinh`,
      deletedBy: currentMember.name,
      data: session,
    });
    setTrashItems(loadTrash());
    const next = attendanceSessions.filter((s) => s.id !== session.id);
    setAttendanceSessions(next);
    saveAttendance(next);
  };

  const handleDeleteCompetitionRecord = (record: CompetitionRecord, updatedMembers: Member[]) => {
    addToTrash({
      originalId: record.id,
      type: 'competition',
      typeLabel: 'Thi đua',
      title: `${record.studentName}: ${record.type === 'plus' ? '+' : '-'}${Math.abs(record.points)} điểm`,
      subtitle: record.reason,
      deletedBy: currentMember.name,
      data: record,
    });
    setTrashItems(loadTrash());
    const next = competitionRecords.filter((r) => r.id !== record.id);
    setCompetitionRecords(next);
    saveCompetition(next);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);
  };

  const handleDeleteReport = (report: WeeklyReport) => {
    addToTrash({
      originalId: report.id,
      type: 'report',
      typeLabel: 'Báo cáo tuần',
      title: `Báo cáo Tuần ${report.weekNumber}`,
      subtitle: `${report.startDate} đến ${report.endDate} • Người lập: ${report.createdByName}`,
      deletedBy: currentMember.name,
      data: report,
    });
    setTrashItems(loadTrash());
    const next = reports.filter((r) => r.id !== report.id);
    setReports(next);
    saveReports(next);
  };

  const handleDeleteDiscussion = (post: DiscussionPost) => {
    addToTrash({
      originalId: post.id,
      type: 'discussion',
      typeLabel: 'Thảo luận',
      title: post.title || post.content.slice(0, 50),
      subtitle: `Tác giả: ${post.authorName} • Ngày: ${post.createdAt}`,
      deletedBy: currentMember.name,
      data: post,
    });
    setTrashItems(loadTrash());
    const next = discussions.filter((p) => p.id !== post.id);
    setDiscussions(next);
    saveDiscussions(next);
  };

  // Restore Handlers from Recycle Bin
  const handleRestoreTrashItem = (item: TrashItem) => {
    switch (item.type) {
      case 'member': {
        const next = [item.data, ...members.filter((m) => m.id !== item.data.id)];
        setMembers(next);
        saveMembers(next);
        break;
      }
      case 'document': {
        const next = [item.data, ...documents.filter((d) => d.id !== item.data.id)];
        setDocuments(next);
        saveDocuments(next);
        break;
      }
      case 'assignment': {
        const next = [item.data, ...assignments.filter((a) => a.id !== item.data.id)];
        setAssignments(next);
        saveAssignments(next);
        break;
      }
      case 'submission': {
        const next = [item.data, ...submissions.filter((s) => s.id !== item.data.id)];
        setSubmissions(next);
        saveSubmissions(next);
        break;
      }
      case 'product': {
        const next = [item.data, ...products.filter((p) => p.id !== item.data.id)];
        setProducts(next);
        saveProducts(next);
        break;
      }
      case 'group': {
        const next = [item.data, ...groups.filter((g) => g.id !== item.data.id)];
        setGroups(next);
        saveGroups(next);
        break;
      }
      case 'attendance': {
        const next = [item.data, ...attendanceSessions.filter((s) => s.id !== item.data.id)];
        setAttendanceSessions(next);
        saveAttendance(next);
        break;
      }
      case 'competition': {
        const next = [item.data, ...competitionRecords.filter((c) => c.id !== item.data.id)];
        setCompetitionRecords(next);
        saveCompetition(next);
        const restoredRecord = item.data as CompetitionRecord;
        if (restoredRecord && restoredRecord.studentId) {
          const updated = members.map((m) => {
            if (m.id === restoredRecord.studentId) {
              const newPlus = restoredRecord.type === 'plus' ? m.plusPoints + Math.abs(restoredRecord.points) : m.plusPoints;
              const newMinus = restoredRecord.type === 'minus' ? m.minusPoints + Math.abs(restoredRecord.points) : m.minusPoints;
              const newNet = newPlus - newMinus;
              return {
                ...m,
                plusPoints: parseFloat(newPlus.toFixed(2)),
                minusPoints: parseFloat(newMinus.toFixed(2)),
                netPoints: parseFloat(newNet.toFixed(2)),
              };
            }
            return m;
          });
          setMembers(updated);
          saveMembers(updated);
        }
        break;
      }
      case 'report': {
        const next = [item.data, ...reports.filter((r) => r.id !== item.data.id)];
        setReports(next);
        saveReports(next);
        break;
      }
      case 'discussion': {
        const next = [item.data, ...discussions.filter((d) => d.id !== item.data.id)];
        setDiscussions(next);
        saveDiscussions(next);
        break;
      }
    }
    removeFromTrash(item.id);
    setTrashItems(loadTrash());
    showToast(`Đã khôi phục "${item.title}" thành công!`);
  };

  const handleRestoreAllTrash = () => {
    const current = loadTrash();
    for (const item of current) {
      handleRestoreTrashItem(item);
    }
    clearAllTrash();
    setTrashItems([]);
    showToast('Đã khôi phục tất cả mục trong thùng rác!');
  };

  const handlePermanentDelete = (id: string) => {
    removeFromTrash(id);
    const updated = loadTrash();
    setTrashItems([...updated]);
    showToast('Đã xóa vĩnh viễn mục khỏi thùng rác thành công!', 'success');
  };

  const handleClearAllTrash = () => {
    clearAllTrash();
    setTrashItems([]);
    showToast('Đã làm trống toàn bộ thùng rác thành công!', 'success');
  };

  // Submit Handler
  const handleNewSubmission = (newSub: Submission) => {
    const nextSubs = [newSub, ...submissions];
    setSubmissions(nextSubs);
    saveSubmissions(nextSubs);

    // Update member submitted count
    const nextMembers = members.map((m) =>
      m.id === currentMember.id
        ? {
            ...m,
            submittedCount: m.submittedCount + 1,
            completedTasks: m.completedTasks + 1,
          }
        : m
    );
    setMembers(nextMembers);
    saveMembers(nextMembers);

    // Log activity
    const newAct: ActivityLog = {
      id: 'act_' + Date.now(),
      actorName: currentMember.name,
      action: 'đã nộp sản phẩm',
      targetTitle: newSub.title,
      timestamp: 'Vừa xong',
      type: 'submission',
    };
    const nextActs = [newAct, ...activities.slice(0, 19)];
    setActivities(nextActs);
    saveActivities(nextActs);

    showToast(`Đã nộp bài "${newSub.title}" thành công với ${newSub.files.length} tệp đính kèm!`);
  };

  // Reset demo
  const handleResetDemoData = () => {
    if (confirm('Bạn có chắc muốn khôi phục toàn bộ dữ liệu mẫu ban đầu của Tổ 3?')) {
      resetAllToDemoData();
      setMembers(loadMembers());
      setDocuments(loadDocuments());
      setAssignments(loadAssignments());
      setSubmissions(loadSubmissions());
      setProducts(loadProducts());
      setGroups(loadGroups());
      setActivities(loadActivities());
      setAttendanceSessions(loadAttendance());
      setCompetitionRecords(loadCompetition());
      setReports(loadReports());
      setDiscussions(loadDiscussions());
      setTrashItems(loadTrash());
      setTests(loadAssessmentTests());
      setQuestionBank(loadQuestionBank());
      setAttempts(loadAssessmentAttempts());
      showToast('Đã khôi phục dữ liệu Demo thành công!');
    }
  };

  const handleClearAllData = () => {
    if (!isLeader) {
      showToast('Chỉ Tổ trưởng mới có quyền xóa dữ liệu!', 'error');
      return;
    }
    if (confirm('CẢNH BÁO: Thao tác này sẽ xóa sạch dữ liệu khỏi trình duyệt. Bạn có chắc không?')) {
      clearAllStorage();
      window.location.reload();
    }
  };

  const handleExportData = () => {
    exportDataToJSON();
    showToast('Đã xuất file dữ liệu dự phòng to3_11a1_backup.json');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importDataFromJSON(e.target.files[0], () => {
        setMembers(loadMembers());
        setDocuments(loadDocuments());
        setAssignments(loadAssignments());
        setSubmissions(loadSubmissions());
        setProducts(loadProducts());
        setGroups(loadGroups());
        setActivities(loadActivities());
        setAttendanceSessions(loadAttendance());
        setCompetitionRecords(loadCompetition());
        setReports(loadReports());
        setDiscussions(loadDiscussions());
        setTrashItems(loadTrash());
        showToast('Đã nhập dữ liệu thành công từ file JSON!');
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation (6 Core Sections) */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec, tab) => navigateTo(sec, tab)}
        currentMember={currentMember}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        membersCount={members.length}
        pendingTasksCount={assignments.filter((a) => a.status === 'in_progress').length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Header */}
        <Header
          currentMember={currentMember}
          members={members}
          onSwitchUser={handleSwitchUser}
          onOpenSubmitModal={() => {
            setSelectedTaskForSubmit(undefined);
            setIsSubmitModalOpen(true);
          }}
          onNavigateToSubmissions={() => {
            navigateTo('study_hub', 'submissions');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Route View (6 Categories) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* 1. Tổng quan */}
          {currentSection === 'overview' && (
            <DashboardView
              members={members}
              documents={documents}
              assignments={assignments}
              submissions={submissions}
              products={products}
              activities={activities}
              currentMember={currentMember}
              onNavigate={(target) => navigateTo(target)}
              onOpenSubmitModal={() => {
                setSelectedTaskForSubmit(undefined);
                setIsSubmitModalOpen(true);
              }}
              onOpenNewDocModal={() => navigateTo('study_hub', 'documents')}
            />
          )}

          {/* 2. Quản lý Thành viên (3 Tabs: Điểm danh [mặc định], Danh sách tổ, Nhóm học tập) */}
          {currentSection === 'members_hub' && (
            <TabLayout
              title="Quản Lý Thành Viên & Phân Nhóm Tổ 3"
              subtitle="Theo dõi điểm danh chuyên cần, hồ sơ học sinh và phân chia nhóm học tập chuyên đề"
              isLeader={isLeader}
              icon={Users}
              tabs={[
                {
                  id: 'attendance',
                  label: 'Điểm danh',
                  icon: ClipboardCheck,
                  badge: attendanceSessions.length,
                },
                {
                  id: 'roster',
                  label: 'Danh sách tổ',
                  icon: Users,
                  badge: members.length,
                },
                {
                  id: 'groups',
                  label: 'Nhóm học tập',
                  icon: Users2,
                  badge: groups.length,
                },
              ]}
              activeTab={currentTab || 'attendance'}
              onTabChange={(tabId) => navigateTo('members_hub', tabId)}
            >
              {currentTab === 'attendance' && (
                <AttendanceView
                  attendanceSessions={attendanceSessions}
                  members={members}
                  currentMember={currentMember}
                  onSaveAttendance={handleUpdateAttendance}
                  onDeleteAttendanceSession={handleDeleteAttendanceSession}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  showToast={showToast}
                />
              )}

              {currentTab === 'roster' && (
                <MembersView
                  members={members}
                  currentMember={currentMember}
                  onUpdateMembers={handleUpdateMembers}
                  onDeleteMember={handleDeleteMember}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  showToast={showToast}
                />
              )}

              {currentTab === 'groups' && (
                <GroupsView
                  groups={groups}
                  members={members}
                  documents={documents}
                  assignments={assignments}
                  products={products}
                  currentMember={currentMember}
                  onUpdateGroups={handleUpdateGroups}
                  onDeleteGroup={handleDeleteGroup}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  showToast={showToast}
                />
              )}
            </TabLayout>
          )}

          {/* 3. Thi đua & Khen thưởng (Giữ NGUYÊN vẹn giao diện hiện tại) */}
          {currentSection === 'competition' && (
            <CompetitionView
              members={members}
              competitionRecords={competitionRecords}
              currentMember={currentMember}
              onUpdateCompetition={handleUpdateCompetition}
              onDeleteCompetitionRecord={handleDeleteCompetitionRecord}
              onOpenTrash={() => setIsTrashModalOpen(true)}
              trashCount={trashItems.length}
              showToast={showToast}
            />
          )}

          {/* 4. Góc Học tập & Bài nộp (5 Tabs: Tiến độ học tập, Nhiệm vụ, Kho tài liệu, Nộp bài & Sản phẩm, Thảo luận) */}
          {currentSection === 'study_hub' && (
            <TabLayout
              title="Góc Học Tập, Nhiệm Vụ & Nộp Bài"
              subtitle="Theo dõi tiến độ học chuyên đề, bài tập được giao, kho tài liệu số, nộp bài và trao đổi học tập"
              isLeader={isLeader}
              icon={GraduationCap}
              tabs={[
                {
                  id: 'progress',
                  label: 'Tiến độ học tập',
                  icon: GraduationCap,
                },
                {
                  id: 'assignments',
                  label: 'Nhiệm vụ',
                  icon: BookOpenCheck,
                  badge: assignments.length,
                },
                {
                  id: 'documents',
                  label: 'Kho tài liệu',
                  icon: FolderArchive,
                  badge: documents.length,
                },
                {
                  id: 'submissions',
                  label: 'Nộp bài & Sản phẩm',
                  icon: Upload,
                  badge: submissions.length + products.length,
                },
                {
                  id: 'discussions',
                  label: 'Thảo luận',
                  icon: MessagesSquare,
                  badge: discussions.length,
                },
              ]}
              activeTab={currentTab || 'progress'}
              onTabChange={(tabId) => navigateTo('study_hub', tabId)}
            >
              {currentTab === 'progress' && (
                <StudyHubView
                  documents={documents}
                  assignments={assignments}
                  submissions={submissions}
                  products={products}
                  currentMember={currentMember}
                  onNavigate={(target) => navigateTo(target)}
                  onOpenSubmitModal={() => {
                    setSelectedTaskForSubmit(undefined);
                    setIsSubmitModalOpen(true);
                  }}
                />
              )}

              {currentTab === 'assignments' && (
                <AssignmentsView
                  assignments={assignments}
                  submissions={submissions}
                  members={members}
                  currentMember={currentMember}
                  onUpdateAssignments={handleUpdateAssignments}
                  onDeleteTask={handleDeleteAssignment}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  onOpenSubmitModalWithTask={(taskId) => {
                    setSelectedTaskForSubmit(taskId);
                    setIsSubmitModalOpen(true);
                  }}
                  onViewFile={(file) => setViewingFile(file)}
                  showToast={showToast}
                />
              )}

              {currentTab === 'documents' && (
                <DocumentsView
                  documents={documents}
                  currentMember={currentMember}
                  onUpdateDocuments={handleUpdateDocuments}
                  onDeleteDocument={handleDeleteDocument}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  onViewFile={(file) => setViewingFile(file)}
                  showToast={showToast}
                />
              )}

              {currentTab === 'submissions' && (
                <SubmissionsProductsView
                  submissions={submissions}
                  products={products}
                  assignments={assignments}
                  members={members}
                  currentMember={currentMember}
                  onUpdateSubmissions={handleUpdateSubmissions}
                  onDeleteSubmission={handleDeleteSubmission}
                  onUpdateProducts={handleUpdateProducts}
                  onDeleteProduct={handleDeleteProduct}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  onOpenSubmitModal={() => {
                    setSelectedTaskForSubmit(undefined);
                    setIsSubmitModalOpen(true);
                  }}
                  onViewFile={(file) => setViewingFile(file)}
                  showToast={showToast}
                />
              )}

              {currentTab === 'discussions' && (
                <DiscussionView
                  posts={discussions}
                  members={members}
                  currentMember={currentMember}
                  onUpdatePosts={handleUpdateDiscussions}
                  onDeletePost={handleDeleteDiscussion}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  onViewFile={(file) => setViewingFile(file)}
                  showToast={showToast}
                />
              )}
            </TabLayout>
          )}

          {/* 5. Trợ lý AI & Tạo đề (2 Tabs: Tạo đề kiểm tra, Prompt hỗ trợ) */}
          {currentSection === 'ai_assistant' && (
            <TabLayout
              title="Trợ Lý AI & Hệ Thống Khảo Thí Thông Minh"
              subtitle="Tạo đề kiểm tra tự động theo chuẩn năng lực, ngân hàng câu hỏi và trợ lý gia sư AI 24/7"
              isLeader={isLeader}
              icon={Sparkles}
              tabs={[
                {
                  id: 'assessment',
                  label: 'Tạo đề kiểm tra',
                  icon: FileCheck2,
                  badge: tests.length,
                },
                {
                  id: 'chat',
                  label: 'Prompt hỗ trợ',
                  icon: Sparkles,
                },
              ]}
              activeTab={currentTab || 'assessment'}
              onTabChange={(tabId) => navigateTo('ai_assistant', tabId)}
            >
              {currentTab === 'assessment' && (
                <AIAssessmentView
                  tests={tests}
                  questionBank={questionBank}
                  attempts={attempts}
                  members={members}
                  currentMember={currentMember}
                  onUpdateTests={handleUpdateTests}
                  onUpdateQuestionBank={handleUpdateQuestionBank}
                  onUpdateAttempts={handleUpdateAttempts}
                  onAssignPersonalizedTask={handleAssignPersonalizedTask}
                  onNavigateToAIChat={handleNavigateToAIChat}
                  onSwitchUser={handleSwitchUser}
                  showToast={showToast}
                />
              )}

              {currentTab === 'chat' && (
                <AIChatView
                  currentMember={currentMember}
                  members={members}
                  tests={tests}
                  attempts={attempts}
                  initialContext={aiChatInitialContext}
                  showToast={showToast}
                />
              )}
            </TabLayout>
          )}

          {/* 6. Báo cáo & Cài đặt (3 Tabs: Thống kê báo cáo, Xuất dữ liệu, Cài đặt quy chế tổ [Admin only]) */}
          {currentSection === 'reports_settings' && (
            <TabLayout
              title="Báo Cáo, Xuất Dữ Liệu & Quy Chế Tổ"
              subtitle="Tổng hợp báo cáo tuần, xuất file sao lưu dữ liệu dự phòng và cấu hình quy chế tổ"
              isLeader={isLeader}
              icon={BarChart3}
              tabs={[
                {
                  id: 'reports',
                  label: 'Thống kê báo cáo',
                  icon: BarChart3,
                  badge: reports.length,
                },
                {
                  id: 'export',
                  label: 'Xuất dữ liệu & Hồ sơ Word (.doc)',
                  icon: Database,
                },
                {
                  id: 'settings',
                  label: 'Cài đặt quy chế tổ',
                  icon: Settings,
                  adminOnly: true,
                },
              ]}
              activeTab={currentTab || 'reports'}
              onTabChange={(tabId) => navigateTo('reports_settings', tabId)}
            >
              {currentTab === 'reports' && (
                <ReportsView
                  reports={reports}
                  members={members}
                  currentMember={currentMember}
                  competitionRecords={competitionRecords}
                  onSaveReport={(report) => {
                    const next = [report, ...reports.filter((r) => r.id !== report.id)];
                    setReports(next);
                    saveReports(next);
                    showToast('Đã lưu báo cáo tuần!');
                  }}
                  onDeleteReport={handleDeleteReport}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  showToast={showToast}
                />
              )}

              {currentTab === 'export' && (
                <DataExportView
                  members={members}
                  competitionRecords={competitionRecords}
                  attendanceSessions={attendanceSessions}
                  submissions={submissions}
                  trashCount={trashItems.length}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  onOpenDownloadAll={() => setIsDownloadAllModalOpen(true)}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                  showToast={showToast}
                />
              )}

              {currentTab === 'settings' && isLeader && (
                <SettingsView
                  currentMember={currentMember}
                  config={appConfig}
                  onSaveConfig={(cfg) => {
                    setAppConfig(cfg);
                    saveAppConfig(cfg);
                  }}
                  onOpenTrash={() => setIsTrashModalOpen(true)}
                  trashCount={trashItems.length}
                  onResetDemoData={handleResetDemoData}
                  onClearAllData={handleClearAllData}
                  onExportData={handleExportData}
                  onImportData={handleImportData}
                  showToast={showToast}
                />
              )}
            </TabLayout>
          )}
        </main>
      </div>

      {/* Global Submit Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        assignments={assignments}
        members={members}
        currentMember={currentMember}
        preselectedAssignmentId={selectedTaskForSubmit}
        onSaveSubmission={handleNewSubmission}
        showToast={showToast}
      />

      {/* Global File Viewer / Preview Modal */}
      <FileViewerModal
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />

      {/* Global Recycle Bin / Trash Modal */}
      <RecycleBinModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        trashItems={trashItems}
        onRestore={handleRestoreTrashItem}
        onRestoreAll={handleRestoreAllTrash}
        onPermanentDelete={handlePermanentDelete}
        onClearAllTrash={handleClearAllTrash}
        showToast={showToast}
      />

      {/* Global Download All App Content Modal */}
      <DownloadAllModal
        isOpen={isDownloadAllModalOpen}
        onClose={() => setIsDownloadAllModalOpen(false)}
        showToast={showToast}
      />

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl flex items-start gap-3 text-xs font-semibold backdrop-blur-md animate-slide-up border ${
              t.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : t.type === 'warning'
                ? 'bg-amber-900/90 text-white border-amber-700'
                : t.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {t.type === 'warning' && <AlertTriangle size={18} className="text-amber-400 shrink-0" />}
            {t.type === 'error' && <XCircle size={18} className="text-rose-400 shrink-0" />}
            {t.type === 'info' && <Info size={18} className="text-blue-400 shrink-0" />}
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
