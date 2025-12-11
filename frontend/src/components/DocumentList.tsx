import React from 'react';
import { Document } from '../types/document';
import { formatFileSize, formatDate } from '../utils/format';
import { getDownloadUrl, deleteDocument } from '../services/api';
import '../styles/DocumentList.css';

interface DocumentListProps {
  documents: Document[];
  onDelete: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete }) => {
  const handleDownload = async (doc: Document) => {
    try {
      const url = await getDownloadUrl(doc.id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        await deleteDocument(id);
        onDelete();
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete file');
      }
    }
  };

  if (documents.length === 0) {
    return (
      <div className="no-documents">
        <p>No documents uploaded yet. Start by uploading your first file!</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      <h2>Uploaded Documents</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Size</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="filename">{doc.original_filename}</td>
                <td>{formatFileSize(doc.file_size)}</td>
                <td>{doc.mime_type || 'Unknown'}</td>
                <td>{formatDate(doc.uploaded_at)}</td>
                <td className="actions">
                  <button
                    className="btn-download"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(doc.id, doc.original_filename)}
                    title="Delete"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentList;
