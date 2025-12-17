import { useState, type MouseEvent } from 'react';
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
  onRename?: () => void;
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
  onRename,
  onDelete,
  onDownload,
  viewMode = 'grid',
}: FileItemProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const Icon = iconMap[getFileIconName(file)] || FileIcon;

  return (
    <>
      <div
        className={`file-item file-item--${viewMode}`}
        onDoubleClick={onDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="file-item__icon">
          {isImageFile(file) && file.thumbnailUrl ? (
            <img src={file.thumbnailUrl} alt={file.name} className="file-item__thumbnail" />
          ) : (
            <Icon size={viewMode === 'grid' ? 64 : 32} />
          )}
        </div>
        <div className="file-item__info">
          <div className="file-item__name" title={file.name}>
            {file.name}
          </div>
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
          {onRename && (
            <ContextMenuItem onClick={() => { onRename(); handleCloseContextMenu(); }}>
              <span className="context-menu__item-content">
                <Edit size={16} />
                <span>Rename</span>
              </span>
            </ContextMenuItem>
          )}
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

