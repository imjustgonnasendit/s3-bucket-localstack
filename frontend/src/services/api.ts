import axios from 'axios';
import { Document, UploadResponse, DocumentsResponse, DownloadResponse } from '../types/document';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const uploadFile = async (file: File): Promise<Document> => {
  console.log('\n🚀 [FRONTEND] Starting file upload...');
  console.log('   Filename:', file.name);
  console.log('   Size:', file.size, 'bytes');
  console.log('   Type:', file.type);
  
  const formData = new FormData();
  formData.append('file', file);

  console.log('📡 [FRONTEND] Sending POST request to backend:', `${API_BASE_URL}/upload`);
  
  const response = await axios.post<UploadResponse>(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('✅ [FRONTEND] Upload successful! Response:', response.data);
  return response.data.document;
};

export const getDocuments = async (): Promise<Document[]> => {
  console.log('\n📋 [FRONTEND] Fetching documents list from backend...');
  const response = await axios.get<DocumentsResponse>(`${API_BASE_URL}/documents`);
  console.log(`✅ [FRONTEND] Received ${response.data.documents.length} documents`);
  return response.data.documents;
};

export const getDownloadUrl = async (id: string): Promise<string> => {
  console.log('\n⬇️  [FRONTEND] Requesting download URL for document:', id);
  const response = await axios.get<DownloadResponse>(`${API_BASE_URL}/documents/${id}/download`);
  console.log('✅ [FRONTEND] Download URL received');
  return response.data.downloadUrl;
};

export const deleteDocument = async (id: string): Promise<void> => {
  console.log('\n🗑️  [FRONTEND] Deleting document:', id);
  await axios.delete(`${API_BASE_URL}/documents/${id}`);
  console.log('✅ [FRONTEND] Document deleted successfully');
};
