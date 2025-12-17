export interface FileMetadata {
  size: number;
  mimeType: string;
  extension: string;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId?: string;
  path?: string;
  size?: number;
  mimeType?: string;
  extension?: string;
  metadata?: FileMetadata;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

export interface Folder extends File {
  type: 'folder';
  childrenCount?: number;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
  path?: string;
}

export interface FileOperationRequest {
  destinationId?: string;
  destinationPath?: string;
}

