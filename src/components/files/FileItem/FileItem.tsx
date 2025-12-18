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
  viewMode?: 'grid' | 'list';
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
  viewMode = 'grid',
}: FileItemProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [fileName, setFileName] = useState(file.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update fileName when file.name changes (e.g., after rename from context menu)
  useEffect(() => {
    setFileName(file.name);
  }, [file.name]);

  // Auto-focus and select text when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

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
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

  const Icon = iconMap[getFileIconName(file)] || FileIcon;

  return (
    <>
      <div
        className={`file-item file-item--${viewMode}`}
        onContextMenu={handleContextMenu}
      >
        <div className="file-item__icon" onDoubleClick={onDoubleClick}>
          {isImageFile(file) && file.thumbnailUrl ? (
            <img src={file.thumbnailUrl} alt={file.name} className="file-item__thumbnail" />
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
              onBlur={handleSaveRename}
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

