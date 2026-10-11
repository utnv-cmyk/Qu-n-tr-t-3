/**
 * Tiện ích Xuất và Tải Đề Kiểm Tra Khảo Thí (Word, Bản in, Đáp án, Ma trận)
 * Dành cho Trường THPT Dương Minh Châu - Lớp 11A1
 */

import { AssessmentTest, QuestionBankItem } from '../types';
import { APP_CONFIG } from '../config';

/**
 * Xuất đề kiểm tra ra file Microsoft Word (.doc) chuẩn mẫu Bộ GD&ĐT / THPT Dương Minh Châu
 */
export function exportTestToWord(
  test: AssessmentTest,
  mode: 'full' | 'student' | 'answers_only' = 'full'
) {
  const isStudentOnly = mode === 'student';
  const isAnswersOnly = mode === 'answers_only';

  const titlePrefix = isStudentOnly
    ? 'ĐỀ_KIỂM_TRA_HỌC_SINH'
    : isAnswersOnly
    ? 'ĐÁP_ÁN_HƯỚNG_DẪN_CHẤM'
    : 'ĐỀ_KIỂM_TRA_VÀ_ĐÁP_ÁN';

  const filename = `${test.code || 'DE'}_${titlePrefix}_${test.subject.replace(/\s+/g, '_')}_Lop${test.grade}.doc`;

  // Tách câu hỏi theo 4 phần
  const part1 = test.questions.filter((q) => q.type === 'multiple_choice');
  const part2 = test.questions.filter((q) => q.type === 'true_false');
  const part3 = test.questions.filter((q) => q.type === 'short_answer');
  const part4 = test.questions.filter((q) => q.type === 'essay');

  const approvalText = test.isApprovedByTeacher
    ? `ĐÃ ĐƯỢC GIÁO VIÊN PHÊ DUYỆT: ${test.approvedBy || 'Ban Giám Khảo'} (${test.approvedAt || 'Đã ban hành'})`
    : `BẢN DỰ THẢO - CHỜ GIÁO VIÊN DUYỆT`;

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${test.title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 20mm; }
        h1, h2, h3, h4 { margin: 0; padding: 0; font-family: 'Times New Roman', serif; }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .header-table td { vertical-align: top; font-size: 12pt; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .section-title { font-size: 13pt; font-weight: bold; margin-top: 18px; margin-bottom: 8px; text-decoration: underline; }
        .question-box { margin-bottom: 14px; page-break-inside: avoid; }
        .question-title { font-weight: bold; }
        .option-grid { margin-left: 20px; margin-top: 4px; margin-bottom: 6px; }
        .tf-table, .matrix-table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px; }
        .tf-table th, .tf-table td, .matrix-table th, .matrix-table td { border: 1px solid #333; padding: 5px 8px; font-size: 11pt; }
        .matrix-table th { background-color: #f2f2f2; text-align: center; }
        .answer-key { background-color: #f0fdf4; border: 1px dashed #16a34a; padding: 6px 10px; margin-top: 4px; font-size: 11pt; }
        .meta-box { border: 1px solid #999; padding: 8px 12px; margin-bottom: 20px; background-color: #fcfcfc; font-size: 11pt; }
        .signature-table { width: 100%; border-collapse: collapse; margin-top: 40px; }
        .signature-table td { text-align: center; width: 50%; vertical-align: top; }
      </style>
    </head>
    <body>
      <!-- Header tiêu ngữ -->
      <table class="header-table">
        <tr>
          <td style="width: 50%; text-align: center;">
            <div style="font-size: 11pt;">SỞ GD&ĐT TÂY NINH</div>
            <div class="bold uppercase" style="font-size: 12pt;">TRƯỜNG THPT DƯƠNG MINH CHÂU</div>
            <div style="font-size: 11pt;">TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME}</div>
            <div style="font-weight: bold; font-size: 10pt; color: #15803d; margin-top: 4px;">[ ${approvalText} ]</div>
          </td>
          <td style="width: 50%; text-align: center;">
            <div class="bold uppercase" style="font-size: 13pt;">${isAnswersOnly ? 'ĐÁP ÁN & HƯỚNG DẪN CHẤM' : 'ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC'}</div>
            <div class="bold" style="font-size: 12pt;">Môn: ${test.subject} – Lớp ${test.grade}</div>
            <div style="font-size: 11pt;">Năm học: ${APP_CONFIG.SCHOOL_YEAR}</div>
            <div style="font-size: 11pt; font-style: italic;">Thời gian làm bài: ${test.durationMinutes} phút (Không kể thời gian phát đề)</div>
          </td>
        </tr>
      </table>

      <div class="center bold" style="font-size: 14pt; margin-bottom: 10px;">
        ${test.title.toUpperCase()}
      </div>

      <div class="center" style="font-size: 11pt; margin-bottom: 15px;">
        <b>Mã đề thi:</b> ${test.code} • <b>Chủ đề:</b> ${test.topic} • <b>Tổng điểm:</b> ${test.totalPoints} điểm
      </div>
  `;

  if (!isAnswersOnly) {
    html += `
      <!-- Thông tin thí sinh -->
      <div class="meta-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 65%;">Họ và tên thí sinh: ............................................................................................</td>
            <td style="width: 35%;">Số báo danh: .............................</td>
          </tr>
          <tr>
            <td>Lớp: ........................................ Phòng thi: .................................................</td>
            <td>Chữ ký GT 1: ..........................</td>
          </tr>
        </table>
      </div>
    `;

    // PHẦN I
    if (part1.length > 0) {
      html += `
        <div class="section-title">PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (${part1.length} câu)</div>
        <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</p>
      `;

      part1.forEach((q, idx) => {
        html += `
          <div class="question-box">
            <div class="question-title">Câu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'BIẾT'}]: ${q.content}</div>
            <div class="option-grid">
              ${(q.options || []).map((opt) => `<div><b>${opt.key}.</b> ${opt.text}</div>`).join('')}
            </div>
            ${
              !isStudentOnly
                ? `
              <div class="answer-key">
                <b>Đáp án đúng: ${q.options?.find((o) => o.isCorrect)?.key || 'A'}</b>. 
                <i>${q.options?.find((o) => o.isCorrect)?.explanation || 'Giải thích chi tiết theo kiến thức bài học.'}</i>
              </div>
            `
                : ''
            }
          </div>
        `;
      });
    }

    // PHẦN II
    if (part2.length > 0) {
      html += `
        <div class="section-title">PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (${part2.length} câu)</div>
        <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trả lời từ câu 1 đến câu ${part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai.</p>
      `;

      part2.forEach((q, idx) => {
        html += `
          <div class="question-box">
            <div class="question-title">Câu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'HIỂU'}]: ${q.content}</div>
            <table class="tf-table">
              <tr>
                <th style="width: 10%;">Ý</th>
                <th style="width: 65%;">Nội dung mệnh đề</th>
                <th style="width: 12%;">Đúng</th>
                <th style="width: 12%;">Sai</th>
              </tr>
              ${(q.options || [])
                .map(
                  (opt) => `
                <tr>
                  <td class="center bold">${opt.key})</td>
                  <td>${opt.text}</td>
                  <td class="center">${!isStudentOnly && opt.isCorrect ? '✓' : ''}</td>
                  <td class="center">${!isStudentOnly && !opt.isCorrect ? '✓' : ''}</td>
                </tr>
              `
                )
                .join('')}
            </table>
          </div>
        `;
      });
    }

    // PHẦN III
    if (part3.length > 0) {
      html += `
        <div class="section-title">PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (${part3.length} câu)</div>
        <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trả lời từ câu 1 đến câu ${part3.length}. Điền kết quả tính toán hoặc từ khóa vào phiếu trả lời.</p>
      `;

      part3.forEach((q, idx) => {
        html += `
          <div class="question-box">
            <div class="question-title">Câu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'VẬN DỤNG'}]: ${q.content}</div>
            <div style="margin-top: 5px; font-style: italic;">
              ${isStudentOnly ? 'Đáp số: ................................................................................................' : `<b>Đáp số chuẩn:</b> <span style="color: #15803d; font-weight: bold;">${q.correctAnswerText || 'Đáp án mẫu'}</span>`}
            </div>
          </div>
        `;
      });
    }

    // PHẦN IV
    if (part4.length > 0) {
      html += `
        <div class="section-title">PHẦN IV. CÂU HỎI TỰ LUẬN (${part4.length} câu)</div>
        <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trình bày chi tiết lời giải hoặc luận điểm vào giấy thi.</p>
      `;

      part4.forEach((q, idx) => {
        html += `
          <div class="question-box">
            <div class="question-title">Câu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'VẬN DỤNG'}]: ${q.content}</div>
            ${
              isStudentOnly
                ? `
              <div style="height: 120px; border-bottom: 1px dotted #ccc; margin-top: 10px;">
                <i>(Bài làm của thí sinh...)</i>
              </div>
            `
                : `
              <div class="answer-key" style="margin-top: 6px;">
                <b>Hướng dẫn chấm / Rubric:</b>
                <ul style="margin: 4px 0 0 20px; padding: 0;">
                  ${
                    q.essayRubric && q.essayRubric.length > 0
                      ? q.essayRubric.map((r) => `<li><b>${r.step || (r as any).criterion}</b> (${r.points}đ): ${r.criteria || (r as any).description}</li>`).join('')
                      : `<li>Trình bày đúng bản chất vấn đề, lập luận logic và kết luận chính xác (${q.points} điểm).</li>`
                  }
                </ul>
              </div>
            `
            }
          </div>
        `;
      });
    }
  }

  // PHẦN MA TRẬN & ĐÁP ÁN (Dành cho giáo viên)
  if (!isStudentOnly && test.matrix) {
    html += `
      <div style="page-break-before: always;"></div>
      <div class="section-title center">MA TRẬN ĐỀ KIỂM TRA ĐÁNH GIÁ (THEO 3 MỨC ĐỘ NHẬN THỨC)</div>
      <p class="center" style="font-size: 11pt;">Tỉ lệ chuẩn hóa: BIẾT ${test.knowRatio}% • HIỂU ${test.understandRatio}% • VẬN DỤNG ${test.applyRatio}% = 100%</p>

      <table class="matrix-table">
        <tr>
          <th rowspan="2">TT</th>
          <th rowspan="2">Chương / Chủ đề</th>
          <th colspan="3">Mức độ nhận thức (Số câu / Điểm)</th>
          <th rowspan="2">Tổng số câu</th>
          <th rowspan="2">Tổng điểm</th>
        </tr>
        <tr>
          <th>BIẾT (KNOW)</th>
          <th>HIỂU (UNDERSTAND)</th>
          <th>VẬN DỤNG (APPLY)</th>
        </tr>
        ${test.matrix.rows
          .map(
            (r, i) => `
          <tr>
            <td class="center">${i + 1}</td>
            <td>${r.topic}</td>
            <td class="center">${(r as any).knowQuestions ?? (r as any).knowCount ?? 0} câu (${r.knowPoints}đ)</td>
            <td class="center">${(r as any).understandQuestions ?? (r as any).understandCount ?? 0} câu (${r.understandPoints}đ)</td>
            <td class="center">${(r as any).applyQuestions ?? (r as any).applyCount ?? 0} câu (${r.applyPoints}đ)</td>
            <td class="center bold">${r.totalQuestions}</td>
            <td class="center bold">${r.totalPoints}đ</td>
          </tr>
        `
          )
          .join('')}
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="2" class="center">TỔNG CỘNG TOÀN ĐỀ</td>
          <td class="center">${test.questions.filter((q) => q.cognitiveLevel === 'KNOW').length} câu (${test.knowRatio}%)</td>
          <td class="center">${test.questions.filter((q) => q.cognitiveLevel === 'UNDERSTAND').length} câu (${test.understandRatio}%)</td>
          <td class="center">${test.questions.filter((q) => q.cognitiveLevel === 'APPLY').length} câu (${test.applyRatio}%)</td>
          <td class="center">${test.questions.length} câu</td>
          <td class="center">${test.totalPoints} điểm</td>
        </tr>
      </table>
    `;
  }

  // BẢNG ĐẶC TẢ MA TRẬN ĐỀ THI (Dành cho giáo viên)
  if (!isStudentOnly && test.specifications && test.specifications.length > 0) {
    html += `
      <div style="page-break-before: always;"></div>
      <div class="section-title center">BẢN ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC</div>
      <p class="center" style="font-size: 11pt;">Môn: ${test.subject} – Lớp ${test.grade} • Khảo thí theo 3 mức độ nhận thức</p>

      <table class="matrix-table">
        <tr>
          <th style="width: 5%;">TT</th>
          <th style="width: 25%;">Nội dung / Đơn vị kiến thức</th>
          <th style="width: 15%;">Mức độ nhận thức</th>
          <th style="width: 35%;">Yêu cầu cần đạt</th>
          <th style="width: 10%;">Dạng câu</th>
          <th style="width: 10%;">Số câu (Điểm)</th>
        </tr>
        ${test.specifications
          .map(
            (s, i) => `
          <tr>
            <td class="center">${i + 1}</td>
            <td><b>${s.content}</b></td>
            <td class="center bold">${s.cognitiveLevel === 'KNOW' ? 'BIẾT' : s.cognitiveLevel === 'UNDERSTAND' ? 'HIỂU' : 'VẬN DỤNG'}</td>
            <td>${s.learningOutcome}</td>
            <td class="center">${s.questionType === 'multiple_choice' ? 'Trắc nghiệm' : s.questionType === 'true_false' ? 'Đúng/Sai' : s.questionType === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'}</td>
            <td class="center bold">${s.questionCount} câu (${s.points}đ)</td>
          </tr>
        `
          )
          .join('')}
      </table>
    `;
  }

  // Chữ ký phê duyệt
  html += `
      <table class="signature-table">
        <tr>
          <td>
            <div class="bold">NGƯỜI TẠO ĐỀ / TỔ TRƯỞNG</div>
            <div style="font-size: 10pt; font-style: italic; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div class="bold">${test.creatorName || 'Trần Công Minh'}</div>
          </td>
          <td>
            <div class="bold">GIÁO VIÊN BỘ MÔN / DUYỆT ĐỀ</div>
            <div style="font-size: 10pt; font-style: italic; margin-top: 2px;">
              ${test.isApprovedByTeacher ? `Đã ký duyệt lúc: ${test.approvedAt || '2026-09-29'}` : '(Chờ ký phê duyệt)'}
            </div>
            <div style="height: 60px; line-height: 60px; color: #15803d; font-weight: bold;">
              ${test.isApprovedByTeacher ? '✓ ĐÃ PHÊ DUYỆT CHÍNH THỨC' : ''}
            </div>
            <div class="bold">${test.approvedBy || 'Thầy/Cô Giáo Viên Bộ Môn'}</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Tạo blob Word và tải về
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tải đề kiểm tra đúng 100% nội dung thực tế trong đề dưới dạng tệp văn bản (.txt)
 */
export function exportTestToTxt(
  test: AssessmentTest,
  includeAnswers: boolean = true
) {
  const isStudentOnly = !includeAnswers;
  const filename = `${test.code || 'DE'}_${isStudentOnly ? 'DE_HOC_SINH' : 'DE_VA_DAP_AN'}_${test.subject.replace(/\\s+/g, '_')}_Lop${test.grade}.txt`;

  const part1 = test.questions.filter((q) => q.type === 'multiple_choice');
  const part2 = test.questions.filter((q) => q.type === 'true_false');
  const part3 = test.questions.filter((q) => q.type === 'short_answer');
  const part4 = test.questions.filter((q) => q.type === 'essay');

  let text = `======================================================================\n`;
  text += `SỞ GD&ĐT TÂY NINH - TRƯỜNG THPT DƯƠNG MINH CHÂU - LỚP ${APP_CONFIG.CLASS_NAME} (TỔ 3)\n`;
  text += `ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC CHUẨN KHẢO THÍ BỘ GD&ĐT\n`;
  text += `Môn: ${test.subject} - Lớp: ${test.grade} - Năm học: ${APP_CONFIG.SCHOOL_YEAR}\n`;
  text += `Thời gian làm bài: ${test.durationMinutes} phút (Không kể thời gian phát đề)\n`;
  text += `Mã đề: ${test.code} | Chủ đề: ${test.topic}\n`;
  text += `Tổng số câu: ${test.questions.length} câu | Tổng điểm: ${test.totalPoints} điểm\n`;
  text += `Trọng số nhận thức: BIẾT ${test.knowRatio}% - HIỂU ${test.understandRatio}% - VẬN DỤNG ${test.applyRatio}%\n`;
  if (test.isApprovedByTeacher) {
    text += `Trạng thái: [ĐÃ ĐƯỢC GIÁO VIÊN PHÊ DUYỆT: ${test.approvedBy || 'Tổ chuyên môn'} (${test.approvedAt || 'Đã ban hành'})]\n`;
  } else {
    text += `Trạng thái: [BẢN DỰ THẢO - CHỜ GIÁO VIÊN DUYỆT]\n`;
  }
  text += `======================================================================\n\n`;

  if (isStudentOnly) {
    text += `Họ và tên thí sinh: ........................................................\n`;
    text += `Số báo danh: ..................... Phòng thi: ..............................\n\n`;
  }

  // PHẦN I
  if (part1.length > 0) {
    text += `----------------------------------------------------------------------\n`;
    text += `PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (${part1.length} câu)\n`;
    text += `Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi chỉ chọn một phương án.\n`;
    text += `----------------------------------------------------------------------\n`;
    part1.forEach((q, idx) => {
      text += `\nCâu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'BIẾT'}]: ${q.content}\n`;
      (q.options || []).forEach((opt) => {
        text += `   ${opt.key}. ${opt.text}\n`;
      });
      if (!isStudentOnly) {
        const correctOpt = q.options?.find((o) => o.isCorrect);
        text += `   ➔ ĐÁP ÁN ĐÚNG: ${correctOpt?.key || 'A'}`;
        if (correctOpt?.explanation) {
          text += ` - Giải thích: ${correctOpt.explanation}`;
        }
        text += `\n`;
      }
    });
    text += `\n`;
  }

  // PHẦN II
  if (part2.length > 0) {
    text += `----------------------------------------------------------------------\n`;
    text += `PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (${part2.length} câu)\n`;
    text += `Thí sinh trả lời từ câu 1 đến câu ${part2.length}. Trong mỗi ý a), b), c), d) chọn Đúng hoặc Sai.\n`;
    text += `----------------------------------------------------------------------\n`;
    part2.forEach((q, idx) => {
      text += `\nCâu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'HIỂU'}]: ${q.content}\n`;
      (q.options || []).forEach((opt) => {
        if (!isStudentOnly) {
          text += `   ${opt.key}) [${opt.isCorrect ? 'ĐÚNG' : 'SAI'}] ${opt.text}`;
          if (opt.explanation) {
            text += ` (Giải thích: ${opt.explanation})`;
          }
          text += `\n`;
        } else {
          text += `   ${opt.key}) [   ] ${opt.text}\n`;
        }
      });
    });
    text += `\n`;
  }

  // PHẦN III
  if (part3.length > 0) {
    text += `----------------------------------------------------------------------\n`;
    text += `PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (${part3.length} câu)\n`;
    text += `Thí sinh trả lời từ câu 1 đến câu ${part3.length}. Điền kết quả tính toán hoặc từ khóa.\n`;
    text += `----------------------------------------------------------------------\n`;
    part3.forEach((q, idx) => {
      text += `\nCâu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'VẬN DỤNG'}]: ${q.content}\n`;
      if (!isStudentOnly) {
        text += `   ➔ ĐÁP SỐ CHUẨN: ${q.correctAnswerText || 'Đáp án mẫu'}\n`;
        if (q.acceptedAnswers && q.acceptedAnswers.length > 0) {
          text += `   (Chấp nhận các dạng biểu diễn: ${q.acceptedAnswers.join(', ')})\n`;
        }
      } else {
        text += `   Đáp số: ........................................................\n`;
      }
    });
    text += `\n`;
  }

  // PHẦN IV
  if (part4.length > 0) {
    text += `----------------------------------------------------------------------\n`;
    text += `PHẦN IV. CÂU HỎI TỰ LUẬN (${part4.length} câu - Tổng ${(part4.reduce((s, q) => s + (q.points || 0), 0) || 1.5).toFixed(1).replace('.', ',')} điểm)\n`;
    text += `Thí sinh trình bày chi tiết lời giải và biện luận khoa học vào bài làm.\n`;
    text += `----------------------------------------------------------------------\n`;
    part4.forEach((q, idx) => {
      text += `\nCâu ${idx + 1} (${q.points} điểm) [Mức: ${q.cognitiveLevel || 'VẬN DỤNG'}]: ${q.content}\n`;
      if (!isStudentOnly) {
        text += `   ➔ HƯỚNG DẪN CHẤM & RUBRIC THANG ĐIỂM (${q.points} điểm):\n`;
        if (q.essayRubric && q.essayRubric.length > 0) {
          q.essayRubric.forEach((r, rIdx) => {
            text += `     • Bước ${rIdx + 1} (${r.points}đ): ${r.step} - Tiêu chuẩn: ${r.criteria}\n`;
          });
        } else {
          text += `     • Trình bày đúng bản chất lý thuyết / phương trình và đáp số chuẩn (${q.points} điểm).\n`;
        }
      } else {
        text += `   (Thí sinh làm bài vào giấy thi...)\n\n`;
      }
    });
    text += `\n`;
  }

  // MA TRẬN & BẢN ĐẶC TẢ
  if (!isStudentOnly) {
    if (test.matrix) {
      text += `======================================================================\n`;
      text += `MA TRẬN ĐỀ KIỂM TRA ĐÁNH GIÁ (3 MỨC ĐỘ NHẬN THỨC)\n`;
      text += `Tỉ lệ chuẩn hóa: BIẾT ${test.knowRatio}% - HIỂU ${test.understandRatio}% - VẬN DỤNG ${test.applyRatio}%\n`;
      text += `----------------------------------------------------------------------\n`;
      test.matrix.rows.forEach((r, idx) => {
        text += `${idx + 1}. Chủ đề: ${r.topic} (${r.content})\n`;
        text += `   - BIẾT: ${r.knowQuestions} câu (${r.knowPoints}đ)\n`;
        text += `   - HIỂU: ${r.understandQuestions} câu (${r.understandPoints}đ)\n`;
        text += `   - VẬN DỤNG: ${r.applyQuestions} câu (${r.applyPoints}đ)\n`;
        text += `   - Tổng: ${r.totalQuestions} câu (${r.totalPoints}đ) - Tỉ lệ: ${r.percentage}%\n\n`;
      });
      text += `TỔNG CỘNG TOÀN ĐỀ: ${test.questions.length} câu - ${test.totalPoints} điểm\n\n`;
    }

    if (test.specifications && test.specifications.length > 0) {
      text += `======================================================================\n`;
      text += `BẢN ĐẶC TẢ MA TRẬN ĐỀ THI ĐÁNH GIÁ NĂNG LỰC\n`;
      text += `----------------------------------------------------------------------\n`;
      test.specifications.forEach((s, idx) => {
        text += `${idx + 1}. [Mức ${s.cognitiveLevel}] ${s.content}\n`;
        text += `   - Yêu cầu cần đạt: ${s.learningOutcome}\n`;
        text += `   - Dạng câu: ${s.questionType} | Số câu: ${s.questionCount} (${s.points}đ)\n\n`;
      });
    }

    text += `======================================================================\n`;
    text += `NGƯỜI LẬP ĐỀ: ${test.creatorName || 'Trần Công Minh'}\n`;
    text += `GIÁO VIÊN PHÊ DUYỆT: ${test.approvedBy || 'Tổ bộ môn'} ${test.isApprovedByTeacher ? `(Đã duyệt: ${test.approvedAt || '2026-09-29'})` : '(Chờ duyệt)'}\n`;
  }

  text += `======================================================================\n`;
  text += `--- HẾT ---\n`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất đề thi ra tệp HTML độc lập chuẩn A4 (mở được ngay trên mọi trình duyệt, dễ in ra PDF)
 */
export function exportTestToHtml(
  test: AssessmentTest,
  mode: 'full' | 'student' | 'answers_only' = 'full'
) {
  const isStudentOnly = mode === 'student';
  const isAnswersOnly = mode === 'answers_only';

  const titlePrefix = isStudentOnly
    ? 'DE_HOC_SINH_A4'
    : isAnswersOnly
    ? 'DAP_AN_RUBRIC'
    : 'DE_THI_VA_DAP_AN_A4';

  const filename = `${test.code || 'DE'}_${titlePrefix}_${test.subject.replace(/\s+/g, '_')}_Lop${test.grade}.html`;

  const part1 = test.questions.filter((q) => q.type === 'multiple_choice');
  const part2 = test.questions.filter((q) => q.type === 'true_false');
  const part3 = test.questions.filter((q) => q.type === 'short_answer');
  const part4 = test.questions.filter((q) => q.type === 'essay');

  const approvalStatusBadge = test.isApprovedByTeacher
    ? `<span style="color: #15803d; font-weight: bold; background: #dcfce7; border: 1px solid #86efac; padding: 3px 8px; border-radius: 6px;">✓ ĐÃ PHÊ DUYỆT BỞI: ${test.approvedBy || 'GVCN'} (${test.approvedAt || 'Đã ban hành'})</span>`
    : `<span style="color: #b45309; font-weight: bold; background: #fef3c7; border: 1px solid #fcd34d; padding: 3px 8px; border-radius: 6px;">⏳ BẢN DỰ THẢO - CHỜ GIÁO VIÊN DUYỆT</span>`;

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${test.title} - THPT Dương Minh Châu</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Times New Roman', serif; font-size: 12.5pt; line-height: 1.38; color: #111; margin: 0 auto; max-width: 210mm; padding: 15mm; background: #fff; }
    .no-print-bar { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; font-family: system-ui, -apple-system, sans-serif; }
    .print-btn { background: #2563eb; color: #fff; font-weight: bold; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .print-btn:hover { background: #1d4ed8; }
    .header-tbl { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .header-tbl td { vertical-align: top; text-align: center; }
    .school-title { font-size: 11pt; }
    .school-name { font-weight: bold; font-size: 12pt; text-transform: uppercase; }
    .exam-title { font-weight: bold; font-size: 12.5pt; text-transform: uppercase; }
    .main-title { text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 12px 0 6px 0; }
    .meta-line { text-align: center; font-size: 11pt; margin-bottom: 12px; }
    .candidate-box { border: 1px solid #333; padding: 6px 12px; margin-bottom: 16px; font-size: 11pt; }
    .sec-head { font-weight: bold; text-decoration: underline; margin-top: 14px; margin-bottom: 6px; font-size: 12pt; }
    .q-item { margin-bottom: 12px; page-break-inside: avoid; }
    .opt-list { margin-left: 20px; margin-top: 4px; }
    .tf-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .tf-table th, .tf-table td { border: 1px solid #444; padding: 4px 8px; font-size: 11pt; }
    .tf-table th { background: #f3f4f6; text-align: center; }
    .answer-box { background: #f0fdf4; border: 1px dashed #16a34a; padding: 6px 10px; margin-top: 4px; font-size: 11pt; }
    .sign-table { width: 100%; border-collapse: collapse; margin-top: 35px; page-break-inside: avoid; }
    .sign-table td { text-align: center; width: 50%; vertical-align: top; }
    @media print {
      body { padding: 0; }
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <b style="color: #1e3a8a;">Đề Kiểm Tra: ${test.title}</b>
      <div style="font-size: 12px; color: #475569; margin-top: 2px;">Chuẩn khảo thí 3 mức độ (BIẾT - HIỂU - VẬN DỤNG) • Mã: ${test.code}</div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="print-btn" onclick="window.print()">🖨️ In đề / Lưu PDF</button>
    </div>
  </div>

  <table class="header-tbl">
    <tr>
      <td style="width: 50%;">
        <div class="school-title">SỞ GD&ĐT TÂY NINH</div>
        <div class="school-name">TRƯỜNG THPT DƯƠNG MINH CHÂU</div>
        <div style="font-size: 11pt;">LỚP ${APP_CONFIG.CLASS_NAME} – TỔ 3</div>
        <div style="margin-top: 5px;">${approvalStatusBadge}</div>
      </td>
      <td style="width: 50%;">
        <div class="exam-title">${isAnswersOnly ? 'ĐÁP ÁN & BIỂU ĐIỂM CHẤM' : 'ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC'}</div>
        <div style="font-weight: bold;">Môn: ${test.subject} – Lớp: ${test.grade}</div>
        <div style="font-style: italic; font-size: 11pt;">Thời gian: ${test.durationMinutes} phút (Không kể phát đề)</div>
      </td>
    </tr>
  </table>

  <div class="main-title">${test.title}</div>
  <div class="meta-line"><b>Mã đề thi:</b> ${test.code} • <b>Chủ đề:</b> ${test.topic} • <b>Thang điểm:</b> ${test.totalPoints} điểm</div>

  ${
    !isAnswersOnly
      ? `
  <div class="candidate-box">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 65%;">Họ và tên thí sinh: ............................................................................................</td>
        <td style="width: 35%;">Số báo danh: .............................</td>
      </tr>
      <tr>
        <td>Lớp: ........................................ Phòng thi: .................................................</td>
        <td>Chữ ký GT 1: ..........................</td>
      </tr>
    </table>
  </div>
  `
      : ''
  }

  ${
    !isAnswersOnly && part1.length > 0
      ? `
  <div class="sec-head">PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (${part1.length} câu)</div>
  <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</p>
  ${part1
    .map(
      (q, idx) => `
    <div class="q-item">
      <div><b>Câu ${idx + 1} (${q.points}đ) [${q.cognitiveLevel || 'BIẾT'}]:</b> ${q.content}</div>
      <div class="opt-list">
        ${(q.options || []).map((opt) => `<div><b>${opt.key}.</b> ${opt.text}</div>`).join('')}
      </div>
      ${
        !isStudentOnly
          ? `
      <div class="answer-box">
        <b>Đáp án đúng: ${q.options?.find((o) => o.isCorrect)?.key || 'A'}</b>. 
        <i>${q.options?.find((o) => o.isCorrect)?.explanation || 'Theo kiến thức trọng tâm SGK.'}</i>
      </div>`
          : ''
      }
    </div>
  `
    )
    .join('')}
  `
      : ''
  }

  ${
    !isAnswersOnly && part2.length > 0
      ? `
  <div class="sec-head">PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (${part2.length} câu)</div>
  <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trả lời từ câu 1 đến câu ${part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai.</p>
  ${part2
    .map(
      (q, idx) => `
    <div class="q-item">
      <div><b>Câu ${idx + 1} (${q.points}đ) [${q.cognitiveLevel || 'HIỂU'}]:</b> ${q.content}</div>
      <table class="tf-table">
        <tr>
          <th style="width: 10%;">Ý</th>
          <th>Nội dung mệnh đề</th>
          <th style="width: 12%;">Đúng</th>
          <th style="width: 12%;">Sai</th>
        </tr>
        ${(q.options || [])
          .map(
            (opt) => `
          <tr>
            <td style="text-align: center; font-weight: bold;">${opt.key})</td>
            <td>${opt.text}</td>
            <td style="text-align: center;">${!isStudentOnly && opt.isCorrect ? '✓' : ''}</td>
            <td style="text-align: center;">${!isStudentOnly && !opt.isCorrect ? '✓' : ''}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    </div>
  `
    )
    .join('')}
  `
      : ''
  }

  ${
    !isAnswersOnly && part3.length > 0
      ? `
  <div class="sec-head">PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (${part3.length} câu)</div>
  <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trả lời từ câu 1 đến câu ${part3.length}. Điền kết quả tính toán hoặc từ khóa.</p>
  ${part3
    .map(
      (q, idx) => `
    <div class="q-item">
      <div><b>Câu ${idx + 1} (${q.points}đ) [${q.cognitiveLevel || 'VẬN DỤNG'}]:</b> ${q.content}</div>
      <div style="margin-top: 4px; font-style: italic;">
        ${isStudentOnly ? 'Đáp số: ................................................................................................' : `<b>Đáp số chuẩn:</b> <span style="color: #15803d; font-weight: bold;">${q.correctAnswerText || 'Đáp án mẫu'}</span>`}
      </div>
    </div>
  `
    )
    .join('')}
  `
      : ''
  }

  ${
    !isAnswersOnly && part4.length > 0
      ? `
  <div class="sec-head">PHẦN IV. CÂU HỎI TỰ LUẬN (${part4.length} câu)</div>
  <p style="font-style: italic; margin-top: 0; font-size: 11pt;">Thí sinh trình bày chi tiết lời giải hoặc luận điểm.</p>
  ${part4
    .map(
      (q, idx) => `
    <div class="q-item">
      <div><b>Câu ${idx + 1} (${q.points}đ) [${q.cognitiveLevel || 'VẬN DỤNG'}]:</b> ${q.content}</div>
      ${
        isStudentOnly
          ? `<div style="height: 120px; border-bottom: 1px dotted #888; margin-top: 10px;"><i>(Bài làm của thí sinh...)</i></div>`
          : `
        <div class="answer-box" style="margin-top: 6px;">
          <b>Hướng dẫn chấm / Rubric:</b>
          <ul style="margin: 4px 0 0 20px; padding: 0;">
            ${
              q.essayRubric && q.essayRubric.length > 0
                ? q.essayRubric.map((r: any) => `<li><b>${r.criterion || r.step || 'Tiêu chí'}</b> (${r.points}đ): ${r.description || r.criteria || ''}</li>`).join('')
                : `<li>Trình bày đúng bản chất vấn đề, lập luận logic và kết luận chính xác (${q.points}đ).</li>`
            }
          </ul>
        </div>
      `
      }
    </div>
  `
    )
    .join('')}
  `
      : ''
  }

  ${
    isAnswersOnly
      ? `
  <div class="sec-head">BẢNG TỔNG HỢP ĐÁP ÁN & HƯỚNG DẪN CHẤM CHI TIẾT</div>
  ${test.questions
    .map(
      (q, i) => `
    <div class="q-item" style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
      <div><b>Câu ${i + 1} (${q.code} - ${q.points}đ) [${q.cognitiveLevel}]:</b> ${q.content}</div>
      ${
        q.type === 'multiple_choice'
          ? `<div style="color: #15803d; font-weight: bold; margin-top: 3px;">Đáp án: ${q.options?.find((o) => o.isCorrect)?.key}. ${q.options?.find((o) => o.isCorrect)?.text}</div>`
          : q.type === 'true_false'
          ? `<div style="margin-top: 3px;">${(q.options || []).map((o) => `<b>${o.key})</b> ${o.isCorrect ? 'ĐÚNG' : 'SAI'}`).join(' &bull; ')}</div>`
          : q.type === 'short_answer'
          ? `<div style="color: #15803d; font-weight: bold; margin-top: 3px;">Đáp số: ${q.correctAnswerText || 'Đúng theo dữ kiện'}</div>`
          : `<div style="margin-top: 3px;">${q.correctAnswerText}</div>`
      }
    </div>
  `
    )
    .join('')}
  `
      : ''
  }

  <table class="sign-table">
    <tr>
      <td>
        <div style="font-weight: bold;">NGƯỜI BIÊN SOẠN / TỔ TRƯỞNG</div>
        <div style="font-size: 10pt; font-style: italic;">(Ký và ghi rõ họ tên)</div>
        <div style="height: 60px;"></div>
        <div style="font-weight: bold;">${test.creatorName || APP_CONFIG.LEADER_NAME}</div>
      </td>
      <td>
        <div style="font-weight: bold;">GIÁO VIÊN BỘ MÔN / GVCN DUYỆT ĐỀ</div>
        <div style="font-size: 10pt; font-style: italic;">
          ${test.isApprovedByTeacher ? `Đã ký duyệt lúc: ${test.approvedAt}` : '(Chờ ký duyệt)'}
        </div>
        <div style="height: 60px; line-height: 60px; color: #15803d; font-weight: bold;">
          ${test.isApprovedByTeacher ? '✓ ĐÃ PHÊ DUYỆT CHÍNH THỨC' : ''}
        </div>
        <div style="font-weight: bold;">${test.approvedBy || APP_CONFIG.HOMEROOM_TEACHER}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất đề thi dạng tệp JSON để lưu trữ hoặc nhập vào hệ thống quản lý học tập (LMS)
 */
export function downloadTestAsJson(test: AssessmentTest) {
  const filename = `${test.code || 'DE'}_${test.subject.replace(/\s+/g, '_')}_Config.json`;
  const blob = new Blob([JSON.stringify(test, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Mở cửa sổ in đề thi chuẩn A4 hoặc Lưu thành PDF trực tiếp (hỗ trợ fallback nếu popup bị chặn)
 */
export function printTestPaper(test: AssessmentTest) {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback: Tự động tải về file HTML chuẩn in A4
      exportTestToHtml(test, 'full');
      return;
    }

    const part1 = test.questions.filter((q) => q.type === 'multiple_choice');
    const part2 = test.questions.filter((q) => q.type === 'true_false');
    const part3 = test.questions.filter((q) => q.type === 'short_answer');
    const part4 = test.questions.filter((q) => q.type === 'essay');

    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>In Đề Thi - ${test.title}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; color: #000; margin: 0; padding: 10px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .school { text-align: center; width: 45%; }
    .exam-info { text-align: center; width: 50%; }
    .bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .title { text-align: center; font-size: 14pt; font-weight: bold; margin: 10px 0; text-transform: uppercase; }
    .candidate-info { border: 1px solid #000; padding: 6px 12px; margin-bottom: 15px; font-size: 11pt; }
    .section-title { font-weight: bold; text-decoration: underline; margin-top: 14px; margin-bottom: 6px; font-size: 12pt; }
    .question { margin-bottom: 10px; page-break-inside: avoid; }
    .options { margin-left: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { border: 1px solid #000; padding: 4px 6px; font-size: 10.5pt; }
    th { background: #f2f2f2; text-align: center; }
    .no-print { margin-bottom: 15px; padding: 10px; background: #e0f2fe; border: 1px solid #38bdf8; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
      🖨️ Bấm Vào Đây Để In Hoặc Lưu Thành PDF
    </button>
    <p style="margin: 4px 0 0 0; font-size: 11px; color: #0369a1;">(Trong hộp thoại in, chọn "Lưu dưới dạng PDF" / "Save as PDF" để xuất tệp PDF sắc nét)</p>
  </div>

  <div class="header">
    <div class="school">
      <div>SỞ GD&ĐT TÂY NINH</div>
      <div class="bold">TRƯỜNG THPT DƯƠNG MINH CHÂU</div>
      <div>LỚP ${APP_CONFIG.CLASS_NAME} – TỔ 3</div>
    </div>
    <div class="exam-info">
      <div class="bold uppercase">ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ</div>
      <div class="bold">Môn: ${test.subject} – Khối: ${test.grade}</div>
      <div>Thời gian: ${test.durationMinutes} phút • Mã đề: <b>${test.code}</b></div>
    </div>
  </div>

  <div class="title">${test.title}</div>

  <div class="candidate-info">
    <table style="border: none; width: 100%;">
      <tr style="border: none;">
        <td style="border: none; width: 65%;">Họ và tên thí sinh: ...................................................................</td>
        <td style="border: none;">Số báo danh: .....................</td>
      </tr>
    </table>
  </div>

  ${
    part1.length > 0
      ? `
    <div class="section-title">PHẦN I. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (${part1.length} câu)</div>
    ${part1
      .map(
        (q, i) => `
      <div class="question">
        <div><b>Câu ${i + 1}:</b> ${q.content}</div>
        <div class="options">
          ${(q.options || []).map((o) => `<div><b>${o.key}.</b> ${o.text}</div>`).join('')}
        </div>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

  ${
    part2.length > 0
      ? `
    <div class="section-title">PHẦN II. TRẮC NGHIỆM ĐÚNG SAI (${part2.length} câu)</div>
    ${part2
      .map(
        (q, i) => `
      <div class="question">
        <div><b>Câu ${i + 1}:</b> ${q.content}</div>
        <table>
          <tr><th style="width: 10%;">Ý</th><th>Mệnh đề</th><th style="width: 12%;">Đúng</th><th style="width: 12%;">Sai</th></tr>
          ${(q.options || [])
            .map(
              (o) => `
            <tr><td style="text-align: center;"><b>${o.key}</b></td><td>${o.text}</td><td></td><td></td></tr>
          `
            )
            .join('')}
        </table>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

  ${
    part3.length > 0
      ? `
    <div class="section-title">PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN (${part3.length} câu)</div>
    ${part3
      .map(
        (q, i) => `
      <div class="question">
        <div><b>Câu ${i + 1}:</b> ${q.content}</div>
        <div style="margin-top: 4px; font-style: italic;">Đáp số: ....................................................................</div>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

  ${
    part4.length > 0
      ? `
    <div class="section-title">PHẦN IV. TỰ LUẬN (${part4.length} câu)</div>
    ${part4
      .map(
        (q, i) => `
      <div class="question">
        <div><b>Câu ${i + 1}:</b> ${q.content}</div>
        <div style="height: 100px; border-bottom: 1px dashed #aaa; margin-top: 8px;"></div>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

  <div style="text-align: center; margin-top: 25px; font-style: italic; font-weight: bold;">
    --------- HẾT ---------<br>
    <span style="font-weight: normal; font-size: 10pt;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>
</body>
</html>`;

    printWindow.document.write(content);
    printWindow.document.close();
  } catch (e) {
    // If any window.open security exception happens, fallback to HTML file download
    exportTestToHtml(test, 'full');
  }
}
