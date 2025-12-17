import { useState } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useFilesStore } from '../../../store/useFilesStore';
import './_FolderTree.scss';

interface FolderTreeProps {
  currentFolderId?: string;
}

export function FolderTree({ currentFolderId }: FolderTreeProps) {
  const navigateToFolder = useFilesStore((state) => state.navigateToFolder);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFolderClick = (folderId: string | undefined) => {
    navigateToFolder(folderId);
  };

  return (
    <div className="folder-tree">
      <div
        className={`folder-tree__item ${!currentFolderId ? 'folder-tree__item--active' : ''}`}
        onClick={() => handleFolderClick(undefined)}
      >
        <Folder size={16} />
        <span>My Drive</span>
      </div>
    </div>
  );
}

