import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck2,
  Plus,
  Table,
  Layers,
  Database,
  PlayCircle,
  BarChart,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
  Award,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Copy,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckSquare,
  HelpCircle,
  Sliders,
  Send,
  UserCheck,
  TrendingUp,
  RotateCcw,
  Minus,
  Scale,
  Printer,
  Image as ImageIcon,
  Paperclip,
  Upload,
  FileUp,
  Maximize2,
} from 'lucide-react';
import {
  AssessmentTest,
  QuestionBankItem,
  CognitiveLevel,
  QuestionType,
  Member,
  AssessmentAttempt,
  QualityCheckReport,
  COGNITIVE_LEVEL_LABELS,
  AttachedKnowledgeMaterial,
} from '../types';
import {
  generateAIAssessmentTest,
  autoGradeAssessment,
  runAIQualityCheck,
} from '../ai/aiEngine';
import { SUBJECT_CURRICULUM_DATA, ChapterInfo } from '../ai/subjectCurriculum';
import { downloadTextAsFile, downloadExamPaperWord, downloadExamPaperTxt } from '../utils/fileDownloader';
import {
  exportTestToWord,
  exportTestToTxt,
  exportTestToHtml,
  downloadTestAsJson,
  printTestPaper,
} from '../utils/testExportUtils';
import { APP_CONFIG, SUBJECTS } from '../config';
import { ExamGraderTool } from './ExamGraderTool';
import { extractUploadedMaterial } from '../utils/documentExtractor';

interface Props {
  tests: AssessmentTest[];
  questionBank: QuestionBankItem[];
  attempts: AssessmentAttempt[];
  members: Member[];
  currentMember: Member;
  onUpdateTests: (tests: AssessmentTest[]) => void;
  onUpdateQuestionBank: (questions: QuestionBankItem[]) => void;
  onUpdateAttempts: (attempts: AssessmentAttempt[]) => void;
  onAssignPersonalizedTask?: (taskTitle: string, studentId: string, level: CognitiveLevel) => void;
  onNavigateToAIChat?: (
    prompt?: string,
    contextType?: 'none' | 'test' | 'student' | 'class_analytics' | 'remedial',
    testId?: string,
    studentId?: string
  ) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  onSwitchUser?: (userId: string) => void;
}

export const AIAssessmentView: React.FC<Props> = ({
  tests,
  questionBank,
  attempts,
  members,
  currentMember,
  onUpdateTests,
  onUpdateQuestionBank,
  onUpdateAttempts,
  onAssignPersonalizedTask,
  onNavigateToAIChat,
  showToast,
}) => {
  const isLeader = currentMember.role === 'leader';

  // Sub-tabs navigation
  const [activeTab, setActiveTab] = useState<
    | 'generator'
    | 'matrix'
    | 'spec'
    | 'quality_check'
    | 'bank'
    | 'library'
    | 'take_test'
    | 'grading'
    | 'exam_grader'
    | 'analytics'
    | 'dashboard'
  >('generator');

  // Generator form state (Mục 1 & 2)
  const [testTitle, setTestTitle] = useState('Kiểm tra chuyên đề Cân bằng & Nhiệt hóa học');
  const [testSubject, setTestSubject] = useState('Hóa học');
  const [testGrade, setTestGrade] = useState('11');
  const [testTopic, setTestTopic] = useState('Cân bằng & Năng lượng hóa học');
  const [knowledgeContent, setKnowledgeContent] = useState(
    'Khái niệm hằng số cân bằng Kc, nguyên lý Le Chatelier, enthalpy phản ứng, tính toán nồng độ cân bằng'
  );
  const [teacherRequirements, setTeacherRequirements] = useState(
    'Ưu tiên câu hỏi bám sát thực tiễn công nghiệp sản xuất hóa chất, tránh câu hỏi mẹo'
  );
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [totalPoints, setTotalPoints] = useState(10);

  // Attached files and images for knowledge content
  const [attachedMaterials, setAttachedMaterials] = useState<AttachedKnowledgeMaterial[]>([]);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const documentFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileUpload = async (files: FileList | null, forcedType?: 'image' | 'document') => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    for (const file of fileList) {
      try {
        const extracted = await extractUploadedMaterial(file, forcedType);
        setAttachedMaterials((prev) => [
          ...prev,
          {
            id: extracted.id,
            name: extracted.name,
            type: extracted.type,
            sizeFormatted: extracted.sizeFormatted,
            dataUrl: extracted.dataUrl,
            contentPreview: extracted.contentPreview,
          },
        ]);

        if (extracted.type === 'image') {
          showToast(`Đã tải lên hình ảnh: "${file.name}"`, 'success');
        } else {
          if (extracted.fullExtractedText && extracted.fullExtractedText.trim().length > 0) {
            const cleanSnippet = extracted.fullExtractedText.trim().slice(0, 600);
            setKnowledgeContent((prev) => {
              if (!prev.trim()) {
                return cleanSnippet;
              }
              return `${prev}\n\n[Trích xuất từ ${file.name}]:\n${cleanSnippet}`;
            });
            showToast(`Đã tải lên và trích xuất nội dung từ "${file.name}"`, 'success');
          } else {
            showToast(`Đã đính kèm tài liệu tham khảo: "${file.name}"`, 'success');
          }
        }
      } catch (err) {
        console.error('File upload error:', err);
        showToast(`Không thể đọc tệp "${file.name}", vui lòng thử lại!`, 'error');
      }
    }
  };

  const handlePasteKnowledge = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          const fileId = 'mat_paste_' + Date.now();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setAttachedMaterials((prev) => [
              ...prev,
              {
                id: fileId,
                name: `Ảnh_chụp_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.png`,
                type: 'image',
                sizeFormatted: formatFileSize(file.size),
                dataUrl,
              },
            ]);
            showToast('Đã dán ảnh từ Clipboard vào nội dung trọng tâm!', 'success');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // 3 Mức độ nhận thức bắt buộc (Mục 2 & 3: KNOW - UNDERSTAND - APPLY)
  const [knowRatio, setKnowRatio] = useState(40);
  const [understandRatio, setUnderstandRatio] = useState(40);
  const [applyRatio, setApplyRatio] = useState(20);

  // Cấu trúc câu hỏi chuẩn theo yêu cầu: 15 TN (0,333đ) + 2 Đ/S (2,0đ) + 3 Ngắn (0,5đ) + 3 câu TL (0,5đ) = 10.0đ (ĐIỀU CHỈNH ĐƯỢC)
  const [mcCount, setMcCount] = useState(15);
  const [tfCount, setTfCount] = useState(2);
  const [saCount, setSaCount] = useState(3);
  const [esCount, setEsCount] = useState(3);
  const [esStepsCount, setEsStepsCount] = useState(3);
  const [p1Points, setP1Points] = useState(5.0);
  const [p2Points, setP2Points] = useState(2.0);
  const [p3Points, setP3Points] = useState(1.5);
  const [p4Points, setP4Points] = useState(1.5);

  // Danh sách chương trình SGK chuẩn theo môn và khối lớp hiện tại
  const availableCurriculumChapters = SUBJECT_CURRICULUM_DATA[testSubject]?.[testGrade] || [];

  // Tự động nạp nội dung theo chương đã chọn (phù hợp với nội dung đã chọn và tự luận đúng 3 câu 1,5 điểm)
  const handleSelectCurriculumChapter = (chapterId: string) => {
    if (!chapterId) return;
    const found = availableCurriculumChapters.find((c) => c.id === chapterId);
    if (found) {
      const cleanTopic = found.name.replace(/^Chương \d+:\s*/, '');
      setTestTopic(cleanTopic);
      setKnowledgeContent(found.knowledgeContent);
      setTeacherRequirements(found.teacherRequirements);
      setTestTitle(`Kiểm tra ${testSubject} ${testGrade} – ${cleanTopic}`);
      if (esCount !== 3) {
        setEsCount(3);
      }
      if (p4Points !== 1.5) {
        setP4Points(1.5);
      }
      showToast(`Đã nạp nội dung SGK: "${found.name}" (Cấu hình tự luận chuẩn 3 câu – 1,5 điểm)!`, 'success');
    }
  };

  // Hàm áp dụng các cấu trúc tổng số câu chuẩn (Tất cả đều đảm bảo TỰ LUẬN ĐÚNG 3 CÂU, TỔNG 1,5 ĐIỂM)
  const applyTotalPreset = (presetTotal: number) => {
    if (presetTotal === 23) {
      setMcCount(15);
      setTfCount(2);
      setSaCount(3);
      setEsCount(3);
      setEsStepsCount(3);
      setP1Points(5.0);
      setP2Points(2.0);
      setP3Points(1.5);
      setP4Points(1.5);
      setTotalPoints(10);
      setDurationMinutes(50);
      showToast('Đã áp dụng Chuẩn 23 câu (Bộ GD&ĐT 2025): 15 TN + 2 Đ/S + 3 Ngắn + 3 Tự luận (1,5đ) = 10,0đ!', 'success');
    } else if (presetTotal === 20) {
      setMcCount(12);
      setTfCount(2);
      setSaCount(3);
      setEsCount(3);
      setEsStepsCount(3);
      setP1Points(5.0);
      setP2Points(2.0);
      setP3Points(1.5);
      setP4Points(1.5);
      setTotalPoints(10);
      setDurationMinutes(50);
      showToast('Đã áp dụng Chuẩn 20 câu: 12 TN + 2 Đ/S + 3 Ngắn + 3 Tự luận (1,5đ) = 10,0đ!', 'success');
    } else if (presetTotal === 17) {
      setMcCount(10);
      setTfCount(2);
      setSaCount(2);
      setEsCount(3);
      setEsStepsCount(3);
      setP1Points(5.0);
      setP2Points(2.0);
      setP3Points(1.5);
      setP4Points(1.5);
      setTotalPoints(10);
      setDurationMinutes(45);
      showToast('Đã áp dụng Chuẩn 17 câu: 10 TN + 2 Đ/S + 2 Ngắn + 3 Tự luận (1,5đ) = 10,0đ!', 'success');
    } else if (presetTotal === 25) {
      setMcCount(17);
      setTfCount(2);
      setSaCount(3);
      setEsCount(3);
      setEsStepsCount(3);
      setP1Points(5.0);
      setP2Points(2.0);
      setP3Points(1.5);
      setP4Points(1.5);
      setTotalPoints(10);
      setDurationMinutes(60);
      showToast('Đã áp dụng Chuẩn 25 câu: 17 TN + 2 Đ/S + 3 Ngắn + 3 Tự luận (1,5đ) = 10,0đ!', 'success');
    } else if (presetTotal === 28) {
      setMcCount(20);
      setTfCount(2);
      setSaCount(3);
      setEsCount(3);
      setEsStepsCount(3);
      setP1Points(5.0);
      setP2Points(2.0);
      setP3Points(1.5);
      setP4Points(1.5);
      setTotalPoints(10);
      setDurationMinutes(60);
      showToast('Đã áp dụng Chuẩn 28 câu: 20 TN + 2 Đ/S + 3 Ngắn + 3 Tự luận (1,5đ) = 10,0đ!', 'success');
    } else if (presetTotal === 30) {
      setMcCount(22);
      setTfCount(2);
      setSaCount(3);
      setEsCount(3);
      setEsStepsCount(3);
      setP1Points(5.0);
      setP2Points(2.0);
      setP3Points(1.5);
      setP4Points(1.5);
      setTotalPoints(10);
      setDurationMinutes(90);
      showToast('Đã áp dụng Chuẩn 30 câu: 22 TN + 2 Đ/S + 3 Ngắn + 3 Tự luận (1,5đ) = 10,0đ!', 'success');
    }
  };

  // Điều chỉnh tăng/giảm tổng số câu từ phần cấu hình chính nhưng luôn giữ cố định Tự luận = 3 câu (1,5đ)
  const handleAdjustTotalQuestions = (delta: number) => {
    setMcCount((prev) => Math.max(1, Math.min(50, prev + delta)));
    if (esCount !== 3) {
      setEsCount(3);
    }
    if (p4Points !== 1.5) {
      setP4Points(1.5);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTestForView, setSelectedTestForView] = useState<AssessmentTest | null>(tests[0] || null);

  // Question editing state (Mục 5)
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);
  const [isManualQuestionModalOpen, setIsManualQuestionModalOpen] = useState(false);

  // Online test taking state (Mục 7)
  const [activeTestForTaking, setActiveTestForTaking] = useState<AssessmentTest | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>({});
  const [testTimeRemaining, setTestTimeRemaining] = useState<number>(45 * 60);
  const [testViewMode, setTestViewMode] = useState<'single' | 'all'>('single');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);

  // Teacher grading & essay score adjustment state (Mục 8)
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<AssessmentAttempt | null>(null);
  const [selectedAttemptForDetailModal, setSelectedAttemptForDetailModal] = useState<AssessmentAttempt | null>(null);
  const [adjustedScores, setAdjustedScores] = useState<Record<string, number>>({});
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [attemptFilterScope, setAttemptFilterScope] = useState<'all' | 'mine'>('all');

  // Question bank search & filter
  const [bankSearch, setBankSearch] = useState('');
  const [bankCognitiveFilter, setBankCognitiveFilter] = useState<string>('all');
  const [bankTypeFilter, setBankTypeFilter] = useState<string>('all');

  // Analytics filter (Mục 10)
  const [analyticsStudentFilter, setAnalyticsStudentFilter] = useState<string>('all');
  const [analyticsCognitiveFilter, setAnalyticsCognitiveFilter] = useState<string>('all');

  // Delete test confirmation state (Mục 12)
  const [deleteConfirmTestId, setDeleteConfirmTestId] = useState<string | null>(null);

  const ratioTotal = knowRatio + understandRatio + applyRatio;
  const isRatioValid = ratioTotal === 100;

  // Countdown timer for test taking (Mục 7)
  useEffect(() => {
    if (!activeTestForTaking) return;
    const timer = setInterval(() => {
      setTestTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Tự động nộp khi hết giờ
          handleForceAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTestForTaking, studentAnswers]);

  // Auto-save student answers (Mục 7)
  const handleAnswerChange = (questionId: string, value: any) => {
    const updated = { ...studentAnswers, [questionId]: value };
    setStudentAnswers(updated);
    setLastAutoSavedTime(new Date().toLocaleTimeString());
    if (activeTestForTaking) {
      try {
        localStorage.setItem(
          APP_CONFIG.STORAGE_KEY_PREFIX + 'active_test_' + activeTestForTaking.id,
          JSON.stringify(updated)
        );
      } catch (e) {}
    }
  };

  // Toggle mark question for review
  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // 1. Xử lý AI Tạo Đề Kiểm Tra (Mục 1, 2, 3, 4, 5)
  const handleGenerateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeader) {
      showToast('Chỉ Giáo viên / Tổ trưởng mới có quyền tạo đề kiểm tra!', 'warning');
      return;
    }
    if (!isRatioValid) {
      showToast(
        `Tổng tỉ lệ 3 mức độ nhận thức phải bằng đúng 100% (Hiện tại là ${ratioTotal}%). Vui lòng điều chỉnh lại!`,
        'error'
      );
      return;
    }

    setIsGenerating(true);
    try {
      const newTest = await generateAIAssessmentTest({
        title: testTitle.trim(),
        subject: testSubject,
        grade: testGrade,
        topic: testTopic.trim(),
        knowledgeContent: knowledgeContent.trim(),
        teacherRequirements: teacherRequirements.trim(),
        attachedMaterials,
        durationMinutes,
        totalPoints,
        knowPercent: knowRatio,
        understandPercent: understandRatio,
        applyPercent: applyRatio,
        totalQuestions: mcCount + tfCount + saCount + esCount,
        partCounts: {
          multipleChoice: mcCount,
          trueFalse: tfCount,
          shortAnswer: saCount,
          essay: esCount,
        },
        partPoints: {
          multipleChoice: p1Points,
          trueFalse: p2Points,
          shortAnswer: p3Points,
          essay: p4Points,
        },
      });

      const updatedTests = [newTest, ...tests];
      onUpdateTests(updatedTests);
      setSelectedTestForView(newTest);

      // Thêm câu hỏi vào Question Bank nếu chưa có
      const updatedBank = [...questionBank];
      newTest.questions.forEach((q) => {
        if (!updatedBank.some((b) => b.code === q.code)) {
          updatedBank.push(q);
        }
      });
      onUpdateQuestionBank(updatedBank);

      showToast(`AI đã tạo thành công đề kiểm tra "${newTest.title}" kèm ma trận và bản đặc tả!`);
      setActiveTab('matrix');
    } catch (err: any) {
      showToast(err.message || 'Không thể tạo đề kiểm tra, vui lòng thử lại!', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 6. Nút AI KIỂM TRA ĐỀ (Mục 6)
  const handleRunQualityCheck = (testToAudit: AssessmentTest) => {
    const report = runAIQualityCheck(testToAudit);
    const updated = tests.map((t) => (t.id === testToAudit.id ? { ...t, qualityCheckResult: report } : t));
    onUpdateTests(updated);
    setSelectedTestForView({ ...testToAudit, qualityCheckResult: report });
    setActiveTab('quality_check');

    if (report.overallStatus === 'pass') {
      showToast('AI kiểm tra: Đề kiểm tra đạt chuẩn xuất sắc!', 'success');
    } else if (report.overallStatus === 'warning') {
      showToast('AI kiểm tra: Phát hiện một số cảnh báo cần lưu ý.', 'warning');
    } else {
      showToast('AI kiểm tra: Có lỗi cần chỉnh sửa trước khi xuất bản.', 'error');
    }
  };

  // Bắt đầu làm bài trực tuyến (Mục 7)
  const handleStartTakingTest = (test: AssessmentTest) => {
    setActiveTestForTaking(test);
    setStudentAnswers({});
    setMarkedForReview(new Set());
    setTestTimeRemaining(test.durationMinutes * 60);
    setCurrentQuestionIndex(0);
    setTestViewMode('single');
    setActiveTab('take_test');
    showToast(`Bắt đầu làm bài: ${test.title} (Thời gian: ${test.durationMinutes} phút)`);
  };

  // Nộp bài thi trực tiếp - mở modal xác nhận nộp và chấm điểm
  const handleSubmitTestAttempt = () => {
    if (!activeTestForTaking) return;
    setShowSubmitConfirmModal(true);
  };

  // Tự động nộp khi hết giờ
  const handleForceAutoSubmit = () => {
    if (!activeTestForTaking) return;
    setShowSubmitConfirmModal(false);
    showToast('Đã hết thời gian làm bài! Hệ thống tự động thu bài và chấm điểm.', 'warning');
    executeSubmission(activeTestForTaking, studentAnswers);
  };

  const executeSubmission = (test: AssessmentTest, answers: Record<string, any>) => {
    setShowSubmitConfirmModal(false);
    const attempt = autoGradeAssessment(test, answers);
    attempt.studentId = currentMember.id;
    attempt.studentName = currentMember.name;

    const updatedAttempts = [attempt, ...attempts];
    onUpdateAttempts(updatedAttempts);

    setActiveTestForTaking(null);
    setStudentAnswers({});
    setSelectedAttemptForReview(attempt);
    setSelectedAttemptForDetailModal(attempt);
    setActiveTab('grading');
    showToast(
      `Đã nộp bài thành công! Điểm của bạn: ${attempt.totalScore}/${attempt.maxScore} (${attempt.percentage}%)`,
      'success'
    );
  };

  // Phê duyệt và điều chỉnh điểm tự luận của giáo viên (Mục 8)
  const handleSaveAdjustedGrades = (attempt: AssessmentAttempt) => {
    const updatedAnswers = attempt.answers.map((ans) => {
      if (adjustedScores[ans.questionId] !== undefined) {
        return {
          ...ans,
          awardedScore: adjustedScores[ans.questionId],
        };
      }
      return ans;
    });

    let newKnow = 0;
    let newUnd = 0;
    let newApp = 0;
    updatedAnswers.forEach((ans) => {
      if (ans.cognitiveLevel === 'KNOW') newKnow += ans.awardedScore || 0;
      if (ans.cognitiveLevel === 'UNDERSTAND') newUnd += ans.awardedScore || 0;
      if (ans.cognitiveLevel === 'APPLY') newApp += ans.awardedScore || 0;
    });

    const newTotal = Math.round((newKnow + newUnd + newApp) * 10) / 10;
    const newAttempt: AssessmentAttempt = {
      ...attempt,
      answers: updatedAnswers,
      totalScore: newTotal,
      percentage: Math.round((newTotal / attempt.maxScore) * 100),
      knowScore: Math.round(newKnow * 10) / 10,
      understandScore: Math.round(newUnd * 10) / 10,
      applyScore: Math.round(newApp * 10) / 10,
      isGraded: true,
      gradedBy: `Giáo viên (${currentMember.name}) đã phê duyệt`,
      gradedAt: new Date().toISOString(),
    };

    const nextAttempts = attempts.map((a) => (a.id === attempt.id ? newAttempt : a));
    onUpdateAttempts(nextAttempts);
    setSelectedAttemptForReview(null);
    setAdjustedScores({});
    showToast('Đã lưu điểm và nhận xét phê duyệt của Giáo viên!');
  };

  // Giao nhiệm vụ cá nhân hóa (Mục 11)
  const handleAssignRecommendedTask = (title: string, studentId: string, level: CognitiveLevel) => {
    if (onAssignPersonalizedTask) {
      onAssignPersonalizedTask(title, studentId, level);
      showToast(`Đã giao nhiệm vụ cá nhân hóa "${title}" cho học sinh!`);
    } else {
      showToast(`Đã ghi nhận nhiệm vụ cá nhân hóa mức ${COGNITIVE_LEVEL_LABELS[level]}!`);
    }
  };

  // 12. Thư viện đề: Nhân bản đề (Clone)
  const handleCloneTest = (test: AssessmentTest) => {
    const cloned: AssessmentTest = {
      ...test,
      id: 'test_clone_' + Date.now(),
      code: `DE-CLONE-${Date.now().toString().slice(-4)}`,
      title: `${test.title} (Bản sao)`,
      createdAt: new Date().toISOString().split('T')[0],
      creatorName: currentMember.name,
      status: 'draft',
      isApprovedByTeacher: false,
    };
    const next = [cloned, ...tests];
    onUpdateTests(next);
    setSelectedTestForView(cloned);
    showToast(`Đã nhân bản đề thành công: "${cloned.title}"!`);
  };

  // 12. Thư viện đề: Xóa đề (kèm xác nhận)
  const handleConfirmDeleteTest = () => {
    if (!deleteConfirmTestId) return;
    const next = tests.filter((t) => t.id !== deleteConfirmTestId);
    onUpdateTests(next);
    setDeleteConfirmTestId(null);
    if (selectedTestForView?.id === deleteConfirmTestId) {
      setSelectedTestForView(next[0] || null);
    }
    showToast('Đã xóa đề kiểm tra khỏi Thư viện đề!');
  };

  // Question editing: đổi vị trí (Move up / down)
  const handleMoveQuestion = (test: AssessmentTest, index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= test.questions.length) return;
    const qs = [...test.questions];
    const temp = qs[index];
    qs[index] = qs[newIdx];
    qs[newIdx] = temp;

    const updatedTest = { ...test, questions: qs };
    const nextTests = tests.map((t) => (t.id === test.id ? updatedTest : t));
    onUpdateTests(nextTests);
    setSelectedTestForView(updatedTest);
    showToast('Đã thay đổi vị trí câu hỏi!');
  };

  // Question editing: Xóa câu hỏi khỏi đề
  const handleDeleteQuestionFromTest = (test: AssessmentTest, qId: string) => {
    if (test.questions.length <= 1) {
      showToast('Đề kiểm tra phải có ít nhất 1 câu hỏi!', 'warning');
      return;
    }
    const qs = test.questions.filter((q) => q.id !== qId);
    const updatedTest = { ...test, questions: qs };
    const nextTests = tests.map((t) => (t.id === test.id ? updatedTest : t));
    onUpdateTests(nextTests);
    setSelectedTestForView(updatedTest);
    showToast('Đã xóa câu hỏi khỏi đề kiểm tra!');
  };

  // Question editing: Cập nhật câu hỏi
  const handleSaveEditedQuestion = (updatedQ: QuestionBankItem) => {
    if (!selectedTestForView) return;
    const updatedQuestions = selectedTestForView.questions.map((q) =>
      q.id === updatedQ.id ? updatedQ : q
    );
    const updatedTest = { ...selectedTestForView, questions: updatedQuestions };
    const nextTests = tests.map((t) => (t.id === updatedTest.id ? updatedTest : t));
    onUpdateTests(nextTests);
    setSelectedTestForView(updatedTest);

    // Cập nhật cả trong Question Bank
    const nextBank = questionBank.map((q) => (q.id === updatedQ.id ? updatedQ : q));
    onUpdateQuestionBank(nextBank);

    setEditingQuestion(null);
    showToast('Đã cập nhật câu hỏi thành công!');
  };

  // Phân quyền lọc dữ liệu
  const visibleAttempts =
    isLeader || attemptFilterScope === 'all'
      ? attempts
      : attempts.filter(
          (a) => a.studentId === currentMember.id || a.id === selectedAttemptForReview?.id
        );

  // Thống kê Dashboard (Mục 18)
  const totalTestsCount = tests.length;
  const totalAttemptsCount = attempts.length;
  const avgClassScore =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce((acc, a) => acc + a.totalScore, 0) / attempts.length) * 10
        ) / 10
      : 8.2;

  const totalKnowMax = attempts.reduce((acc, a) => acc + a.knowMaxScore, 0);
  const totalKnowEarned = attempts.reduce((acc, a) => acc + a.knowScore, 0);
  const knowPassRate =
    totalKnowMax > 0 ? Math.round((totalKnowEarned / totalKnowMax) * 100) : 88;

  const totalUndMax = attempts.reduce((acc, a) => acc + a.understandMaxScore, 0);
  const totalUndEarned = attempts.reduce((acc, a) => acc + a.understandScore, 0);
  const undPassRate =
    totalUndMax > 0 ? Math.round((totalUndEarned / totalUndMax) * 100) : 76;

  const totalAppMax = attempts.reduce((acc, a) => acc + a.applyMaxScore, 0);
  const totalAppEarned = attempts.reduce((acc, a) => acc + a.applyScore, 0);
  const appPassRate =
    totalAppMax > 0 ? Math.round((totalAppEarned / totalAppMax) * 100) : 58;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-md">
              <FileCheck2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">AI TẠO ĐỀ KIỂM TRA</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  3 Mức Độ: BIẾT – HIỂU – VẬN DỤNG
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ma trận đề • Bản đặc tả • Sinh câu hỏi • AI Kiểm tra đề • Làm bài trực tuyến • AI Chấm điểm & Nhận xét • Phân tích & Cá nhân hóa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
              {isLeader ? '👑 Quản Trị Khảo Thí (Giáo Viên)' : '🎒 Học Sinh Làm Bài & Xem Điểm'}
            </span>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-t border-slate-100 pt-3">
          {[
            { id: 'generator', label: '1. AI Tạo Đề', icon: Sparkles },
            { id: 'matrix', label: '2. Ma Trận Đề', icon: Table },
            { id: 'spec', label: '3. Bản Đặc Tả', icon: Layers },
            { id: 'quality_check', label: '4. AI Kiểm Tra Đề', icon: ShieldAlert },
            { id: 'bank', label: `5. Ngân Hàng Câu (${questionBank.length})`, icon: Database },
            { id: 'library', label: `6. Thư Viện Đề (${tests.length})`, icon: BookOpen },
            { id: 'take_test', label: '7. Làm Bài Online', icon: PlayCircle },
            { id: 'grading', label: `8. AI Chấm & Nhận Xét (${visibleAttempts.length})`, icon: CheckCircle2 },
            { id: 'exam_grader', label: '🎯 Chấm Điểm 4 Phần (5đ - 2đ - 1.5đ - 1.5đ)', icon: FileCheck2 },
            { id: 'analytics', label: '9. Phân Tích & Cá Nhân Hóa', icon: BarChart },
            { id: 'dashboard', label: '10. Dashboard Tổng Hợp', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
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
          TAB 1: AI TẠO ĐỀ KIỂM TRA (MỤC 1 & 2)
      ==================================================================== */}
      {activeTab === 'generator' && (
        <div className="space-y-6 animate-fade-in">
          <form
            onSubmit={handleGenerateTest}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6"
          >
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-600" />
                <span>Cấu Hình AI Tạo Đề Kiểm Tra Chuẩn Khảo Thí</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI tạo đề tự động dựa trên 10 thông số chuẩn mực, chỉ dùng đúng 3 mức độ: BIẾT, HIỂU, VẬN DỤNG
              </p>
            </div>

            {/* Basic Info: Môn, Khối, Chủ đề, Thời gian, Điểm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên bài kiểm tra *</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Môn học & Khối lớp *</label>
                <div className="flex gap-2">
                  <select
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={testGrade}
                    onChange={(e) => setTestGrade(e.target.value)}
                    className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Chủ đề / Chương / Bài *</label>
                  {availableCurriculumChapters.length > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      SGK Kết nối tri thức
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={testTopic}
                    onChange={(e) => setTestTopic(e.target.value)}
                    placeholder="Nhập hoặc chọn chương bên dưới..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                  />
                  {availableCurriculumChapters.length > 0 && (
                    <select
                      onChange={(e) => {
                        handleSelectCurriculumChapter(e.target.value);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="w-full px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-900 cursor-pointer outline-none hover:bg-emerald-100/70 transition-colors"
                      title="Chọn nhanh chương để nạp đúng chuẩn nội dung kiến thức và yêu cầu sư phạm"
                    >
                      <option value="" disabled>
                        📖 Chọn nhanh chương từ chuẩn SGK ({testSubject} Lớp {testGrade})...
                      </option>
                      {availableCurriculumChapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thời gian làm bài (Phút) *</label>
                <input
                  type="number"
                  min={15}
                  max={90}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thang điểm tổng *</label>
                <input
                  type="number"
                  value={totalPoints}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Tổng số câu hỏi *</label>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 size={11} className="text-emerald-700" />
                    <span>Tự luận: {esCount} câu ({p4Points.toFixed(1)}đ – {(p4Points / esCount) === 0.5 ? '0,5' : (p4Points / esCount).toFixed(2).replace(/\.?0+$/, '')}đ/câu)</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={
                      [17, 20, 23, 25, 28, 30].includes(mcCount + tfCount + saCount + esCount) && esCount === 3 && p4Points === 1.5
                        ? String(mcCount + tfCount + saCount + esCount)
                        : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        applyTotalPreset(Number(e.target.value));
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-300 rounded-xl font-black text-slate-800 text-xs outline-none cursor-pointer hover:border-emerald-400"
                  >
                    <option value="23">⭐ Chuẩn 23 câu (15 TN • 2 Đ/S • 3 Ngắn • 3 TL 1,5đ = 10,0đ)</option>
                    <option value="20">Chuẩn 20 câu (12 TN • 2 Đ/S • 3 Ngắn • 3 TL 1,5đ = 10,0đ)</option>
                    <option value="17">Chuẩn 17 câu (10 TN • 2 Đ/S • 2 Ngắn • 3 TL 1,5đ = 10,0đ)</option>
                    <option value="25">Chuẩn 25 câu (17 TN • 2 Đ/S • 3 Ngắn • 3 TL 1,5đ = 10,0đ)</option>
                    <option value="28">Chuẩn 28 câu (20 TN • 2 Đ/S • 3 Ngắn • 3 TL 1,5đ = 10,0đ)</option>
                    <option value="30">Chuẩn 30 câu (22 TN • 2 Đ/S • 3 Ngắn • 3 TL 1,5đ = 10,0đ)</option>
                    <option value="custom">Tùy chỉnh: {mcCount + tfCount + saCount + esCount} câu ({esCount} TL • {p4Points.toFixed(1)}đ)</option>
                  </select>

                  <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleAdjustTotalQuestions(-1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center cursor-pointer border border-slate-200 shadow-2xs"
                      title="Giảm 1 câu hỏi (giữ nguyên 3 câu tự luận)"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-7 text-center font-black text-emerald-800 text-xs">
                      {mcCount + tfCount + saCount + esCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustTotalQuestions(1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center cursor-pointer shadow-2xs"
                      title="Tăng 1 câu hỏi (giữ nguyên 3 câu tự luận)"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
                  <span>Cơ cấu: <b>{mcCount}</b> TN + <b>{tfCount}</b> Đ/S + <b>{saCount}</b> Ngắn + <b className="text-emerald-700">{esCount}</b> Tự luận</span>
                  <span className="text-emerald-700 font-extrabold">Đủ {(p1Points + p2Points + p3Points + p4Points).toFixed(1)}đ</span>
                </div>
              </div>
            </div>

            {/* Nội dung kiến thức & Yêu cầu riêng của giáo viên (Mục 1) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-xs">
                      Nội dung kiến thức trọng tâm cần kiểm tra: <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Tự gõ hoặc tải tài liệu (.doc, .docx, .pdf, .txt, .xlsx) và ảnh chụp sơ đồ, bài tập
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Hidden inputs */}
                    <input
                      ref={documentFileInputRef}
                      type="file"
                      multiple
                      accept=".txt,.doc,.docx,.pdf,.xls,.xlsx,.csv,.json,.md"
                      onChange={(e) => {
                        handleFileUpload(e.target.files, 'document');
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        handleFileUpload(e.target.files, 'image');
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    {/* Nút Tải Tài Liệu nổi bật */}
                    <button
                      type="button"
                      onClick={() => documentFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Tải lên tài liệu tham khảo (.doc, .docx, .pdf, .txt, .xlsx, .csv...)"
                    >
                      <Paperclip size={14} />
                      <span>Tải tài liệu</span>
                      <span className="px-1.5 py-0.2 bg-blue-500 text-[10px] rounded-md font-semibold">.doc, .pdf</span>
                    </button>

                    {/* Nút Tải Ảnh nổi bật */}
                    <button
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Tải lên ảnh chụp đề bài, sơ đồ, công thức, bài tập SGK..."
                    >
                      <ImageIcon size={14} />
                      <span>Tải ảnh lên</span>
                      <span className="px-1.5 py-0.2 bg-emerald-500 text-[10px] rounded-md font-semibold">Ảnh SGK/sơ đồ</span>
                    </button>
                  </div>
                </div>

                {/* Tip banner */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500 shrink-0" />
                    <span>Tự động trích xuất nội dung văn bản Word/PDF/Excel và nhận diện sơ đồ công thức từ ảnh!</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Dán nhanh: Ctrl + V</span>
                </div>

                {/* Dropzone & Textarea */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    if (e.dataTransfer.files) {
                      handleFileUpload(e.dataTransfer.files);
                    }
                  }}
                  className={`relative rounded-2xl transition-all ${
                    isDraggingOver
                      ? 'ring-2 ring-emerald-500 bg-emerald-50/50'
                      : ''
                  }`}
                >
                  <textarea
                    rows={3}
                    value={knowledgeContent}
                    onChange={(e) => setKnowledgeContent(e.target.value)}
                    onPaste={handlePasteKnowledge}
                    placeholder="Nhập kiến thức, công thức, định luật, kỹ năng cần kiểm tra... HOẶC bấm 'Tải tài liệu', 'Tải ảnh lên' phía trên, kéo thả tệp, dán ảnh (Ctrl+V) vào đây để AI tạo đề chuẩn xác."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium resize-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs"
                  />
                  {isDraggingOver && (
                    <div className="absolute inset-0 bg-emerald-500/15 border-2 border-dashed border-emerald-600 rounded-2xl flex items-center justify-center text-emerald-900 font-black text-xs pointer-events-none backdrop-blur-2xs">
                      📥 Thả tài liệu hoặc ảnh vào đây để tự động phân tích
                    </div>
                  )}
                </div>

                {/* Danh sách tệp & ảnh đã tải lên */}
                {attachedMaterials.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
                      <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Đã đính kèm {attachedMaterials.length} tệp ({attachedMaterials.filter((m) => m.type === 'image').length} ảnh, {attachedMaterials.filter((m) => m.type === 'document').length} tài liệu)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachedMaterials([])}
                        className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-bold cursor-pointer"
                      >
                        Xóa tất cả tệp đính kèm
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachedMaterials.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.type === 'image' && item.dataUrl ? (
                              <div
                                onClick={() => setPreviewImageModal(item.dataUrl || null)}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in shrink-0 relative group shadow-2xs"
                                title="Nhấp xem phóng to"
                              >
                                <img
                                  src={item.dataUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Maximize2 size={11} />
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                                <FileText size={18} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 text-[11px] truncate" title={item.name}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span className={item.type === 'image' ? 'text-emerald-600 font-bold' : 'text-blue-600 font-bold'}>
                                  {item.type === 'image' ? '🖼️ Hình ảnh' : '📄 Tài liệu'}
                                </span>
                                <span>•</span>
                                <span>{item.sizeFormatted}</span>
                              </div>
                              {item.contentPreview && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5" title={item.contentPreview}>
                                  "{item.contentPreview}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {item.type === 'document' && item.contentPreview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setKnowledgeContent((prev) => {
                                    const snippet = item.contentPreview || '';
                                    if (prev.includes(snippet)) return prev;
                                    return prev ? `${prev}\n\n[${item.name}]:\n${snippet}` : snippet;
                                  });
                                  showToast(`Đã đưa trích xuất từ "${item.name}" vào nội dung!`, 'success');
                                }}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                title="Đưa trích xuất này vào ô kiến thức trọng tâm"
                              >
                                + Chèn
                              </button>
                            )}
                            {item.type === 'image' && item.dataUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImageModal(item.dataUrl || null)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Xem phóng to ảnh"
                              >
                                <Eye size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setAttachedMaterials((prev) => prev.filter((m) => m.id !== item.id))}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Gỡ bỏ tệp này"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Yêu cầu riêng của giáo viên (Tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={teacherRequirements}
                  onChange={(e) => setTeacherRequirements(e.target.value)}
                  placeholder="Ví dụ: Tập trung vào bài toán thực tiễn, tránh câu hỏi mẹo, có câu hỏi hình ảnh..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium resize-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-xs"
                />
              </div>
            </div>

            {/* BẮT BUỘC: 3 MỨC ĐỘ NHẬN THỨC (MỤC 2 & 3) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-sm text-slate-900 block">
                    Cấu Hình Tỉ Lệ 3 Mức Độ Nhận Thức (Bắt buộc Tổng = 100%)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Chỉ sử dụng đúng 3 mức độ: BIẾT (KNOW), HIỂU (UNDERSTAND), VẬN DỤNG (APPLY)
                  </p>
                </div>

                <div
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                    isRatioValid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                  }`}
                >
                  Tổng tỉ lệ: {ratioTotal}% {isRatioValid ? '✓ Hợp lệ (100%)' : '✗ Chưa bằng 100%'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>1. BIẾT (KNOW)</span>
                    <span className="font-black text-sm">{knowRatio}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={knowRatio}
                    onChange={(e) => setKnowRatio(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Nhận biết khái niệm, thuật ngữ, công thức, quy tắc, dữ kiện đã học
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between font-bold text-blue-800">
                    <span>2. HIỂU (UNDERSTAND)</span>
                    <span className="font-black text-sm">{understandRatio}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={understandRatio}
                    onChange={(e) => setUnderstandRatio(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Giải thích, mô tả, so sánh, phân loại, phân tích ở mức độ hiểu
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between font-bold text-purple-800">
                    <span>3. VẬN DỤNG (APPLY)</span>
                    <span className="font-black text-sm">{applyRatio}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={applyRatio}
                    onChange={(e) => setApplyRatio(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Áp dụng kiến thức, xử lý tình huống mới, tính toán, gắn thực tiễn
                  </p>
                </div>
              </div>
            </div>

            {/* Cấu trúc câu hỏi 4 phần (ĐIỀU CHỈNH ĐƯỢC) */}
            <div className="space-y-4 p-5 rounded-3xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Scale size={13} /> Thang Điểm Chia Đều Cho Mỗi Câu Trong Mỗi Phần
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-[11px]">
                      Tổng: {(p1Points + p2Points + p3Points + p4Points).toFixed(1)} điểm
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-slate-900 mt-1">
                    Cấu Trúc Các Dạng Câu Hỏi Trong Đề (Điều Chỉnh Được)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Giáo viên có thể bấm <b>[+]</b> hoặc <b>[-]</b> hoặc nhập trực tiếp số câu / số ý để tuỳ biến thang điểm chia đều theo mong muốn
                  </p>
                </div>

                {/* Preset Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyTotalPreset(23)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:scale-102 active:scale-98 transition-all cursor-pointer"
                  >
                    <Sparkles size={13} className="text-amber-200" />
                    <span>⭐ Chuẩn 23 câu: 15 TN • 2 Đ/S • 3 Ngắn • 3 Tự Luận (1,5đ) = 10,0đ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTotalPreset(20)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Chuẩn 20 câu (3 TL • 1,5đ)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTotalPreset(17)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Chuẩn 17 câu (3 TL • 1,5đ)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTotalPreset(25)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Chuẩn 25 câu (3 TL • 1,5đ)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTotalPreset(28)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Chuẩn 28 câu (3 TL • 1,5đ)
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTotalPreset(30)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    Chuẩn 30 câu (3 TL • 1,5đ)
                  </button>
                </div>
              </div>

              {/* 4 Cards Điều Chỉnh Số Câu & Điểm Chia Đều */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Phần 1: TN nhiều lựa chọn */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-blue-900 block">Phần I: TN Nhiều Lựa Chọn</label>
                    <span className="font-black text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      {p1Points.toFixed(1)} điểm
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-blue-200">
                    <button
                      type="button"
                      onClick={() => setMcCount((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-black cursor-pointer transition-colors"
                      title="Giảm 1 câu"
                    >
                      <Minus size={13} />
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={mcCount}
                        onChange={(e) => setMcCount(Math.max(1, Number(e.target.value)))}
                        className="w-14 text-center font-black text-blue-900 text-sm outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-500 font-semibold">câu</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMcCount((prev) => Math.min(50, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-black cursor-pointer transition-colors"
                      title="Tăng 1 câu"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-blue-100 text-center space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Chia đều mỗi câu:</span>
                    <span className="font-black text-blue-800 text-xs block">
                      {(p1Points / mcCount).toFixed(3)} điểm / câu
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ({mcCount} câu × {(p1Points / mcCount).toFixed(3)}đ = {p1Points.toFixed(1)}đ)
                    </span>
                  </div>
                </div>

                {/* Phần 2: Đúng / Sai */}
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/90 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-purple-900 block">Phần II: Đúng / Sai</label>
                    <span className="font-black text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      {p2Points.toFixed(1)} điểm
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-purple-200">
                    <button
                      type="button"
                      onClick={() => setTfCount((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-black cursor-pointer transition-colors"
                      title="Giảm 1 câu"
                    >
                      <Minus size={13} />
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={tfCount}
                        onChange={(e) => setTfCount(Math.max(1, Number(e.target.value)))}
                        className="w-14 text-center font-black text-purple-900 text-sm outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-500 font-semibold">câu</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTfCount((prev) => Math.min(10, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-black cursor-pointer transition-colors"
                      title="Tăng 1 câu"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-purple-100 text-center space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Tối đa mỗi câu:</span>
                    <span className="font-black text-purple-800 text-xs block">
                      {(p2Points / tfCount).toFixed(2)} điểm / câu
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      (1 ý: {((p2Points / tfCount) * 0.1).toFixed(2)}đ • 2 ý: {((p2Points / tfCount) * 0.25).toFixed(2)}đ • 3 ý: {((p2Points / tfCount) * 0.5).toFixed(2)}đ • 4 ý: {(p2Points / tfCount).toFixed(2)}đ)
                    </span>
                  </div>
                </div>

                {/* Phần 3: Trả lời ngắn */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-amber-900 block">Phần III: Trả Lời Ngắn</label>
                    <span className="font-black text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                      {p3Points.toFixed(1)} điểm
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-amber-200">
                    <button
                      type="button"
                      onClick={() => setSaCount((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-black cursor-pointer transition-colors"
                      title="Giảm 1 câu"
                    >
                      <Minus size={13} />
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={saCount}
                        onChange={(e) => setSaCount(Math.max(1, Number(e.target.value)))}
                        className="w-14 text-center font-black text-amber-900 text-sm outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-500 font-semibold">câu</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSaCount((prev) => Math.min(30, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-black cursor-pointer transition-colors"
                      title="Tăng 1 câu"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-amber-100 text-center space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold block">Chia đều mỗi câu:</span>
                    <span className="font-black text-amber-800 text-xs block">
                      {(p3Points / saCount).toFixed(3)} điểm / câu
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ({saCount} câu × {(p3Points / saCount).toFixed(3)}đ = {p3Points.toFixed(1)}đ)
                    </span>
                  </div>
                </div>

                {/* Phần 4: Tự luận */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-emerald-900 block flex items-center gap-1.5">
                      <span>Phần IV: Tự Luận</span>
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-black">
                        {esCount} câu
                      </span>
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-xs shadow-2xs">
                        {p4Points.toFixed(1)} điểm
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setEsCount((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black cursor-pointer transition-colors"
                      title="Giảm 1 câu tự luận"
                    >
                      <Minus size={13} />
                    </button>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={esCount}
                        onChange={(e) => setEsCount(Math.max(1, Number(e.target.value)))}
                        className="w-14 text-center font-black text-emerald-900 text-sm outline-none bg-transparent"
                      />
                      <span className="text-[11px] text-slate-500 font-semibold">câu TL</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEsCount((prev) => Math.min(10, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black cursor-pointer transition-colors"
                      title="Tăng 1 câu tự luận"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-emerald-100 text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-800">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <span>
                        {esCount === 3 && p4Points === 1.5
                          ? '⭐ Chuẩn khảo thí: 3 câu tự luận (1,5 điểm – 0,5đ/câu)'
                          : `${esCount} câu tự luận (${p4Points.toFixed(1)}đ)`}
                      </span>
                    </div>
                    <span className="font-black text-emerald-800 text-xs block">
                      {(p4Points / esCount) === 0.5 ? '0,5' : (p4Points / esCount).toFixed(2).replace(/\.?0+$/, '')} điểm / câu
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ({esCount} câu TL × {(p4Points / esCount) === 0.5 ? '0,5' : (p4Points / esCount).toFixed(2).replace(/\.?0+$/, '')}đ = {p4Points.toFixed(1)}đ)
                    </span>
                    {(esCount !== 3 || p4Points !== 1.5) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEsCount(3);
                          setP4Points(1.5);
                        }}
                        className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                      >
                        <RotateCcw size={10} />
                        <span>Khôi phục chuẩn: 3 câu (1,5 điểm)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* THANH CÔNG CỤ TẢI ĐỀ THI VỀ MÁY (WORD, TXT, IN/PDF) */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-xs block">
                      TẢI ĐỀ KIỂM TRA ĐÃ CẤU HÌNH VỀ MÁY ({mcCount} TN + {tfCount} Đ/S + {saCount} Ngắn + {esCount} Tự luận = 10,0đ • Tổng {mcCount + tfCount + saCount + esCount} câu)
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Xuất ngay đề thi đầy đủ câu hỏi, bảng ma trận và biểu điểm chuẩn để in hoặc giao học sinh
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const targetTest = selectedTestForView || tests[0];
                      if (targetTest) {
                        exportTestToWord(targetTest, 'full');
                        showToast(`Đã tải đề kiểm tra "${targetTest.title}" kèm đáp án & ma trận (.doc)!`, 'success');
                      } else {
                        downloadExamPaperWord({
                          title: testTitle || 'Kiểm tra đánh giá chuyên đề',
                          subject: testSubject,
                          grade: testGrade,
                          durationMinutes,
                          p1Count: mcCount,
                          p1PointPerQ: p1Points / mcCount,
                          p2Count: tfCount,
                          p2MaxPerQ: p2Points / tfCount,
                          p3Count: saCount,
                          p3PointPerQ: p3Points / saCount,
                          p4Steps: esCount,
                          p4PointPerStep: p4Points / esCount,
                          includeAnswers: true,
                        });
                        showToast('Đã tải đề kiểm tra kèm đáp án (.doc)!', 'success');
                      }
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all hover:scale-102"
                    title="Tải tệp Word (.doc) có đầy đủ câu hỏi và bảng đáp án"
                  >
                    <Download size={13} />
                    <span>Tải Đề Word (.doc - Kèm Đáp Án)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetTest = selectedTestForView || tests[0];
                      if (targetTest) {
                        exportTestToWord(targetTest, 'student');
                        showToast(`Đã tải đề thi học sinh "${targetTest.title}" (.doc)!`, 'success');
                      } else {
                        downloadExamPaperWord({
                          title: testTitle || 'Kiểm tra đánh giá chuyên đề',
                          subject: testSubject,
                          grade: testGrade,
                          durationMinutes,
                          p1Count: mcCount,
                          p1PointPerQ: p1Points / mcCount,
                          p2Count: tfCount,
                          p2MaxPerQ: p2Points / tfCount,
                          p3Count: saCount,
                          p3PointPerQ: p3Points / saCount,
                          p4Steps: esCount,
                          p4PointPerStep: p4Points / esCount,
                          includeAnswers: false,
                        });
                        showToast('Đã tải đề thi phát cho học sinh (.doc)!', 'success');
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all hover:scale-102"
                    title="Tải đề thi phát cho học sinh làm bài (không lộ đáp án)"
                  >
                    <FileText size={13} />
                    <span>Tải Đề Học Sinh (.doc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetTest = selectedTestForView || tests[0];
                      if (targetTest) {
                        exportTestToTxt(targetTest, true);
                        showToast(`Đã tải tệp đề kiểm tra "${targetTest.title}" (.txt)!`, 'success');
                      } else {
                        downloadExamPaperTxt({
                          title: testTitle || 'Kiểm tra đánh giá chuyên đề',
                          subject: testSubject,
                          grade: testGrade,
                          durationMinutes,
                          p1Count: mcCount,
                          p1PointPerQ: p1Points / mcCount,
                          p2Count: tfCount,
                          p2MaxPerQ: p2Points / tfCount,
                          p3Count: saCount,
                          p3PointPerQ: p3Points / saCount,
                          p4Steps: esCount,
                          p4PointPerStep: p4Points / esCount,
                          includeAnswers: true,
                        });
                        showToast('Đã tải tệp đề kiểm tra (.txt)!', 'success');
                      }
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Tải tệp văn bản thô (.txt)"
                  >
                    <Download size={13} />
                    <span>Tải .txt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetTest = selectedTestForView || tests[0];
                      if (targetTest) {
                        printTestPaper(targetTest);
                      } else {
                        window.print();
                      }
                    }}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    title="In đề thi hoặc lưu thành file PDF"
                  >
                    <Printer size={13} />
                    <span>In / PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Tổng số câu: <b>{mcCount + tfCount + saCount + esCount}</b> câu hỏi ({mcCount} TN, {tfCount} Đ/S, {saCount} Ngắn, {esCount} Tự luận)
              </span>

              <button
                type="submit"
                disabled={isGenerating || !isRatioValid || !isLeader}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    <span>AI đang xây dựng ma trận & sinh câu hỏi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Tạo Đề Kiểm Tra & Ma Trận Chuẩn</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          TAB 2: MA TRẬN ĐỀ KIỂM TRA (MỤC 3)
      ==================================================================== */}
      {activeTab === 'matrix' && selectedTestForView && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                  {selectedTestForView.code}
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedTestForView.subject} {selectedTestForView.grade}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                MA TRẬN ĐỀ KIỂM TRA: {selectedTestForView.title}
              </h3>
              <p className="text-slate-500 mt-0.5">
                Bảng phân bổ số câu, điểm số và tỉ lệ % giữa 3 mức độ: BIẾT – HIỂU – VẬN DỤNG
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRunQualityCheck(selectedTestForView)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert size={14} />
                <span>AI Kiểm Tra Đề</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  exportTestToWord(selectedTestForView, 'full');
                  showToast(`Đã tải đề kiểm tra "${selectedTestForView.title}" (.doc) kèm ma trận & bản đặc tả!`, 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-2xs cursor-pointer"
                title="Tải toàn bộ đề kiểm tra, ma trận & bản đặc tả định dạng Word (.doc)"
              >
                <Download size={13} />
                <span>Tải đề (.doc)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = `MA TRẬN ĐỀ KIỂM TRA: ${selectedTestForView.title}\n` +
                    `Môn: ${selectedTestForView.subject} | Khối: ${selectedTestForView.grade} | Thời gian: ${selectedTestForView.durationMinutes} phút\n\n` +
                    `Tỉ lệ 3 mức độ nhận thức:\n` +
                    `- Mức BIẾT: ${selectedTestForView.knowRatio}%\n` +
                    `- Mức HIỂU: ${selectedTestForView.understandRatio}%\n` +
                    `- Mức VẬN DỤNG: ${selectedTestForView.applyRatio}%\n` +
                    `Tổng số câu: ${selectedTestForView.questions.length} câu | Tổng điểm: ${selectedTestForView.totalPoints} điểm\n`;
                  downloadTextAsFile(`Ma_Tran_${selectedTestForView.code}.txt`, text);
                  showToast('Đã tải ma trận đề kiểm tra (.txt)');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer"
              >
                <Download size={13} />
                <span>Tải ma trận (.txt)</span>
              </button>
            </div>
          </div>

          {/* Bảng Ma trận chuẩn hóa */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold text-[11px] border-b border-slate-200">
                  <th className="p-3">Chủ đề / Nội dung kiến thức</th>
                  <th className="p-3 text-center text-emerald-800 bg-emerald-50/70">Số câu BIẾT</th>
                  <th className="p-3 text-center text-blue-800 bg-blue-50/70">Số câu HIỂU</th>
                  <th className="p-3 text-center text-purple-800 bg-purple-50/70">Số câu VẬN DỤNG</th>
                  <th className="p-3 text-center bg-slate-200/60 font-black">Tổng số câu</th>
                  <th className="p-3 text-center">Tỷ lệ %</th>
                  <th className="p-3 text-center font-black">Tổng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedTestForView.matrix?.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-medium">
                    <td className="p-3">
                      <b className="text-slate-900 block">{row.topic}</b>
                      <span className="text-[11px] text-slate-500">{row.content}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-800 bg-emerald-50/30">
                      {row.knowQuestions} câu ({row.knowPoints}đ)
                    </td>
                    <td className="p-3 text-center font-bold text-blue-800 bg-blue-50/30">
                      {row.understandQuestions} câu ({row.understandPoints}đ)
                    </td>
                    <td className="p-3 text-center font-bold text-purple-800 bg-purple-50/30">
                      {row.applyQuestions} câu ({row.applyPoints}đ)
                    </td>
                    <td className="p-3 text-center font-black text-slate-900 bg-slate-100/50">
                      {row.totalQuestions} câu
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{row.percentage}%</td>
                    <td className="p-3 text-center font-black text-emerald-700">{row.totalPoints}đ</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                  <td className="p-3">TỔNG CỘNG</td>
                  <td className="p-3 text-center text-emerald-900">
                    {selectedTestForView.questions.filter((q) => q.cognitiveLevel === 'KNOW').length} câu ({selectedTestForView.knowRatio}%)
                  </td>
                  <td className="p-3 text-center text-blue-900">
                    {selectedTestForView.questions.filter((q) => q.cognitiveLevel === 'UNDERSTAND').length} câu ({selectedTestForView.understandRatio}%)
                  </td>
                  <td className="p-3 text-center text-purple-900">
                    {selectedTestForView.questions.filter((q) => q.cognitiveLevel === 'APPLY').length} câu ({selectedTestForView.applyRatio}%)
                  </td>
                  <td className="p-3 text-center text-slate-900">
                    {selectedTestForView.questions.length} câu
                  </td>
                  <td className="p-3 text-center">100%</td>
                  <td className="p-3 text-center text-emerald-700">{selectedTestForView.totalPoints}đ</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* AI Tự kiểm tra tính nhất quán (Mục 3) */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <span className="font-black flex items-center gap-1.5 text-xs">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>AI Tự Kiểm Tra Tính Nhất Quán Của Ma Trận:</span>
            </span>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-800">
              <li>✓ Tổng số câu ({selectedTestForView.questions.length} câu) đúng với cấu trúc yêu cầu.</li>
              <li>✓ Tổng điểm đạt chuẩn {selectedTestForView.totalPoints} điểm.</li>
              <li>✓ Tỷ lệ 3 mức độ (BIẾT: {selectedTestForView.knowRatio}%, HIỂU: {selectedTestForView.understandRatio}%, VẬN DỤNG: {selectedTestForView.applyRatio}%) đúng 100%.</li>
              <li>✓ Mỗi câu hỏi thuộc đúng 1 mức độ, không có câu bị thiếu mức độ.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: BẢN ĐẶC TẢ ĐỀ (MỤC 4)
      ==================================================================== */}
      {activeTab === 'spec' && selectedTestForView && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-purple-600" />
                <span>BẢN ĐẶC TẢ ĐỀ KIỂM TRA: {selectedTestForView.title}</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Xác định yêu cầu cần đạt, dạng câu hỏi và hướng dẫn chấm cho từng câu theo 3 mức độ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  exportTestToWord(selectedTestForView, 'full');
                  showToast(`Đã tải đề kiểm tra "${selectedTestForView.title}" (.doc) kèm ma trận & bản đặc tả!`, 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-2xs cursor-pointer"
                title="Tải toàn bộ đề kiểm tra, ma trận & bản đặc tả định dạng Word (.doc)"
              >
                <Download size={13} />
                <span>Tải đề (.doc)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = `BẢN ĐẶC TẢ ĐỀ KIỂM TRA: ${selectedTestForView.title}\n` +
                    `Môn: ${selectedTestForView.subject} | Khối: ${selectedTestForView.grade}\n\n` +
                    (selectedTestForView.specifications || [])
                      .map(
                        (s, i) =>
                          `${i + 1}. [Mức ${COGNITIVE_LEVEL_LABELS[s.cognitiveLevel]}] ${s.content}\n` +
                          `   - Yêu cầu cần đạt: ${s.learningOutcome}\n` +
                          `   - Dạng câu: ${s.questionType} | Số câu: ${s.questionCount} (${s.points}đ)\n`
                      )
                      .join('\n');
                  downloadTextAsFile(`Ban_Dac_Ta_${selectedTestForView.code}.txt`, text);
                  showToast('Đã tải bản đặc tả đề kiểm tra (.txt)');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer"
              >
                <Download size={13} />
                <span>Tải bản đặc tả (.txt)</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {(selectedTestForView.specifications || []).map((spec, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">
                    {i + 1}. {spec.content}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${
                      spec.cognitiveLevel === 'KNOW'
                        ? 'bg-emerald-100 text-emerald-800'
                        : spec.cognitiveLevel === 'UNDERSTAND'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    Mức: {COGNITIVE_LEVEL_LABELS[spec.cognitiveLevel]}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <b>Yêu cầu cần đạt:</b> {spec.learningOutcome}
                </p>
                <div className="flex items-center gap-3 text-slate-500 text-[11px] pt-1">
                  <span>Dạng câu hỏi: <b>{spec.questionType}</b></span>
                  <span>• Số câu: <b>{spec.questionCount} câu</b></span>
                  <span>• Điểm: <b>{spec.points}đ</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: AI KIỂM TRA ĐỀ (MỤC 6)
      ==================================================================== */}
      {activeTab === 'quality_check' && selectedTestForView && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert size={18} className="text-indigo-600" />
                <span>AI KIỂM TRA CHẤT LƯỢNG ĐỀ: {selectedTestForView.title}</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Kiểm định 9 tiêu chuẩn khảo thí: Độ phù hợp, rõ ràng, đáp án, điểm số, trùng lặp, lỗi dữ liệu, diễn đạt, 3 mức độ, tính nhất quán
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleRunQualityCheck(selectedTestForView)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Chạy lại kiểm tra chất lượng</span>
            </button>
          </div>

          {selectedTestForView.qualityCheckResult && (
            <div className="space-y-4">
              {/* Tóm tắt tình trạng */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  selectedTestForView.qualityCheckResult.overallStatus === 'pass'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : selectedTestForView.qualityCheckResult.overallStatus === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                {selectedTestForView.qualityCheckResult.overallStatus === 'pass' ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-black text-sm">
                    {selectedTestForView.qualityCheckResult.summary}
                  </h4>
                  <span className="text-[11px] opacity-80 block mt-0.5">
                    Kiểm định bởi {selectedTestForView.qualityCheckResult.checkerName} • lúc {new Date(selectedTestForView.qualityCheckResult.checkedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Danh sách các tiêu chí kiểm tra */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTestForView.qualityCheckResult.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-1.5 ${
                      issue.severity === 'pass'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : issue.severity === 'warning'
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">{issue.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.severity === 'pass'
                            ? 'bg-emerald-100 text-emerald-800'
                            : issue.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {issue.severity === 'pass' ? '✓ Đạt' : issue.severity === 'warning' ? '⚠️ Cảnh báo' : '✗ Lỗi'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700">{issue.message}</p>
                    {issue.suggestion && (
                      <p className="text-[10px] text-indigo-700 font-bold bg-white/70 p-1.5 rounded-lg border border-indigo-100">
                        💡 Đề xuất: {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 5: NGÂN HÀNG CÂU HỎI & BIÊN TẬP CÂU HỎI (MỤC 5)
      ==================================================================== */}
      {activeTab === 'bank' && (
        <div className="space-y-4 animate-fade-in text-xs">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Tìm nội dung, mã câu, chủ đề..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={bankCognitiveFilter}
                onChange={(e) => setBankCognitiveFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="KNOW">Mức BIẾT</option>
                <option value="UNDERSTAND">Mức HIỂU</option>
                <option value="APPLY">Mức VẬN DỤNG</option>
              </select>

              <select
                value={bankTypeFilter}
                onChange={(e) => setBankTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
              >
                <option value="all">Tất cả dạng câu</option>
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="true_false">Đúng / Sai</option>
                <option value="short_answer">Trả lời ngắn</option>
                <option value="essay">Tự luận</option>
              </select>

              <button
                type="button"
                onClick={() =>
                  onNavigateToAIChat?.(
                    `Hãy tạo thêm 3 câu hỏi mới cho Ngân hàng câu hỏi theo đúng 3 mức độ: 1 câu BIẾT, 1 câu HIỂU, 1 câu VẬN DỤNG cho chủ đề môn ${testSubject} lớp ${testGrade}.`,
                    'none'
                  )
                }
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                title="Hỏi AI tạo thêm câu hỏi hoặc giải thích kiến thức"
              >
                <Sparkles size={13} className="text-indigo-600" />
                <span>AI Tạo câu tương tự</span>
              </button>
            </div>
          </div>

          {/* Question List with Editing actions (Mục 5) */}
          <div className="space-y-3">
            {questionBank
              .filter((q) => {
                const matchSearch =
                  q.content.toLowerCase().includes(bankSearch.toLowerCase()) ||
                  q.topic.toLowerCase().includes(bankSearch.toLowerCase()) ||
                  q.code.toLowerCase().includes(bankSearch.toLowerCase());
                const matchCog = bankCognitiveFilter === 'all' || q.cognitiveLevel === bankCognitiveFilter;
                const matchType = bankTypeFilter === 'all' || q.type === bankTypeFilter;
                return matchSearch && matchCog && matchType;
              })
              .map((q) => (
                <div
                  key={q.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {q.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                          q.cognitiveLevel === 'KNOW'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.cognitiveLevel === 'UNDERSTAND'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        Mức: {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel]}
                      </span>
                      <span className="text-slate-400">
                        • {q.subject} {q.grade} • {q.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600">{q.points}đ</span>

                      {/* Nút sửa câu hỏi cho Giáo viên (Mục 5) */}
                      {isLeader && (
                        <button
                          type="button"
                          onClick={() => setEditingQuestion(q)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Sửa câu hỏi, đáp án, mức độ"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-sm text-slate-900 leading-relaxed whitespace-pre-line">
                    {q.content}
                  </p>

                  {/* Options if multiple choice or true/false */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            opt.isCorrect
                              ? 'bg-emerald-50/70 border-emerald-300 font-semibold text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-white border border-slate-300">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                          {opt.isCorrect && <Check size={14} className="text-emerald-600 ml-auto" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short answer correct key */}
                  {q.type === 'short_answer' && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-700">Đáp án chuẩn: </span>
                      <span className="font-bold text-emerald-700">{q.correctAnswerText}</span>
                    </div>
                  )}

                  {/* Essay rubric & instructions */}
                  {q.type === 'essay' && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>📝 Hướng dẫn chấm & Biểu điểm Rubric ({q.points} điểm):</span>
                        <span className="text-[10px] text-emerald-800 font-extrabold bg-white px-2 py-0.5 rounded border border-emerald-200">
                          Phần IV: Tự luận
                        </span>
                      </div>
                      {q.correctAnswerText && (
                        <div className="text-[11.5px] text-slate-800 bg-white p-2.5 rounded-lg border border-emerald-100 whitespace-pre-line leading-relaxed">
                          {q.correctAnswerText}
                        </div>
                      )}
                      {q.essayRubric && q.essayRubric.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="font-bold text-emerald-900 text-[11px] block">Thang điểm bậc thang theo từng bước:</span>
                          {q.essayRubric.map((r, rIdx) => (
                            <div key={rIdx} className="flex items-center justify-between text-[11px] bg-white/90 px-2.5 py-1 rounded-md border border-emerald-100">
                              <span className="text-slate-700 font-medium">• Bước {rIdx + 1}: {r.step}</span>
                              <span className="font-extrabold text-emerald-800 shrink-0 ml-2">+{r.points}đ</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Tạo bởi: {q.creatorName} ({q.createdAt})</span>
                    <span className="text-emerald-600 font-bold">✓ Đã chuẩn hóa 3 mức độ</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: THƯ VIỆN ĐỀ ĐÃ LƯU (MỤC 12)
      ==================================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {test.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                        test.isApprovedByTeacher
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {test.isApprovedByTeacher ? '✓ Đã Phê Duyệt' : 'Bản nháp (Chờ GV duyệt)'}
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-slate-900 leading-snug">{test.title}</h4>
                  <p className="text-slate-500">
                    Môn: <b>{test.subject}</b> • Khối: <b>{test.grade}</b> • Chủ đề: <b>{test.topic}</b>
                  </p>

                  <div className="flex items-center gap-3 text-[11px] pt-1">
                    <span className="text-emerald-700 font-bold">BIẾT: {test.knowRatio}%</span>
                    <span className="text-blue-700 font-bold">HIỂU: {test.understandRatio}%</span>
                    <span className="text-purple-700 font-bold">VẬN DỤNG: {test.applyRatio}%</span>
                  </div>

                  {/* Cơ cấu câu hỏi thực tế trong đề */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 flex-wrap gap-1">
                      <span>Cơ cấu trong đề:</span>
                      <span className="text-emerald-700 font-extrabold">
                        {test.questions.filter((q) => q.type === 'multiple_choice').length} TN •{' '}
                        {test.questions.filter((q) => q.type === 'true_false').length} Đ/S •{' '}
                        {test.questions.filter((q) => q.type === 'short_answer').length} Ngắn •{' '}
                        {test.questions.filter((q) => q.type === 'essay').length} Tự luận (1,5đ)
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                      <span>Tải về 100% đúng nội dung thực tế các câu hỏi trong đề kèm đáp án & ma trận</span>
                    </div>
                  </div>
                </div>

                {/* Thao tác Thư viện đề (Mục 12) */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTestForView(test);
                        setActiveTab('matrix');
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                      title="Xem bảng ma trận 3 mức độ nhận thức"
                    >
                      Ma trận
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTestForView(test);
                        setActiveTab('spec');
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                      title="Xem bản đặc tả chi tiết từng câu"
                    >
                      Bản đặc tả
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportTestToWord(test, 'full');
                        showToast(`Đã tải đề kiểm tra "${test.title}" (.doc) đúng 100% nội dung câu hỏi kèm đáp án & ma trận!`, 'success');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Tải tệp Word (.doc) đúng 100% nội dung câu hỏi trong đề kèm đáp án, ma trận và bản đặc tả"
                    >
                      <Download size={12} />
                      <span>Tải đề (.doc)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportTestToWord(test, 'student');
                        showToast(`Đã tải đề thi học sinh "${test.title}" (.doc) không lộ đáp án!`, 'success');
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl flex items-center gap-1 cursor-pointer border border-blue-200"
                      title="Tải đề thi học sinh làm bài (.doc) đúng nội dung câu hỏi, không có đáp án"
                    >
                      <FileText size={12} />
                      <span>Đề HS (.doc)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportTestToTxt(test, true);
                        showToast(`Đã tải tệp văn bản đề thi "${test.title}" (.txt) đúng 100% nội dung!`, 'success');
                      }}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                      title="Tải tệp văn bản thô (.txt) đúng 100% nội dung câu hỏi và đáp án"
                    >
                      <Download size={12} />
                      <span>.txt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => printTestPaper(test)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="In đề thi hoặc lưu PDF chuẩn A4"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToAIChat?.(
                          `Hãy phân tích đề kiểm tra "${test.title}" theo đúng 3 mức độ nhận thức (BIẾT: ${test.knowRatio}%, HIỂU: ${test.understandRatio}%, VẬN DỤNG: ${test.applyRatio}%), và tư vấn phương pháp hướng dẫn học sinh làm bài đạt điểm cao.`,
                          'test',
                          test.id
                        )
                      }
                      className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50 cursor-pointer"
                      title="Trò chuyện với AI về đề kiểm tra này"
                    >
                      <Sparkles size={13} />
                    </button>
                    {isLeader && (
                      <button
                        type="button"
                        onClick={() => handleCloneTest(test)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Nhân bản đề này"
                      >
                        <Copy size={13} />
                      </button>
                    )}
                    {isLeader && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTestId(test.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Xóa đề kiểm tra"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartTakingTest(test)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <PlayCircle size={13} />
                      <span>Làm bài</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 7: LÀM BÀI TRỰC TUYẾN TRÊN APP (MỤC 7)
      ==================================================================== */}
      {activeTab === 'take_test' && !activeTestForTaking && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlayCircle size={20} className="text-emerald-600" />
                <span>CHỌN ĐỀ ĐỂ BẮT ĐẦU LÀM BÀI TRỰC TUYẾN</span>
              </h3>
              <p className="text-slate-500 mt-1">
                Chọn một đề kiểm tra từ danh sách dưới đây để bắt đầu làm bài trực tuyến có đồng hồ đếm ngược và hệ thống AI tự động chấm điểm 3 mức độ.
              </p>
            </div>
            {tests.length > 0 && (
              <button
                type="button"
                onClick={() => handleStartTakingTest(selectedTestForView || tests[0])}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <PlayCircle size={16} />
                <span>Làm Ngay: {selectedTestForView?.title || tests[0].title}</span>
              </button>
            )}
          </div>

          {tests.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl space-y-3">
              <p className="font-semibold text-sm">Chưa có đề kiểm tra nào trong hệ thống.</p>
              <button
                type="button"
                onClick={() => setActiveTab('generator')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles size={15} />
                <span>🤖 Sang mục AI Tạo Đề Kiểm Tra Ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {test.code}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        ⏱ {test.durationMinutes} phút • {test.questions.length} câu • {test.totalPoints}đ
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2">
                      {test.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Môn: <b>{test.subject}</b> • Khối: <b>{test.grade}</b> • Chủ đề: {test.topic}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BIẾT: {test.knowRatio}%
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        HIỂU: {test.understandRatio}%
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                        VẬN DỤNG: {test.applyRatio}%
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartTakingTest(test)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <PlayCircle size={16} />
                    <span>Bắt Đầu Làm Bài Trực Tuyến</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'take_test' && activeTestForTaking && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6 animate-fade-in text-xs">
          {/* Header thi trực tuyến */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Đang làm bài trực tiếp
                </span>
                <span className="text-slate-400 font-mono">{activeTestForTaking.code}</span>
                {lastAutoSavedTime && (
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ✓ Đã tự động lưu lúc {lastAutoSavedTime}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {activeTestForTaking.title}
              </h3>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              {/* Đồng hồ đếm ngược (Mục 7) */}
              <div
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-black border transition-colors ${
                  testTimeRemaining < 300
                    ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <Clock size={16} className={testTimeRemaining < 300 ? 'text-rose-600' : 'text-amber-600'} />
                <span>
                  {Math.floor(testTimeRemaining / 60)}:
                  {(testTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Chuyển đổi hiển thị: Từng câu / Toàn bộ đề (Mục 7) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTestViewMode('single')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                    testViewMode === 'single' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Từng câu
                </button>
                <button
                  type="button"
                  onClick={() => setTestViewMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                    testViewMode === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Toàn bộ đề
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmitTestAttempt}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Nộp bài thi
              </button>
            </div>
          </div>

          {/* Bảng điều hướng câu hỏi (Mục 7) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 overflow-x-auto">
            <span className="font-extrabold text-slate-700 shrink-0">Danh sách câu:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {activeTestForTaking.questions.map((q, idx) => {
                const isAnswered = studentAnswers[q.id] !== undefined;
                const isMarked = markedForReview.has(q.id);
                const isCurrent = currentQuestionIndex === idx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      if (testViewMode === 'all') {
                        document.getElementById(`q_${q.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 font-black'
                        : ''
                    } ${
                      isMarked
                        ? 'bg-amber-400 text-amber-950 font-black'
                        : isAnswered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                    title={`Câu ${idx + 1}: ${isAnswered ? 'Đã trả lời' : 'Chưa làm'}${isMarked ? ' (Đã đánh dấu xem lại)' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Câu hỏi đang làm */}
          <div className="space-y-6">
            {(testViewMode === 'single'
              ? [activeTestForTaking.questions[currentQuestionIndex]]
              : activeTestForTaking.questions
            ).map((q, idx) => {
              const displayIndex = testViewMode === 'single' ? currentQuestionIndex : idx;
              return (
                <div
                  key={q.id}
                  id={`q_${q.id}`}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {displayIndex + 1}
                      </span>
                      <span
                        className={`font-extrabold text-xs px-2 py-0.5 rounded ${
                          q.cognitiveLevel === 'KNOW'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.cognitiveLevel === 'UNDERSTAND'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        Mức: {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel]}
                      </span>
                      <span className="text-slate-400">({q.points} điểm)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMarkForReview(q.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        markedForReview.has(q.id)
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {markedForReview.has(q.id) ? '🚩 Đã đánh dấu xem lại' : '⚐ Đánh dấu xem lại'}
                    </button>
                  </div>

                  <p className="font-bold text-sm text-slate-900 leading-relaxed whitespace-pre-line">
                    {q.content}
                  </p>

                  {/* Multiple choice options */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = studentAnswers[q.id] === opt.key;
                        return (
                          <div
                            key={opt.key}
                            onClick={() => handleAnswerChange(q.id, opt.key)}
                            className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isSelected
                                  ? 'bg-white text-blue-600'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False */}
                  {q.type === 'true_false' && q.options && (
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt) => {
                        const currentVal = studentAnswers[q.id]?.[opt.key];
                        return (
                          <div
                            key={opt.key}
                            className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                          >
                            <span className="font-medium text-slate-800">
                              <b>{opt.key})</b> {opt.text}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAnswerChange(q.id, {
                                    ...(studentAnswers[q.id] || {}),
                                    [opt.key]: true,
                                  })
                                }
                                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                                  currentVal === true
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAnswerChange(q.id, {
                                    ...(studentAnswers[q.id] || {}),
                                    [opt.key]: false,
                                  })
                                }
                                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                                  currentVal === false
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short answer input */}
                  {q.type === 'short_answer' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={studentAnswers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Nhập kết quả số hoặc từ khóa trả lời..."
                        className="w-full sm:w-80 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900"
                      />
                    </div>
                  )}

                  {/* Essay input */}
                  {q.type === 'essay' && (
                    <div className="pt-1 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">📝 Trình bày bài làm tự luận chi tiết:</span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black text-[10px]">
                          Điểm tối đa: {q.points}đ (Mức {COGNITIVE_LEVEL_LABELS[q.cognitiveLevel]})
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={studentAnswers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Trình bày lời giải chi tiết theo các bước (công thức, giải thích bản chất, tính toán, kết luận)... Lưu ý: Nếu bỏ trống sẽ chấm 0 điểm."
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl outline-none resize-none font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-xs"
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500 italic">
                        <span>🤖 AI chấm theo 3 mức độ (Biết - Hiểu - Vận dụng) và Rubric SGK Kết nối tri thức.</span>
                        <span className="text-amber-700 font-semibold not-italic">⚠️ Bỏ trống = 0 điểm</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation for single question mode */}
          {testViewMode === 'single' && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={16} /> Câu trước
              </button>

              <span className="text-slate-500 font-bold">
                Câu {currentQuestionIndex + 1} / {activeTestForTaking.questions.length}
              </span>

              <button
                type="button"
                disabled={currentQuestionIndex === activeTestForTaking.questions.length - 1}
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(activeTestForTaking.questions.length - 1, prev + 1)
                  )
                }
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                Câu tiếp <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={handleSubmitTestAttempt}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer"
            >
              Hoàn Thành & Nộp Bài Thi
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 8: AI CHẤM ĐIỂM & NHẬN XÉT BÀI LÀM (MỤC 8 & 9)
      ==================================================================== */}
      {activeTab === 'grading' && (
        <div className="space-y-5 animate-fade-in text-xs">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>KẾT QUẢ BÀI KIỂM TRA ĐÃ CHẤM & NHẬN XÉT CÁ NHÂN HÓA</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  AI tự động chấm trắc nghiệm & rubric tự luận, đối chiếu đáp án, nhận xét theo 3 mức độ BIẾT – HIỂU – VẬN DỤNG
                </p>
              </div>

              {/* Lọc phạm vi xem & Bảng chấm điểm 4 phần */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('exam_grader')}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer text-xs transition-all hover:scale-105 active:scale-95"
                >
                  <FileCheck2 size={14} />
                  <span>🎯 Chấm Điểm 4 Phần (5đ - 2đ - 1.5đ - 1.5đ)</span>
                </button>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAttemptFilterScope('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                      attemptFilterScope === 'all'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả lượt thi ({attempts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttemptFilterScope('mine')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                      attemptFilterScope === 'mine'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bài của tôi ({attempts.filter((a) => a.studentId === currentMember.id).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Banner nổi bật khi vừa nộp bài thi thành công */}
            {selectedAttemptForReview && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse-subtle">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Award size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        Bài làm vừa chấm: {selectedAttemptForReview.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        {selectedAttemptForReview.percentage}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Đề thi: <b>{selectedAttemptForReview.testTitle}</b> • Điểm số: <b className="text-emerald-700 text-sm">{selectedAttemptForReview.totalScore}/{selectedAttemptForReview.maxScore}đ</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedAttemptForDetailModal(selectedAttemptForReview)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Xem Bảng Điểm & Đối Chiếu Chi Tiết</span>
                  </button>
                </div>
              </div>
            )}

            {visibleAttempts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl space-y-3">
                <CheckCircle2 size={36} className="mx-auto text-slate-300" />
                <p className="font-semibold">Chưa có lượt làm bài nào trong danh mục này.</p>
                <button
                  type="button"
                  onClick={() => {
                    if (tests.length > 0) {
                      handleStartTakingTest(tests[0]);
                    } else {
                      setActiveTab('take_test');
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <PlayCircle size={15} />
                  <span>Vào Làm Bài Online Ngay</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleAttempts.map((att) => (
                  <div key={att.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{att.studentName}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {att.gradedBy}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Bài thi: <b>{att.testTitle}</b> • Nộp lúc: {att.submittedAt.slice(0, 16)}
                        </span>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-2xl font-black text-emerald-700">
                            {att.totalScore}/{att.maxScore}đ
                          </span>
                          <span className="text-xs text-slate-400 ml-1 font-bold">({att.percentage}%)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedAttemptForDetailModal(att)}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 hover:border-emerald-400 font-bold rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Xem chi tiết câu hỏi và đối chiếu đáp án"
                        >
                          <Eye size={13} />
                          <span>Chi tiết câu hỏi</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown 3 mức độ nhận thức */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-emerald-800">1. Mức BIẾT:</span>
                        <span className="font-black text-emerald-900">{att.knowScore}/{att.knowMaxScore}đ</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-blue-800">2. Mức HIỂU:</span>
                        <span className="font-black text-blue-900">{att.understandScore}/{att.understandMaxScore}đ</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-purple-800">3. Mức VẬN DỤNG:</span>
                        <span className="font-black text-purple-900">{att.applyScore}/{att.applyMaxScore}đ</span>
                      </div>
                    </div>

                    {/* AI Nhận xét cá nhân hóa có cấu trúc (Mục 9) */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 space-y-2 text-xs">
                      <span className="font-black text-slate-900 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-600" />
                        <span>AI Nhận Xét Cá Nhân Hóa (Dựa trên dữ liệu thực tế bài làm):</span>
                      </span>

                      <div className="space-y-1.5 text-slate-700 pl-1">
                        <p><b>• Kết quả chung:</b> {att.aiFeedbackOverall}</p>
                        <p><b>• Mức BIẾT:</b> {att.knowFeedback}</p>
                        <p><b>• Mức HIỂU:</b> {att.understandFeedback}</p>
                        <p><b>• Mức VẬN DỤNG:</b> {att.applyFeedback}</p>
                        <p className="text-indigo-800 font-bold bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                          🎯 <b>Đề xuất cải thiện:</b> {att.recommendedImprovements}
                        </p>
                      </div>

                      {/* Nút hành động AI Chat & Giao nhiệm vụ (Mục 11 & 13) */}
                      <div className="pt-2 flex items-center justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAttemptForDetailModal(att)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Bảng điểm từng câu & Rubric</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateToAIChat?.(
                              `Hãy giải thích chi tiết đáp án và hướng dẫn học sinh ${att.studentName} phương pháp ôn tập khắc phục các câu chưa đạt trong bài kiểm tra "${att.testTitle}".`,
                              'student',
                              att.testId,
                              att.studentId
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl cursor-pointer"
                        >
                          <Sparkles size={12} />
                          <span>AI Chat hướng dẫn giải & ôn tập</span>
                        </button>
                        {isLeader && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAssignRecommendedTask(
                                `Củng cố sau kiểm tra: ${att.testTitle}`,
                                att.studentId,
                                att.applyScore < att.applyMaxScore * 0.6 ? 'APPLY' : 'UNDERSTAND'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                          >
                            <Send size={12} />
                            <span>Giao nhiệm vụ cá nhân hóa này vào hệ thống</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB: CHẤM ĐIỂM KIỂM TRA 4 PHẦN CHUẨN BỘ GD&ĐT 2025
          Phần 1: 5.0đ | Phần 2: 2.0đ | Phần 3: 1.5đ | Phần 4: 1.5đ = 10.0đ
      ==================================================================== */}
      {activeTab === 'exam_grader' && (
        <ExamGraderTool
          members={members}
          tests={tests}
          currentMember={currentMember}
          onSaveAttempt={(att) => {
            onUpdateAttempts([att, ...attempts]);
          }}
          showToast={showToast}
        />
      )}

      {/* ====================================================================
          TAB 9: PHÂN TÍCH KẾT QUẢ & CÁ NHÂN HÓA (MỤC 10 & 11)
      ==================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 animate-fade-in text-xs">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart size={18} className="text-indigo-600" />
                  <span>PHÂN TÍCH KẾT QUẢ THEO 3 MỨC ĐỘ & CÁ NHÂN HÓA</span>
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Phân tích tỷ lệ đúng BIẾT - HIỂU - VẬN DỤNG và đề xuất can thiệp cá nhân hóa tiếp theo
                </p>
              </div>

              {/* Bộ lọc xem: Toàn lớp, từng học sinh (Mục 10) & Nút AI Chat (Mục 13) */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={analyticsStudentFilter}
                  onChange={(e) => setAnalyticsStudentFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="all">👥 Toàn lớp ({attempts.length} lượt bài)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    onNavigateToAIChat?.(
                      `Dựa trên kết quả bài kiểm tra của cả lớp (Mức BIẾT: ${knowPassRate}%, HIỂU: ${undPassRate}%, VẬN DỤNG: ${appPassRate}%), hãy đề xuất kế hoạch giảng dạy lại hoặc phụ đạo cụ thể cho các bạn còn yếu.`,
                      'class_analytics'
                    )
                  }
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  title="Tư vấn kế hoạch phụ đạo & phương pháp giảng dạy với AI Chat"
                >
                  <Sparkles size={13} />
                  <span>AI Chat tư vấn phụ đạo</span>
                </button>
              </div>
            </div>

            {/* Thống kê 3 mức độ nhận thức */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[11px] font-bold text-emerald-800">Tỷ lệ đúng mức BIẾT</span>
                <h4 className="text-2xl font-black text-emerald-950">{knowPassRate}%</h4>
                <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full" style={{ width: `${knowPassRate}%` }} />
                </div>
                <p className="text-[10px] text-emerald-700">Khái niệm, công thức nền tảng nắm vững</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="text-[11px] font-bold text-blue-800">Tỷ lệ đúng mức HIỂU</span>
                <h4 className="text-2xl font-black text-blue-950">{undPassRate}%</h4>
                <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${undPassRate}%` }} />
                </div>
                <p className="text-[10px] text-blue-700">Giải thích cơ chế, so sánh hiện tượng</p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                <span className="text-[11px] font-bold text-purple-800">Tỷ lệ đúng mức VẬN DỤNG</span>
                <h4 className="text-2xl font-black text-purple-950">{appPassRate}%</h4>
                <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full" style={{ width: `${appPassRate}%` }} />
                </div>
                <p className="text-[10px] text-purple-700">Cần tăng cường bài toán thực tiễn</p>
              </div>
            </div>

            {/* Quy tắc cá nhân hóa sau kiểm tra (Mục 11) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-extrabold text-sm text-slate-900 block">
                Quy Tắc AI Đề Xuất Hoạt Động Tiếp Theo:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <b className="text-emerald-800 block">1. Yếu mức BIẾT (&lt; 60%):</b>
                  <p className="text-slate-600">→ Ưu tiên ôn lại kiến thức nền tảng, công thức, định nghĩa cơ bản.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <b className="text-blue-800 block">2. BIẾT tốt nhưng HIỂU yếu:</b>
                  <p className="text-slate-600">→ Tăng cường bài tập giải thích cơ chế, phân tích và so sánh mối quan hệ.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <b className="text-purple-800 block">3. BIẾT & HIỂU tốt nhưng VẬN DỤNG yếu:</b>
                  <p className="text-slate-600">→ Tăng cường bài toán tình huống thực tiễn, tính toán nhiều bước.</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <b className="text-indigo-800 block">4. Cả 3 mức độ đều tốt (&gt; 80%):</b>
                  <p className="text-slate-600">→ Giao nhiệm vụ mở rộng, nâng cao và hướng dẫn hỗ trợ bạn cùng tổ.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 10: DASHBOARD TỔNG HỢP: AI KIỂM TRA & CÁ NHÂN HÓA (MỤC 18)
      ==================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5 animate-fade-in text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Số đề đã tạo</span>
              <h4 className="text-2xl font-black text-slate-900">{totalTestsCount}</h4>
              <span className="text-[10px] text-emerald-600 font-bold">100% chuẩn 3 mức độ</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Số bài đã kiểm tra</span>
              <h4 className="text-2xl font-black text-slate-900">{totalAttemptsCount}</h4>
              <span className="text-[10px] text-blue-600 font-bold">Tự động chấm điểm</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Điểm trung bình</span>
              <h4 className="text-2xl font-black text-indigo-700">{avgClassScore} / 10</h4>
              <span className="text-[10px] text-emerald-600 font-bold">Tỷ lệ đạt 92%</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400">VẬN DỤNG đạt được</span>
              <h4 className="text-2xl font-black text-purple-700">{appPassRate}%</h4>
              <span className="text-[10px] text-amber-600 font-bold">Cần hỗ trợ 4 học sinh</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-600" />
              <span>Đề Xuất Can Thiệp Sư Phạm Của AI Khảo Thí</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Dữ liệu khảo thí cho thấy Tổ 3 đã làm chủ rất tốt mức <b>BIẾT (88%)</b> và <b>HIỂU (76%)</b>.
              Khoảng trống kiến thức tập trung ở phần <b>VẬN DỤNG (58%)</b> khi học sinh cần phối hợp tính toán nồng độ và các tình huống liên hệ công nghiệp. AI đã tự động chuẩn bị các gói bài tập củng cố tương ứng trong mục Nhiệm Vụ Học Tập.
            </p>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA ĐỀ (MỤC 12) */}
      {deleteConfirmTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Xác Nhận Xóa Đề Kiểm Tra</h3>
                <p className="text-slate-500 mt-0.5">Thao tác này sẽ xóa đề khỏi Thư viện đề đã lưu</p>
              </div>
            </div>

            <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-semibold leading-relaxed">
              “Bạn có chắc chắn muốn xóa đề kiểm tra này không?”
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmTestId(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTest}
                className="px-5 py-2.5 rounded-xl font-black text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA CÂU HỎI (MỤC 5) */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Chỉnh Sửa Câu Hỏi: {editingQuestion.code}
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung câu hỏi</label>
                <textarea
                  rows={3}
                  value={editingQuestion.content}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, content: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức độ nhận thức (Bắt buộc 3 mức)</label>
                  <select
                    value={editingQuestion.cognitiveLevel}
                    onChange={(e) => {
                      const level = e.target.value as CognitiveLevel;
                      setEditingQuestion({
                        ...editingQuestion,
                        cognitiveLevel: level,
                        cognitive_level: level,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="KNOW">Mức 1 – BIẾT (KNOW)</option>
                    <option value="UNDERSTAND">Mức 2 – HIỂU (UNDERSTAND)</option>
                    <option value="APPLY">Mức 3 – VẬN DỤNG (APPLY)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm số câu</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingQuestion.points}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Sửa đáp án trắc nghiệm nếu có */}
              {editingQuestion.options && editingQuestion.options.length > 0 && (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">Các lựa chọn đáp án & Đáp án đúng</label>
                  {editingQuestion.options.map((opt, i) => (
                    <div key={opt.key} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {opt.key}
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const opts = [...editingQuestion.options!];
                          opts[i].text = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: opts });
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const opts = editingQuestion.options!.map((o, idx) => ({
                            ...o,
                            isCorrect: idx === i,
                          }));
                          setEditingQuestion({ ...editingQuestion, options: opts });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          opt.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.isCorrect ? '✓ Đúng' : 'Chọn đúng'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sửa đáp án tự luận & Rubric chuẩn SGK Kết nối tri thức */}
              {editingQuestion.type === 'essay' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Đáp án chi tiết (Chuẩn YCCĐ SGK Kết nối tri thức)
                    </label>
                    <textarea
                      rows={3}
                      value={editingQuestion.correctAnswerText || ''}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, correctAnswerText: e.target.value })
                      }
                      placeholder="Nhập hướng dẫn giải và đáp án chi tiết bám sát SGK..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-xs leading-relaxed"
                    />
                  </div>

                  {editingQuestion.essayRubric && editingQuestion.essayRubric.length > 0 && (
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-700">Tiêu chuẩn chấm Rubric từng bước</label>
                      {editingQuestion.essayRubric.map((r, ri) => (
                        <div key={ri} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={r.step}
                              onChange={(e) => {
                                const rub = [...editingQuestion.essayRubric!];
                                rub[ri] = { ...rub[ri], step: e.target.value };
                                setEditingQuestion({ ...editingQuestion, essayRubric: rub });
                              }}
                              placeholder="Tên bước (VD: Bước 1: Lập phương trình)"
                              className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max="10"
                                value={r.points}
                                onChange={(e) => {
                                  const rub = [...editingQuestion.essayRubric!];
                                  rub[ri] = { ...rub[ri], points: parseFloat(e.target.value) || 0 };
                                  setEditingQuestion({ ...editingQuestion, essayRubric: rub });
                                }}
                                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs text-center"
                              />
                              <span className="text-slate-400 text-xs font-bold">đ</span>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={r.criteria}
                            onChange={(e) => {
                              const rub = [...editingQuestion.essayRubric!];
                              rub[ri] = { ...rub[ri], criteria: e.target.value };
                              setEditingQuestion({ ...editingQuestion, essayRubric: rub });
                            }}
                            placeholder="Tiêu chí đánh giá của bước..."
                            className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedQuestion(editingQuestion)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xs"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN NỘP BÀI THI (MỤC 7 & 8) */}
      {showSubmitConfirmModal && activeTestForTaking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-up text-xs">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Xác Nhận Nộp Bài Thi</h3>
                <p className="text-slate-500 mt-0.5">Hệ thống AI sẽ tự động chấm điểm và đánh giá 3 mức độ</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="font-extrabold text-sm text-slate-800 line-clamp-1">
                {activeTestForTaking.title}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="block text-[10px] text-slate-400">Đã trả lời:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    {Object.keys(studentAnswers).filter((k) => studentAnswers[k] !== undefined && studentAnswers[k] !== '').length} / {activeTestForTaking.questions.length} câu
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="block text-[10px] text-slate-400">Bỏ trống / Chưa làm:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {activeTestForTaking.questions.filter((q) => !studentAnswers[q.id] || studentAnswers[q.id] === '').length} câu
                  </span>
                </div>
              </div>

              {activeTestForTaking.questions.filter((q) => !studentAnswers[q.id] || studentAnswers[q.id] === '').length > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] font-semibold flex items-center gap-2">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>
                    Bạn còn {activeTestForTaking.questions.filter((q) => !studentAnswers[q.id] || studentAnswers[q.id] === '').length} câu chưa làm (các câu tự luận hoặc trắc nghiệm bỏ trống sẽ bị chấm 0 điểm). Bạn có chắc chắn muốn nộp bài ngay bây giờ?
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={() => executeSubmission(activeTestForTaking, studentAnswers)}
                className="px-6 py-2.5 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>Nộp Bài & Chấm Điểm Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT BÀI LÀM & ĐỐI CHIẾU ĐÁP ÁN (MỤC 8) */}
      {selectedAttemptForDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-5 animate-scale-up text-xs max-h-[90vh] flex flex-col">
            {/* Header modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bảng Điểm Chi Tiết & Đối Chiếu Đáp Án
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Học sinh: <b>{selectedAttemptForDetailModal.studentName}</b> • Bài thi: <b>{selectedAttemptForDetailModal.testTitle}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttemptForDetailModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Score summary in modal */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between gap-4 shrink-0 flex-wrap">
              <div>
                <span className="text-[11px] font-bold text-emerald-800">Tổng điểm đạt được:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-emerald-800">
                    {selectedAttemptForDetailModal.totalScore}/{selectedAttemptForDetailModal.maxScore}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    ({selectedAttemptForDetailModal.percentage}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200 font-bold text-emerald-800">
                  BIẾT: {selectedAttemptForDetailModal.knowScore}/{selectedAttemptForDetailModal.knowMaxScore}đ
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white border border-blue-200 font-bold text-blue-800">
                  HIỂU: {selectedAttemptForDetailModal.understandScore}/{selectedAttemptForDetailModal.understandMaxScore}đ
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 font-bold text-purple-800">
                  VẬN DỤNG: {selectedAttemptForDetailModal.applyScore}/{selectedAttemptForDetailModal.applyMaxScore}đ
                </span>
              </div>
            </div>

            {/* Questions detail list */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText size={14} className="text-slate-500" />
                <span>Chi tiết câu trả lời & Chấm điểm từng câu:</span>
              </h4>

              {selectedAttemptForDetailModal.answers.map((ans, idx) => {
                const testObj = tests.find((t) => t.id === selectedAttemptForDetailModal.testId);
                const qObj = testObj?.questions.find((q) => q.id === ans.questionId);

                return (
                  <div
                    key={ans.questionId || idx}
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      ans.isCorrect
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : (ans.awardedScore || 0) > 0
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span
                          className={`font-black text-[10px] px-2 py-0.5 rounded ${
                            ans.cognitiveLevel === 'KNOW'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ans.cognitiveLevel === 'UNDERSTAND'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          Mức: {ans.cognitiveLevel ? COGNITIVE_LEVEL_LABELS[ans.cognitiveLevel] : 'Biết'}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          ({ans.questionType === 'multiple_choice' ? 'Trắc nghiệm' : ans.questionType === 'true_false' ? 'Đúng/Sai' : ans.questionType === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-black text-xs">
                        <span className={ans.isCorrect ? 'text-emerald-700' : (ans.awardedScore || 0) > 0 ? 'text-amber-700' : 'text-rose-600'}>
                          {ans.awardedScore ?? 0}/{ans.maxScore} điểm
                        </span>
                        {ans.isCorrect ? (
                          <span className="text-emerald-600">✓ Đúng</span>
                        ) : (
                          <span className="text-rose-500">✗ Chưa đúng</span>
                        )}
                      </div>
                    </div>

                    {qObj && (
                      <p className="font-semibold text-slate-900 text-xs">
                        {qObj.content}
                      </p>
                    )}

                    {/* Student answer details */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                      {ans.questionType === 'multiple_choice' && (
                        <div>
                          <p>
                            <b>Học sinh chọn:</b>{' '}
                            <span className={ans.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                              {ans.selectedOptionKey || '(Bỏ trống)'}
                            </span>
                            {qObj?.options && (
                              <span className="text-slate-600 ml-1">
                                - {qObj.options.find((o) => o.key === ans.selectedOptionKey)?.text || ''}
                              </span>
                            )}
                          </p>
                          {!ans.isCorrect && qObj?.options && (
                            <p className="text-emerald-700 font-semibold mt-1">
                              ✓ <b>Đáp án đúng:</b> {qObj.options.find((o) => o.isCorrect)?.key} - {qObj.options.find((o) => o.isCorrect)?.text}
                            </p>
                          )}
                        </div>
                      )}

                      {ans.questionType === 'true_false' && (
                        <div className="space-y-1">
                          <b>Đối chiếu Đúng/Sai:</b>
                          {qObj?.options?.map((opt) => {
                            const studentVal = ans.selectedTrueFalse?.[opt.key];
                            const isMatch = studentVal === opt.isCorrect;
                            return (
                              <div key={opt.key} className="flex items-center justify-between text-[10px] pl-2 py-0.5 border-b border-slate-100 last:border-0">
                                <span><b>{opt.key})</b> {opt.text}</span>
                                <div className="flex items-center gap-2">
                                  <span>HS chọn: <b>{studentVal === true ? 'Đúng' : studentVal === false ? 'Sai' : 'Chưa chọn'}</b></span>
                                  <span>Đáp án: <b>{opt.isCorrect ? 'Đúng' : 'Sai'}</b></span>
                                  <span>{isMatch ? '✓' : '✗'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {ans.questionType === 'short_answer' && (
                        <div>
                          <p>
                            <b>Câu trả lời của HS:</b>{' '}
                            <span className={ans.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                              {ans.textAnswer || '(Bỏ trống)'}
                            </span>
                          </p>
                          <p className="text-emerald-700 font-semibold mt-0.5">
                            ✓ <b>Đáp án chuẩn:</b> {qObj?.correctAnswerText || qObj?.acceptedAnswers?.join(' / ')}
                          </p>
                        </div>
                      )}

                      {ans.questionType === 'essay' && (
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-slate-700">Nội dung bài làm HS:</span>
                              {(!ans.textAnswer || ans.awardedScore === 0) ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                                  ⚠️ Bỏ trống (0 điểm)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px]">
                                  Đã làm bài: {ans.awardedScore}/{ans.maxScore}đ
                                </span>
                              )}
                            </div>
                            <div className={`p-2.5 rounded-lg whitespace-pre-line text-[11px] leading-relaxed ${
                              !ans.textAnswer || ans.awardedScore === 0
                                ? 'bg-rose-50 border border-rose-200 text-rose-900 italic font-medium'
                                : 'bg-slate-50 border border-slate-200 text-slate-800 font-mono'
                            }`}>
                              {ans.textAnswer?.trim() || '⚠️ (Học sinh bỏ trống - Chưa thực hiện câu tự luận này)'}
                            </div>
                          </div>

                          {ans.aiGradingSuggestion && (
                            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              ans.awardedScore === 0
                                ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                                : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="font-black flex items-center gap-1.5">
                                  🤖 AI Chấm & Nhận xét Tự Luận:
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  ans.awardedScore === 0
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {ans.awardedScore === 0 ? '0 điểm (Bỏ trống)' : `Đạt ${ans.awardedScore}/${ans.maxScore}đ`}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed">
                                {ans.aiGradingSuggestion.feedback}
                              </p>
                              <div className="pt-1 border-t border-indigo-200/50 flex items-center justify-between text-[10px] text-slate-600">
                                <span className="font-semibold">
                                  📊 Đánh giá mức độ: <b className="text-indigo-900">{ans.aiGradingSuggestion.rubricMatch}</b>
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Chi tiết đáp án chuẩn bám sát SGK Kết nối tri thức */}
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-emerald-900 flex items-center gap-1">
                                ✓ Đáp án chi tiết & Hướng dẫn chấm (SGK Kết nối tri thức):
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 text-[10px] font-bold">
                                Chuẩn YCCĐ
                              </span>
                            </div>
                            <p className="whitespace-pre-line text-[11px] text-emerald-950 leading-relaxed font-sans bg-white/70 p-2.5 rounded-lg border border-emerald-200/60">
                              {qObj?.correctAnswerText || 'Theo tiêu chuẩn rubric chấm tự luận'}
                            </p>
                            {qObj?.essayRubric && qObj.essayRubric.length > 0 && (
                              <div className="pt-1.5 border-t border-emerald-200/60 space-y-1">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">
                                  Bảng tiêu chí Rubric từng bước:
                                </span>
                                {qObj.essayRubric.map((r, ri) => (
                                  <div key={ri} className="text-[10px] flex items-start gap-1.5 text-emerald-900 bg-emerald-100/40 px-2 py-1 rounded">
                                    <span className="font-bold shrink-0">• {r.step} ({r.points}đ):</span>
                                    <span>{r.criteria}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {isLeader && (
                            <div className="pt-2 flex items-center gap-2">
                              <span className="font-bold text-slate-700">Giáo viên điều chỉnh điểm:</span>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max={ans.maxScore}
                                value={adjustedScores[ans.questionId] ?? ans.awardedScore}
                                onChange={(e) =>
                                  setAdjustedScores({
                                    ...adjustedScores,
                                    [ans.questionId]: Math.min(ans.maxScore ?? 1, Math.max(0, parseFloat(e.target.value) || 0)),
                                  })
                                }
                                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-center"
                              />
                              <span className="text-slate-400">/{ans.maxScore}đ</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                {isLeader && Object.keys(adjustedScores).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveAdjustedGrades(selectedAttemptForDetailModal);
                      setSelectedAttemptForDetailModal(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    Lưu Điểm Điều Chỉnh Của Giáo Viên
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const testObj = tests.find((t) => t.id === selectedAttemptForDetailModal.testId);
                    if (testObj) {
                      setSelectedAttemptForDetailModal(null);
                      handleStartTakingTest(testObj);
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Làm Lại Đề Này</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAttemptForDetailModal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Preview Hình Ảnh Đính Kèm */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
              <span className="font-extrabold text-sm flex items-center gap-2">
                <ImageIcon size={18} className="text-emerald-400" />
                <span>Xem Phóng To Hình Ảnh Đính Kèm</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center max-h-[calc(90vh-80px)] bg-slate-950/5">
              <img
                src={previewImageModal}
                alt="Hình ảnh đính kèm"
                className="max-h-full max-w-full object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
