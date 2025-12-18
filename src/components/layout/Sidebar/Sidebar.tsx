import { FolderTree } from '../../files/FolderTree/FolderTree';
import { useFilesStore } from '../../../store/useFilesStore';
import './_Sidebar.scss';

interface SidebarProps {
  onFileDrop?: (draggedFileId: string, targetFolderId: string | undefined) => void;
  onDropFiles?: (files: FileList, targetFolderId: string | undefined) => void;
  onDragOver?: (folderId: string | undefined) => void;
  onDragLeave?: () => void;
  dragOverFolderId?: string | null;
}

export function Sidebar({
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  dragOverFolderId,
}: SidebarProps) {
  const currentFolderId = useFilesStore((state) => state.currentFolderId);

  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <h3 className="sidebar__title">Folders</h3>
        <FolderTree
          currentFolderId={currentFolderId}
          onFileDrop={onFileDrop}
          onDropFiles={onDropFiles}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          dragOverFolderId={dragOverFolderId}
        />
      </div>
    </aside>
  );
}

