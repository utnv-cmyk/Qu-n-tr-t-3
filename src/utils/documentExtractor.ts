import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình PDF.js worker nếu chưa có
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
} catch {
  // Bỏ qua lỗi cấu hình worker trong môi trường kiểm thử
}

export interface ExtractedFileResult {
  id: string;
  name: string;
  type: 'image' | 'document';
  sizeFormatted: string;
  dataUrl?: string;
  contentPreview?: string;
  fullExtractedText?: string;
  fileExtension: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Trích xuất nội dung văn bản hoặc hình ảnh từ tệp người dùng tải lên
 */
export async function extractUploadedMaterial(
  file: File,
  forcedType?: 'image' | 'document'
): Promise<ExtractedFileResult> {
  const isImage = forcedType === 'image' || file.type.startsWith('image/');
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const fileId = 'mat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const sizeFormatted = formatBytes(file.size);

  if (isImage) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        resolve({
          id: fileId,
          name: file.name,
          type: 'image',
          sizeFormatted,
          dataUrl,
          fileExtension: ext || 'png',
        });
      };
      reader.onerror = () => {
        resolve({
          id: fileId,
          name: file.name,
          type: 'image',
          sizeFormatted,
          fileExtension: ext || 'png',
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Tệp tài liệu (.doc, .docx, .pdf, .txt, .xlsx, .csv...)
  let fullExtractedText = '';

  try {
    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const mammothResult = await mammoth.extractRawText({ arrayBuffer });
      fullExtractedText = mammothResult.value?.trim() || '';
    } else if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        });
        const pdfDoc = await loadingTask.promise;
        let pdfText = '';
        const maxPages = Math.min(pdfDoc.numPages, 15);
        for (let p = 1; p <= maxPages; p++) {
          const page = await pdfDoc.getPage(p);
          const tc = await page.getTextContent();
          const pageLines = tc.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
          pdfText += `[Trang ${p}]: ${pageLines}\n`;
        }
        fullExtractedText = pdfText.trim();
      } catch (pdfErr) {
        console.warn('PDF.js extract fallback:', pdfErr);
        const decoder = new TextDecoder('utf-8', { fatal: false });
        fullExtractedText = decoder.decode(arrayBuffer).replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ').slice(0, 3000);
      }
    } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      let sheetTexts: string[] = [];
      wb.SheetNames.forEach((sheetName) => {
        const sheet = wb.Sheets[sheetName];
        if (sheet) {
          const csv = XLSX.utils.sheet_to_csv(sheet);
          if (csv.trim()) {
            sheetTexts.push(`[Sheet: ${sheetName}]:\n${csv}`);
          }
        }
      });
      fullExtractedText = sheetTexts.join('\n\n');
    } else if (
      file.type.includes('text') ||
      ['txt', 'md', 'json', 'xml', 'tsv'].includes(ext)
    ) {
      fullExtractedText = (await file.text()).trim();
    } else {
      // Đối với tệp .doc hoặc các định dạng khác
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const raw = decoder.decode(arrayBuffer);
      // Lọc các ký tự nhị phân
      const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned.length > 50) {
        fullExtractedText = cleaned.slice(0, 4000);
      }
    }
  } catch (err) {
    console.warn(`Error extracting text from ${file.name}:`, err);
  }

  const contentPreview = fullExtractedText
    ? fullExtractedText.slice(0, 400) + (fullExtractedText.length > 400 ? '...' : '')
    : undefined;

  return {
    id: fileId,
    name: file.name,
    type: 'document',
    sizeFormatted,
    contentPreview,
    fullExtractedText,
    fileExtension: ext || 'doc',
  };
}
