import type { ReactNode } from 'react';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';
import './_Layout.scss';

interface LayoutProps {
  children: ReactNode;
  onSearch: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFileDrop?: (draggedFileId: string, targetFolderId: string | undefined) => void;
  onDropFiles?: (files: FileList, targetFolderId: string | undefined) => void;
  onDragOver?: (folderId: string | undefined) => void;
  onDragLeave?: () => void;
  dragOverFolderId?: string | null;
}

export function Layout({
  children,
  onSearch,
  viewMode,
  onViewModeChange,
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  dragOverFolderId,
}: LayoutProps) {
  return (
    <div className="layout">
      <Header
        onSearch={onSearch}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
      <div className="layout__body">
        <Sidebar
          onFileDrop={onFileDrop}
          onDropFiles={onDropFiles}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          dragOverFolderId={dragOverFolderId}
        />
        <main className="layout__main">{children}</main>
      </div>
    </div>
  );
}

