import { SectionKey } from '../components/Sidebar';

export interface RouteState {
  section: SectionKey;
  tab: string;
}

// Slugs mapping for URLs
export const SECTION_TO_SLUG: Record<SectionKey, string> = {
  overview: 'tong-quan',
  members_hub: 'thanh-vien',
  competition: 'thi-dua',
  study_hub: 'hoc-tap',
  ai_assistant: 'tro-ly-ai',
  reports_settings: 'bao-cao-cai-dat',
};

export const SLUG_TO_SECTION: Record<string, SectionKey> = {
  'tong-quan': 'overview',
  overview: 'overview',
  dashboard: 'overview',
  '1': 'overview',

  'thanh-vien': 'members_hub',
  members: 'members_hub',
  'members-hub': 'members_hub',
  members_hub: 'members_hub',
  'quan-ly-thanh-vien': 'members_hub',
  '2': 'members_hub',

  'thi-dua': 'competition',
  competition: 'competition',
  'thi-dua-khen-thuong': 'competition',
  '3': 'competition',

  'hoc-tap': 'study_hub',
  study: 'study_hub',
  study_hub: 'study_hub',
  'study-hub': 'study_hub',
  'hoc-tap-bai-nop': 'study_hub',
  '4': 'study_hub',

  'tro-ly-ai': 'ai_assistant',
  ai: 'ai_assistant',
  'ai-assistant': 'ai_assistant',
  ai_assistant: 'ai_assistant',
  '5': 'ai_assistant',

  'bao-cao-cai-dat': 'reports_settings',
  'bao-cao': 'reports_settings',
  reports: 'reports_settings',
  settings: 'reports_settings',
  reports_settings: 'reports_settings',
  'reports-settings': 'reports_settings',
  '6': 'reports_settings',
};

// Default tabs per section
export const DEFAULT_TABS: Record<SectionKey, string> = {
  overview: '',
  members_hub: 'attendance', // Tab mặc định là Điểm danh theo yêu cầu
  competition: '',
  study_hub: 'progress',
  ai_assistant: 'assessment',
  reports_settings: 'reports',
};

// Legacy view/tab redirects
export const LEGACY_REDIRECTS: Record<string, { section: SectionKey; tab: string }> = {
  overview: { section: 'overview', tab: '' },
  members: { section: 'members_hub', tab: 'roster' },
  attendance: { section: 'members_hub', tab: 'attendance' },
  groups: { section: 'members_hub', tab: 'groups' },
  competition: { section: 'competition', tab: '' },
  study_hub: { section: 'study_hub', tab: 'progress' },
  documents: { section: 'study_hub', tab: 'documents' },
  assignments: { section: 'study_hub', tab: 'assignments' },
  submissions: { section: 'study_hub', tab: 'submissions' },
  products: { section: 'study_hub', tab: 'submissions' },
  discussions: { section: 'study_hub', tab: 'discussions' },
  reports: { section: 'reports_settings', tab: 'reports' },
  settings: { section: 'reports_settings', tab: 'settings' },
  ai_assessment: { section: 'ai_assistant', tab: 'assessment' },
  ai_chat: { section: 'ai_assistant', tab: 'chat' },
};

// Tab slug normalize
export function normalizeTab(section: SectionKey, tabParam?: string | null, isLeader: boolean = false): string {
  if (!tabParam) return DEFAULT_TABS[section] || '';
  const clean = tabParam.toLowerCase().trim();

  // Handle section 2: members_hub
  if (section === 'members_hub') {
    if (['attendance', 'diem-danh', 'diemdanh'].includes(clean)) return 'attendance';
    if (['roster', 'danh-sach', 'danhsach', 'members', 'thanh-vien'].includes(clean)) return 'roster';
    if (['groups', 'nhom', 'nhom-hoc-tap', 'nhomhoctap'].includes(clean)) return 'groups';
    return 'attendance';
  }

  // Handle section 4: study_hub
  if (section === 'study_hub') {
    if (['progress', 'tien-do', 'tiendo', 'study_hub', 'hoc-tap'].includes(clean)) return 'progress';
    if (['assignments', 'nhiem-vu', 'nhiemvu', 'tasks'].includes(clean)) return 'assignments';
    if (['documents', 'tai-lieu', 'tailieu', 'kho-tai-lieu'].includes(clean)) return 'documents';
    if (['submissions', 'nop-bai', 'nopbai', 'products', 'san-pham', 'nop-bai-san-pham'].includes(clean)) return 'submissions';
    if (['discussions', 'thao-luan', 'thaoluan', 'trao-doi'].includes(clean)) return 'discussions';
    return 'progress';
  }

  // Handle section 5: ai_assistant
  if (section === 'ai_assistant') {
    if (['assessment', 'tao-de', 'taode', 'ai_assessment', 'kiem-tra'].includes(clean)) return 'assessment';
    if (['chat', 'prompt', 'prompt-ho-tro', 'ai_chat', 'tro-ly'].includes(clean)) return 'chat';
    return 'assessment';
  }

  // Handle section 6: reports_settings
  if (section === 'reports_settings') {
    if (['reports', 'thong-ke', 'thongke', 'bao-cao'].includes(clean)) return 'reports';
    if (['export', 'xuat-du-lieu', 'xuatdulieu', 'backup'].includes(clean)) return 'export';
    if (['settings', 'quy-che', 'quyche', 'cai-dat'].includes(clean)) {
      // Permission check: admin/leader only
      return isLeader ? 'settings' : 'reports';
    }
    return 'reports';
  }

  return DEFAULT_TABS[section] || '';
}

// Parse current URL into RouteState
export function parseRoute(isLeader: boolean): RouteState {
  try {
    const url = new URL(window.location.href);
    const pathname = url.pathname.replace(/^\/+/, '').split('/')[0]?.toLowerCase();
    const queryTab = url.searchParams.get('tab')?.toLowerCase();
    const querySection = url.searchParams.get('section')?.toLowerCase() || url.searchParams.get('muc')?.toLowerCase();

    // 1. Check legacy query parameter: e.g. ?tab=documents or ?section=documents
    if (queryTab && LEGACY_REDIRECTS[queryTab]) {
      const target = LEGACY_REDIRECTS[queryTab];
      return {
        section: target.section,
        tab: target.tab === 'settings' && !isLeader ? 'reports' : (target.tab || DEFAULT_TABS[target.section]),
      };
    }
    if (querySection && LEGACY_REDIRECTS[querySection]) {
      const target = LEGACY_REDIRECTS[querySection];
      return {
        section: target.section,
        tab: target.tab === 'settings' && !isLeader ? 'reports' : (target.tab || DEFAULT_TABS[target.section]),
      };
    }

    // 2. Check pathname for legacy or new section
    if (pathname) {
      if (LEGACY_REDIRECTS[pathname]) {
        const target = LEGACY_REDIRECTS[pathname];
        return {
          section: target.section,
          tab: normalizeTab(target.section, queryTab || target.tab, isLeader),
        };
      }
      if (SLUG_TO_SECTION[pathname]) {
        const sec = SLUG_TO_SECTION[pathname];
        return {
          section: sec,
          tab: normalizeTab(sec, queryTab, isLeader),
        };
      }
    }

    // 3. Check query section
    if (querySection && SLUG_TO_SECTION[querySection]) {
      const sec = SLUG_TO_SECTION[querySection];
      return {
        section: sec,
        tab: normalizeTab(sec, queryTab, isLeader),
      };
    }

    // Default: Overview
    return { section: 'overview', tab: '' };
  } catch {
    return { section: 'overview', tab: '' };
  }
}

// Push/Replace URL state cleanly
export function syncUrl(section: SectionKey, tab?: string) {
  try {
    const url = new URL(window.location.href);
    const sectionSlug = SECTION_TO_SLUG[section] || section;
    url.pathname = `/${sectionSlug}`;

    if (tab && tab !== DEFAULT_TABS[section]) {
      url.searchParams.set('tab', tab);
    } else {
      url.searchParams.delete('tab');
    }
    url.searchParams.delete('section');
    url.searchParams.delete('muc');

    window.history.replaceState({ section, tab }, '', url.toString());
  } catch {
    // Ignore URL replace errors in unsupported contexts
  }
}
