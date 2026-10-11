import React, { useState, useMemo, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Save,
  Copy,
  RotateCcw,
  Sliders,
  Check,
  X,
  FileText,
  Clock,
  ChevronRight,
  HelpCircle,
  Scale,
  Settings2,
  Download,
  Printer,
  Plus,
  Minus,
} from 'lucide-react';
import {
  AssessmentTest,
  Member,
  AssessmentAttempt,
} from '../types';
import { formatScore } from '../utils/scoreUtils';
import { downloadExamPaperWord, downloadExamPaperTxt } from '../utils/fileDownloader';

interface Props {
  members: Member[];
  tests: AssessmentTest[];
  currentMember: Member;
  onSaveAttempt?: (attempt: AssessmentAttempt) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const ExamGraderTool: React.FC<Props> = ({
  members,
  tests,
  currentMember,
  onSaveAttempt,
  showToast,
}) => {
  // Thông tin bài thi & học sinh
  const [selectedStudentId, setSelectedStudentId] = useState<string>(members[0]?.id || '');
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || 'custom');
  const [examTitle, setExamTitle] = useState<string>('Kiểm tra đánh giá định kỳ - Cấu trúc 4 phần chuẩn Bộ GD&ĐT');
  const [examSubject, setExamSubject] = useState<string>('Hóa học');
  const [examGrade, setExamGrade] = useState<string>('11');
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // ==============================================================
  // CẤU HÌNH THANG ĐIỂM CHIA ĐỀU CHO MỖI CÂU TRONG MỖI PHẦN
  // Phần 1: 5.0 điểm chia đều cho N1 câu
  // Phần 2: 2.0 điểm chia đều cho N2 câu (mỗi câu 4 ý a,b,c,d)
  // Phần 3: 1.5 điểm chia đều cho N3 câu
  // Phần 4: 1.5 điểm chia đều cho N4 câu / ý tiêu chí
  // Tổng luôn luôn bằng đúng 10.0 điểm
  // ==============================================================
  const [p1TotalQuestions, setP1TotalQuestions] = useState<number>(15);
  const [p2TotalQuestions, setP2TotalQuestions] = useState<number>(2);
  const [p3TotalQuestions, setP3TotalQuestions] = useState<number>(3);
  const [p4TotalSteps, setP4TotalSteps] = useState<number>(3);

  // ĐIỂM MỖI CÂU ĐƯỢC CHIA ĐỀU CHÍNH XÁC:
  const p1PointPerQ = useMemo(() => {
    return p1TotalQuestions > 0 ? 5.0 / p1TotalQuestions : 0.333;
  }, [p1TotalQuestions]);

  const p2MaxPerQ = useMemo(() => {
    return p2TotalQuestions > 0 ? 2.0 / p2TotalQuestions : 1.0;
  }, [p2TotalQuestions]);

  const p3PointPerQ = useMemo(() => {
    return p3TotalQuestions > 0 ? 1.5 / p3TotalQuestions : 0.5;
  }, [p3TotalQuestions]);

  const p4PointPerStep = useMemo(() => {
    return p4TotalSteps > 0 ? 1.5 / p4TotalSteps : 0.5;
  }, [p4TotalSteps]);

  // ==========================================
  // PHẦN 1: Trắc nghiệm nhiều lựa chọn (5.0 điểm chia đều)
  // ==========================================
  const [p1Mode, setP1Mode] = useState<'quick' | 'detail'>('quick');
  const [p1CorrectCount, setP1CorrectCount] = useState<number>(14);
  // Bảng chi tiết từng câu
  const [p1DetailedAnswers, setP1DetailedAnswers] = useState<Record<number, { key: string; correctKey: string }>>(() => {
    const init: Record<number, { key: string; correctKey: string }> = {};
    const defaultKeys = ['A', 'B', 'C', 'D'];
    for (let i = 1; i <= 40; i++) {
      const correct = defaultKeys[(i - 1) % 4];
      init[i] = { key: correct, correctKey: correct };
    }
    return init;
  });

  // Tự động giới hạn số câu đúng không vượt quá tổng số câu
  useEffect(() => {
    if (p1CorrectCount > p1TotalQuestions) {
      setP1CorrectCount(p1TotalQuestions);
    }
  }, [p1TotalQuestions]);

  // ==========================================
  // PHẦN 2: Trắc nghiệm Đúng / Sai (2.0 điểm chia đều)
  // ==========================================
  interface TfItemState {
    key: 'a' | 'b' | 'c' | 'd';
    text: string;
    standard: boolean;
    student: boolean;
  }

  interface TfQuestionState {
    id: number;
    title: string;
    items: TfItemState[];
  }

  const [p2Questions, setP2Questions] = useState<TfQuestionState[]>([
    {
      id: 1,
      title: 'Câu 1: Về cân bằng hóa học và nguyên lý chuyển dịch Le Chatelier',
      items: [
        { key: 'a', text: 'a) Phản ứng thuận nghịch luôn xảy ra theo hai chiều ngược nhau ở cùng điều kiện.', standard: true, student: true },
        { key: 'b', text: 'b) Ở trạng thái cân bằng, nồng độ của tất cả các chất phản ứng và sản phẩm bằng nhau.', standard: false, student: false },
        { key: 'c', text: 'c) Khi tăng áp suất, cân bằng chuyển dịch theo chiều làm giảm số mol khí.', standard: true, student: true },
        { key: 'd', text: 'd) Chất xúc tác làm thay đổi hằng số cân bằng Kc của phản ứng thuận nghịch.', standard: false, student: false },
      ],
    },
    {
      id: 2,
      title: 'Câu 2: Về nhiệt hóa học và biến thiên enthalpy chuẩn',
      items: [
        { key: 'a', text: 'a) Phản ứng tỏa nhiệt có biến thiên enthalpy chuẩn mang giá trị âm (ΔrHo < 0).', standard: true, student: true },
        { key: 'b', text: 'b) Năng lượng liên kết càng lớn thì liên kết hóa học càng kém bền.', standard: false, student: false },
        { key: 'c', text: 'c) Đa số các phản ứng đốt cháy nhiên liệu đều là phản ứng tỏa nhiệt mạnh.', standard: true, student: true },
        { key: 'd', text: 'd) Biến thiên enthalpy của phản ứng không phụ thuộc vào trạng thái chất.', standard: false, student: true },
      ],
    },
    {
      id: 3,
      title: 'Câu 3: Về thuyết acid - base của Bronsted - Lowry và thang pH',
      items: [
        { key: 'a', text: 'a) Acid là chất có khả năng cho proton (H+).', standard: true, student: true },
        { key: 'b', text: 'b) Base là chất có khả năng nhận proton (H+).', standard: true, student: true },
        { key: 'c', text: 'c) Dung dịch có pH = 7 ở 25°C luôn có môi trường trung tính.', standard: true, student: true },
        { key: 'd', text: 'd) Nước cất không có khả năng tự ion hóa trong bất kỳ điều kiện nào.', standard: false, student: false },
      ],
    },
    {
      id: 4,
      title: 'Câu 4: Về các hợp chất hữu cơ và hóa học hợp chất tự nhiên',
      items: [
        { key: 'a', text: 'a) Hydrocarbon chỉ gồm hai nguyên tố carbon và hydrogen trong phân tử.', standard: true, student: true },
        { key: 'b', text: 'b) Mọi alcohol đều có khả năng hòa tan kết tủa Cu(OH)2 ở nhiệt độ thường.', standard: false, student: false },
        { key: 'c', text: 'c) Glucose và fructose là hai chất đồng phân lập thể của nhau.', standard: true, student: true },
        { key: 'd', text: 'd) Tinh bột và cellulose có cùng công thức phân tử và cùng độ polymer hóa.', standard: false, student: false },
      ],
    },
  ]);

  // ==========================================
  // PHẦN 3: Trắc nghiệm trả lời ngắn (1.5 điểm chia đều)
  // ==========================================
  const [p3Mode, setP3Mode] = useState<'quick' | 'detail'>('quick');
  const [p3CorrectCount, setP3CorrectCount] = useState<number>(5);
  const [p3Items, setP3Items] = useState([
    { id: 1, question: 'Câu 1: Tính hằng số cân bằng Kc của phản ứng...', standard: '4.5', student: '4.5', isCorrect: true },
    { id: 2, question: 'Câu 2: Tính biến thiên enthalpy chuẩn (kJ)...', standard: '-92.4', student: '-92.4', isCorrect: true },
    { id: 3, question: 'Câu 3: Xác định số mol khí NH3 thu được...', standard: '0.8', student: '0.8', isCorrect: true },
    { id: 4, question: 'Câu 4: Tính hiệu suất phản ứng tổng hợp (%)...', standard: '75', student: '75', isCorrect: true },
    { id: 5, question: 'Câu 5: Tính giá trị pH của dung dịch thu được...', standard: '3.2', student: '3.2', isCorrect: true },
    { id: 6, question: 'Câu 6: Nồng độ mol của ion H+ sau phản ứng (M)...', standard: '0.05', student: '0.08', isCorrect: false },
    { id: 7, question: 'Câu 7: Khối lượng muối khan kết tinh (gam)...', standard: '14.2', student: '14.2', isCorrect: true },
    { id: 8, question: 'Câu 8: Thể tích khí thoát ra ở đktc (lít)...', standard: '2.479', student: '2.479', isCorrect: true },
  ]);

  useEffect(() => {
    if (p3CorrectCount > p3TotalQuestions) {
      setP3CorrectCount(p3TotalQuestions);
    }
  }, [p3TotalQuestions]);

  // ==========================================
  // PHẦN 4: Tự luận (1.5 điểm chia đều cho các tiêu chí/ý)
  // ==========================================
  // Mảng điểm cho từng bước: mỗi bước tối đa p4PointPerStep
  const [p4StepScores, setP4StepScores] = useState<number[]>([0.5, 0.5, 0.5]);

  useEffect(() => {
    setP4StepScores((prev) => {
      const next = [];
      for (let i = 0; i < p4TotalSteps; i++) {
        next.push(prev[i] !== undefined ? Math.min(prev[i], p4PointPerStep) : p4PointPerStep);
      }
      return next;
    });
  }, [p4TotalSteps, p4PointPerStep]);

  const [p4StudentAnswerText, setP4StudentAnswerText] = useState<string>(
    'Học sinh đã nêu chính xác định nghĩa hằng số cân bằng Kc và nguyên lý Le Chatelier. Trình bày được đồ thị phụ thuộc nhiệt độ và viết đúng biểu thức tính toán. Liên hệ giải thích vì sao cần tối ưu nhiệt độ và áp suất trong tổng hợp NH3 công nghiệp.'
  );
  const [teacherFeedback, setTeacherFeedback] = useState<string>(
    'Bài làm rất tốt, lập luận chặt chẽ, trình bày sạch sẽ. Cần lưu ý ghi rõ đơn vị ở câu trắc nghiệm trả lời ngắn số 6.'
  );

  // Lịch sử bài đã chấm trong phiên
  const [gradedHistory, setGradedHistory] = useState<any[]>([]);

  // TÍNH ĐIỂM TỪNG PHẦN
  // 1. Điểm Phần 1 (Chia đều: 5.0 / N1 mỗi câu)
  const p1Score = useMemo(() => {
    if (p1Mode === 'quick') {
      const score = Math.min(5.0, Math.max(0, p1CorrectCount * p1PointPerQ));
      return Math.round(score * 1000) / 1000;
    } else {
      let correct = 0;
      for (let i = 1; i <= p1TotalQuestions; i++) {
        const ans = p1DetailedAnswers[i];
        if (ans && ans.key === ans.correctKey) correct++;
      }
      const score = Math.min(5.0, Math.max(0, correct * p1PointPerQ));
      return Math.round(score * 1000) / 1000;
    }
  }, [p1Mode, p1TotalQuestions, p1CorrectCount, p1PointPerQ, p1DetailedAnswers]);

  // 2. Điểm Phần 2 (Chia đều: 2.0 / N2 mỗi câu)
  // Quy chế Bộ GD&ĐT: 1 ý = 10%, 2 ý = 25%, 3 ý = 50%, 4 ý = 100% của điểm tối đa câu đó
  const p2Stats = useMemo(() => {
    const activeQuestions = p2Questions.slice(0, p2TotalQuestions);
    let totalP2 = 0;
    const questionsBreakdown: { id: number; correctCount: number; score: number }[] = [];

    activeQuestions.forEach((q) => {
      let correctCount = 0;
      q.items.forEach((item) => {
        if (item.student === item.standard) correctCount++;
      });

      let fraction = 0;
      if (correctCount === 1) fraction = 0.1;
      else if (correctCount === 2) fraction = 0.25;
      else if (correctCount === 3) fraction = 0.5;
      else if (correctCount === 4) fraction = 1.0;

      const qScore = Math.round(p2MaxPerQ * fraction * 1000) / 1000;
      totalP2 += qScore;
      questionsBreakdown.push({ id: q.id, correctCount, score: qScore });
    });

    return {
      totalScore: Math.min(2.0, Math.round(totalP2 * 1000) / 1000),
      breakdown: questionsBreakdown,
    };
  }, [p2Questions, p2TotalQuestions, p2MaxPerQ]);

  // 3. Điểm Phần 3 (Chia đều: 1.5 / N3 mỗi câu)
  const p3Score = useMemo(() => {
    if (p3Mode === 'quick') {
      const score = Math.min(1.5, Math.max(0, p3CorrectCount * p3PointPerQ));
      return Math.round(score * 1000) / 1000;
    } else {
      const activeItems = p3Items.slice(0, p3TotalQuestions);
      const correct = activeItems.filter((i) => i.isCorrect).length;
      const score = Math.min(1.5, Math.max(0, correct * p3PointPerQ));
      return Math.round(score * 1000) / 1000;
    }
  }, [p3Mode, p3TotalQuestions, p3CorrectCount, p3PointPerQ, p3Items]);

  // 4. Điểm Phần 4 (Chia đều: 1.5 / N4 mỗi bước/ý)
  const p4Score = useMemo(() => {
    const sum = p4StepScores.slice(0, p4TotalSteps).reduce((acc, v) => acc + (v || 0), 0);
    return Math.min(1.5, Math.max(0, Math.round(sum * 1000) / 1000));
  }, [p4StepScores, p4TotalSteps]);

  // TỔNG ĐIỂM KIỂM TRA
  const totalScore = useMemo(() => {
    const sum = p1Score + p2Stats.totalScore + p3Score + p4Score;
    return Math.min(10.0, Math.max(0, Math.round(sum * 100) / 100));
  }, [p1Score, p2Stats.totalScore, p3Score, p4Score]);

  // Xếp loại học lực bài thi
  const performanceTier = useMemo(() => {
    if (totalScore >= 9.0) return { label: 'Xuất sắc', color: 'emerald', badge: '🏆 XUẤT SẮC' };
    if (totalScore >= 8.0) return { label: 'Giỏi', color: 'blue', badge: '🥇 GIỎI' };
    if (totalScore >= 6.5) return { label: 'Khá', color: 'indigo', badge: '🥈 KHÁ' };
    if (totalScore >= 5.0) return { label: 'Đạt (Trung bình)', color: 'amber', badge: '🥉 ĐẠT' };
    return { label: 'Chưa đạt', color: 'rose', badge: '⚠️ CHƯA ĐẠT' };
  }, [totalScore]);

  // Thí sinh
  const currentStudentObj = members.find((m) => m.id === selectedStudentId);
  const activeStudentName = customStudentName.trim() || currentStudentObj?.name || 'Thí sinh';

  // Toggle Đúng/Sai phần 2
  const handleToggleTfItem = (qIndex: number, itemKey: 'a' | 'b' | 'c' | 'd') => {
    setP2Questions((prev) => {
      const copy = [...prev];
      const targetQ = copy[qIndex];
      if (!targetQ) return prev;
      targetQ.items = targetQ.items.map((it) =>
        it.key === itemKey ? { ...it, student: !it.student } : it
      );
      return copy;
    });
  };

  // Toggle Standard Đúng/Sai phần 2
  const handleToggleTfStandard = (qIndex: number, itemKey: 'a' | 'b' | 'c' | 'd') => {
    setP2Questions((prev) => {
      const copy = [...prev];
      const targetQ = copy[qIndex];
      if (!targetQ) return prev;
      targetQ.items = targetQ.items.map((it) =>
        it.key === itemKey ? { ...it, standard: !it.standard } : it
      );
      return copy;
    });
  };

  // Áp dụng Preset số câu chia đều chuẩn
  const applyPreset = (mc: number, tf: number, sa: number, es: number, label: string) => {
    setP1TotalQuestions(mc);
    setP2TotalQuestions(tf);
    setP3TotalQuestions(sa);
    setP4TotalSteps(es);
    // Reset mức làm đúng mẫu tương ứng
    setP1CorrectCount(Math.min(mc, Math.round(mc * 0.9)));
    setP3CorrectCount(Math.min(sa, Math.round(sa * 0.85)));
    showToast(`Đã áp dụng thang điểm chia đều: ${label}`, 'success');
  };

  // Lưu bài đã chấm
  const handleSaveGrading = () => {
    const attemptRecord: any = {
      id: 'grade_' + Date.now(),
      studentId: selectedStudentId || 'student_custom',
      studentName: activeStudentName,
      testTitle: examTitle,
      subject: examSubject,
      date: examDate,
      p1Score,
      p1Config: { count: p1TotalQuestions, perQ: p1PointPerQ, correct: p1CorrectCount },
      p2Score: p2Stats.totalScore,
      p2Config: { count: p2TotalQuestions, maxPerQ: p2MaxPerQ, breakdown: p2Stats.breakdown },
      p3Score,
      p3Config: { count: p3TotalQuestions, perQ: p3PointPerQ, correct: p3CorrectCount },
      p4Score,
      p4Config: { steps: p4TotalSteps, perStep: p4PointPerStep },
      totalScore,
      maxScore: 10.0,
      percentage: Math.round((totalScore / 10.0) * 100),
      tier: performanceTier.label,
      feedback: teacherFeedback,
      timestamp: new Date().toLocaleString('vi-VN'),
    };

    setGradedHistory((prev) => [attemptRecord, ...prev]);

    if (onSaveAttempt && currentStudentObj) {
      const fullAttempt: AssessmentAttempt = {
        id: attemptRecord.id,
        testId: selectedTestId,
        testTitle: examTitle,
        studentId: currentStudentObj.id,
        studentName: currentStudentObj.name,
        startedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        durationSeconds: 50 * 60,
        totalScore,
        maxScore: 10.0,
        percentage: Math.round((totalScore / 10.0) * 100),
        correctCount: Math.round(p1CorrectCount + (p3CorrectCount)),
        incorrectCount: Math.max(0, p1TotalQuestions - p1CorrectCount),
        blankCount: 0,
        knowScore: Math.round((p1Score * 0.6) * 10) / 10,
        knowMaxScore: 3.0,
        understandScore: Math.round((p2Stats.totalScore + p1Score * 0.4) * 10) / 10,
        understandMaxScore: 4.0,
        applyScore: Math.round((p3Score + p4Score) * 10) / 10,
        applyMaxScore: 3.0,
        aiFeedbackOverall: `Đạt ${formatScore(totalScore)}/10.0 điểm (${performanceTier.label}). ${teacherFeedback}`,
        knowFeedback: p1Score >= 4.0 ? 'Nắm rất vững các khái niệm và công thức phần trắc nghiệm.' : 'Cần củng cố thêm các định nghĩa cơ bản.',
        understandFeedback: p2Stats.totalScore >= 1.5 ? 'Hiểu sâu bản chất đúng sai của các mệnh đề khoa học.' : 'Cần chú ý các bẫy câu hỏi đúng/sai.',
        applyFeedback: (p3Score + p4Score) >= 2.0 ? 'Vận dụng tốt giải bài toán ngắn và trình bày tự luận mạch lạc.' : 'Cần rèn luyện thêm kỹ năng tính toán và lập luận.',
        isGraded: true,
        gradedBy: currentMember.name,
        gradedAt: new Date().toISOString(),
        teacherNotes: teacherFeedback,
        answers: [],
      };
      onSaveAttempt(fullAttempt);
    }

    showToast(`Đã lưu kết quả bài thi của ${activeStudentName}: ${formatScore(totalScore)}/10.0 điểm!`, 'success');
  };

  // Copy phiếu điểm
  const handleCopyReport = () => {
    const text = `PHIẾU ĐIỂM KIỂM TRA - THANG ĐIỂM CHIA ĐỀU CHO MỖI CÂU TRONG MỖI PHẦN
Thí sinh: ${activeStudentName}
Môn học: ${examSubject} • Lớp: ${examGrade}
Bài kiểm tra: ${examTitle}
Ngày chấm: ${examDate}
------------------------------------------------
1. PHẦN I (Trắc nghiệm nhiều lựa chọn): ${p1Score.toFixed(2)} / 5.00 điểm
   • Quy tắc: 5.00 điểm chia đều cho ${p1TotalQuestions} câu (Mỗi câu = ${p1PointPerQ.toFixed(3)}đ)
   • Thí sinh đúng: ${p1CorrectCount} / ${p1TotalQuestions} câu

2. PHẦN II (Trắc nghiệm Đúng / Sai): ${p2Stats.totalScore.toFixed(2)} / 2.00 điểm
   • Quy tắc: 2.00 điểm chia đều cho ${p2TotalQuestions} câu (Mỗi câu tối đa = ${p2MaxPerQ.toFixed(2)}đ)
   ${p2Stats.breakdown.map((b, idx) => `   • Câu ${idx + 1}: Đúng ${b.correctCount}/4 ý ➔ ${b.score.toFixed(2)}đ`).join('\n')}

3. PHẦN III (Trả lời ngắn): ${p3Score.toFixed(2)} / 1.50 điểm
   • Quy tắc: 1.50 điểm chia đều cho ${p3TotalQuestions} câu (Mỗi câu = ${p3PointPerQ.toFixed(3)}đ)
   • Thí sinh đúng: ${p3CorrectCount} / ${p3TotalQuestions} câu

4. PHẦN IV (Tự luận): ${p4Score.toFixed(2)} / 1.50 điểm
   • Quy tắc: 1.50 điểm chia đều cho ${p4TotalSteps} tiêu chí/ý (Mỗi tiêu chí = ${p4PointPerStep.toFixed(2)}đ)
   • Điểm đạt: ${p4Score.toFixed(2)} / 1.50 điểm
------------------------------------------------
TỔNG ĐIỂM: ${totalScore.toFixed(2)} / 10.00 điểm
XẾP LOẠI: ${performanceTier.label} (${performanceTier.badge})
Nhận xét sư phạm: ${teacherFeedback}
Người chấm: ${currentMember.name}`;

    navigator.clipboard.writeText(text);
    showToast('Đã sao chép toàn bộ phiếu chấm điểm vào Clipboard!', 'success');
  };

  // Chấm thí sinh tiếp theo
  const handleNextStudent = () => {
    const currentIndex = members.findIndex((m) => m.id === selectedStudentId);
    if (currentIndex >= 0 && currentIndex < members.length - 1) {
      setSelectedStudentId(members[currentIndex + 1].id);
      setCustomStudentName('');
    } else {
      setSelectedStudentId(members[0]?.id || '');
    }
    showToast('Đã chuyển sang chấm thí sinh tiếp theo.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-800 text-white p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-xs font-black text-xs uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Scale size={14} /> Thang Điểm Chia Đều Cho Mỗi Câu Trong Mỗi Phần
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-xs shadow-xs">
                Tổng điểm: 10,0đ (5.0 + 2.0 + 1.5 + 1.5)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Bảng Chấm Điểm Kiểm Tra Tự Động Chia Đều
            </h2>
            <p className="text-emerald-100 text-xs max-w-3xl leading-relaxed">
              Nguyên tắc khảo thí chuẩn: Điểm của từng phần được <b>chia đều tuyệt đối cho số câu trong phần đó</b>. Khi giáo viên thay đổi số lượng câu hỏi, hệ thống tự động quy đổi điểm số trên mỗi câu ngay lập tức!
            </p>
          </div>

          {/* Quick Score Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[210px] flex flex-col justify-center">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              Tổng Điểm Bài Thi
            </span>
            <div className="flex items-baseline justify-center gap-1 my-1">
              <span className="text-4xl font-black text-amber-300 drop-shadow-sm">
                {totalScore.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-white/80">/ 10,0đ</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white/20 font-black text-xs text-white inline-block">
              {performanceTier.badge}
            </span>
          </div>
        </div>

        {/* Thông tin bài thi & Thí sinh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/15">
          {/* Chọn học sinh */}
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <label className="text-[10px] font-bold text-emerald-200 block uppercase mb-1">
              Thí sinh kiểm tra:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setCustomStudentName('');
              }}
              className="w-full bg-slate-900/60 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs outline-none border border-white/20 cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.name} ({m.groupName})
                </option>
              ))}
              <option value="custom" className="bg-slate-900 text-white">
                ➕ Nhập tên thí sinh khác...
              </option>
            </select>
            {selectedStudentId === 'custom' && (
              <input
                type="text"
                value={customStudentName}
                onChange={(e) => setCustomStudentName(e.target.value)}
                placeholder="Nhập họ và tên thí sinh..."
                className="w-full mt-1.5 px-2 py-1 bg-white text-slate-900 rounded font-semibold text-xs outline-none"
              />
            )}
          </div>

          {/* Tên bài thi */}
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <label className="text-[10px] font-bold text-emerald-200 block uppercase mb-1">
              Tên bài kiểm tra:
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full bg-slate-900/60 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs outline-none border border-white/20"
            />
          </div>

          {/* Môn & Lớp */}
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <label className="text-[10px] font-bold text-emerald-200 block uppercase mb-1">
              Môn học & Khối lớp:
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className="w-2/3 bg-slate-900/60 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs outline-none border border-white/20"
                placeholder="Môn..."
              />
              <input
                type="text"
                value={examGrade}
                onChange={(e) => setExamGrade(e.target.value)}
                className="w-1/3 bg-slate-900/60 text-white font-bold px-2 py-1.5 rounded-lg text-xs outline-none border border-white/20 text-center"
                placeholder="Khối"
              />
            </div>
          </div>

          {/* Ngày chấm */}
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
            <label className="text-[10px] font-bold text-emerald-200 block uppercase mb-1">
              Ngày kiểm tra / chấm:
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full bg-slate-900/60 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs outline-none border border-white/20 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ==============================================================
          BẢNG ĐIỀU KHIỂN: THANG ĐIỂM CHIA ĐỀU TỪNG PHẦN (EQUAL POINT CONTROLLER)
      ============================================================== */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Bảng Cấu Hình Số Câu & Thang Điểm Chia Đều Cho Từng Phần
              </h3>
              <p className="text-[11px] text-slate-500">
                Điều chỉnh số câu hỏi ở mỗi phần ➔ Điểm mỗi câu sẽ tự động chia đều tương ứng
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 mr-0.5">Mẫu đề:</span>
            <button
              type="button"
              onClick={() => applyPreset(15, 2, 3, 3, 'Đề 15 TN (0,333đ) + 2 Đ/S (2,0đ) + 3 Ngắn (0,5đ) + 3 ý TL (0,5đ) = 10,0đ')}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles size={14} className="text-amber-200" />
              <span>⭐ Đề 15 TN (0,333đ) • 2 Đ/S (2đ) • 3 Ngắn (0,5đ) • 3 ý TL (0,5đ) [ĐIỀU CHỈNH ĐƯỢC]</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset(20, 2, 6, 3, 'Chuẩn 2025 (20 TN + 2 Đ/S + 6 Ngắn + 3 ý TL)')}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              20 TN • 2 Đ/S • 6 Ngắn • 3 ý TL
            </button>
            <button
              type="button"
              onClick={() => applyPreset(10, 2, 3, 3, 'Đề 10 TN (0.5đ/câu)')}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              10 TN • 2 Đ/S • 3 Ngắn • 3 ý TL
            </button>
            <button
              type="button"
              onClick={() => applyPreset(25, 2, 5, 2, 'Đề 25 TN (0.2đ/câu)')}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              25 TN • 2 Đ/S • 5 Ngắn • 2 ý TL
            </button>
          </div>
        </div>

        {/* Thanh công cụ TẢI ĐỀ THI VỀ MÁY */}
        <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-300/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs">
              <Download size={16} />
            </div>
            <div>
              <span className="font-black text-slate-900 text-xs block">
                TẢI ĐỀ KIỂM TRA ĐÃ CẤU HÌNH VỀ MÁY ({p1TotalQuestions} TN + {p2TotalQuestions} Đ/S + {p3TotalQuestions} Ngắn + {p4TotalSteps} ý TL)
              </span>
              <span className="text-[11px] text-slate-500">
                Xuất file đề thi chuẩn Bộ GD&ĐT mở ngay trên Word, Docs, WPS Office để in hoặc phát cho học sinh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                downloadExamPaperWord({
                  title: examTitle,
                  subject: examSubject,
                  grade: examGrade,
                  p1Count: p1TotalQuestions,
                  p1PointPerQ,
                  p2Count: p2TotalQuestions,
                  p2MaxPerQ,
                  p3Count: p3TotalQuestions,
                  p3PointPerQ,
                  p4Steps: p4TotalSteps,
                  p4PointPerStep,
                  includeAnswers: true,
                });
                showToast('Đã tải đề kiểm tra kèm đáp án (.doc)!', 'success');
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-102"
              title="Tải đề thi đầy đủ câu hỏi và bảng đáp án"
            >
              <Download size={13} />
              <span>Tải Đề Word (.doc - Kèm Đáp Án)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadExamPaperWord({
                  title: examTitle,
                  subject: examSubject,
                  grade: examGrade,
                  p1Count: p1TotalQuestions,
                  p1PointPerQ,
                  p2Count: p2TotalQuestions,
                  p2MaxPerQ,
                  p3Count: p3TotalQuestions,
                  p3PointPerQ,
                  p4Steps: p4TotalSteps,
                  p4PointPerStep,
                  includeAnswers: false,
                });
                showToast('Đã tải đề thi cho học sinh làm bài (.doc)!', 'success');
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-102"
              title="Tải đề thi phát cho học sinh (không có đáp án)"
            >
              <FileText size={13} />
              <span>Tải Đề Học Sinh (.doc)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadExamPaperTxt({
                  title: examTitle,
                  subject: examSubject,
                  grade: examGrade,
                  p1Count: p1TotalQuestions,
                  p1PointPerQ,
                  p2Count: p2TotalQuestions,
                  p2MaxPerQ,
                  p3Count: p3TotalQuestions,
                  p3PointPerQ,
                  p4Steps: p4TotalSteps,
                  p4PointPerStep,
                  includeAnswers: true,
                });
                showToast('Đã tải tệp đề kiểm tra (.txt)!', 'success');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Tải tệp văn bản thô (.txt)"
            >
              <Download size={13} />
              <span>Tải .txt</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="In đề kiểm tra hoặc lưu file PDF"
            >
              <Printer size={13} />
              <span>In / PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Cards công thức chia đều (ĐIỀU CHỈNH ĐƯỢC) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* P1 */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-blue-900">PHẦN 1: TN 1 lựa chọn</span>
              <span className="font-black text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                5,0 điểm
              </span>
            </div>

            <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-blue-200">
              <button
                type="button"
                onClick={() => setP1TotalQuestions((prev) => Math.max(1, prev - 1))}
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
                  value={p1TotalQuestions}
                  onChange={(e) => setP1TotalQuestions(Math.max(1, Number(e.target.value)))}
                  className="w-14 text-center font-black text-blue-900 text-sm outline-none bg-transparent"
                />
                <span className="text-[11px] text-slate-500 font-semibold">câu</span>
              </div>
              <button
                type="button"
                onClick={() => setP1TotalQuestions((prev) => Math.min(50, prev + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-black cursor-pointer transition-colors"
                title="Tăng 1 câu"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="p-1.5 bg-white rounded-lg border border-blue-100 text-center">
              <span className="text-[10px] text-slate-500 block">Chia đều mỗi câu:</span>
              <span className="text-xs font-black text-blue-800">
                {p1PointPerQ.toFixed(3)} điểm / câu
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({p1TotalQuestions} câu × {p1PointPerQ.toFixed(3)}đ = 5,0đ)
              </span>
            </div>
          </div>

          {/* P2 */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-purple-900">PHẦN 2: TN Đúng / Sai</span>
              <span className="font-black text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                2,0 điểm
              </span>
            </div>

            <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-purple-200">
              <button
                type="button"
                onClick={() => setP2TotalQuestions((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-black cursor-pointer transition-colors"
                title="Giảm 1 câu"
              >
                <Minus size={13} />
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={p2TotalQuestions}
                  onChange={(e) => setP2TotalQuestions(Math.min(4, Math.max(1, Number(e.target.value))))}
                  className="w-14 text-center font-black text-purple-900 text-sm outline-none bg-transparent"
                />
                <span className="text-[11px] text-slate-500 font-semibold">câu</span>
              </div>
              <button
                type="button"
                onClick={() => setP2TotalQuestions((prev) => Math.min(4, prev + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-black cursor-pointer transition-colors"
                title="Tăng 1 câu"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="p-1.5 bg-white rounded-lg border border-purple-100 text-center">
              <span className="text-[10px] text-slate-500 block">Chia đều mỗi câu (tối đa):</span>
              <span className="text-xs font-black text-purple-800">
                {p2MaxPerQ.toFixed(2)} điểm / câu
              </span>
              <span className="text-[10px] text-slate-400 block">
                (1 ý: {(p2MaxPerQ * 0.1).toFixed(2)}đ • 2 ý: {(p2MaxPerQ * 0.25).toFixed(2)}đ • 3 ý: {(p2MaxPerQ * 0.5).toFixed(2)}đ • 4 ý: {p2MaxPerQ.toFixed(2)}đ)
              </span>
            </div>
          </div>

          {/* P3 */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-amber-900">PHẦN 3: Trả lời ngắn</span>
              <span className="font-black text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                1,5 điểm
              </span>
            </div>

            <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-amber-200">
              <button
                type="button"
                onClick={() => setP3TotalQuestions((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-black cursor-pointer transition-colors"
                title="Giảm 1 câu"
              >
                <Minus size={13} />
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={p3TotalQuestions}
                  onChange={(e) => setP3TotalQuestions(Math.max(1, Number(e.target.value)))}
                  className="w-14 text-center font-black text-amber-900 text-sm outline-none bg-transparent"
                />
                <span className="text-[11px] text-slate-500 font-semibold">câu</span>
              </div>
              <button
                type="button"
                onClick={() => setP3TotalQuestions((prev) => Math.min(20, prev + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-black cursor-pointer transition-colors"
                title="Tăng 1 câu"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="p-1.5 bg-white rounded-lg border border-amber-100 text-center">
              <span className="text-[10px] text-slate-500 block">Chia đều mỗi câu:</span>
              <span className="text-xs font-black text-amber-800">
                {p3PointPerQ.toFixed(3)} điểm / câu
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({p3TotalQuestions} câu × {p3PointPerQ.toFixed(3)}đ = 1,5đ)
              </span>
            </div>
          </div>

          {/* P4 */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-900">PHẦN 4: Tự luận</span>
              <span className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                1,5 điểm
              </span>
            </div>

            <div className="flex items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-emerald-200">
              <button
                type="button"
                onClick={() => setP4TotalSteps((prev) => Math.max(1, prev - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black cursor-pointer transition-colors"
                title="Giảm 1 ý"
              >
                <Minus size={13} />
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={p4TotalSteps}
                  onChange={(e) => setP4TotalSteps(Math.min(5, Math.max(1, Number(e.target.value))))}
                  className="w-14 text-center font-black text-emerald-900 text-sm outline-none bg-transparent"
                />
                <span className="text-[11px] text-slate-500 font-semibold">ý TL</span>
              </div>
              <button
                type="button"
                onClick={() => setP4TotalSteps((prev) => Math.min(5, prev + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black cursor-pointer transition-colors"
                title="Tăng 1 ý"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="p-1.5 bg-white rounded-lg border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-500 block">Chia đều mỗi ý:</span>
              <span className="text-xs font-black text-emerald-800">
                {p4PointPerStep.toFixed(2)} điểm / ý
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({p4TotalSteps} ý × {p4PointPerStep.toFixed(2)}đ = 1,5đ)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4 Parts Grading Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4 Parts (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ==============================================================
              PHẦN 1: TRẮC NGHIỆM NHIỀU LỰA CHỌN (5.0 ĐIỂM CHIA ĐỀU)
          ============================================================== */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-sm">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Phần 1: Trắc nghiệm có nhiều phương án lựa chọn
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    5,0 điểm chia đều cho {p1TotalQuestions} câu (<b>{p1PointPerQ.toFixed(3)}đ</b> / câu đúng)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs">
                  Điểm đạt: {p1Score.toFixed(2)} / 5,00đ
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setP1Mode('quick')}
                    className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                      p1Mode === 'quick' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Chấm nhanh
                  </button>
                  <button
                    type="button"
                    onClick={() => setP1Mode('detail')}
                    className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                      p1Mode === 'detail' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Phiếu {p1TotalQuestions} câu
                  </button>
                </div>
              </div>
            </div>

            {p1Mode === 'quick' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Số câu thí sinh trả lời đúng:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Công thức: <b>{p1CorrectCount} câu × {p1PointPerQ.toFixed(3)}đ = {p1Score.toFixed(2)} điểm</b>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
                      <input
                        type="number"
                        min={0}
                        max={p1TotalQuestions}
                        value={p1CorrectCount}
                        onChange={(e) => setP1CorrectCount(Math.min(p1TotalQuestions, Math.max(0, Number(e.target.value))))}
                        className="w-14 text-center font-black text-base text-blue-700 outline-none"
                      />
                      <span className="text-slate-400 font-bold">/ {p1TotalQuestions} câu</span>
                    </div>

                    <span className="text-sm font-black text-emerald-700">
                      = {p1Score.toFixed(2)}đ
                    </span>
                  </div>
                </div>

                {/* Thanh trượt số câu đúng */}
                <input
                  type="range"
                  min={0}
                  max={p1TotalQuestions}
                  value={p1CorrectCount}
                  onChange={(e) => setP1CorrectCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />

                {/* Nút chọn nhanh */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-400 font-semibold mr-1">Chọn nhanh:</span>
                  {[
                    p1TotalQuestions,
                    Math.round(p1TotalQuestions * 0.9),
                    Math.round(p1TotalQuestions * 0.8),
                    Math.round(p1TotalQuestions * 0.7),
                    Math.round(p1TotalQuestions * 0.6),
                    Math.round(p1TotalQuestions * 0.5),
                  ].map((count, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setP1CorrectCount(count)}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                        p1CorrectCount === count
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {count}/{p1TotalQuestions} ({(count * p1PointPerQ).toFixed(2)}đ)
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chấm chi tiết từng câu */
              <div className="space-y-3">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-900 text-[11px] flex items-center justify-between">
                  <span>Tích chọn phương án thí sinh tô trên phiếu trắc nghiệm ({p1TotalQuestions} câu, mỗi câu {p1PointPerQ.toFixed(3)}đ):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allSame: any = {};
                      for (let i = 1; i <= p1TotalQuestions; i++) {
                        allSame[i] = { key: p1DetailedAnswers[i]?.correctKey || 'A', correctKey: p1DetailedAnswers[i]?.correctKey || 'A' };
                      }
                      setP1DetailedAnswers(allSame);
                    }}
                    className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    Đánh dấu đúng hết ({p1TotalQuestions}/{p1TotalQuestions})
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {Array.from({ length: p1TotalQuestions }, (_, i) => i + 1).map((qNum) => {
                    const ans = p1DetailedAnswers[qNum] || { key: 'A', correctKey: 'A' };
                    const isMatch = ans.key === ans.correctKey;
                    return (
                      <div
                        key={qNum}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isMatch ? 'bg-emerald-50/60 border-emerald-300' : 'bg-rose-50/60 border-rose-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-700">Câu {qNum}</span>
                          <span className={`text-[10px] ${isMatch ? 'text-emerald-700 font-bold' : 'text-rose-600'}`}>
                            {isMatch ? `✓ +${p1PointPerQ.toFixed(2)}đ` : '✗ 0đ'}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setP1DetailedAnswers((prev) => ({
                                  ...prev,
                                  [qNum]: { ...prev[qNum], key: opt },
                                }))
                              }
                              className={`w-6 h-6 rounded-md font-black text-xs flex items-center justify-center cursor-pointer transition-all ${
                                ans.key === opt
                                  ? opt === ans.correctKey
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ==============================================================
              PHẦN 2: TRẮC NGHIỆM ĐÚNG / SAI (2.0 ĐIỂM CHIA ĐỀU)
          ============================================================== */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-sm">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    PHẦN II: Trắc nghiệm đúng sai (Tổng 2,0 điểm)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    2,0 điểm chia đều cho {p2TotalQuestions} câu (Điểm tối đa của 01 câu là <b>{p2MaxPerQ.toFixed(2)}đ</b>)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-black text-xs">
                  Điểm đạt: {p2Stats.totalScore.toFixed(2)} / 2,00đ
                </span>
              </div>
            </div>

            {/* Quy tắc chia điểm theo tỷ lệ của Bộ GD&ĐT */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 space-y-2">
              <div className="flex items-center gap-1.5 font-black text-purple-950 text-xs">
                <Sparkles size={14} className="text-purple-600" />
                <span>Thang điểm chia đều cho 01 câu hỏi Đúng/Sai (tối đa {p2MaxPerQ.toFixed(2)} điểm):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-semibold">Chính xác 01 ý (10%)</span>
                  <span className="font-black text-purple-700 text-sm">{(p2MaxPerQ * 0.1).toFixed(2)} điểm</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-semibold">Chính xác 02 ý (25%)</span>
                  <span className="font-black text-purple-700 text-sm">{(p2MaxPerQ * 0.25).toFixed(2)} điểm</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-semibold">Chính xác 03 ý (50%)</span>
                  <span className="font-black text-purple-700 text-sm">{(p2MaxPerQ * 0.5).toFixed(2)} điểm</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-purple-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block font-semibold">Chính xác cả 04 ý (100%)</span>
                  <span className="font-black text-emerald-600 text-sm">{p2MaxPerQ.toFixed(2)} điểm</span>
                </div>
              </div>
            </div>

            {/* Danh sách câu hỏi Đúng / Sai */}
            <div className="space-y-4">
              {p2Questions.slice(0, p2TotalQuestions).map((q, qIdx) => {
                const breakdown = p2Stats.breakdown[qIdx] || { correctCount: 0, score: 0 };

                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        Câu {qIdx + 1}: {q.title}
                      </span>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-300 font-extrabold text-[11px] text-slate-700">
                          Đúng {breakdown.correctCount}/4 ý
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-600 text-white font-black text-xs shadow-2xs">
                          {breakdown.score.toFixed(2)} / {p2MaxPerQ.toFixed(2)}đ
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {q.items.map((item) => {
                        const isMatch = item.student === item.standard;
                        return (
                          <div
                            key={item.key}
                            className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                              isMatch ? 'bg-white border-emerald-300' : 'bg-rose-50/50 border-rose-200'
                            }`}
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <span
                                className={`w-5 h-5 rounded-md font-black text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                                  isMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.key}
                              </span>
                              <span className="text-slate-800 text-xs leading-snug">{item.text}</span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                              {/* Đáp án chuẩn */}
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-400">Đáp án:</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTfStandard(qIdx, item.key)}
                                  className={`px-2 py-0.5 rounded font-black text-[10px] cursor-pointer ${
                                    item.standard ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}
                                  title="Bấm để đổi đáp án mẫu chuẩn"
                                >
                                  {item.standard ? 'ĐÚNG' : 'SAI'}
                                </button>
                              </div>

                              {/* Học sinh chọn */}
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-slate-600 font-bold">Học sinh chọn:</span>
                                <div className="flex bg-slate-200 p-0.5 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!item.student) handleToggleTfItem(qIdx, item.key);
                                    }}
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                                      item.student
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Đúng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item.student) handleToggleTfItem(qIdx, item.key);
                                    }}
                                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                                      !item.student
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    Sai
                                  </button>
                                </div>
                              </div>

                              {/* Icon kết quả */}
                              {isMatch ? (
                                <span className="text-emerald-600 font-black text-xs flex items-center gap-0.5">
                                  <CheckCircle2 size={15} />
                                </span>
                              ) : (
                                <span className="text-rose-500 font-black text-xs flex items-center gap-0.5">
                                  <XCircle size={15} />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ==============================================================
              PHẦN 3: TRẮC NGHIỆM TRẢ LỜI NGẮN (1.5 ĐIỂM CHIA ĐỀU)
          ============================================================== */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Phần 3 – Câu trắc nghiệm yêu cầu trả lời ngắn
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    1,5 điểm chia đều cho {p3TotalQuestions} câu (Mỗi câu = <b>{p3PointPerQ.toFixed(3)}đ</b>)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs">
                  Điểm đạt: {p3Score.toFixed(2)} / 1,50đ
                </span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setP3Mode('quick')}
                    className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                      p3Mode === 'quick' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Chấm nhanh
                  </button>
                  <button
                    type="button"
                    onClick={() => setP3Mode('detail')}
                    className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                      p3Mode === 'detail' ? 'bg-white text-amber-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Chi tiết {p3TotalQuestions} câu
                  </button>
                </div>
              </div>
            </div>

            {p3Mode === 'quick' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      Số câu thí sinh điền đúng kết quả:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Công thức chia đều: <b>{p3CorrectCount} câu × {p3PointPerQ.toFixed(3)}đ = {p3Score.toFixed(2)} điểm</b>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
                      <input
                        type="number"
                        min={0}
                        max={p3TotalQuestions}
                        value={p3CorrectCount}
                        onChange={(e) => setP3CorrectCount(Math.min(p3TotalQuestions, Math.max(0, Number(e.target.value))))}
                        className="w-12 text-center font-black text-base text-amber-700 outline-none"
                      />
                      <span className="text-slate-400 font-bold">/ {p3TotalQuestions} câu</span>
                    </div>

                    <span className="text-sm font-black text-emerald-700">
                      = {p3Score.toFixed(2)}đ
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={p3TotalQuestions}
                  value={p3CorrectCount}
                  onChange={(e) => setP3CorrectCount(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />

                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-400 font-semibold mr-1">Chọn nhanh:</span>
                  {Array.from({ length: p3TotalQuestions + 1 }, (_, i) => p3TotalQuestions - i).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setP3CorrectCount(count)}
                      className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                        p3CorrectCount === count
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {count}/{p3TotalQuestions} ({(count * p3PointPerQ).toFixed(2)}đ)
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {p3Items.slice(0, p3TotalQuestions).map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      item.isCorrect ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 text-xs block">{item.question}</span>
                      <span className="text-[11px] text-slate-500">
                        Đáp án chuẩn: <b className="text-emerald-700">{item.standard}</b> • Bài làm thí sinh:{' '}
                        <b className={item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>{item.student}</b>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...p3Items];
                          updated[idx].isCorrect = !updated[idx].isCorrect;
                          setP3Items(updated);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                          item.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.isCorrect ? <Check size={12} /> : <X size={12} />}
                        <span>{item.isCorrect ? `Đúng (+${p3PointPerQ.toFixed(2)}đ)` : 'Sai (0đ)'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ==============================================================
              PHẦN 4: TỰ LUẬN (1.5 ĐIỂM CHIA ĐỀU)
          ============================================================== */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                  4
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Phần 4: Tự luận (3 câu – Tổng 1,5 điểm)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    1,5 điểm chia đều cho {p4TotalSteps} câu tự luận (Mỗi câu = <b>{p4PointPerStep.toFixed(2)}đ</b>)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs">
                  Điểm đạt: {p4Score.toFixed(2)} / 1,50đ
                </span>
              </div>
            </div>

            {/* Rubric chia đều cho 3 câu tự luận */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from({ length: p4TotalSteps }, (_, i) => i).map((stepIdx) => {
                const currentVal = p4StepScores[stepIdx] || 0;
                const maxVal = p4PointPerStep;

                return (
                  <div key={stepIdx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-800">
                        {stepIdx === 0
                          ? 'Câu 1: Lý thuyết & Cơ chế'
                          : stepIdx === 1
                          ? 'Câu 2: Tính toán định lượng'
                          : 'Câu 3: Vận dụng thực tiễn'}
                      </span>
                      <span className="font-black text-emerald-700">{currentVal.toFixed(2)}đ</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {stepIdx === 0
                        ? 'Định nghĩa, nguyên lý & viết phương trình nền tảng'
                        : stepIdx === 1
                        ? 'Thiết lập công thức, giải số liệu & kết quả'
                        : 'Tình huống thực tế, giải pháp kỹ thuật & kết luận'}
                    </p>
                    <div className="flex gap-1 pt-1">
                      {[
                        { label: 'Tối đa', val: maxVal },
                        { label: '50%', val: Math.round((maxVal * 0.5) * 100) / 100 },
                        { label: '0đ', val: 0.0 },
                      ].map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            const copy = [...p4StepScores];
                            copy[stepIdx] = opt.val;
                            setP4StepScores(copy);
                          }}
                          className={`flex-1 py-1 rounded-lg font-bold text-xs cursor-pointer border ${
                            Math.abs(currentVal - opt.val) < 0.01
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                          }`}
                        >
                          {opt.val}đ
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bài làm tự luận của học sinh & Lời phê giáo viên */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Bài làm tự luận của thí sinh:
                </label>
                <textarea
                  rows={3}
                  value={p4StudentAnswerText}
                  onChange={(e) => setP4StudentAnswerText(e.target.value)}
                  placeholder="Nội dung bài làm tự luận của học sinh..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-medium text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Lời phê & Nhận xét sư phạm của giáo viên:
                </label>
                <textarea
                  rows={2}
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  placeholder="Nhập nhận xét chi tiết cho bài thi..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl font-medium text-xs text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary Card & Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 sticky top-20">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Award className="text-emerald-600" size={20} />
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Bảng Tổng Kết Điểm Bài Thi
              </h3>
            </div>

            {/* Big Score Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Thí sinh: {activeStudentName}
              </span>
              <div className="flex items-baseline justify-center gap-1.5 my-1">
                <span className="text-5xl font-black text-emerald-800">
                  {totalScore.toFixed(2)}
                </span>
                <span className="text-base font-bold text-slate-400">/ 10,0đ</span>
              </div>
              <div className="pt-1">
                <span className="px-3 py-1 rounded-full font-black text-xs bg-emerald-600 text-white shadow-xs inline-block">
                  {performanceTier.badge}
                </span>
              </div>
            </div>

            {/* Breakdown 4 phần */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Chi tiết thang điểm chia đều 4 phần:
              </span>

              {/* P1 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">
                    I
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">TN nhiều lựa chọn</span>
                    <span className="text-[10px] text-slate-400">
                      {p1TotalQuestions} câu (5.0đ chia đều: {p1PointPerQ.toFixed(2)}đ/câu)
                    </span>
                  </div>
                </div>
                <span className="font-black text-blue-700 text-sm">{p1Score.toFixed(2)}đ</span>
              </div>

              {/* P2 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] flex items-center justify-center">
                    II
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">TN Đúng / Sai</span>
                    <span className="text-[10px] text-slate-400">
                      {p2TotalQuestions} câu (2.0đ chia đều: {p2MaxPerQ.toFixed(2)}đ/câu)
                    </span>
                  </div>
                </div>
                <span className="font-black text-purple-700 text-sm">{p2Stats.totalScore.toFixed(2)}đ</span>
              </div>

              {/* P3 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                    III
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">TN trả lời ngắn</span>
                    <span className="text-[10px] text-slate-400">
                      {p3TotalQuestions} câu (1.5đ chia đều: {p3PointPerQ.toFixed(2)}đ/câu)
                    </span>
                  </div>
                </div>
                <span className="font-black text-amber-700 text-sm">{p3Score.toFixed(2)}đ</span>
              </div>

              {/* P4 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                    IV
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">Tự luận</span>
                    <span className="text-[10px] text-slate-400">
                      {p4TotalSteps} ý (1.5đ chia đều: {p4PointPerStep.toFixed(2)}đ/ý)
                    </span>
                  </div>
                </div>
                <span className="font-black text-emerald-700 text-sm">{p4Score.toFixed(2)}đ</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSaveGrading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Save size={16} />
                <span>Lưu Kết Quả Vào Hồ Sơ Thí Sinh</span>
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Copy size={15} />
                <span>Sao Chép Phiếu Chấm Điểm</span>
              </button>

              <button
                type="button"
                onClick={handleNextStudent}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-2xl border border-blue-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw size={15} />
                <span>Chấm Thí Sinh Tiếp Theo ➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lịch sử các bài kiểm tra vừa chấm trong phiên */}
      {gradedHistory.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span>Lịch Sử Bài Kiểm Tra Vừa Chấm ({gradedHistory.length} bài)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Đã lưu trữ trong phiên làm việc</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gradedHistory.map((h) => (
              <div key={h.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-xs">{h.studentName}</span>
                  <span className="text-emerald-700 font-black text-sm">{h.totalScore.toFixed(2)}/10đ</span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>Môn: {h.subject} • {h.timestamp}</p>
                  <p className="text-[10px] text-slate-400">
                    P1 ({h.p1Config.count}c): {h.p1Score.toFixed(2)}đ | P2 ({h.p2Config.count}c): {h.p2Score.toFixed(2)}đ | P3 ({h.p3Config.count}c): {h.p3Score.toFixed(2)}đ | P4: {h.p4Score.toFixed(2)}đ
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
