export interface FileChunk {
  iv: string;
  encrypted: string;
  originalSize: number;
  compressedSize: number;
  encryptedSize: number;
  fileId: number;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileType: string;
  lastModified: number;
}

export interface FileData {
  createdAt: string;
  fileID: number;
  fileName: string;
  filePath: string;
  ownerId: number;
  updatedAt: string;
  uuid: string;
  size: number;
  type: string;
}

export interface ProgressStatus {
  status: 'progress' | 'complete' | 'error';
  percentage: number;
}
