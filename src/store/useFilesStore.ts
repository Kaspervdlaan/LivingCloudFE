import { create } from 'zustand';
import type { File, CreateFolderRequest } from '../types/file';
import { api } from '../utils/api';

interface FilesState {
  files: File[];
  allFiles: File[]; // All files and folders for tree building (cached)
  currentFolderId: string | undefined;
  loading: boolean;
  error: string | null;
  loadFiles: (parentId?: string) => Promise<void>;
  uploadFiles: (files: FileList | globalThis.File[], parentId?: string) => Promise<void>;
  createFolder: (request: CreateFolderRequest) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, destinationId: string | undefined) => Promise<void>;
  copyFile: (fileId: string, destinationId: string) => Promise<void>;
  navigateToFolder: (folderId: string | undefined) => Promise<void>;
  refreshFiles: () => Promise<void>;
  getAllFolders: () => File[];
  getFileById: (fileId: string) => File | undefined;
  getCurrentFolderName: () => string;
  loadAllFolders: () => Promise<void>; // Load all folders for tree view
}

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],
  allFiles: [], // Start empty, will be loaded from API
  currentFolderId: undefined,
  loading: false,
  error: null,

  loadFiles: async (parentId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getFiles(parentId);
      const fetchedFiles = response.data;
      
      // Update allFiles cache with fetched files
      set((currentState) => {
        const existingIds = new Set(currentState.allFiles.map((f) => f.id));
        const newFiles = fetchedFiles.filter((f) => !existingIds.has(f.id));
        const updatedFiles = currentState.allFiles.map((f) => {
          const updated = fetchedFiles.find((nf) => nf.id === f.id);
          return updated || f;
        });
        
        return {
          allFiles: [...updatedFiles, ...newFiles],
          files: fetchedFiles,
          currentFolderId: parentId,
          loading: false,
        };
      });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to load files',
        loading: false,
      });
    }
  },

  loadAllFolders: async () => {
    try {
      // Fetch all files to get all folders for tree view
      const response = await api.getFiles();
      const allItems = response.data;
      
      // Also try to get files from common parent folders to build complete tree
      // For now, we'll update allFiles with what we have
      set((currentState) => {
        const existingIds = new Set(currentState.allFiles.map((f) => f.id));
        const newItems = allItems.filter((f) => !existingIds.has(f.id));
        const updatedItems = currentState.allFiles.map((f) => {
          const updated = allItems.find((nf) => nf.id === f.id);
          return updated || f;
        });
        
        return {
          allFiles: [...updatedItems, ...newItems],
        };
      });
    } catch (err: any) {
      console.error('Failed to load all folders:', err);
    }
  },

  uploadFiles: async (fileList: FileList | globalThis.File[], parentId?: string) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const targetParentId = parentId !== undefined ? parentId : (state.currentFolderId || undefined);
      
      const response = await api.uploadFiles(fileList, targetParentId);
      const uploadedFiles = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: [...currentState.allFiles, ...uploadedFiles],
        loading: false,
      }));
      
      // Reload files to show only files in current folder
      await get().loadFiles(targetParentId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload files', loading: false });
    }
  },

  createFolder: async (request: CreateFolderRequest) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const targetParentId = request.parentId !== undefined ? request.parentId : (state.currentFolderId || undefined);
      
      const folderRequest = {
        ...request,
        parentId: targetParentId,
      };
      
      const response = await api.createFolder(folderRequest);
      const newFolder = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: [...currentState.allFiles, newFolder],
        loading: false,
      }));
      
      // Reload files to show only files in current folder
      await get().loadFiles(targetParentId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to create folder', loading: false });
    }
  },

  deleteFile: async (fileId: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteFile(fileId);
      
      // Remove from allFiles cache (recursive removal handled by backend)
      set((currentState) => {
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
        
        return {
          allFiles: removeRecursive(fileId, currentState.allFiles),
          loading: false,
        };
      });
      
      // Reload files to refresh the view
      await get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete file', loading: false });
    }
  },

  renameFile: async (fileId: string, newName: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.renameFile(fileId, newName);
      const updatedFile = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: currentState.allFiles.map((f) =>
          f.id === fileId ? updatedFile : f
        ),
        loading: false,
      }));
      
      // Reload files to refresh the view
      await get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to rename file', loading: false });
    }
  },

  moveFile: async (fileId: string, destinationId: string | undefined) => {
    set({ loading: true, error: null });
    try {
      const response = await api.moveFile(fileId, destinationId);
      const updatedFile = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: currentState.allFiles.map((f) =>
          f.id === fileId ? updatedFile : f
        ),
        loading: false,
      }));
      
      // Reload files for current folder to reflect the change
      await get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to move file', loading: false });
    }
  },

  copyFile: async (fileId: string, destinationId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.copyFile(fileId, destinationId);
      const copiedFile = response.data;
      
      // Update allFiles cache
      set((currentState) => ({
        allFiles: [...currentState.allFiles, copiedFile],
        loading: false,
      }));
      
      // Reload files to refresh the view
      await get().loadFiles(get().currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to copy file', loading: false });
    }
  },

  navigateToFolder: async (folderId: string | undefined) => {
    await get().loadFiles(folderId);
  },

  refreshFiles: async () => {
    const state = get();
    await get().loadFiles(state.currentFolderId);
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
