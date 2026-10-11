import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Video,
  Music,
  Image as ImageIcon,
  FileCode,
  Archive,
  File,
} from 'lucide-react';
import { FileTypeCategory } from '../types';

interface Props {
  type: FileTypeCategory;
  extension?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const FileIconBadge: React.FC<Props> = ({
  type,
  extension,
  size = 'md',
  showLabel = false,
}) => {
  const getDetails = () => {
    switch (type) {
      case 'word':
        return {
          icon: FileText,
          bg: 'bg-blue-100 text-blue-700 border-blue-200',
          label: 'Word',
          badgeText: extension?.toUpperCase() || 'DOCX',
        };
      case 'pdf':
        return {
          icon: FileText,
          bg: 'bg-red-100 text-red-700 border-red-200',
          label: 'PDF',
          badgeText: 'PDF',
        };
      case 'excel':
        return {
          icon: FileSpreadsheet,
          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          label: 'Excel',
          badgeText: extension?.toUpperCase() || 'XLSX',
        };
      case 'powerpoint':
        return {
          icon: Presentation,
          bg: 'bg-amber-100 text-amber-700 border-amber-200',
          label: 'PowerPoint',
          badgeText: extension?.toUpperCase() || 'PPTX',
        };
      case 'video':
        return {
          icon: Video,
          bg: 'bg-purple-100 text-purple-700 border-purple-200',
          label: 'Video',
          badgeText: extension?.toUpperCase() || 'MP4',
        };
      case 'audio':
        return {
          icon: Music,
          bg: 'bg-pink-100 text-pink-700 border-pink-200',
          label: 'Âm thanh',
          badgeText: extension?.toUpperCase() || 'MP3',
        };
      case 'image':
        return {
          icon: ImageIcon,
          bg: 'bg-cyan-100 text-cyan-700 border-cyan-200',
          label: 'Hình ảnh',
          badgeText: extension?.toUpperCase() || 'IMG',
        };
      case 'text':
        return {
          icon: FileCode,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Văn bản',
          badgeText: extension?.toUpperCase() || 'TXT',
        };
      case 'archive':
        return {
          icon: Archive,
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'File nén',
          badgeText: extension?.toUpperCase() || 'ZIP',
        };
      default:
        return {
          icon: File,
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          label: 'Tệp tin',
          badgeText: extension?.toUpperCase() || 'FILE',
        };
    }
  };

  const details = getDetails();
  const IconComponent = details.icon;

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 26,
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`relative inline-flex items-center justify-center rounded-lg border font-semibold ${details.bg} ${sizeClasses[size]}`}
        title={`${details.label} (${details.badgeText})`}
      >
        <IconComponent size={iconSizes[size]} />
        <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded bg-white shadow-xs border border-gray-200 text-gray-800 uppercase tracking-tighter">
          {details.badgeText.length > 4 ? details.badgeText.substring(0, 3) : details.badgeText}
        </span>
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600">
          {details.label}
        </span>
      )}
    </div>
  );
};
