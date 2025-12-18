import type { File } from '../../../types/file';
import { FileItem } from '../FileItem/FileItem';
import './_FileGrid.scss';

interface FileGridProps {
  files: File[];
  onFileDoubleClick: (file: File) => void;
  onDoubleClickFileName: (file: File, newName: string) => void;
  onFileRename: (file: File) => void;
  onFileDelete: (file: File) => void;
  onFileDownload: (file: File) => void;
}

export function FileGrid({
  files,
  onFileDoubleClick,
  onDoubleClickFileName,
  onFileRename,
  onFileDelete,
  onFileDownload,
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
          onRename={() => onFileRename(file)}
          onDelete={() => onFileDelete(file)}
          onDownload={() => onFileDownload(file)}
        />
      ))}
    </div>
  );
}

