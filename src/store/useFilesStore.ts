import { create } from 'zustand';
import type { File, CreateFolderRequest } from '../types/file';

// Helper to generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface FilesState {
  files: File[];
  allFiles: File[]; // All files and folders for tree building
  currentFolderId: string | undefined;
  loading: boolean;
  error: string | null;
  loadFiles: (parentId?: string) => void;
  uploadFiles: (files: FileList | globalThis.File[], parentId?: string) => Promise<void>;
  createFolder: (request: CreateFolderRequest) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  moveFile: (fileId: string, destinationId: string | undefined) => void;
  copyFile: (fileId: string, destinationId: string) => void;
  navigateToFolder: (folderId: string | undefined) => void;
  refreshFiles: () => void;
  getAllFolders: () => File[];
  getFileById: (fileId: string) => File | undefined;
  getCurrentFolderName: () => string;
}

// Initialize with sample data
const initializeSampleData = (): File[] => {
  const now = new Date().toISOString();
  return [
    {
      id: generateId(),
      name: 'Documents',
      type: 'folder',
      parentId: undefined,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Pictures',
      type: 'folder',
      parentId: undefined,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],
  allFiles: initializeSampleData(), // Initialize with sample folders
  currentFolderId: undefined,
  loading: false,
  error: null,

  loadFiles: (parentId?: string) => {
    const state = get();
    // Filter files by parentId from allFiles, excluding the 'root' folder
    const filteredFiles = state.allFiles.filter((f) => {
      // Exclude the root folder (id: 'root') from being displayed
      if (f.id === 'root') {
        return false;
      }
      if (parentId === undefined) {
        // Root level: files with no parentId
        return f.parentId === undefined;
      }
      return f.parentId === parentId;
    });
    
    set({ 
      files: filteredFiles, 
      currentFolderId: parentId, 
      loading: false 
    });
  },

  uploadFiles: async (fileList: FileList | globalThis.File[], parentId?: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const targetParentId = parentId !== undefined ? parentId : (state.currentFolderId || undefined);
      
      // Convert FileList to array
      const fileArray = fileList instanceof FileList ? Array.from(fileList) : fileList;
      const now = new Date().toISOString();
      const newFiles: File[] = [];
      
      // Process each file
      for (const domFile of fileArray) {
        // Generate unique ID
        const fileId = generateId();
        
        // Create file data object
        const fileData: File = {
          id: fileId,
          name: domFile.name,
          type: 'file',
          parentId: targetParentId,
          size: domFile.size,
          mimeType: domFile.type,
          extension: domFile.name.split('.').pop()?.toLowerCase(),
          createdAt: now,
          updatedAt: now,
        };
        
        // Read file content for small files (< 5MB), create blob URL for larger files
        if (domFile.size < 5 * 1024 * 1024) {
          try {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(domFile);
            });
            fileData.downloadUrl = base64;
          } catch (err) {
            // If reading fails, create blob URL instead
            fileData.downloadUrl = URL.createObjectURL(domFile);
          }
        } else {
          fileData.downloadUrl = URL.createObjectURL(domFile);
        }
        
        // Set thumbnail for images
        if (domFile.type.startsWith('image/')) {
          fileData.thumbnailUrl = fileData.downloadUrl;
        }
        
        newFiles.push(fileData);
      }
      
      // Add new files to allFiles
      set((currentState) => ({
        allFiles: [...currentState.allFiles, ...newFiles],
        loading: false,
      }));
      
      // Reload files to show only files in current folder
      get().loadFiles(targetParentId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload files', loading: false });
    }
  },

  createFolder: (request: CreateFolderRequest) => {
    const state = get();
    set({ loading: true, error: null });
    
    try {
      const targetParentId = request.parentId !== undefined ? request.parentId : (state.currentFolderId || undefined);
      const now = new Date().toISOString();
      
      const newFolder: File = {
        id: generateId(),
        name: request.name,
        type: 'folder',
        parentId: targetParentId,
        createdAt: now,
        updatedAt: now,
      };
      
      // Add new folder to allFiles
      set((currentState) => ({
        allFiles: [...currentState.allFiles, newFolder],
        loading: false,
      }));
      
      // Reload files to show only files in current folder
      get().loadFiles(targetParentId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to create folder', loading: false });
    }
  },

  deleteFile: (fileId: string) => {
    set({ loading: true, error: null });
    
    try {
      // Remove file and all children recursively
      const removeRecursive = (id: string, files: File[]): File[] => {
        return files.filter((f) => {
          if (f.id === id) {
            return false;
          }
          // Also remove children
          if (f.parentId === id) {
            return false;
          }
          return true;
        }).map((f) => {
          // Recursively remove children of children
          if (f.parentId === id) {
            return removeRecursive(f.id, [f])[0];
          }
          return f;
        });
      };
      
      set((currentState) => ({
        allFiles: removeRecursive(fileId, currentState.allFiles),
        loading: false,
      }));
      
      // Reload files to refresh the view
      get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete file', loading: false });
    }
  },

  renameFile: (fileId: string, newName: string) => {
    set({ loading: true, error: null });
    
    try {
      set((currentState) => ({
        allFiles: currentState.allFiles.map((f) =>
          f.id === fileId ? { ...f, name: newName, updatedAt: new Date().toISOString() } : f
        ),
        loading: false,
      }));
      
      // Reload files to refresh the view
      get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to rename file', loading: false });
    }
  },

  moveFile: (fileId: string, destinationId: string | undefined) => {
    set({ loading: true, error: null });
    
    try {
      // Update allFiles with new parentId
      const state = get();
      const updatedAllFiles = state.allFiles.map((f) =>
        f.id === fileId ? { ...f, parentId: destinationId, updatedAt: new Date().toISOString() } : f
      );
      
      // Update state
      set({
        allFiles: updatedAllFiles,
        loading: false,
      });
      
      // Reload files for current folder to reflect the change
      const currentState = get();
      currentState.loadFiles(currentState.currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to move file', loading: false });
    }
  },

  copyFile: (fileId: string, destinationId: string) => {
    set({ loading: true, error: null });
    
    try {
      const state = get();
      const fileToCopy = state.allFiles.find((f) => f.id === fileId);
      
      if (!fileToCopy) {
        set({ error: 'File not found', loading: false });
        return;
      }
      
      const now = new Date().toISOString();
      const copiedFile: File = {
        ...fileToCopy,
        id: generateId(),
        name: `${fileToCopy.name} (copy)`,
        parentId: destinationId,
        createdAt: now,
        updatedAt: now,
      };
      
      set((currentState) => ({
        allFiles: [...currentState.allFiles, copiedFile],
        loading: false,
      }));
      
      // Reload files to refresh the view
      get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to copy file', loading: false });
    }
  },

  navigateToFolder: (folderId: string | undefined) => {
    get().loadFiles(folderId);
  },

  refreshFiles: () => {
    const state = get();
    get().loadFiles(state.currentFolderId);
  },

  getAllFolders: () => {
    const state = get();
    return state.allFiles.filter((f) => f.type === 'folder');
  },

  getFileById: (fileId: string) => {
    const state = get();
    return state.allFiles.find((f) => f.id === fileId);
  },

  getCurrentFolderName: () => {
    const state = get();
    if (state.currentFolderId === undefined) {
      return 'My Drive';
    }
    const folder = state.allFiles.find((f) => f.id === state.currentFolderId && f.type === 'folder');
    return folder ? folder.name : 'My Drive';
  },
}));
