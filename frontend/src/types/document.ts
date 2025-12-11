export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string | null;
  s3_key: string;
  s3_bucket: string;
  uploaded_at: string;
  updated_at: string;
}

export interface UploadResponse {
  message: string;
  document: Document;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface DownloadResponse {
  downloadUrl: string;
  document: Document;
}
