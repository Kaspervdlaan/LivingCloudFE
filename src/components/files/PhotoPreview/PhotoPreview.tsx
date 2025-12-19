import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { File } from '../../../types/file';
import { isImageFile } from '../../../utils/fileUtils';
import './_PhotoPreview.scss';

interface PhotoPreviewProps {
  isOpen: boolean;
  file: File | null;
  files: File[];
  onClose: () => void;
}

export function PhotoPreview({ isOpen, file, files, onClose }: PhotoPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const imageFiles = files.filter(f => isImageFile(f));

  // Only set index when the file prop changes (initial open), not when navigating
  useEffect(() => {
    if (file && isImageFile(file) && isOpen) {
      const index = imageFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [file?.id, isOpen]); // Only depend on file.id and isOpen, not imageFiles array

  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
          setZoom(1);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < imageFiles.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setZoom(1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, imageFiles.length, onClose]);

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < imageFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
    }
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!isOpen || !file || imageFiles.length === 0) return null;

  const currentFile = imageFiles[currentIndex];
  const imageUrl = currentFile.thumbnailUrl || currentFile.downloadUrl;

  return (
    <div className="photo-preview" onClick={onClose}>
      <div className="photo-preview__container" onClick={(e) => e.stopPropagation()}>
        <button className="photo-preview__close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>

        <div className="photo-preview__image-container">
          <img
            src={imageUrl}
            alt={currentFile.name}
            className="photo-preview__image"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        <div className="photo-preview__controls">
          <div className="photo-preview__nav">
            <button
              className="photo-preview__button"
              onClick={(e) => handlePrevious(e)}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="photo-preview__counter">
              {currentIndex + 1} / {imageFiles.length}
            </span>
            <button
              className="photo-preview__button"
              onClick={(e) => handleNext(e)}
              disabled={currentIndex === imageFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="photo-preview__zoom">
            <button className="photo-preview__button" onClick={(e) => handleZoomOut(e)} aria-label="Zoom out">
              <ZoomOut size={20} />
            </button>
            <span className="photo-preview__zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="photo-preview__button" onClick={(e) => handleZoomIn(e)} aria-label="Zoom in">
              <ZoomIn size={20} />
            </button>
            <button className="photo-preview__button" onClick={(e) => handleFullscreen(e)} aria-label="Fullscreen">
              <Maximize size={20} />
            </button>
          </div>
        </div>

        <div className="photo-preview__info">
          <div className="photo-preview__name">{currentFile.name}</div>
        </div>
      </div>
    </div>
  );
}

