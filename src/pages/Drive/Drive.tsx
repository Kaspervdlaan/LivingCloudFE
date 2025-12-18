import { useState, useEffect, useRef } from 'react';
import { useFilesStore } from '../../store/useFilesStore';
import { Layout } from '../../components/layout/Layout/Layout';
import { FileGrid } from '../../components/files/FileGrid/FileGrid';
import { FileList } from '../../components/files/FileList/FileList';
import { DropZone } from '../../components/files/DropZone/DropZone';
import { PhotoPreview } from '../../components/files/PhotoPreview/PhotoPreview';
import { RenameModal } from '../../components/common/RenameModal/RenameModal';
import { CreateFolderModal } from '../../components/common/CreateFolderModal/CreateFolderModal';
import { Button } from '../../components/common/Button/Button';
import { FolderPlus, Upload } from 'lucide-react';
import type { File } from '../../types/file';
import { isImageFile } from '../../utils/fileUtils';
import './_Drive.scss';

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
    currentFolderId,
    navigateToFolder,
    getCurrentFolderName,
  } = useFilesStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files on mount and when folder changes
  useEffect(() => {
    loadFiles(currentFolderId);
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
    }
  };

  const handleDoubleClickFileName = async (file: File, newName: string) => {
    if (newName && newName !== file.name) {
      await renameFile(file.id, newName);
    }
  };

  const handleFileRename = (file: File) => {
    setSelectedFile(file);
    setIsRenameModalOpen(true);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (selectedFile) {
      await renameFile(selectedFile.id, newName);
      setSelectedFile(null);
    }
  };

  const handleFileDelete = async (file: File) => {
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      await deleteFile(file.id);
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

  const handleCreateFolder = async (name: string) => {
    await createFolder({ name });
  };

  const breadcrumbs = [];
  if (currentFolderId) {
    breadcrumbs.push({ id: undefined, name: 'My Drive' });
  }

  return (
    <Layout
      onSearch={handleSearch}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    >
      <DropZone>
        <div className="drive">
          <div className="drive__toolbar">
            <div className="drive__folder-name">{getCurrentFolderName()}</div>
            <div className="drive__actions">
              <Button
                variant="primary"
                onClick={handleUploadClick}
                className="drive__upload"
              >
                <Upload size={18} />
                <span>Upload</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsCreateFolderModalOpen(true)}
                className="drive__create-folder"
              >
                <FolderPlus size={18} />
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
                      onFileRename={handleFileRename}
                      onFileDelete={handleFileDelete}
                      onFileDownload={handleFileDownload}
                    />
                  ) : (
                    <FileList
                      files={filteredFiles}
                      onFileDoubleClick={handleFileDoubleClick}
                      onDoubleClickFileName={handleDoubleClickFileName}
                      onFileRename={handleFileRename}
                      onFileDelete={handleFileDelete}
                      onFileDownload={handleFileDownload}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </DropZone>

      <RenameModal
        isOpen={isRenameModalOpen}
        currentName={selectedFile?.name || ''}
        onClose={() => {
          setIsRenameModalOpen(false);
          setSelectedFile(null);
        }}
        onConfirm={handleRenameConfirm}
      />

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onConfirm={handleCreateFolder}
      />

      <PhotoPreview
        isOpen={isPhotoPreviewOpen}
        file={selectedFile}
        files={files}
        onClose={() => {
          setIsPhotoPreviewOpen(false);
          setSelectedFile(null);
        }}
      />
    </Layout>
  );
}

