import type { File } from '../../../types/file';
import { FileItem } from '../FileItem/FileItem';
import './_FileList.scss';

interface FileListProps {
  files: File[];
  onFileDoubleClick: (file: File) => void;
  onFileRename: (file: File) => void;
  onFileDelete: (file: File) => void;
  onFileDownload: (file: File) => void;
}

export function FileList({
  files,
  onFileDoubleClick,
  onFileRename,
  onFileDelete,
  onFileDownload,
}: FileListProps) {
  return (
    <div className="file-list">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          viewMode="list"
          onDoubleClick={() => onFileDoubleClick(file)}
          onRename={() => onFileRename(file)}
          onDelete={() => onFileDelete(file)}
          onDownload={() => onFileDownload(file)}
        />
      ))}
    </div>
  );
}

