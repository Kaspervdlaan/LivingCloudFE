import type { File } from '../../../types/file';
import { FileItem } from '../FileItem/FileItem';
import './_FileGrid.scss';

interface FileGridProps {
  files: File[];
  onFileDoubleClick: (file: File) => void;
  onDoubleClickFileName: (file: File, newName: string) => void;
  onFileDelete: (file: File) => void;
  onFileDownload: (file: File) => void;
  onFileDrop?: (draggedFileId: string, targetFolderId: string) => void;
  onDropFiles?: (files: FileList, targetFolderId: string) => void;
  onDragOver?: (folderId: string) => void;
  onDragLeave?: () => void;
  onDropComplete?: () => void;
  dragOverFolderId?: string | null;
}

export function FileGrid({
  files,
  onFileDoubleClick,
  onDoubleClickFileName,
  onFileDelete,
  onFileDownload,
  onFileDrop,
  onDropFiles,
  onDragOver,
  onDragLeave,
  onDropComplete,
  dragOverFolderId,
}: FileGridProps) {
  return (
    <div className="file-grid">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          viewMode="grid"
          onDoubleClick={() => onFileDoubleClick(file)}
          onDoubleClickFileName={(f, newName) => onDoubleClickFileName(f, newName)}
          onDelete={() => onFileDelete(file)}
          onDownload={() => onFileDownload(file)}
          onDrop={onFileDrop}
          onDropFiles={onDropFiles}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDropComplete={onDropComplete}
          isDragOver={dragOverFolderId === file.id}
        />
      ))}
    </div>
  );
}

