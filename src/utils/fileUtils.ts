// Image file extensions
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];

export function isImageFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return IMAGE_MIME_TYPES.includes(file.mimeType);
  }
  
  if (file.extension) {
    return IMAGE_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? IMAGE_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

// Video file extensions
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

export function isVideoFile(file: { name?: string; mimeType?: string; extension?: string }): boolean {
  if (file.mimeType) {
    return VIDEO_MIME_TYPES.includes(file.mimeType) || file.mimeType.startsWith('video/');
  }
  
  if (file.extension) {
    return VIDEO_EXTENSIONS.includes(file.extension.toLowerCase());
  }
  
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? VIDEO_EXTENSIONS.includes(ext) : false;
  }
  
  return false;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileIconName(file: { name: string; mimeType?: string; type: 'file' | 'folder' }): string {
  if (file.type === 'folder') {
    return 'folder';
  }
  
  if (!file.mimeType) {
    return 'file';
  }
  
  const mime = file.mimeType.toLowerCase();
  
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'music';
  if (mime.includes('pdf')) return 'file-text';
  if (mime.includes('word') || mime.includes('document')) return 'file-text';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return 'file-spreadsheet';
  if (mime.includes('zip') || mime.includes('archive')) return 'archive';
  
  return 'file';
}

