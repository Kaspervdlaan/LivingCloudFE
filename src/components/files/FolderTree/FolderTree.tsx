import { useState, useEffect, useMemo } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useFilesStore } from '../../../store/useFilesStore';
import type { File } from '../../../types/file';
import './_FolderTree.scss';

interface FolderTreeProps {
  currentFolderId?: string;
}

interface FolderNode extends File {
  children?: FolderNode[];
}

export function FolderTree({ currentFolderId }: FolderTreeProps) {
  const navigateToFolder = useFilesStore((state) => state.navigateToFolder);
  const allFiles = useFilesStore((state) => state.allFiles);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Build hierarchical tree structure
  const folderTree = useMemo(() => {
    // Get all folders - filter out undefined/null values first
    const folders = allFiles.filter((f): f is File => f != null && f.type === 'folder');
    
    // Create a map for quick lookup
    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // First pass: create all folder nodes
    folders.forEach((folder) => {
      if (folder && folder.id) {
        folderMap.set(folder.id, { ...folder, children: [] });
      }
    });

    // Second pass: build tree structure
    folders.forEach((folder) => {
      if (!folder || !folder.id) return;
      
      const node = folderMap.get(folder.id);
      if (!node) return;
      
      if (!folder.parentId || folder.parentId === 'root' || folder.parentId === undefined) {
        // Root level folder
        rootFolders.push(node);
      } else {
        // Child folder
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          rootFolders.push(node);
        }
      }
    });

    // Sort folders alphabetically
    const sortFolders = (folders: FolderNode[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach((folder) => {
        if (folder.children) {
          sortFolders(folder.children);
        }
      });
    };

    sortFolders(rootFolders);
    return rootFolders;
  }, [allFiles]);

  // Auto-expand path to current folder
  useEffect(() => {
    if (currentFolderId) {
      const expandPath = (folderId: string | undefined) => {
        if (!folderId) return;
        
        const folder = allFiles.find((f) => f && f.id === folderId && f.type === 'folder');
        if (folder && folder.parentId) {
          setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            newSet.add(folder.parentId!);
            return newSet;
          });
          expandPath(folder.parentId);
        }
      };
      
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentFolderId);
        return newSet;
      });
      expandPath(currentFolderId);
    }
  }, [currentFolderId, allFiles]);

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderClick = (folderId: string | undefined) => {
    navigateToFolder(folderId);
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    if (!folder || !folder.id) return null;
    
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = currentFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id} className="folder-tree__node">
        <div
          className={`folder-tree__item ${isActive ? 'folder-tree__item--active' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleFolderClick(folder.id)}
        >
          {hasChildren ? (
            <button
              className="folder-tree__toggle"
              onClick={(e) => toggleFolder(folder.id, e)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          ) : (
            <span className="folder-tree__spacer" />
          )}
          <Folder size={16} className="folder-tree__icon" />
          <span className="folder-tree__name">{folder.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="folder-tree__children">
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree">
      <div
        className={`folder-tree__item ${!currentFolderId ? 'folder-tree__item--active' : ''}`}
        onClick={() => handleFolderClick(undefined)}
      >
        <Folder size={16} className="folder-tree__icon" />
        <span className="folder-tree__name">My Drive</span>
      </div>
      {folderTree.map((folder) => renderFolder(folder, 0))}
    </div>
  );
}
