/**
 * Utilities for member avatar management (resizing, compressing, presets, defaults)
 */

export const STUDENT_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
];

/**
 * Generate default avatar URL with initials
 */
export function getDefaultAvatar(name: string): string {
  const safeName = encodeURIComponent(name.trim() || 'Học Sinh');
  return `https://ui-avatars.com/api/?name=${safeName}&background=0284c7&color=fff&bold=true&size=200`;
}

/**
 * Check if the avatar is a default UI avatar
 */
export function isDefaultAvatar(avatarUrl?: string): boolean {
  if (!avatarUrl) return true;
  return avatarUrl.includes('ui-avatars.com');
}

/**
 * Compress and read image file to square base64 JPEG to preserve storage and ensure fast loading
 */
export function compressAndReadImage(file: File, maxSize = 250): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP,...)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate square crop / fit
          let sx = 0;
          let sy = 0;
          let sSize = Math.min(width, height);
          if (width > height) {
            sx = (width - height) / 2;
          } else {
            sy = (height - width) / 2;
          }

          canvas.width = maxSize;
          canvas.height = maxSize;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            // Draw center-cropped square
            ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, maxSize, maxSize);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressedDataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
