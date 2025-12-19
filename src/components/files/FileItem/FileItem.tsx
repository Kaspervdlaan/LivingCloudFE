import { useState, useRef, useEffect, type MouseEvent } from 'react';
import {
  Folder,
  File as FileIcon,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  MoreVertical,
  Download,
  Trash2,
  Edit,
} from 'lucide-react';
import type { File } from '../../../types/file';
import { getFileIconName, isImageFile, formatFileSize } from '../../../utils/fileUtils';
import { ContextMenu, ContextMenuItem } from '../../common/ContextMenu/ContextMenu';
import './_FileItem.scss';

interface FileItemProps {
  file: File;
  onDoubleClick?: () => void;
  onDoubleClickFileName?: (file: File, newName: string) => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDrop?: (draggedFileId: string, targetFolderId: string) => void;
  onDropFiles?: (files: FileList, targetFolderId: string) => void;
  onDragOver?: (folderId: string) => void;
  onDragLeave?: () => void;
  onDropComplete?: () => void;
  isDragOver?: boolean;
  viewMode?: 'grid' | 'list';
  shouldStartRenaming?: boolean;
}

const iconMap: Record<string, any> = {
  folder: Folder,
  image: Image,
  video: Video,
  music: Music,
  'file-text': FileText,
  archive: Archive,
  file: FileIcon,
};

export function FileItem({
  file,
  onDoubleClick,
  onDoubleClickFileName,
  onDelete,
  onDownload,
  onDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  onDropComplete,
  isDragOver,
  viewMode = 'grid',
  shouldStartRenaming = false,
}: FileItemProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [fileName, setFileName] = useState(file.name);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update fileName when file.name changes (e.g., after rename from context menu)
  useEffect(() => {
    setFileName(file.name);
  }, [file.name]);

  // Auto-enter rename mode if shouldStartRenaming is true
  useEffect(() => {
    if (shouldStartRenaming && !isRenaming) {
      setIsRenaming(true);
      setFileName(file.name);
    }
  }, [shouldStartRenaming, isRenaming, file.name]);

  // Auto-focus and select text when entering rename mode
  // Keep focus maintained, especially for newly created folders
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      const focusInput = () => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      };
      // Focus immediately
      focusInput();
      // Also focus on next tick to handle any async rendering
      setTimeout(focusInput, 0);
      // Keep checking focus periodically while renaming (for newly created folders)
      // This ensures the input stays focused until user presses Enter
      if (shouldStartRenaming) {
        const focusInterval = setInterval(focusInput, 100);
        return () => clearInterval(focusInterval);
      }
    }
  }, [isRenaming, shouldStartRenaming]);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDoubleClickFileName = (e: MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
    setFileName(file.name);
  };

  const handleRenameFromContextMenu = () => {
    setIsRenaming(true);
    setFileName(file.name);
    handleCloseContextMenu();
  };

  const handleSaveRename = () => {
    const trimmedName = fileName.trim();
    if (trimmedName && trimmedName !== file.name) {
      onDoubleClickFileName?.(file, trimmedName);
    } else {
      // Reset to original name if empty or unchanged
      setFileName(file.name);
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setFileName(file.name);
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancelRename();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging while renaming
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
    // Create a drag image
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (file.type !== 'folder') return;
    
    // Don't allow dropping while renaming
    if (isRenaming) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's external files (from OS) or internal drag
    const hasFiles = e.dataTransfer.types.includes('Files');
    if (hasFiles) {
      // External files - allow drop
      e.dataTransfer.dropEffect = 'copy';
    } else {
      // Internal drag - move effect
      e.dataTransfer.dropEffect = 'move';
    }
    
    onDragOver?.(file.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (file.type !== 'folder') return;
    
    // Check if we're actually leaving the folder element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onDragLeave?.();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (file.type !== 'folder') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it's external files (from OS) or internal drag
    const hasFiles = e.dataTransfer.types.includes('Files');
    
    if (hasFiles) {
      // External files from Finder/OS - upload to this folder
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onDropFiles?.(files, file.id);
      }
    } else {
      // Internal drag - move file/folder
      const draggedFileId = e.dataTransfer.getData('text/plain');
      
      // Don't allow dropping a folder into itself
      if (draggedFileId === file.id) {
        return;
      }
      
      onDrop?.(draggedFileId, file.id);
    }
    
    onDragLeave?.();
    onDropComplete?.();
  };

  const Icon = iconMap[getFileIconName(file)] || FileIcon;

  return (
    <>
      <div
        className={`file-item file-item--${viewMode} ${isDragging ? 'file-item--dragging' : ''} ${isDragOver ? 'file-item--drag-over' : ''}`}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
      >
        <div className="file-item__icon" onDoubleClick={onDoubleClick}>
          {isImageFile(file) && (file.thumbnailUrl || file.downloadUrl) ? (
            <img 
              src={file.thumbnailUrl || file.downloadUrl} 
              alt={file.name} 
              className="file-item__thumbnail"
            />
          ) : (
            <Icon size={viewMode === 'grid' ? 64 : 32} />
          )}
        </div>
        <div className="file-item__info">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              className="file-item__name file-item__name--editing"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onBlur={(e) => {
                // For newly created folders, don't save on blur - wait for Enter
                // Only save on blur if it's not a newly created folder
                if (!shouldStartRenaming) {
                  handleSaveRename();
                } else {
                  // Keep focus if it's a newly created folder
                  e.target.focus();
                }
              }}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div className="file-item__name" title={file.name} onDoubleClick={handleDoubleClickFileName}>
              {file.name}
            </div>
          )}

          {file.type === 'file' && file.size && (
            <div className="file-item__size">{formatFileSize(file.size)}</div>
          )}
        </div>
        <button className="file-item__menu" onClick={handleContextMenu}>
          <MoreVertical size={14} />
        </button>
      </div>
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={handleCloseContextMenu}>
          <ContextMenuItem onClick={handleRenameFromContextMenu}>
            <span className="context-menu__item-content">
              <Edit size={16} />
              <span>Rename</span>
            </span>
          </ContextMenuItem>
          {onDownload && file.type === 'file' && (
            <ContextMenuItem onClick={() => { onDownload(); handleCloseContextMenu(); }}>
              <span className="context-menu__item-content">
                <Download size={16} />
                <span>Download</span>
              </span>
            </ContextMenuItem>
          )}
          {onDelete && (
            <ContextMenuItem onClick={() => { onDelete(); handleCloseContextMenu(); }} danger>
              <span className="context-menu__item-content">
                <Trash2 size={16} />
                <span>Delete</span>
              </span>
            </ContextMenuItem>
          )}
        </ContextMenu>
      )}
    </>
  );
}

