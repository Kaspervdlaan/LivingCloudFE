import type { File, Folder, CreateFolderRequest } from '../types/file';
import type { APIResponse } from '../types/api';

const STORAGE_KEY = 'drive_mock_data';
const DELAY_MS = 300; // Simulate network delay

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Delay helper
function delay(ms: number = DELAY_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get stored data
function getStoredData(): { files: File[] } {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { files: [] };
    }
  }
  return { files: [] };
}

// Save data
function saveData(data: { files: File[] }): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Initialize with sample data if empty
function initializeSampleData(): void {
  const data = getStoredData();
  if (data.files.length === 0) {
    const now = new Date().toISOString();
    const sampleFiles: File[] = [
      {
        id: 'root',
        name: 'My Drive',
        type: 'folder',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        name: 'Documents',
        type: 'folder',
        parentId: undefined, // Root level
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        name: 'Pictures',
        type: 'folder',
        parentId: undefined, // Root level
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        name: 'sample-document.pdf',
        type: 'file',
        parentId: undefined, // Root level
        size: 102400,
        mimeType: 'application/pdf',
        extension: 'pdf',
        createdAt: now,
        updatedAt: now,
      },
    ];
    saveData({ files: sampleFiles });
  }
}

// Initialize on load
initializeSampleData();

export const mockApi = {
  // Get files
  async getFiles(parentId?: string, path?: string): Promise<APIResponse<File[]>> {
    await delay();
    const data = getStoredData();
    let files = data.files;
    
    if (parentId) {
      files = files.filter(f => f.parentId === parentId);
    } else if (!parentId && !path) {
      // Root level
      files = files.filter(f => f.parentId === undefined || f.parentId === 'root');
    }
    
    return { data: files };
  },

  // Get file by ID
  async getFileById(fileId: string): Promise<APIResponse<File>> {
    await delay();
    const data = getStoredData();
    const file = data.files.find(f => f.id === fileId);
    
    if (!file) {
      throw { message: 'File not found', statusCode: 404 } as any;
    }
    
    return { data: file };
  },

  // Upload files
  async uploadFiles(files: FileList | File[], parentId?: string): Promise<APIResponse<File[]>> {
    await delay(500);
    const data = getStoredData();
    const now = new Date().toISOString();
    const uploadedFiles: File[] = [];
    
    const fileArray = files instanceof FileList ? Array.from(files) : files;
    
    // Normalize parentId: undefined means root level
    const normalizedParentId = parentId === undefined || parentId === 'root' ? undefined : parentId;
    
    for (const file of fileArray) {
      const fileData: File = {
        id: generateId(),
        name: file.name,
        type: 'file',
        parentId: normalizedParentId,
        size: file.size,
        mimeType: file.type,
        extension: file.name.split('.').pop()?.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      };
      
      // Store file content as base64 for small files, or create blob URL
      if (file.size < 5 * 1024 * 1024) { // < 5MB
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
          fileData.downloadUrl = base64;
        } catch (err) {
          // If reading fails, create blob URL instead
          fileData.downloadUrl = URL.createObjectURL(file);
        }
      } else {
        fileData.downloadUrl = URL.createObjectURL(file);
      }
      
      if (file.type.startsWith('image/')) {
        fileData.thumbnailUrl = fileData.downloadUrl;
      }
      
      data.files.push(fileData);
      uploadedFiles.push(fileData);
    }
    
    saveData(data);
    return { data: uploadedFiles };
  },

  // Delete file
  async deleteFile(fileId: string): Promise<void> {
    await delay();
    const data = getStoredData();
    
    // Remove file and all children if it's a folder
    const removeRecursive = (id: string) => {
      data.files = data.files.filter(f => f.id !== id);
      const children = data.files.filter(f => f.parentId === id);
      children.forEach(child => removeRecursive(child.id));
    };
    
    removeRecursive(fileId);
    saveData(data);
  },

  // Rename file
  async renameFile(fileId: string, newName: string): Promise<APIResponse<File>> {
    await delay();
    const data = getStoredData();
    const file = data.files.find(f => f.id === fileId);
    
    if (!file) {
      throw { message: 'File not found', statusCode: 404 } as any;
    }
    
    file.name = newName;
    file.updatedAt = new Date().toISOString();
    
    saveData(data);
    return { data: file };
  },

  // Move file
  async moveFile(fileId: string, destinationId: string): Promise<APIResponse<File>> {
    await delay();
    const data = getStoredData();
    const file = data.files.find(f => f.id === fileId);
    
    if (!file) {
      throw { message: 'File not found', statusCode: 404 } as any;
    }
    
    file.parentId = destinationId;
    file.updatedAt = new Date().toISOString();
    
    saveData(data);
    return { data: file };
  },

  // Copy file
  async copyFile(fileId: string, destinationId: string): Promise<APIResponse<File>> {
    await delay(400);
    const data = getStoredData();
    const file = data.files.find(f => f.id === fileId);
    
    if (!file) {
      throw { message: 'File not found', statusCode: 404 } as any;
    }
    
    const copiedFile: File = {
      ...file,
      id: generateId(),
      name: `${file.name} (copy)`,
      parentId: destinationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    data.files.push(copiedFile);
    saveData(data);
    return { data: copiedFile };
  },

  // Create folder
  async createFolder(request: CreateFolderRequest): Promise<APIResponse<Folder>> {
    await delay();
    const data = getStoredData();
    const now = new Date().toISOString();
    
    // Normalize parentId: undefined means root level
    const normalizedParentId = request.parentId === undefined || request.parentId === 'root' ? undefined : request.parentId;
    
    const folder: Folder = {
      id: generateId(),
      name: request.name,
      type: 'folder',
      parentId: normalizedParentId,
      createdAt: now,
      updatedAt: now,
    };
    
    data.files.push(folder);
    saveData(data);
    return { data: folder };
  },

  // Download file (returns blob URL or base64)
  async downloadFile(fileId: string): Promise<Blob> {
    await delay();
    const data = getStoredData();
    const file = data.files.find(f => f.id === fileId);
    
    if (!file || !file.downloadUrl) {
      throw { message: 'File not found', statusCode: 404 } as any;
    }
    
    if (file.downloadUrl.startsWith('data:')) {
      // Base64 data URL
      const response = await fetch(file.downloadUrl);
      return await response.blob();
    } else {
      // Blob URL
      const response = await fetch(file.downloadUrl);
      return await response.blob();
    }
  },
};

