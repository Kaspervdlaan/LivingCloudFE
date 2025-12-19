import { useState, useEffect, useRef } from 'react';
import { useFilesStore } from '../../store/useFilesStore';
import { Layout } from '../../components/layout/Layout/Layout';
import { FileGrid } from '../../components/files/FileGrid/FileGrid';
import { FileList } from '../../components/files/FileList/FileList';
import { DropZone, useDropZone } from '../../components/files/DropZone/DropZone';
import { PhotoPreview } from '../../components/files/PhotoPreview/PhotoPreview';
import { VideoPreview } from '../../components/files/VideoPreview/VideoPreview';
import { ContextMenu, ContextMenuItem } from '../../components/common/ContextMenu/ContextMenu';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal/DeleteConfirmModal';
import { Button } from '../../components/common/Button/Button';
import { FolderPlus, Upload, ArrowLeft, Cloud } from 'lucide-react';
import type { File } from '../../types/file';
import { isImageFile, isVideoFile } from '../../utils/fileUtils';
import './_Drive.scss';
import { useNavigate } from 'react-router-dom';

export function Drive() {
  const {
    files,
    loading,
    error,
    loadFiles,
    uploadFiles,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
    currentFolderId,
    navigateToFolder,
    getCurrentFolderName,
    getFileById,
  } = useFilesStore();

  const handleNavigateUp = () => {
    if (currentFolderId) {
      const currentFolder = getFileById(currentFolderId);
      if (currentFolder && currentFolder.parentId !== undefined) {
        navigateToFolder(currentFolder.parentId);
      } else {
        // Navigate to root (My Drive)
        navigateToFolder(undefined);
      }
    }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [fileToRename, setFileToRename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const driveContentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // Force grid view on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        setViewMode('grid');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    // Prevent view mode change on mobile (always grid)
    if (window.innerWidth <= 768) {
      return;
    }
    setViewMode(mode);
  };

  // Load files on mount and when folder changes
  useEffect(() => {
    loadFiles(currentFolderId).catch(console.error);
  }, [currentFolderId, loadFiles]);

  useEffect(() => {
    // Filter files by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredFiles(
        files.filter(
          (file) => file.name.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredFiles(files);
    }
  }, [files, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileDoubleClick = (file: File) => {
    if (file.type === 'folder') {
      navigateToFolder(file.id);
    } else if (isImageFile(file)) {
      setSelectedFile(file);
      setIsPhotoPreviewOpen(true);
    } else if (isVideoFile(file)) {
      setSelectedFile(file);
      setIsVideoPreviewOpen(true);
    }
  };

  const handleDoubleClickFileName = async (file: File, newName: string) => {
    if (newName && newName !== file.name) {
      await renameFile(file.id, newName);
    }
    // Clear the rename trigger after rename is complete
    if (fileToRename === file.id) {
      setFileToRename(null);
    }
  };

  const handleFileDelete = async (file: File) => {
    setFileToDelete(file);
  };

  const confirmDelete = async () => {
    if (fileToDelete) {
      await deleteFile(fileToDelete.id);
      setFileToDelete(null);
    }
  };

  const handleFileDownload = async (file: File) => {
    try {
      const getFileById = useFilesStore.getState().getFileById;
      const fileData = getFileById(file.id);
      
      if (!fileData || !fileData.downloadUrl) {
        console.error('File not found or no download URL');
        return;
      }
      
      // If it's a base64 data URL, convert to blob
      if (fileData.downloadUrl.startsWith('data:')) {
        const response = await fetch(fileData.downloadUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // It's already a blob URL
        const a = document.createElement('a');
        a.href = fileData.downloadUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const handleCreateFolderFromContext = async () => {
    setContextMenu(null);
    const folderName = 'Newmap';
    await createFolder({ name: folderName });
    // Wait for files to update, then find the newly created folder
    // Use a small delay to ensure the store has updated
    const checkForNewFolder = () => {
      const currentFiles = useFilesStore.getState().files;
      const newFolder = currentFiles.find(f => f.name === folderName && f.type === 'folder');
      if (newFolder) {
        setFileToRename(newFolder.id);
        // Don't clear automatically - let it stay focused until Enter is pressed
      } else {
        // Retry if folder not found yet
        setTimeout(checkForNewFolder, 50);
      }
    };
    setTimeout(checkForNewFolder, 100);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only show context menu if clicking on empty space (not on a file item)
    if ((e.target as HTMLElement).closest('.file-item')) {
      return;
    }
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Helper function to check if a folder is a descendant of another folder
  const isDescendant = (folderId: string | undefined, ancestorId: string): boolean => {
    if (!folderId) return false;
    const folder = getFileById(folderId);
    if (!folder || !folder.parentId) return false;
    if (folder.parentId === ancestorId) return true;
    return isDescendant(folder.parentId, ancestorId);
  };

  const handleFileDrop = (draggedFileId: string, targetFolderId: string | undefined) => {
    // Don't allow dropping a file/folder into itself
    if (draggedFileId === targetFolderId) {
      return;
    }

    // Don't allow dropping a folder into its own descendant (only if targetFolderId is defined)
    if (targetFolderId) {
      const draggedFile = getFileById(draggedFileId);
      if (draggedFile?.type === 'folder' && isDescendant(targetFolderId, draggedFileId)) {
        return;
      }
    }

    // Move the file/folder (undefined = root level)
    moveFile(draggedFileId, targetFolderId);
    setDragOverFolderId(null);
  };

  const handleDragOver = (folderId: string | undefined) => {
    // Empty string represents root, undefined/null means not dragging over anything
    setDragOverFolderId(folderId || '');
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDropFiles = async (files: FileList, targetFolderId: string | undefined) => {
    await uploadFiles(files, targetFolderId);
    setDragOverFolderId(null);
  };

  // Inner component to access DropZone context
  function DriveContent() {
    const dropZone = useDropZone();
    const resetDragging = dropZone?.resetDragging || (() => {});

    return (
      <div 
        className="drive" 
        ref={driveContentRef}
        onContextMenu={handleContextMenu}
      >
        <div className="drive__toolbar">
          <div className="drive__breadcrumb">
            {currentFolderId !== undefined ? (
              <button
                className="drive__back-button"
                onClick={handleNavigateUp}
                title="Go up one folder"
                aria-label="Go up one folder"
              >
                <ArrowLeft size={24} />
              </button>
            ) : (
              <button
                className="drive__back-button"
                onClick={() => navigate('/drive')}
                title="Go to My Drive"
                aria-label="Go to My Drive"
              >
                <Cloud size={24} />
              </button>
            )}
            <span className="drive__folder-name">{getCurrentFolderName()}</span>
          </div>
          <div className="drive__actions">
            <Button
              variant="secondary"
              onClick={handleUploadClick}
              className="drive__upload"
            >
              <Upload size={24} />
              <span>Upload</span>
            </Button>
            <Button
              variant="secondary"
              onClick={handleCreateFolderFromContext}
              className="drive__create-folder"
            >
              <FolderPlus size={24} />
              <span>New Folder</span>
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {loading && <div className="drive__loading">Loading...</div>}
        {error && <div className="drive__error">Error: {error}</div>}

        {!loading && !error && (
          <>
            {filteredFiles.length === 0 ? (
              <div className="drive__empty">
                <p>No files here. Upload files or create a folder to get started.</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <FileGrid
                    files={filteredFiles}
                    onFileDoubleClick={handleFileDoubleClick}
                    onDoubleClickFileName={handleDoubleClickFileName}
                    onFileDelete={handleFileDelete}
                    onFileDownload={handleFileDownload}
                    onFileDrop={handleFileDrop}
                    onDropFiles={handleDropFiles}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDropComplete={resetDragging}
                    dragOverFolderId={dragOverFolderId}
                    fileToRename={fileToRename}
                    currentFolderId={currentFolderId}
                  />
                ) : (
                  <FileList
                    files={filteredFiles}
                    onFileDoubleClick={handleFileDoubleClick}
                    onDoubleClickFileName={handleDoubleClickFileName}
                    onFileDelete={handleFileDelete}
                    onFileDownload={handleFileDownload}
                    onFileDrop={handleFileDrop}
                    onDropFiles={handleDropFiles}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDropComplete={resetDragging}
                    dragOverFolderId={dragOverFolderId}
                    fileToRename={fileToRename}
                    currentFolderId={currentFolderId}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  }

  const breadcrumbs = [];
  if (currentFolderId) {
    breadcrumbs.push({ id: undefined, name: 'My Drive' });
  }

  return (
    <Layout
      onSearch={handleSearch}
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      onFileDrop={handleFileDrop}
      onDropFiles={handleDropFiles}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      dragOverFolderId={dragOverFolderId}
    >
      <DropZone>
        <DriveContent />
      </DropZone>

      <PhotoPreview
        isOpen={isPhotoPreviewOpen}
        file={selectedFile}
        files={files}
        onClose={() => {
          setIsPhotoPreviewOpen(false);
          setSelectedFile(null);
        }}
      />
      <VideoPreview
        isOpen={isVideoPreviewOpen}
        file={selectedFile}
        files={files}
        onClose={() => {
          setIsVideoPreviewOpen(false);
          setSelectedFile(null);
        }}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        >
          <ContextMenuItem onClick={handleCreateFolderFromContext}>
            <FolderPlus size={16} style={{ marginRight: '8px', display: 'inline-block' }} />
            New Folder
          </ContextMenuItem>
        </ContextMenu>
      )}
      <DeleteConfirmModal
        isOpen={fileToDelete !== null}
        fileName={fileToDelete?.name || ''}
        fileType={fileToDelete?.type || 'file'}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDelete}
      />
    </Layout>
  );
}

