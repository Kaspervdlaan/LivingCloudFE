import { ReactNode } from 'react';
import { useDragDrop } from '../../../hooks/useDragDrop';
import { useFilesStore } from '../../../store/useFilesStore';
import './_DropZone.scss';

interface DropZoneProps {
  children: ReactNode;
  targetId?: string;
}

export function DropZone({ children, targetId }: DropZoneProps) {
  const uploadFiles = useFilesStore((state) => state.uploadFiles);

  const { isDragging, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onDrop: (files) => {
      uploadFiles(files, targetId);
    },
  });

  return (
    <div
      className={`drop-zone ${isDragging ? 'drop-zone--dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => handleDragOver(e, targetId)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, targetId)}
    >
      {children}
      {isDragging && (
        <div className="drop-zone__overlay">
          <div className="drop-zone__message">Drop files here to upload</div>
        </div>
      )}
    </div>
  );
}

