import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import { getDocuments } from './services/api';
import { Document } from './types/document';
import './styles/App.css';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📁 Drag & Drop File Upload</h1>
        <p>Upload files to LocalStack S3 (AWS S3 simulator)</p>
      </header>

      <main className="app-main">
        <FileUpload onUploadSuccess={fetchDocuments} />
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading documents...</p>
          </div>
        ) : (
          <DocumentList documents={documents} onDelete={fetchDocuments} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Backend: Express + TypeScript | Frontend: React + TypeScript | Storage: LocalStack S3 | Database: PostgreSQL
        </p>
      </footer>
    </div>
  );
};

export default App;
