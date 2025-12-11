export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string | null;
  s3_key: string;
  s3_bucket: string;
  uploaded_at: Date;
  updated_at: Date;
}

export interface CreateDocumentInput {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string | null;
  s3_key: string;
  s3_bucket: string;
}
