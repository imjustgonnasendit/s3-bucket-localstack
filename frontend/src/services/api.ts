import axios from "axios";
import {
  Document,
  DocumentsResponse,
  DownloadResponse,
} from "../types/document";
import { auth } from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      auth.logout();
    }
    return Promise.reject(error);
  }
);

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileKey: string;
  documentId: string;
  fields: Record<string, string>;
  message: string;
}

export const requestUploadUrl = async (
  fileName: string,
  fileSize: number,
  mimeType: string
): Promise<PresignedUploadResponse> => {
  const response = await api.post<PresignedUploadResponse>(`/upload/request`, {
    fileName,
    fileSize,
    mimeType,
  });
  return response.data;
};

export const uploadToS3 = async (
  uploadUrl: string,
  fields: Record<string, string>,
  file: File
): Promise<void> => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("file", file);
  await axios.post(uploadUrl, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const confirmUpload = async (documentId: string): Promise<Document> => {
  const response = await api.post<{ document: Document; message: string }>(
    `/upload/confirm/${documentId}`
  );
  return response.data.document;
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get<DocumentsResponse>(`/documents`);
  return response.data.documents;
};

export const downloadDocument = async (documentId: string): Promise<void> => {
  const response = await api.get<DownloadResponse>(
    `/documents/${documentId}/download`
  );
  window.open(response.data.downloadUrl, "_blank");
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};
