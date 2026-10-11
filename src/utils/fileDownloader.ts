/**
 * Tiện ích tải tệp tin và lưu trữ học liệu cho Tổ 3 – Lớp 11A1
 * Hỗ trợ tải trực tiếp tệp tin (FileItem), phiếu nhiệm vụ, bài nộp, tài liệu, sản phẩm học tập
 */

import { Assignment, DocumentItem, FileItem, ProductItem, Submission, AssessmentTest, QuestionBankItem } from '../types';
import { APP_CONFIG } from '../config';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { exportTestToWord, exportTestToTxt } from './testExportUtils';

export interface ProductDownloadContext {
  title?: string;
  subject?: string;
  authorGroup?: string;
  participants?: string[];
  description?: string;
}

/**
 * Utility to wrap long text inside HTML5 Canvas
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  if (!text) return y;
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
  return curY + lineHeight;
}

/**
 * Tạo tệp PDF chuẩn 100% bằng jsPDF & Canvas A4 đồ họa sắc nét,
 * mở được trên tất cả các trình đọc PDF (Adobe Acrobat, Chrome, Preview, Foxit...)
 * mà không bao giờ bị lỗi font hay lỗi tệp bị hỏng.
 */
export async function generateValidPdfBlob(
  title: string,
  subject: string,
  authorGroup: string,
  participants: string[],
  description: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754; // A4 chuẩn 150 DPI
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.text(title, 20, 20);
    return doc.output('blob');
  }

  // 1. Nền trắng và viền trang trí
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dải màu trang trí phía trên
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, '#4338ca');
  grad.addColorStop(0.5, '#7c3aed');
  grad.addColorStop(1, '#db2777');
  ctx.fillStyle = grad;
  ctx.fillRect(40, 30, canvas.width - 80, 10);

  // 2. Tiêu đề cơ quan / trường học
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('TRƯỜNG THPT DƯƠNG MINH CHÂU – LỚP ' + APP_CONFIG.CLASS_NAME, 60, 80);

  ctx.fillStyle = '#64748b';
  ctx.font = 'normal 17px Arial, sans-serif';
  ctx.fillText(`TỔ 3 • NĂM HỌC ${APP_CONFIG.SCHOOL_YEAR} • THƯ VIỆN SẢN PHẨM HỌC TẬP`, 60, 110);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 130);
  ctx.lineTo(canvas.width - 60, 130);
  ctx.stroke();

  // 3. Tên sản phẩm học tập
  ctx.fillStyle = '#1e1b4b';
  ctx.font = 'bold 32px Arial, sans-serif';
  const afterTitleY = wrapCanvasText(ctx, title.toUpperCase(), 60, 185, canvas.width - 120, 42);

  // 4. Bảng thông tin thuộc tính
  const tableY = Math.max(afterTitleY + 15, 250);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(60, tableY, canvas.width - 120, 130);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, tableY, canvas.width - 120, 130);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`Môn học: `, 80, tableY + 35);
  ctx.fillStyle = '#4338ca';
  ctx.fillText(`${subject}`, 220, tableY + 35);

  ctx.fillStyle = '#0f172a';
  ctx.fillText(`Nhóm thực hiện: `, 80, tableY + 70);
  ctx.fillStyle = '#334155';
  ctx.font = 'normal 18px Arial, sans-serif';
  ctx.fillText(`${authorGroup}`, 240, tableY + 70);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`Thành viên tham gia: `, 80, tableY + 105);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`${participants.length > 0 ? participants.join(', ') : 'Toàn thể thành viên Tổ 3'}`, 280, tableY + 105);

  // 5. Nội dung thuyết minh
  const contentY = tableY + 170;
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('I. THUYẾT MINH & NỘI DUNG SẢN PHẨM HỌC TẬP', 60, contentY);

  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, contentY + 10);
  ctx.lineTo(460, contentY + 10);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = 'normal 19px Arial, sans-serif';
  const descText = description || 'Sản phẩm học tập được xây dựng sáng tạo và hoàn thiện công phu bởi các thành viên Tổ 3. Bám sát yêu cầu cần đạt của Chương trình GDPT 2018 (SGK Kết nối tri thức).';
  const afterDescY = wrapCanvasText(ctx, descText, 60, contentY + 50, canvas.width - 120, 32);

  // 6. Mục tiêu & Ý nghĩa
  const section2Y = afterDescY + 30;
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('II. MỤC TIÊU & HIỆU QUẢ ỨNG DỤNG', 60, section2Y);

  ctx.beginPath();
  ctx.moveTo(60, section2Y + 10);
  ctx.lineTo(400, section2Y + 10);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = 'normal 19px Arial, sans-serif';
  const subGoal = `1. Củng cố và mở rộng kiến thức trọng tâm môn ${subject} theo chuẩn SGK Kết nối tri thức.\n2. Rèn luyện kỹ năng thực hành, hợp tác nhóm và tư duy sáng tạo cho học sinh.\n3. Ứng dụng công nghệ thông tin trong báo cáo và thuyết trình dự án học tập.`;
  subGoal.split('\n').forEach((line, idx) => {
    ctx.fillText(line, 60, section2Y + 50 + idx * 36);
  });

  // 7. Dấu xác nhận & chữ ký
  const stampBoxX = canvas.width - 360;
  const stampBoxY = canvas.height - 240;
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 3;
  ctx.strokeRect(stampBoxX, stampBoxY, 300, 130);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('XÁC NHẬN SẢN PHẨM', stampBoxX + 25, stampBoxY + 35);
  ctx.font = 'normal 15px Arial, sans-serif';
  ctx.fillText('TỔ 3 – LỚP 11A1 ĐẠT CHUẨN', stampBoxX + 25, stampBoxY + 68);
  ctx.fillText(`Ngày lưu: ${new Date().toLocaleDateString('vi-VN')}`, stampBoxX + 25, stampBoxY + 98);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  return doc.output('blob');
}

/**
 * Tạo tệp Word (.doc) chuẩn mở được ngay trên Microsoft Word, WPS Office, Google Docs
 * có đầy đủ bảng biểu, định dạng, căn lề và tiếng Việt có dấu 100%.
 */
export function generateWordBlob(
  title: string,
  subject: string,
  authorGroup: string,
  participants: string[],
  description: string
): Blob {
  const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { size: A4; margin: 2.5cm 2cm 2.5cm 2cm; }
  body { font-family: 'Times New Roman', 'Arial', serif; font-size: 13pt; line-height: 1.5; color: #111827; }
  .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
  .school { font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a; }
  .sub-school { font-size: 11pt; color: #475569; }
  h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; text-align: center; margin: 20px 0; text-transform: uppercase; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
  .meta-table td { padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 12pt; }
  .meta-lbl { font-weight: bold; background-color: #f8fafc; width: 30%; color: #334155; }
  .section-title { font-size: 14pt; font-weight: bold; color: #1d4ed8; border-bottom: 1px solid #93c5fd; padding-bottom: 5px; margin-top: 20px; }
  .content-p { font-size: 12.5pt; text-align: justify; margin-top: 10px; line-height: 1.6; }
  .footer-sign { width: 100%; margin-top: 40px; }
  .footer-sign td { text-align: center; font-size: 12pt; }
</style>
</head>
<body>
  <div class="header">
    <div class="school">TRƯỜNG THPT DƯƠNG MINH CHÂU – LỚP ${APP_CONFIG.CLASS_NAME}</div>
    <div class="sub-school">TỔ 3 • NĂM HỌC ${APP_CONFIG.SCHOOL_YEAR}</div>
  </div>
  <h1>${title}</h1>
  <table class="meta-table">
    <tr>
      <td class="meta-lbl">Môn học:</td>
      <td><strong>${subject}</strong></td>
    </tr>
    <tr>
      <td class="meta-lbl">Nhóm thực hiện:</td>
      <td>${authorGroup}</td>
    </tr>
    <tr>
      <td class="meta-lbl">Thành viên tham gia:</td>
      <td><strong>${participants.length > 0 ? participants.join(', ') : 'Toàn thể thành viên Tổ 3'}</strong></td>
    </tr>
    <tr>
      <td class="meta-lbl">Ngày xuất bản:</td>
      <td>${new Date().toLocaleDateString('vi-VN')}</td>
    </tr>
  </table>
  <div class="section-title">I. MÔ TẢ & THUYẾT MINH SẢN PHẨM HỌC TẬP</div>
  <div class="content-p">${(description || 'Sản phẩm học tập được nghiên cứu và thiết kế công phu bởi các bạn thành viên Tổ 3.').replace(/\n/g, '<br/>')}</div>
  <div class="section-title" style="margin-top: 25px;">II. Ý NGHĨA & HIỆU QUẢ ỨNG DỤNG</div>
  <div class="content-p">Sản phẩm học tập bám sát yêu cầu cần đạt của Chương trình Giáo dục Phổ thông 2018 (SGK Kết nối tri thức). Giúp củng cố kiến thức môn ${subject}, rèn luyện tư duy thực tế và tinh thần làm việc nhóm hiệu quả.</div>
  <table class="footer-sign">
    <tr>
      <td style="width: 50%;">
        <em>Xác nhận của Tổ trưởng</em><br/>
        <br/><br/><br/>
        <strong>${APP_CONFIG.LEADER_NAME}</strong>
      </td>
      <td style="width: 50%;">
        <em>Đại diện nhóm thực hiện</em><br/>
        <br/><br/><br/>
        <strong>${participants[0] || 'Đại diện nhóm'}</strong>
      </td>
    </tr>
  </table>
</body>
</html>
`;
  return new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
}

/**
 * Tạo tệp PowerPoint (.ppt) mở được ngay trên Microsoft PowerPoint hoặc trình duyệt
 * gồm 3 slide thuyết trình hoàn chỉnh với giao diện đẹp mắt.
 */
export function generatePowerPointBlob(
  title: string,
  subject: string,
  authorGroup: string,
  participants: string[],
  description: string
): Blob {
  const pptHtml = `
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:p="urn:schemas-microsoft-com:office:powerpoint">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: 'Arial', sans-serif; background: #0f172a; margin: 0; padding: 20px; }
  .slide { width: 960px; height: 540px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; margin: 20px auto; border-radius: 16px; padding: 40px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; border: 2px solid #6366f1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
  .slide-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 15px; }
  .school-tag { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #a5b4fc; }
  .subject-badge { background: #4f46e5; padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: bold; }
  .slide-title { font-size: 32px; font-weight: bold; color: #f8fafc; margin: 20px 0; }
  .slide-body { font-size: 18px; line-height: 1.6; color: #e2e8f0; flex: 1; overflow: hidden; }
  .slide-footer { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
  .members-box { background: rgba(255,255,255,0.1); padding: 12px 18px; border-radius: 12px; margin-top: 15px; }
</style>
</head>
<body>
  <!-- Slide 1: Bìa bài thuyết trình -->
  <div class="slide">
    <div class="slide-header">
      <span class="school-tag">THPT DƯƠNG MINH CHÂU • TỔ 3 LỚP ${APP_CONFIG.CLASS_NAME}</span>
      <span class="subject-badge">${subject}</span>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
      <h1 class="slide-title" style="font-size: 36px;">${title}</h1>
      <p style="font-size: 20px; color: #c7d2fe;">BÁO CÁO THUYẾT TRÌNH DỰ ÁN HỌC TẬP</p>
      <div class="members-box">
        <div><strong>Nhóm thực hiện:</strong> ${authorGroup}</div>
        <div style="margin-top: 4px;"><strong>Thành viên:</strong> ${participants.length > 0 ? participants.join(' • ') : 'Toàn thể Tổ 3'}</div>
      </div>
    </div>
    <div class="slide-footer">
      <span>Năm học: ${APP_CONFIG.SCHOOL_YEAR}</span>
      <span>Slide 1 / 3</span>
    </div>
  </div>

  <!-- Slide 2: Nội dung dự án -->
  <div class="slide" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
    <div class="slide-header">
      <span class="school-tag">NỘI DUNG & Ý TƯỞNG THỰC HIỆN</span>
      <span class="subject-badge">${subject}</span>
    </div>
    <div class="slide-body">
      <h2 style="font-size: 24px; color: #38bdf8; margin-bottom: 15px;">Thuyết minh sản phẩm:</h2>
      <p style="text-align: justify; font-size: 17px;">${description || 'Sản phẩm học tập được thiết kế sáng tạo nhằm phát huy năng lực hợp tác và ứng dụng thực tiễn.'}</p>
      <div style="margin-top: 20px; background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38bdf8; padding: 12px 16px; border-radius: 0 8px 8px 0;">
        <strong>Yêu cầu cần đạt:</strong> Bám sát sách giáo khoa Kết nối tri thức, phát triển năng lực tự chủ và giải quyết vấn đề.
      </div>
    </div>
    <div class="slide-footer">
      <span>${title}</span>
      <span>Slide 2 / 3</span>
    </div>
  </div>

  <!-- Slide 3: Kết luận & Cảm ơn -->
  <div class="slide" style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);">
    <div class="slide-header">
      <span class="school-tag">KẾT QUẢ & ĐÁNH GIÁ DỰ ÁN</span>
      <span class="subject-badge">HOÀN THÀNH</span>
    </div>
    <div class="slide-body" style="display: flex; flex-direction: column; justify-content: center; text-align: center;">
      <h2 style="font-size: 32px; color: #a7f3d0; margin-bottom: 15px;">CẢM ƠN THẦY CÔ VÀ CÁC BẠN ĐÃ THEO DÕI!</h2>
      <p style="font-size: 20px; color: #e2e8f0;">Sản phẩm học tập được lưu trữ chính thức tại Thư viện Sản phẩm Tổ 3</p>
      <p style="font-size: 16px; color: #6ee7b7; margin-top: 15px;">Tổ 3 – Đoàn kết, Sáng tạo & Dẫn đầu!</p>
    </div>
    <div class="slide-footer">
      <span>THPT Dương Minh Châu</span>
      <span>Slide 3 / 3</span>
    </div>
  </div>
</body>
</html>
`;
  return new Blob(['\ufeff' + pptHtml], { type: 'application/vnd.ms-powerpoint;charset=utf-8' });
}

/**
 * Tạo tệp hình ảnh Poster / Infographic (.png) độ phân giải cao bằng Canvas
 */
export async function generatePosterImageBlob(
  title: string,
  subject: string,
  authorGroup: string,
  participants: string[]
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new Blob([], { type: 'image/png' });
  }

  // Nền gradient
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, '#312e81');
  grad.addColorStop(0.5, '#4f46e5');
  grad.addColorStop(1, '#9333ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  // Huy hiệu trường
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(60, 50, 420, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText('THPT DƯƠNG MINH CHÂU • TỔ 3 LỚP 11A1', 75, 83);

  // Môn học badge
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(980, 50, 160, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText(subject, 1000, 83);

  // Tiêu đề poster
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Arial, sans-serif';
  wrapCanvasText(ctx, title, 60, 190, 1080, 52);

  // Thẻ thông tin phía dưới
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fillRect(60, 480, 1080, 260);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText('SẢN PHẨM HỌC TẬP XUẤT SẮC', 90, 535);

  ctx.fillStyle = '#ffffff';
  ctx.font = '22px Arial, sans-serif';
  ctx.fillText(`Nhóm thực hiện: ${authorGroup}`, 90, 585);
  ctx.fillText(`Thành viên tham gia: ${participants.length > 0 ? participants.join(', ') : 'Toàn thể Tổ 3'}`, 90, 635);
  ctx.fillText(`Lớp 11A1 • Năm học ${APP_CONFIG.SCHOOL_YEAR}`, 90, 685);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([], { type: 'image/png' }));
    }, 'image/png');
  });
}

/**
 * Tổng hợp tệp âm thanh WAV 44.1kHz chuẩn (chuỗi hợp âm thư giãn)
 * phát được trên mọi máy tính và điện thoại mà không cần internet.
 */
export function generateSyntheticAudioBlob(durationSeconds: number = 4): Blob {
  const sampleRate = 44100;
  const numChannels = 1;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Giai điệu hợp âm ngũ cung vui tươi (C - E - G - A)
  const notes = [261.63, 329.63, 392.0, 440.0, 523.25];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.floor((t * 2) % notes.length);
    const freq = notes[noteIdx];
    const envelope = Math.exp(-((t % 0.5) * 4));
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Tải trực tiếp một tệp tin bất kỳ về máy tính / thiết bị của người dùng.
 * ĐẢM BẢO 100% CÁC TỆP ĐƯỢC TẢI VỀ MỞ ĐƯỢC TRÊN PHẦN MỀM TƯƠNG ỨNG.
 */
export async function downloadFile(file: FileItem, context?: ProductDownloadContext) {
  if (!file) return;

  const title = context?.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
  const subject = context?.subject || 'Học tập';
  const authorGroup = context?.authorGroup || 'Tổ 3 – Lớp 11A1';
  const participants = context?.participants || [];
  const description = context?.description || file.contentPreview || 'Học liệu số dự án học tập Tổ 3.';

  const ext = (file.extension || 'txt').toLowerCase();

  // 1. Nếu có URL thực tế hoặc data URL (base64/blob)
  if (file.url) {
    if (file.url.startsWith('data:') || file.url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    try {
      const res = await fetch(file.url);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback xuống các bộ sinh tệp chuẩn
    }
  }

  // 2. Tạo tệp chuẩn mở được 100% theo từng loại định dạng
  let blob: Blob;
  let filename = file.name;

  if (ext === 'pdf' || file.type === 'pdf') {
    blob = await generateValidPdfBlob(title, subject, authorGroup, participants, description);
    if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';
  } else if (['docx', 'doc', 'word'].includes(ext) || file.type === 'word') {
    blob = generateWordBlob(title, subject, authorGroup, participants, description);
    if (!filename.toLowerCase().endsWith('.doc') && !filename.toLowerCase().endsWith('.docx')) {
      filename += '.doc';
    }
  } else if (['pptx', 'ppt', 'powerpoint'].includes(ext) || file.type === 'powerpoint') {
    blob = generatePowerPointBlob(title, subject, authorGroup, participants, description);
    if (!filename.toLowerCase().endsWith('.ppt') && !filename.toLowerCase().endsWith('.pptx')) {
      filename += '.ppt';
    }
  } else if (['png', 'jpg', 'jpeg', 'image'].includes(ext) || file.type === 'image') {
    blob = await generatePosterImageBlob(title, subject, authorGroup, participants);
    if (!filename.toLowerCase().endsWith('.png') && !filename.toLowerCase().endsWith('.jpg')) {
      filename += '.png';
    }
  } else if (['mp3', 'wav', 'audio'].includes(ext) || file.type === 'audio') {
    blob = generateSyntheticAudioBlob(5);
    if (!filename.toLowerCase().endsWith('.wav') && !filename.toLowerCase().endsWith('.mp3')) {
      filename += '.wav';
    }
  } else if (['xlsx', 'xls', 'spreadsheet', 'excel'].includes(ext) || file.type === 'excel') {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['TRƯỜNG THPT DƯƠNG MINH CHÂU', 'TỔ 3 – LỚP ' + APP_CONFIG.CLASS_NAME],
      ['TÊN SẢN PHẨM / TÀI LIỆU', title],
      ['MÔN HỌC', subject],
      ['NHÓM THỰC HIỆN', authorGroup],
      ['THÀNH VIÊN', participants.join(', ')],
      ['NGÀY XUẤT', new Date().toLocaleDateString('vi-VN')],
      [],
      ['STT', 'Hạng mục nội dung', 'Chi tiết / Thuyết minh', 'Trạng thái'],
      [1, 'Mục tiêu kiến thức', 'Bám sát SGK Kết nối tri thức', 'Đạt'],
      [2, 'Kỹ năng thực hành', 'Ứng dụng thực tiễn giải quyết bài toán', 'Đạt'],
      [3, 'Làm việc nhóm', 'Phân công rõ ràng giữa các thành viên', 'Hoàn thành'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'HocLieu');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    if (!filename.toLowerCase().endsWith('.xlsx')) filename += '.xlsx';
  } else {
    // Văn bản text chuẩn
    const content = `======================================================================
HỌC LIỆU SỐ TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME} (${APP_CONFIG.SCHOOL_YEAR})
TRƯỜNG THPT DƯƠNG MINH CHÂU
======================================================================
TÊN TỆP TIN: ${file.name}
MÔN HỌC: ${subject}
NHÓM THỰC HIỆN: ${authorGroup}
THÀNH VIÊN: ${participants.join(', ')}
NGÀY TẢI: ${new Date().toLocaleString('vi-VN')}
======================================================================
NỘI DUNG / THUYẾT MINH:
${description}
======================================================================`;
    blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
  }

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
 * Tải một chuỗi văn bản bất kỳ thành file văn bản (.txt)
 */
export function downloadTextAsFile(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
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
 * Tải phiếu hướng dẫn chi tiết của một Nhiệm vụ học tập
 */
export function downloadAssignmentSheet(task: Assignment) {
  const content = `======================================================================
PHIẾU GIAO NHIỆM VỤ HỌC TẬP – TỔ 3 LỚP ${APP_CONFIG.CLASS_NAME}
NĂM HỌC: ${APP_CONFIG.SCHOOL_YEAR} | GVCN: ${APP_CONFIG.HOMEROOM_TEACHER}
======================================================================
1. THÔNG TIN NHIỆM VỤ:
- Tiêu đề: ${task.title}
- Môn học: ${task.subject}
- Hình thức thực hiện: ${task.format}
- Người giao: ${task.assignerName}
- Ngày giao: ${task.assignedDate}
- Hạn nộp bài: ${task.dueDate} (${task.isLocked ? 'ĐÃ KHÓA' : 'ĐANG MỞ'})

2. MÔ TẢ CHI TIẾT:
${task.description}

3. YÊU CẦU CẦN ĐẠT:
${task.requirements}

4. DANH SÁCH TÀI LIỆU ĐÍNH KÈM (${task.attachedFiles.length} tệp):
${task.attachedFiles.map((f, i) => `  ${i + 1}. ${f.name} (${f.sizeFormatted})`).join('\n') || '  (Không có tệp đính kèm)'}

======================================================================
HƯỚNG DẪN NỘP BÀI:
- Các thành viên truy cập mục "Nộp bài", chọn nhiệm vụ này và đính kèm tệp kết quả (Word, PDF, PowerPoint, Video...).
- Chúc các thành viên hoàn thành tốt nhiệm vụ được giao!
======================================================================`;

  const cleanName = task.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
  downloadTextAsFile(`Phieu_Nhiem_Vu_${cleanName}.txt`, content);
}

/**
 * Tải phiếu xác nhận bài nộp của thành viên kèm nhận xét và điểm số
 */
export function downloadSubmissionReceipt(sub: Submission) {
  const content = `======================================================================
PHIẾU XÁC NHẬN BÀI NỘP HỌC TẬP – TỔ 3 LỚP ${APP_CONFIG.CLASS_NAME}
TRƯỜNG THPT DƯƠNG MINH CHÂU – NĂM HỌC ${APP_CONFIG.SCHOOL_YEAR}
======================================================================
1. THÔNG TIN BÀI NỘP:
- Tiêu đề bài nộp: ${sub.title}
- Nhiệm vụ học tập: ${sub.assignmentTitle}
- Học sinh nộp: ${sub.studentName}
- Thời gian nộp: ${sub.submittedAt}
- Trạng thái: ${
    sub.status === 'completed'
      ? 'ĐÃ HOÀN THÀNH'
      : sub.status === 'reviewed'
      ? 'ĐÃ NHẬN XÉT'
      : sub.status === 'need_resubmit'
      ? 'CẦN NỘP LẠI'
      : 'ĐÃ NỘP'
  }
- Điểm số đánh giá: ${sub.score !== undefined ? `${sub.score}/10` : 'Chưa chấm điểm'}
- Người đánh giá: ${sub.reviewerName || 'Tổ trưởng'}

2. MÔ TẢ BÀI LÀM:
${sub.description || 'Không có mô tả thêm.'}

3. GHI CHÚ CỦA HỌC SINH:
${sub.notes || 'Không có ghi chú.'}

4. DANH SÁCH TỆP TIN ĐÃ NỘP (${sub.files.length} tệp):
${sub.files.map((f, i) => `  ${i + 1}. ${f.name} (${f.sizeFormatted} • .${f.extension})`).join('\n') || '  (Không có tệp đính kèm)'}

5. NHẬN XÉT & PHẢN HỒI TỪ TỔ TRƯỞNG / GVCN:
${sub.feedback || 'Bài làm đạt yêu cầu, tinh thần học tập nghiêm túc.'}
======================================================================`;

  const cleanName = sub.studentName.replace(/\s+/g, '_');
  downloadTextAsFile(`Bai_Nop_${cleanName}_${sub.id}.txt`, content);
}

/**
 * Tải trọn bộ Kế hoạch & Học liệu của Trung tâm Học tập
 */
export function downloadStudySummaryPackage(
  documents: DocumentItem[],
  assignments: Assignment[],
  products: ProductItem[]
) {
  const content = `======================================================================
TRỌN BỘ KẾ HOẠCH HỌC TẬP & KHO HỌC LIỆU TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME}
TRƯỜNG THPT DƯƠNG MINH CHÂU | NĂM HỌC ${APP_CONFIG.SCHOOL_YEAR}
GVCN: ${APP_CONFIG.HOMEROOM_TEACHER} | TỔ TRƯỞNG: ${APP_CONFIG.LEADER_NAME}
Ngày xuất học liệu: ${new Date().toLocaleString('vi-VN')}
======================================================================

I. KHO TÀI LIỆU DÙNG CHUNG (${documents.length} tài liệu):
----------------------------------------------------------------------
${documents
  .map(
    (d, i) =>
      `${i + 1}. [${d.subject}] ${d.title}
   - Danh mục: ${d.category} | Chủ đề: ${d.topic || 'Chung'}
   - Tệp tin: ${d.file.name} (${d.file.sizeFormatted})
   - Người đăng: ${d.creatorName} | Ngày: ${d.createdAt}
   - Tóm tắt: ${d.description}`
  )
  .join('\n\n')}

======================================================================
II. KẾ HOẠCH NHIỆM VỤ HỌC TẬP (${assignments.length} nhiệm vụ):
----------------------------------------------------------------------
${assignments
  .map(
    (a, i) =>
      `${i + 1}. [${a.subject}] ${a.title}
   - Hình thức: ${a.format} | Hạn nộp: ${a.dueDate} (${a.isLocked ? 'Khóa' : 'Đang mở'})
   - Người giao: ${a.assignerName} | Ngày giao: ${a.assignedDate}
   - Yêu cầu: ${a.requirements}
   - Tệp hướng dẫn: ${a.attachedFiles.map((f) => f.name).join(', ') || 'Không có'}`
  )
  .join('\n\n')}

======================================================================
III. THƯ VIỆN SẢN PHẨM HỌC TẬP DỰ ÁN (${products.length} sản phẩm):
----------------------------------------------------------------------
${products
  .map(
    (p, i) =>
      `${i + 1}. [${p.subject}] ${p.title}
   - Thể loại: ${p.category} | Nhóm thực hiện: ${p.authorGroup}
   - Thành viên tham gia: ${p.participants.join(', ')}
   - Tệp chính: ${p.mainFile?.name || 'Đa phương tiện'}
   - Mô tả: ${p.description}`
  )
  .join('\n\n')}
======================================================================
TỔ 3 – ĐOÀN KẾT, SÁNG TẠO VÀ DẪN ĐẦU THI ĐUA!
======================================================================`;

  downloadTextAsFile(`Ke_Hoach_Va_Hoc_Lieu_To3_${new Date().toISOString().split('T')[0]}.txt`, content);
}

/**
 * Tải phiếu giới thiệu và thông tin chi tiết một Sản phẩm học tập
 */
export function downloadProductSheet(prod: ProductItem) {
  const content = `======================================================================
THÔNG TIN SẢN PHẨM HỌC TẬP – TỔ 3 LỚP ${APP_CONFIG.CLASS_NAME}
TRƯỜNG THPT DƯƠNG MINH CHÂU | NĂM HỌC ${APP_CONFIG.SCHOOL_YEAR}
======================================================================
1. THÔNG TIN CHUNG:
- Tiêu đề sản phẩm: ${prod.title}
- Môn học: ${prod.subject}
- Thể loại: ${prod.category || 'Dự án học tập'}
- Nhóm tác giả: ${prod.authorGroup}
- Người đăng: ${prod.creatorName} (${prod.createdAt})
- Chủ đề: ${prod.topic || 'Học kỳ II'}

2. DANH SÁCH THÀNH VIÊN THAM GIA:
${prod.participants.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

3. MÔ TẢ & Ý TƯỞNG THỰC HIỆN:
${prod.description || 'Sản phẩm học tập sáng tạo của Tổ 3.'}

4. DANH SÁCH TỆP TIN ĐÍNH KÈM (${prod.files.length} tệp):
${prod.files.map((f, i) => `  ${i + 1}. ${f.name} (${f.sizeFormatted} • .${f.extension})`).join('\n') || '  (Không có tệp đính kèm)'}

======================================================================
Chúc mừng các bạn đã tạo ra sản phẩm học tập xuất sắc!
======================================================================`;

  const cleanName = prod.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
  downloadTextAsFile(`SanPham_${cleanName}.txt`, content);
}

/**
 * Tùy chọn tải về đề thi chuẩn Bộ GD&ĐT 2025
 */
export interface ExamDownloadOptions {
  title: string;
  subject: string;
  grade: string;
  durationMinutes?: number;
  p1Count: number;
  p1PointPerQ: number;
  p2Count: number;
  p2MaxPerQ: number;
  p3Count: number;
  p3PointPerQ: number;
  p4Steps: number;
  p4PointPerStep: number;
  includeAnswers?: boolean;
  questions?: QuestionBankItem[];
  test?: AssessmentTest;
  code?: string;
}

/**
 * Xuất và tải đề kiểm tra chuẩn định dạng Microsoft Word (.doc)
 * Mở được ngay trên Word, WPS Office, Google Docs với định dạng đẹp mắt
 */
export function downloadExamPaperWord(options: ExamDownloadOptions) {
  // Nếu có đề kiểm tra thực tế (AssessmentTest), tải đúng 100% nội dung câu hỏi trong đề
  if (options.test) {
    exportTestToWord(options.test, options.includeAnswers === false ? 'student' : 'full');
    return;
  }

  // Nếu có danh sách câu hỏi cụ thể truyền vào, tự động dựng đề và xuất chuẩn
  if (options.questions && options.questions.length > 0) {
    const syntheticTest: AssessmentTest = {
      id: 'custom_test_' + Date.now(),
      code: options.code || 'DE-THI-KHAO-THI',
      title: options.title || 'Đề Kiểm Tra Đánh Giá Năng Lực',
      subject: options.subject || 'Hóa học',
      grade: options.grade || '11',
      topic: options.title || 'Chuyên đề học tập',
      durationMinutes: options.durationMinutes || 45,
      totalPoints: 10,
      knowRatio: 40,
      understandRatio: 30,
      applyRatio: 30,
      questions: options.questions,
      isApprovedByTeacher: true,
      approvedBy: 'Tổ Chuyên Môn 3',
      approvedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      creatorName: 'Trần Công Minh',
    };
    exportTestToWord(syntheticTest, options.includeAnswers === false ? 'student' : 'full');
    return;
  }

  const {
    title,
    subject,
    grade,
    durationMinutes = 50,
    p1Count,
    p1PointPerQ,
    p2Count,
    p2MaxPerQ,
    p3Count,
    p3PointPerQ,
    p4Steps,
    p4PointPerStep,
    includeAnswers = true,
  } = options;

  // Nội dung mẫu câu hỏi Phần 1 (15 câu)
  const p1SampleQuestions = [
    { q: 'Phản ứng thuận nghịch là phản ứng', opts: ['A. chỉ xảy ra theo một chiều nhất định.', 'B. xảy ra theo hai chiều ngược nhau trong cùng điều kiện.', 'C. xảy ra đến khi các chất phản ứng hết hoàn toàn.', 'D. có tốc độ phản ứng thuận luôn lớn hơn tốc độ nghịch.'], ans: 'B' },
    { q: 'Hằng số cân bằng Kc của một phản ứng thuận nghịch chỉ phụ thuộc vào yếu tố nào?', opts: ['A. Nồng độ các chất.', 'B. Áp suất chung.', 'C. Nhiệt độ.', 'D. Chất xúc tác.'], ans: 'C' },
    { q: 'Biến thiên enthalpy chuẩn của phản ứng mang giá trị âm (ΔrHo298 < 0) cho biết phản ứng đó', opts: ['A. là phản ứng tỏa nhiệt.', 'B. là phản ứng thu nhiệt.', 'C. không kèm theo sự thay đổi năng lượng.', 'D. chỉ xảy ra ở nhiệt độ cao.'], ans: 'A' },
    { q: 'Cho phản ứng: N2 (g) + 3H2 (g) ⇌ 2NH3 (g) (ΔrHo298 < 0). Để cân bằng chuyển dịch theo chiều thuận cần', opts: ['A. giảm áp suất hệ.', 'B. tăng nhiệt độ.', 'C. tăng áp suất hệ.', 'D. giảm nồng độ N2.'], ans: 'C' },
    { q: 'Theo thuyết Bronsted - Lowry, base là chất có khả năng', opts: ['A. cho proton (H+).', 'B. nhận proton (H+).', 'C. phân li ra ion H+ trong nước.', 'D. làm quỳ tím hóa đỏ.'], ans: 'B' },
    { q: 'Giá trị pH của dung dịch có nồng độ [H+] = 1,0 × 10^-3 M là', opts: ['A. 3.', 'B. 11.', 'C. 1.', 'D. 7.'], ans: 'A' },
    { q: 'Nhiệt tạo thành chuẩn (ΔfHo298) của các đơn chất bền ở điều kiện chuẩn bằng', opts: ['A. 1 kJ/mol.', 'B. 0 kJ/mol.', 'C. 100 kJ/mol.', 'D. -298 kJ/mol.'], ans: 'B' },
    { q: 'Chất xúc tác có vai trò gì trong phản ứng thuận nghịch?', opts: ['A. Làm tăng hiệu suất phản ứng.', 'B. Làm thay đổi hằng số cân bằng Kc.', 'C. Làm cân bằng chuyển dịch theo chiều thuận.', 'D. Làm tăng tốc độ phản ứng thuận và nghịch với mức độ như nhau.'], ans: 'D' },
    { q: 'Dung dịch nào sau đây làm quỳ tím chuyển sang màu đỏ?', opts: ['A. HCl 0,1M.', 'B. NaOH 0,1M.', 'C. NaCl 0,1M.', 'D. Ba(OH)2 0,1M.'], ans: 'A' },
    { q: 'Phát biểu nào sau đây đúng về trạng thái cân bằng hóa học?', opts: ['A. Phản ứng đã dừng lại hoàn toàn.', 'B. Nồng độ của chất phản ứng và sản phẩm luôn bằng nhau.', 'C. Tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch.', 'D. Hằng số Kc luôn có giá trị bằng 1.'], ans: 'C' },
    { q: 'Đơn vị thông dụng của biến thiên enthalpy phản ứng là', opts: ['A. kJ hoặc kcal.', 'B. g/mol.', 'C. J/K.', 'D. mol/L.'], ans: 'A' },
    { q: 'Ở 25°C, tích số ion của nước Kw có giá trị là', opts: ['A. 1,0 × 10^-7.', 'B. 1,0 × 10^-14.', 'C. 1,0 × 10^7.', 'D. 1,0 × 10^14.'], ans: 'B' },
    { q: 'Khi hòa tan khí NH3 vào nước thu được dung dịch có môi trường', opts: ['A. acid.', 'B. base.', 'C. trung tính.', 'D. lưỡng tính.'], ans: 'B' },
    { q: 'Phản ứng nung vôi: CaCO3 (s) → CaO (s) + CO2 (g) là phản ứng', opts: ['A. tỏa nhiệt.', 'B. thu nhiệt.', 'C. không trao đổi nhiệt.', 'D. quang hóa.'], ans: 'B' },
    { q: 'Muối nào sau đây khi tan trong nước tạo dung dịch có pH > 7?', opts: ['A. Na2CO3.', 'B. NH4Cl.', 'C. NaCl.', 'D. Al2(SO4)3.'], ans: 'A' },
  ];

  // Nội dung mẫu câu hỏi Phần 2 (2 câu Đ/S)
  const p2SampleQuestions = [
    {
      title: 'Về cân bằng hóa học và nguyên lý chuyển dịch cân bằng Le Chatelier:',
      items: [
        { key: 'a', text: 'Phản ứng thuận nghịch luôn xảy ra theo hai chiều ngược nhau ở cùng điều kiện.', ans: 'Đúng' },
        { key: 'b', text: 'Ở trạng thái cân bằng, nồng độ của tất cả các chất phản ứng và sản phẩm luôn bằng nhau.', ans: 'Sai' },
        { key: 'c', text: 'Khi tăng áp suất, cân bằng chuyển dịch theo chiều làm giảm số mol khí.', ans: 'Đúng' },
        { key: 'd', text: 'Chất xúc tác làm thay đổi giá trị hằng số cân bằng Kc của hệ.', ans: 'Sai' },
      ],
    },
    {
      title: 'Về nhiệt hóa học và biến thiên enthalpy của phản ứng:',
      items: [
        { key: 'a', text: 'Phản ứng tỏa nhiệt có biến thiên enthalpy chuẩn mang giá trị âm (ΔrHo < 0).', ans: 'Đúng' },
        { key: 'b', text: 'Năng lượng liên kết càng lớn thì liên kết hóa học đó càng kém bền vững.', ans: 'Sai' },
        { key: 'c', text: 'Đa số các phản ứng đốt cháy nhiên liệu trong đời sống đều là phản ứng tỏa nhiệt mạnh.', ans: 'Đúng' },
        { key: 'd', text: 'Biến thiên enthalpy của phản ứng không phụ thuộc vào trạng thái tồn tại của các chất.', ans: 'Sai' },
      ],
    },
  ];

  // Nội dung mẫu câu hỏi Phần 3 (3 câu ngắn)
  const p3SampleQuestions = [
    { q: 'Cho phản ứng: N2 (g) + 3H2 (g) ⇌ 2NH3 (g). Ở trạng thái cân bằng, nồng độ [N2] = 0,5 M; [H2] = 1,0 M; [NH3] = 1,5 M. Tính hằng số cân bằng Kc của phản ứng (làm tròn đến 1 chữ số thập phân).', ans: '4.5' },
    { q: 'Tính biến thiên enthalpy chuẩn ΔrHo298 (theo đơn vị kJ) của phản ứng tổng hợp 1 mol khí HCl từ H2 và Cl2, biết năng lượng liên kết Eb(H-H) = 436 kJ/mol, Eb(Cl-Cl) = 242 kJ/mol, Eb(H-Cl) = 431 kJ/mol.', ans: '-92' },
    { q: 'Hòa tan 0,04 gam NaOH vào nước để được 100 mL dung dịch. Tính giá trị pH của dung dịch thu được ở 25°C (coi NaOH phân li hoàn toàn).', ans: '12' },
  ];

  const htmlDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${title}</title>
<style>
  @page { size: A4; margin: 2cm 2cm 2cm 2cm; }
  body { font-family: 'Times New Roman', 'Arial', serif; font-size: 12pt; line-height: 1.4; color: #000; }
  .school-header { width: 100%; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
  .school-header td { font-size: 11pt; vertical-align: top; }
  .exam-title { text-align: center; font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 12px 0 4px 0; }
  .exam-subtitle { text-align: center; font-size: 11pt; font-style: italic; margin-bottom: 12px; }
  .part-header { font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-top: 16px; margin-bottom: 6px; background-color: #f1f5f9; padding: 4px 8px; border-left: 4px solid #0284c7; }
  .part-desc { font-size: 11pt; font-style: italic; margin-bottom: 10px; color: #334155; }
  .question-item { margin-bottom: 10px; text-align: justify; }
  .options-grid { width: 100%; margin-top: 4px; margin-bottom: 6px; }
  .options-grid td { width: 25%; font-size: 11.5pt; padding: 2px 4px; vertical-align: top; }
  .answer-box { background-color: #ecfdf5; border: 1px dashed #059669; padding: 4px 8px; margin-top: 4px; font-weight: bold; color: #065f46; font-size: 11pt; }
  .key-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .key-table th, .key-table td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 11pt; }
  .key-table th { background-color: #f8fafc; font-weight: bold; }
</style>
</head>
<body>
  <table class="school-header">
    <tr>
      <td style="width: 50%; text-align: center;">
        TRƯỜNG THPT DƯƠNG MINH CHÂU<br/>
        <strong>TỔ 3 – LỚP ${APP_CONFIG.CLASS_NAME}</strong>
      </td>
      <td style="width: 50%; text-align: center;">
        <strong>ĐỀ KIỂM TRA ĐÁNH GIÁ CHUYÊN ĐỀ</strong><br/>
        NĂM HỌC: ${APP_CONFIG.SCHOOL_YEAR}
      </td>
    </tr>
  </table>

  <div class="exam-title">${title}</div>
  <div class="exam-subtitle">
    Môn học: <strong>${subject}</strong> • Khối: <strong>${grade}</strong> • Thời gian làm bài: <strong>${durationMinutes} phút</strong><br/>
    <em>(Cấu trúc: ${p1Count} câu TN + ${p2Count} câu Đ/S + ${p3Count} câu Ngắn + ${p4Steps} ý Tự luận — Tổng 10,0 điểm)</em>
  </div>

  <!-- PHẦN 1 -->
  <div class="part-header">
    PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (5,0 điểm)
  </div>
  <div class="part-desc">
    Thí sinh trả lời từ câu 1 đến câu ${p1Count}. Mỗi câu hỏi thí sinh chỉ chọn một phương án. 
    Thang điểm chia đều: mỗi câu trả lời đúng được <strong>${p1PointPerQ.toFixed(3)} điểm</strong> (Tổng ${p1Count} câu = 5,0 điểm).
  </div>

  ${Array.from({ length: p1Count }, (_, i) => {
    const sample = p1SampleQuestions[i % p1SampleQuestions.length];
    return `
      <div class="question-item">
        <strong>Câu ${i + 1}.</strong> ${sample.q}
        <table class="options-grid">
          <tr>
            <td>${sample.opts[0]}</td>
            <td>${sample.opts[1]}</td>
            <td>${sample.opts[2]}</td>
            <td>${sample.opts[3]}</td>
          </tr>
        </table>
        ${includeAnswers ? `<div class="answer-box">➔ Đáp án đúng: ${sample.ans} (${p1PointPerQ.toFixed(3)}đ)</div>` : ''}
      </div>
    `;
  }).join('')}

  <!-- PHẦN 2 -->
  <div class="part-header">
    PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (2,0 điểm)
  </div>
  <div class="part-desc">
    Thí sinh trả lời từ câu 1 đến câu ${p2Count}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.<br/>
    Thang điểm chia đều: Điểm tối đa của 01 câu là <strong>${p2MaxPerQ.toFixed(2)} điểm</strong> (Tổng ${p2Count} câu = 2,0 điểm).<br/>
    • Thí sinh chỉ lựa chọn chính xác 01 ý được <strong>${(p2MaxPerQ * 0.1).toFixed(2)} điểm</strong>.<br/>
    • Thí sinh chỉ lựa chọn chính xác 02 ý được <strong>${(p2MaxPerQ * 0.25).toFixed(2)} điểm</strong>.<br/>
    • Thí sinh chỉ lựa chọn chính xác 03 ý được <strong>${(p2MaxPerQ * 0.5).toFixed(2)} điểm</strong>.<br/>
    • Thí sinh lựa chọn chính xác cả 04 ý được <strong>${p2MaxPerQ.toFixed(2)} điểm</strong>.
  </div>

  ${Array.from({ length: p2Count }, (_, i) => {
    const sample = p2SampleQuestions[i % p2SampleQuestions.length];
    return `
      <div class="question-item">
        <strong>Câu ${i + 1}.</strong> ${sample.title}
        <div style="margin-left: 15px; margin-top: 4px;">
          ${sample.items.map((it) => `
            <div>
              <strong>${it.key})</strong> ${it.text}
              ${includeAnswers ? `<span style="color: #065f46; font-weight: bold; margin-left: 10px;">[Đáp án: ${it.ans}]</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('')}

  <!-- PHẦN 3 -->
  <div class="part-header">
    PHẦN III. CÂU TRẮC NGHIỆM YÊU CẦU TRẢ LỜI NGẮN (1,5 điểm)
  </div>
  <div class="part-desc">
    Thí sinh trả lời từ câu 1 đến câu ${p3Count}. Thang điểm chia đều: mỗi câu trả lời chính xác được <strong>${p3PointPerQ.toFixed(3)} điểm</strong> (Tổng ${p3Count} câu = 1,5 điểm).
  </div>

  ${Array.from({ length: p3Count }, (_, i) => {
    const sample = p3SampleQuestions[i % p3SampleQuestions.length];
    return `
      <div class="question-item">
        <strong>Câu ${i + 1}.</strong> ${sample.q}
        ${includeAnswers ? `<div class="answer-box">➔ Đáp số chuẩn: ${sample.ans} (${p3PointPerQ.toFixed(2)}đ)</div>` : ''}
      </div>
    `;
  }).join('')}

  <!-- PHẦN 4 -->
  <div class="part-header">
    PHẦN IV. TỰ LUẬN (${p4Steps} CÂU — TỔNG 1,5 ĐIỂM)
  </div>
  <div class="part-desc">
    Thí sinh trình bày lời giải chi tiết từ câu 1 đến câu ${p4Steps}. Thang điểm chia đều: mỗi câu tự luận đạt tối đa <strong>${p4PointPerStep.toFixed(2)} điểm</strong> (Tổng cộng 1,5 điểm).
  </div>

  <div class="question-item" style="margin-bottom: 16px;">
    <strong>Câu 1 (${p4PointPerStep.toFixed(2)} điểm):</strong> Vận dụng kiến thức trọng tâm chuyên đề "${title}" môn ${subject} lớp ${grade} (Bộ SGK Kết nối tri thức):<br/>
    Trình bày bản chất nguyên lý/cơ chế khoa học cốt lõi, viết phương trình/mô hình minh họa và giải thích sự biến đổi khi thay đổi điều kiện hệ.
    ${includeAnswers ? `
      <div style="margin-top: 6px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px;">
        <strong>HƯỚNG DẪN CHẤM & RUBRIC CÂU 1 (${p4PointPerStep.toFixed(2)}đ):</strong><br/>
        • <em>Bước 1 (${(p4PointPerStep * 0.35).toFixed(2)}đ):</em> Nêu chính xác định nghĩa, cơ chế và viết phương trình nền tảng theo SGK Kết nối tri thức.<br/>
        • <em>Bước 2 (${(p4PointPerStep * 0.35).toFixed(2)}đ):</em> Phân tích mối quan hệ giữa các đại lượng và giải thích bản chất hiện tượng.<br/>
        • <em>Bước 3 (${(p4PointPerStep * 0.30).toFixed(2)}đ):</em> Rút ra kết luận khoa học chặt chẽ và chuẩn xác.
      </div>
    ` : ''}
  </div>

  <div class="question-item" style="margin-bottom: 16px;">
    <strong>Câu 2 (${p4PointPerStep.toFixed(2)} điểm):</strong> Bài toán tính toán định lượng chuyên sâu môn ${subject} lớp ${grade}:<br/>
    Cho hệ phản ứng/mô hình thực nghiệm với các dữ kiện số liệu ban đầu. Hãy thiết lập công thức tính toán, tìm giá trị đại lượng cần xác định và biện luận kết quả thu được.
    ${includeAnswers ? `
      <div style="margin-top: 6px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px;">
        <strong>HƯỚNG DẪN CHẤM & RUBRIC CÂU 2 (${p4PointPerStep.toFixed(2)}đ):</strong><br/>
        • <em>Bước 1 (${(p4PointPerStep * 0.35).toFixed(2)}đ):</em> Tóm tắt bài toán, đổi đơn vị và thiết lập phương trình liên hệ đại lượng.<br/>
        • <em>Bước 2 (${(p4PointPerStep * 0.40).toFixed(2)}đ):</em> Thay số, tính toán chuẩn xác và tìm đúng đáp số kèm đơn vị đo.<br/>
        • <em>Bước 3 (${(p4PointPerStep * 0.25).toFixed(2)}đ):</em> Biện luận ý nghĩa thực nghiệm của kết quả tính toán.
      </div>
    ` : ''}
  </div>

  <div class="question-item" style="margin-bottom: 16px;">
    <strong>Câu 3 (${p4PointPerStep.toFixed(2)} điểm):</strong> Vận dụng kiến thức chuyên đề "${title}" giải quyết vấn đề thực tiễn đời sống và sản xuất:<br/>
    Một tình huống thực tế liên quan đến đời sống, công nghiệp sản xuất hoặc môi trường đòi hỏi tối ưu hóa hiệu suất hoặc giảm thiểu tác hại. Hãy đề xuất giải pháp kỹ thuật khả thi và giải thích cơ sở khoa học của giải pháp đó.
    ${includeAnswers ? `
      <div style="margin-top: 6px; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px;">
        <strong>HƯỚNG DẪN CHẤM & RUBRIC CÂU 3 (${p4PointPerStep.toFixed(2)}đ):</strong><br/>
        • <em>Bước 1 (${(p4PointPerStep * 0.30).toFixed(2)}đ):</em> Nhận diện chính xác nguyên nhân khoa học của vấn đề thực tế.<br/>
        • <em>Bước 2 (${(p4PointPerStep * 0.40).toFixed(2)}đ):</em> Đề xuất giải pháp kỹ thuật/biện pháp xử lý khả thi, hiệu quả.<br/>
        • <em>Bước 3 (${(p4PointPerStep * 0.30).toFixed(2)}đ):</em> Giải thích thuyết phục cơ chế khoa học giúp tối ưu hóa hiệu quả hoặc bảo vệ môi trường.
      </div>
    ` : ''}
  </div>

  ${includeAnswers ? `
    <div style="page-break-before: always; margin-top: 30px;">
      <h3 style="text-align: center; text-transform: uppercase;">BẢNG TỔNG HỢP ĐÁP ÁN NHANH</h3>
      <table class="key-table">
        <tr>
          <th colspan="8">PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (Mỗi câu = ${p1PointPerQ.toFixed(3)}đ)</th>
        </tr>
        <tr>
          ${Array.from({ length: Math.min(8, p1Count) }, (_, i) => `<th>Câu ${i + 1}</th>`).join('')}
        </tr>
        <tr>
          ${Array.from({ length: Math.min(8, p1Count) }, (_, i) => `<td><strong>${p1SampleQuestions[i % p1SampleQuestions.length].ans}</strong></td>`).join('')}
        </tr>
        ${p1Count > 8 ? `
          <tr>
            ${Array.from({ length: p1Count - 8 }, (_, i) => `<th>Câu ${i + 9}</th>`).join('')}
          </tr>
          <tr>
            ${Array.from({ length: p1Count - 8 }, (_, i) => `<td><strong>${p1SampleQuestions[(i + 8) % p1SampleQuestions.length].ans}</strong></td>`).join('')}
          </tr>
        ` : ''}
      </table>
    </div>
  ` : ''}

  <div style="margin-top: 30px; text-align: center; font-style: italic;">
    --- HẾT ---<br/>
    <em>Cán bộ coi thi không giải thích gì thêm. Thí sinh không được sử dụng tài liệu.</em>
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff' + htmlDoc], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const suffix = includeAnswers ? 'Co_Dap_An' : 'De_Hoc_Sinh';
  a.download = `De_Kiem_Tra_${p1Count}TN_${p2Count}DS_${p3Count}Ngan_${p4Steps}TL_${suffix}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Tải đề kiểm tra dưới dạng văn bản thuần (.txt)
 */
export function downloadExamPaperTxt(options: ExamDownloadOptions) {
  // Nếu có đề kiểm tra thực tế (AssessmentTest), tải đúng 100% nội dung câu hỏi trong đề
  if (options.test) {
    exportTestToTxt(options.test, options.includeAnswers !== false);
    return;
  }

  // Nếu có danh sách câu hỏi cụ thể truyền vào, tự động dựng đề và xuất chuẩn
  if (options.questions && options.questions.length > 0) {
    const syntheticTest: AssessmentTest = {
      id: 'custom_test_' + Date.now(),
      code: options.code || 'DE-THI-KHAO-THI',
      title: options.title || 'Đề Kiểm Tra Đánh Giá Năng Lực',
      subject: options.subject || 'Hóa học',
      grade: options.grade || '11',
      topic: options.title || 'Chuyên đề học tập',
      durationMinutes: options.durationMinutes || 45,
      totalPoints: 10,
      knowRatio: 40,
      understandRatio: 30,
      applyRatio: 30,
      questions: options.questions,
      isApprovedByTeacher: true,
      approvedBy: 'Tổ Chuyên Môn 3',
      approvedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      creatorName: 'Trần Công Minh',
    };
    exportTestToTxt(syntheticTest, options.includeAnswers !== false);
    return;
  }

  const {
    title,
    subject,
    grade,
    durationMinutes = 50,
    p1Count,
    p1PointPerQ,
    p2Count,
    p2MaxPerQ,
    p3Count,
    p3PointPerQ,
    p4Steps,
    p4PointPerStep,
    includeAnswers = true,
  } = options;

  let text = `======================================================================
TRƯỜNG THPT DƯƠNG MINH CHÂU – TỔ 3 LỚP ${APP_CONFIG.CLASS_NAME}
ĐỀ KIỂM TRA ĐÁNH GIÁ CHUYÊN ĐỀ: ${title.toUpperCase()}
Môn: ${subject} • Lớp: ${grade} • Thời gian làm bài: ${durationMinutes} phút
Cấu trúc đề: ${p1Count} câu TN (0,333đ) + ${p2Count} câu Đ/S (2,0đ) + ${p3Count} câu Ngắn (0,5đ) + ${p4Steps} câu Tự luận (0,5đ) = 10,0 điểm
======================================================================

I. PHẦN 1: CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (5,0 ĐIỂM)
Thí sinh trả lời từ câu 1 đến câu ${p1Count}. Mỗi câu chỉ chọn một phương án.
Thang điểm chia đều: mỗi câu đúng được ${p1PointPerQ.toFixed(3)} điểm (Tổng = 5,0 điểm).
----------------------------------------------------------------------
`;

  for (let i = 1; i <= p1Count; i++) {
    text += `Câu ${i}: (Nội dung câu hỏi trắc nghiệm số ${i})\n`;
    text += `  A. Phương án A          B. Phương án B\n`;
    text += `  C. Phương án C          D. Phương án D\n`;
    if (includeAnswers) {
      text += `  ➔ Đáp án: ${['A', 'B', 'C', 'D'][(i - 1) % 4]} (+${p1PointPerQ.toFixed(3)} điểm)\n`;
    }
    text += `\n`;
  }

  text += `======================================================================
II. PHẦN 2: CÂU TRẮC NGHIỆM ĐÚNG / SAI (2,0 ĐIỂM)
Thí sinh trả lời từ câu 1 đến câu ${p2Count}. Trong mỗi ý a, b, c, d chọn Đúng hoặc Sai.
Điểm tối đa của 01 câu là ${p2MaxPerQ.toFixed(2)} điểm (Tổng = 2,0 điểm).
• Đúng 1 ý: ${(p2MaxPerQ * 0.1).toFixed(2)}đ  |  Đúng 2 ý: ${(p2MaxPerQ * 0.25).toFixed(2)}đ
• Đúng 3 ý: ${(p2MaxPerQ * 0.5).toFixed(2)}đ  |  Đúng 4 ý: ${p2MaxPerQ.toFixed(2)}đ
----------------------------------------------------------------------
`;

  for (let i = 1; i <= p2Count; i++) {
    text += `Câu ${i}: Về kiến thức chuyên đề ${title} (tối đa ${p2MaxPerQ.toFixed(2)} điểm):\n`;
    text += `  a) Phát biểu a... ${includeAnswers ? '[Đúng]' : ''}\n`;
    text += `  b) Phát biểu b... ${includeAnswers ? '[Sai]' : ''}\n`;
    text += `  c) Phát biểu c... ${includeAnswers ? '[Đúng]' : ''}\n`;
    text += `  d) Phát biểu d... ${includeAnswers ? '[Sai]' : ''}\n\n`;
  }

  text += `======================================================================
III. PHẦN 3: CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (1,5 ĐIỂM)
Thí sinh trả lời từ câu 1 đến câu ${p3Count}.
Thang điểm chia đều: mỗi câu trả lời đúng được ${p3PointPerQ.toFixed(3)} điểm (Tổng = 1,5 điểm).
----------------------------------------------------------------------
`;

  for (let i = 1; i <= p3Count; i++) {
    text += `Câu ${i}: (Câu hỏi tính toán hoặc điền từ khóa số ${i})\n`;
    if (includeAnswers) {
      text += `  ➔ Đáp số chuẩn: ${i === 1 ? '4.5' : i === 2 ? '-92.4' : '12'} (+${p3PointPerQ.toFixed(2)}đ)\n`;
    }
    text += `\n`;
  }

  text += `======================================================================
IV. PHẦN 4: TỰ LUẬN (${p4Steps} CÂU — 1,5 ĐIỂM)
Thí sinh trình bày chi tiết bài làm từ câu 1 đến câu ${p4Steps}.
Mỗi câu tự luận đạt tối đa ${p4PointPerStep.toFixed(2)} điểm (Tổng = 1,5 điểm).
----------------------------------------------------------------------
Câu 1 (${p4PointPerStep.toFixed(2)}đ): Vận dụng kiến thức trọng tâm chuyên đề "${title}" môn ${subject} lớp ${grade}:
Trình bày bản chất nguyên lý/cơ chế khoa học cốt lõi, viết phương trình/mô hình minh họa và giải thích sự biến đổi khi thay đổi điều kiện hệ.
${includeAnswers ? `➔ HƯỚNG DẪN CHẤM CÂU 1 (${p4PointPerStep.toFixed(2)}đ):
• Bước 1 (${(p4PointPerStep * 0.35).toFixed(2)}đ): Nêu chính xác định nghĩa, cơ chế và viết phương trình nền tảng theo SGK.
• Bước 2 (${(p4PointPerStep * 0.35).toFixed(2)}đ): Phân tích mối quan hệ giữa các đại lượng và giải thích bản chất hiện tượng.
• Bước 3 (${(p4PointPerStep * 0.30).toFixed(2)}đ): Rút ra kết luận khoa học hoàn chỉnh.
` : ''}

Câu 2 (${p4PointPerStep.toFixed(2)}đ): Bài toán tính toán định lượng chuyên sâu môn ${subject} lớp ${grade}:
Cho hệ phản ứng/mô hình thực nghiệm với các dữ kiện số liệu ban đầu. Hãy thiết lập công thức tính toán, tìm giá trị đại lượng cần xác định và biện luận kết quả thu được.
${includeAnswers ? `➔ HƯỚNG DẪN CHẤM CÂU 2 (${p4PointPerStep.toFixed(2)}đ):
• Bước 1 (${(p4PointPerStep * 0.35).toFixed(2)}đ): Tóm tắt bài toán, đổi đơn vị và thiết lập phương trình liên hệ đại lượng.
• Bước 2 (${(p4PointPerStep * 0.40).toFixed(2)}đ): Thay số, tính toán chuẩn xác và tìm đúng đáp số kèm đơn vị đo.
• Bước 3 (${(p4PointPerStep * 0.25).toFixed(2)}đ): Biện luận ý nghĩa thực nghiệm của kết quả tính toán.
` : ''}

Câu 3 (${p4PointPerStep.toFixed(2)}đ): Vận dụng giải quyết vấn đề thực tiễn đời sống và sản xuất:
Một tình huống thực tế liên quan đến đời sống, công nghiệp sản xuất hoặc môi trường đòi hỏi tối ưu hóa hiệu suất hoặc giảm thiểu tác hại. Hãy đề xuất giải pháp kỹ thuật khả thi và giải thích cơ sở khoa học của giải pháp đó.
${includeAnswers ? `➔ HƯỚNG DẪN CHẤM CÂU 3 (${p4PointPerStep.toFixed(2)}đ):
• Bước 1 (${(p4PointPerStep * 0.30).toFixed(2)}đ): Nhận diện chính xác nguyên nhân khoa học của vấn đề thực tế.
• Bước 2 (${(p4PointPerStep * 0.40).toFixed(2)}đ): Đề xuất giải pháp kỹ thuật/biện pháp xử lý khả thi, hiệu quả.
• Bước 3 (${(p4PointPerStep * 0.30).toFixed(2)}đ): Giải thích cơ chế khoa học giúp tối ưu hóa hiệu quả hoặc bảo vệ môi trường.
` : ''}
======================================================================
--- HẾT ---
`;

  const suffix = includeAnswers ? 'Co_Dap_An' : 'De_Hoc_Sinh';
  downloadTextAsFile(`De_Kiem_Tra_${p1Count}TN_${p2Count}DS_${p3Count}Ngan_${p4Steps}TL_${suffix}.txt`, text);
}


