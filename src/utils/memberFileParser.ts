import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { Member, Role } from '../types';

export interface ParsedMemberCandidate {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  groupName: string;
  selected: boolean;
  isDuplicate: boolean;
  duplicateReason?: string;
  sourceRow?: number;
  originalRawText?: string;
}

// Ensure PDF worker source is configured
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
} catch {
  // Ignore worker setting error if not supported in environment
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

/**
 * Remove Vietnamese diacritics for flexible fuzzy header matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Clean phone numbers to standard Vietnamese format (e.g. 0912.345.678 or 0912345678)
 */
function cleanPhoneNumber(raw: any): string {
  if (!raw) return '';
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  return digits;
}

/**
 * Clean and normalize group name to Tổ 3 standard groups
 */
function normalizeGroup(rawGroup: any): string {
  if (!rawGroup) return 'Nhóm 1 - Tự nhiên';
  const norm = normalizeText(String(rawGroup));
  if (norm.includes('1') || norm.includes('tu nhien') || norm.includes('toan') || norm.includes('ly') || norm.includes('hoa')) {
    return 'Nhóm 1 - Tự nhiên';
  }
  if (norm.includes('2') || norm.includes('xa hoi') || norm.includes('van') || norm.includes('su') || norm.includes('dia')) {
    return 'Nhóm 2 - Xã hội';
  }
  if (norm.includes('3') || norm.includes('ngoai ngu') || norm.includes('anh') || norm.includes('tin')) {
    return 'Nhóm 3 - Ngoại ngữ & Tin';
  }
  if (norm.includes('4') || norm.includes('du an')) {
    return 'Nhóm 4 - Dự án';
  }
  return String(rawGroup).trim() || 'Nhóm 1 - Tự nhiên';
}

/**
 * Clean and normalize member role
 */
function normalizeRole(rawRole: any): Role {
  if (!rawRole) return 'member';
  const norm = normalizeText(String(rawRole));
  if (norm.includes('to truong') || norm.includes('truong') || norm.includes('leader') || norm.includes('quan ly')) {
    return 'leader';
  }
  return 'member';
}

/**
 * Create a candidate object from parsed fields
 */
function createCandidate(
  name: string,
  phone: string,
  email: string,
  groupName: string,
  role: Role,
  sourceRow: number,
  existingMembers: Member[],
  rawText?: string
): ParsedMemberCandidate | null {
  const cleanName = name.replace(/^[\d\s.\-_)]+/, '').trim();
  if (!cleanName || cleanName.length < 2) return null;

  // Ignore header-like rows that might have leaked
  const norm = normalizeText(cleanName);
  if (
    norm === 'ho va ten' ||
    norm === 'ho ten' ||
    norm === 'ten' ||
    norm === 'stt' ||
    norm === 'danh sach' ||
    norm === 'so dien thoai'
  ) {
    return null;
  }

  // Check duplicate
  const duplicate = existingMembers.find(
    (m) => normalizeText(m.name) === norm
  );

  const cleanPhone = cleanPhoneNumber(phone) || '0900.000.000';
  const generatedEmail =
    email.trim() ||
    `${norm.replace(/\s+/g, '')}@thptduongminhchau.edu.vn`;

  return {
    id: 'candidate_' + Math.random().toString(36).substr(2, 9),
    name: cleanName,
    role,
    email: generatedEmail,
    phone: cleanPhone,
    groupName: normalizeGroup(groupName),
    selected: !duplicate,
    isDuplicate: !!duplicate,
    duplicateReason: duplicate ? `Đã có học sinh "${duplicate.name}" trong Tổ 3` : undefined,
    sourceRow,
    originalRawText: rawText,
  };
}

/**
 * 1. PARSE EXCEL FILES (.xlsx, .xls, .csv)
 */
export async function parseExcelMembers(
  file: File,
  existingMembers: Member[]
): Promise<ParsedMemberCandidate[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const candidates: ParsedMemberCandidate[] = [];

  // Pick first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to 2D array of strings
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
  });

  if (!rawRows || rawRows.length === 0) return [];

  // Find header index
  let headerRowIdx = -1;
  let nameColIdx = -1;
  let phoneColIdx = -1;
  let emailColIdx = -1;
  let groupColIdx = -1;
  let roleColIdx = -1;

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r];
    for (let c = 0; c < row.length; c++) {
      const cell = normalizeText(String(row[c]));
      if (
        cell.includes('ho va ten') ||
        cell.includes('ho ten') ||
        cell === 'ten' ||
        cell.includes('hoc sinh') ||
        cell === 'name' ||
        cell.includes('full name')
      ) {
        nameColIdx = c;
        headerRowIdx = r;
      } else if (
        cell.includes('dien thoai') ||
        cell.includes('sdt') ||
        cell === 'phone' ||
        cell.includes('mobile') ||
        cell.includes('zalo')
      ) {
        phoneColIdx = c;
      } else if (cell.includes('email') || cell.includes('mail') || cell.includes('thu dien tu')) {
        emailColIdx = c;
      } else if (cell.includes('nhom') || cell.includes('to hoc tap') || cell.includes('group')) {
        groupColIdx = c;
      } else if (cell.includes('vai tro') || cell.includes('chuc vu') || cell.includes('role')) {
        roleColIdx = c;
      }
    }
    if (nameColIdx !== -1) break;
  }

  // If no header found, assume standard layout:
  // Col 0: STT, Col 1: Họ tên, Col 2: SĐT, Col 3: Email, Col 4: Nhóm, Col 5: Chức vụ
  const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
  if (nameColIdx === -1) {
    nameColIdx = 1;
    phoneColIdx = 2;
    emailColIdx = 3;
    groupColIdx = 4;
    roleColIdx = 5;
  }

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    let name = String(row[nameColIdx] || '').trim();

    // Sometimes STT is in col 0 and name is in col 0 if there are few columns
    if (!name && row[0] && isNaN(Number(row[0]))) {
      name = String(row[0]).trim();
    }

    if (!name) continue;

    const phone = phoneColIdx !== -1 ? String(row[phoneColIdx] || '') : '';
    const email = emailColIdx !== -1 ? String(row[emailColIdx] || '') : '';
    const group = groupColIdx !== -1 ? String(row[groupColIdx] || '') : 'Nhóm 1 - Tự nhiên';
    const roleStr = roleColIdx !== -1 ? String(row[roleColIdx] || '') : 'member';

    const candidate = createCandidate(
      name,
      phone,
      email,
      group,
      normalizeRole(roleStr),
      r + 1,
      existingMembers,
      row.join(' | ')
    );

    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

/**
 * 2. PARSE WORD FILES (.docx, .doc)
 */
export async function parseWordMembers(
  file: File,
  existingMembers: Member[]
): Promise<ParsedMemberCandidate[]> {
  const arrayBuffer = await file.arrayBuffer();
  const candidates: ParsedMemberCandidate[] = [];

  try {
    // Attempt HTML conversion first to check if tables exist in docx
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const html = htmlResult.value;

    if (html && html.includes('<table')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tableRows = doc.querySelectorAll('tr');

      if (tableRows.length > 0) {
        let nameIdx = 1;
        let phoneIdx = -1;
        let emailIdx = -1;
        let groupIdx = -1;
        let roleIdx = -1;
        let startRow = 0;

        // Check header row in <th> or first <tr>
        const firstRowCells = tableRows[0].querySelectorAll('th, td');
        let headerDetected = false;
        firstRowCells.forEach((cell, idx) => {
          const text = normalizeText(cell.textContent || '');
          if (text.includes('ho ten') || text.includes('ho va ten') || text.includes('hoc sinh') || text === 'ten') {
            nameIdx = idx;
            headerDetected = true;
          } else if (text.includes('sdt') || text.includes('dien thoai') || text.includes('phone')) {
            phoneIdx = idx;
          } else if (text.includes('email') || text.includes('mail')) {
            emailIdx = idx;
          } else if (text.includes('nhom') || text.includes('to')) {
            groupIdx = idx;
          } else if (text.includes('vai tro') || text.includes('chuc vu')) {
            roleIdx = idx;
          }
        });

        if (headerDetected) {
          startRow = 1;
        } else {
          // If first column is not a number, maybe it's name
          nameIdx = 0;
          phoneIdx = 1;
          emailIdx = 2;
          groupIdx = 3;
        }

        for (let i = startRow; i < tableRows.length; i++) {
          const cells = tableRows[i].querySelectorAll('td');
          if (cells.length === 0) continue;

          let name = cells[nameIdx]?.textContent?.trim() || '';
          if (!name && cells[0] && isNaN(Number(cells[0].textContent))) {
            name = cells[0].textContent.trim();
          }
          if (!name) continue;

          const phone = phoneIdx !== -1 && cells[phoneIdx] ? cells[phoneIdx].textContent?.trim() || '' : '';
          const email = emailIdx !== -1 && cells[emailIdx] ? cells[emailIdx].textContent?.trim() || '' : '';
          const group = groupIdx !== -1 && cells[groupIdx] ? cells[groupIdx].textContent?.trim() || '' : '';
          const roleStr = roleIdx !== -1 && cells[roleIdx] ? cells[roleIdx].textContent?.trim() || '' : '';

          const candidate = createCandidate(
            name,
            phone,
            email,
            group,
            normalizeRole(roleStr),
            i + 1,
            existingMembers,
            Array.from(cells).map((c) => c.textContent?.trim()).join(' | ')
          );
          if (candidate) candidates.push(candidate);
        }

        if (candidates.length > 0) return candidates;
      }
    }

    // Fallback or plain text in docx
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    const text = rawResult.value;
    return parseTextLines(text, existingMembers);
  } catch (err) {
    // If mammoth fails (e.g. binary .doc), try text decoder fallback
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(arrayBuffer);
    return parseTextLines(text, existingMembers);
  }
}

/**
 * 3. PARSE PDF FILES (.pdf)
 */
export async function parsePdfMembers(
  file: File,
  existingMembers: Member[]
): Promise<ParsedMemberCandidate[]> {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' \t ');
      fullText += pageText + '\n';
    }

    return parseTextLines(fullText, existingMembers);
  } catch (err) {
    // Fallback: decode raw stream looking for student lines
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(arrayBuffer);
    return parseTextLines(text, existingMembers);
  }
}

/**
 * Helper to parse plain lines (used by Word text fallback, PDF, or text files)
 */
function parseTextLines(
  fullText: string,
  existingMembers: Member[]
): ParsedMemberCandidate[] {
  const lines = fullText.split(/\r?\n/);
  const candidates: ParsedMemberCandidate[] = [];

  lines.forEach((line, idx) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length < 4) return;

    // Check if line contains phone, email, name
    // Examples:
    // "1. Nguyễn Văn Nam | 0901234567 | nam@thpt.edu.vn | Nhóm 1"
    // "Nguyễn Văn Nam - SĐT: 0901234567 - Nhóm 2 - Thành viên"
    // "Trần Thị Lan, 0987654321, lan@gmail.com"
    const phoneMatch = cleanLine.match(/(?:0|\+84)[3|5|7|8|9]\d{8}/) || cleanLine.match(/\b0\d{3}[.\s]?\d{3}[.\s]?\d{3}\b/);
    const emailMatch = cleanLine.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);

    let parts: string[] = [];
    if (cleanLine.includes('|')) {
      parts = cleanLine.split('|').map((s) => s.trim());
    } else if (cleanLine.includes('\t')) {
      parts = cleanLine.split('\t').map((s) => s.trim());
    } else if (cleanLine.includes(';') || (cleanLine.includes(',') && !cleanLine.includes(' - '))) {
      parts = cleanLine.split(/[,;]/).map((s) => s.trim());
    } else if (cleanLine.includes(' - ')) {
      parts = cleanLine.split(' - ').map((s) => s.trim());
    }

    let name = '';
    let phone = phoneMatch ? phoneMatch[0] : '';
    let email = emailMatch ? emailMatch[0] : '';
    let group = 'Nhóm 1 - Tự nhiên';
    let role: Role = 'member';

    if (parts.length >= 2) {
      // First part might be STT or Name
      if (/^\d+$/.test(parts[0]) && parts.length > 2) {
        name = parts[1];
        if (parts[2] && !phone && parts[2].match(/\d/)) phone = parts[2];
        if (parts[3] && parts[3].includes('@')) email = parts[3];
        if (parts[4]) group = parts[4];
      } else {
        name = parts[0];
        for (let p = 1; p < parts.length; p++) {
          const partNorm = normalizeText(parts[p]);
          if (partNorm.includes('nhom')) group = parts[p];
          if (partNorm.includes('to truong') || partNorm.includes('leader')) role = 'leader';
          if (!phone && parts[p].match(/0\d{8,9}/)) phone = parts[p];
          if (!email && parts[p].includes('@')) email = parts[p];
        }
      }
    } else {
      // Try to isolate name before phone or hyphen
      let rawName = cleanLine;
      if (phoneMatch) {
        rawName = rawName.replace(phoneMatch[0], '');
      }
      if (emailMatch) {
        rawName = rawName.replace(emailMatch[0], '');
      }
      rawName = rawName.replace(/sdt:|dien thoai:|email:|nhom \d|to truong|thanh vien/gi, '');
      rawName = rawName.replace(/^[\d\s.\-_)]+/, '').trim();
      if (rawName.split(/\s+/).length >= 2 && rawName.length <= 40) {
        name = rawName;
      }
    }

    if (name) {
      const candidate = createCandidate(
        name,
        phone,
        email,
        group,
        role,
        idx + 1,
        existingMembers,
        cleanLine
      );
      if (candidate) candidates.push(candidate);
    }
  });

  return candidates;
}

/**
 * Universal dispatcher parsing any uploaded file (Excel, Word, PDF)
 */
export async function parseMembersFromFile(
  file: File,
  existingMembers: Member[]
): Promise<ParsedMemberCandidate[]> {
  const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();

  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return await parseExcelMembers(file, existingMembers);
  } else if (['docx', 'doc'].includes(ext)) {
    return await parseWordMembers(file, existingMembers);
  } else if (ext === 'pdf') {
    return await parsePdfMembers(file, existingMembers);
  } else {
    // Default try excel first, then word text
    try {
      return await parseExcelMembers(file, existingMembers);
    } catch {
      return await parseWordMembers(file, existingMembers);
    }
  }
}

/**
 * Generate and download a standard Sample Excel Template
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'STT': 1,
      'Họ và tên': 'Nguyễn Văn Minh',
      'Số điện thoại': '0901.234.567',
      'Email': 'minh.nguyen@thptduongminhchau.edu.vn',
      'Phân nhóm': 'Nhóm 1 - Tự nhiên',
      'Vai trò': 'Thành viên',
    },
    {
      'STT': 2,
      'Họ và tên': 'Lê Thị Thu Thảo',
      'Số điện thoại': '0908.112.233',
      'Email': 'thao.le@thptduongminhchau.edu.vn',
      'Phân nhóm': 'Nhóm 2 - Xã hội',
      'Vai trò': 'Thành viên',
    },
    {
      'STT': 3,
      'Họ và tên': 'Phạm Hoàng Khang',
      'Số điện thoại': '0912.445.566',
      'Email': 'khang.pham@thptduongminhchau.edu.vn',
      'Phân nhóm': 'Nhóm 3 - Ngoại ngữ & Tin',
      'Vai trò': 'Thành viên',
    },
    {
      'STT': 4,
      'Họ và tên': 'Võ Quốc Huy',
      'Số điện thoại': '0933.778.899',
      'Email': 'huy.vo@thptduongminhchau.edu.vn',
      'Phân nhóm': 'Nhóm 1 - Tự nhiên',
      'Vai trò': 'Thành viên',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  // Auto-size columns
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 16 },
    { wch: 35 },
    { wch: 22 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachThanhVien');

  XLSX.writeFile(workbook, 'Mau_Danh_Sach_Thanh_Vien_To3.xlsx');
}

/**
 * Generate and download a sample text/word guide
 */
export function downloadSampleWordGuide() {
  const content = `BẢNG DANH SÁCH THÀNH VIÊN TỔ 3 - LỚP 11A1
(Định dạng chuẩn dùng để nhập vào hệ thống từ file Word/PDF)

Cách 1: Định dạng bảng (Khuyên dùng)
| STT | Họ và tên | Số điện thoại | Email | Phân nhóm | Vai trò |
| 1 | Nguyễn Văn Minh | 0901.234.567 | minh.nguyen@thptduongminhchau.edu.vn | Nhóm 1 - Tự nhiên | Thành viên |
| 2 | Lê Thị Thu Thảo | 0908.112.233 | thao.le@thptduongminhchau.edu.vn | Nhóm 2 - Xã hội | Thành viên |
| 3 | Phạm Hoàng Khang | 0912.445.566 | khang.pham@thptduongminhchau.edu.vn | Nhóm 3 - Ngoại ngữ & Tin | Thành viên |

Cách 2: Định dạng từng dòng (Gạch nối hoặc dấu gạch đứng)
1. Nguyễn Văn Minh - 0901.234.567 - minh.nguyen@thptduongminhchau.edu.vn - Nhóm 1 - Tự nhiên
2. Lê Thị Thu Thảo - 0908.112.233 - thao.le@thptduongminhchau.edu.vn - Nhóm 2 - Xã hội
3. Phạm Hoàng Khang - 0912.445.566 - khang.pham@thptduongminhchau.edu.vn - Nhóm 3 - Ngoại ngữ & Tin
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Mau_Danh_Sach_Thanh_Vien_Word.txt';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Convert candidates into actual Member items
 */
export function convertCandidatesToMembers(candidates: ParsedMemberCandidate[]): Member[] {
  return candidates.map((c, index) => {
    const avatar = DEFAULT_AVATARS[index % DEFAULT_AVATARS.length];
    return {
      id: 'm_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substr(2, 4),
      name: c.name,
      role: c.role,
      email: c.email,
      phone: c.phone,
      avatar: avatar,
      groupName: c.groupName,
      attendancePresent: 28,
      attendanceLate: 0,
      attendanceAbsent: 0,
      plusPoints: 0,
      minusPoints: 0,
      netPoints: 0,
      completedTasks: 0,
      submittedCount: 0,
      productCount: 0,
    };
  });
}
