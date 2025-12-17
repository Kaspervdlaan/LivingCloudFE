import { create } from 'zustand';
import type { File, CreateFolderRequest } from '../types/file';
import { mockApi } from '../utils/mockApi';

interface FilesState {
  files: File[];
  currentFolderId: string | undefined;
  loading: boolean;
  error: string | null;
  loadFiles: (parentId?: string) => Promise<void>;
  uploadFiles: (files: FileList | globalThis.File[], parentId?: string) => Promise<void>;
  createFolder: (request: CreateFolderRequest) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, destinationId: string) => Promise<void>;
  copyFile: (fileId: string, destinationId: string) => Promise<void>;
  navigateToFolder: (folderId: string | undefined) => void;
  refreshFiles: () => Promise<void>;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],
  currentFolderId: undefined,
  loading: false,
  error: null,

  loadFiles: async (parentId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await mockApi.getFiles(parentId);
      set({ files: response.data, currentFolderId: parentId, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load files', loading: false });
    }
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
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
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
      
      // Add new files to state
      // If we're viewing the folder where files were uploaded, add them to the displayed files
      const updatedState = get();
      if (updatedState.currentFolderId === targetParentId) {
        set((currentState) => ({
          files: [...currentState.files, ...newFiles],
          loading: false,
        }));
      } else {
        // If viewing a different folder, just add to the full list (files will be filtered on next load)
        set((currentState) => ({
          files: [...currentState.files, ...newFiles],
          loading: false,
        }));
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to upload files', loading: false });
    }
  },

  createFolder: async (request: CreateFolderRequest) => {
    const state = get();
    set({ loading: true, error: null });
    try {
      await mockApi.createFolder({
        ...request,
        parentId: request.parentId || state.currentFolderId,
      });
      await get().loadFiles(state.currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to create folder', loading: false });
    }
  },

  deleteFile: async (fileId: string) => {
    const state = get();
    set({ loading: true, error: null });
    try {
      await mockApi.deleteFile(fileId);
      await get().loadFiles(state.currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete file', loading: false });
    }
  },

  renameFile: async (fileId: string, newName: string) => {
    const state = get();
    set({ loading: true, error: null });
    try {
      await mockApi.renameFile(fileId, newName);
      await get().loadFiles(state.currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to rename file', loading: false });
    }
  },

  moveFile: async (fileId: string, destinationId: string) => {
    const state = get();
    set({ loading: true, error: null });
    try {
      await mockApi.moveFile(fileId, destinationId);
      await get().loadFiles(state.currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to move file', loading: false });
    }
  },

  copyFile: async (fileId: string, destinationId: string) => {
    const state = get();
    set({ loading: true, error: null });
    try {
      await mockApi.copyFile(fileId, destinationId);
      await get().loadFiles(state.currentFolderId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to copy file', loading: false });
    }
  },

  navigateToFolder: (folderId: string | undefined) => {
    get().loadFiles(folderId);
  },

  refreshFiles: async () => {
    const state = get();
    await get().loadFiles(state.currentFolderId);
  },
}));

