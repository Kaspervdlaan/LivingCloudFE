import type { File, Folder, CreateFolderRequest } from '../types/file';
import type { APIResponse, APIError } from '../types/api';
import { getApiUrl } from '../config/api';

/**
 * Handle API errors
 */
async function handleResponse<T>(response: Response): Promise<APIResponse<T>> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData: APIError = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Real API client for Drive backend
 */
export const api = {
  /**
   * Get files (list files in a folder)
   */
  async getFiles(parentId?: string): Promise<APIResponse<File[]>> {
    const url = parentId
      ? getApiUrl(`files?parentId=${encodeURIComponent(parentId)}`)
      : getApiUrl('files');
    
    const response = await fetch(url);
    return handleResponse<File[]>(response);
  },

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}`));
    return handleResponse<File>(response);
  },

  /**
   * Upload files
   */
  async uploadFiles(
    files: FileList | File[],
    parentId?: string
  ): Promise<APIResponse<File[]>> {
    const formData = new FormData();
    
    // Convert FileList to array if needed
    const fileArray = files instanceof FileList ? Array.from(files) : files;
    
    // Add all files to FormData
    fileArray.forEach((file) => {
      formData.append('files', file);
    });
    
    // Add parentId if provided
    if (parentId) {
      formData.append('parentId', parentId);
    }
    
    const response = await fetch(getApiUrl('files/upload'), {
      method: 'POST',
      body: formData,
    });
    
    return handleResponse<File[]>(response);
  },

  /**
   * Create folder
   */
  async createFolder(request: CreateFolderRequest): Promise<APIResponse<Folder>> {
    const response = await fetch(getApiUrl('folders'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    return handleResponse<Folder>(response);
  },

  /**
   * Rename file/folder
   */
  async renameFile(fileId: string, newName: string): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/rename`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    });
    
    return handleResponse<File>(response);
  },

  /**
   * Move file/folder
   */
  async moveFile(
    fileId: string,
    destinationId?: string
  ): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/move`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ destinationId: destinationId || null }),
    });
    
    return handleResponse<File>(response);
  },

  /**
   * Copy file/folder
   */
  async copyFile(fileId: string, destinationId: string): Promise<APIResponse<File>> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/copy`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ destinationId }),
    });
    
    return handleResponse<File>(response);
  },

  /**
   * Delete file/folder
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}`), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData: APIError = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // 204 No Content - no body to parse
    if (response.status !== 204) {
      await response.json();
    }
  },

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(getApiUrl(`files/${encodeURIComponent(fileId)}/download`));
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData: APIError = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    return response.blob();
  },
};

