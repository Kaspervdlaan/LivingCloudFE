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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const imageFiles = files.filter(f => isImageFile(f));

  useEffect(() => {
    if (file && isImageFile(file)) {
      const index = imageFiles.findIndex(f => f.id === file.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [file, imageFiles]);

  useEffect(() => {
    if (!isOpen) {
      setZoom(1);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, imageFiles.length]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < imageFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
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
              onClick={handlePrevious}
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
              onClick={handleNext}
              disabled={currentIndex === imageFiles.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="photo-preview__zoom">
            <button className="photo-preview__button" onClick={handleZoomOut} aria-label="Zoom out">
              <ZoomOut size={20} />
            </button>
            <span className="photo-preview__zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="photo-preview__button" onClick={handleZoomIn} aria-label="Zoom in">
              <ZoomIn size={20} />
            </button>
            <button className="photo-preview__button" onClick={handleFullscreen} aria-label="Fullscreen">
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

