import pool from '../config/database';
import { Document, CreateDocumentInput } from '../models/Document';

export const createDocument = async (data: CreateDocumentInput): Promise<Document> => {
  console.log('🗄️  [DATABASE] Inserting document metadata into PostgreSQL');
  console.log('   Document ID:', data.id);
  console.log('   Filename:', data.original_filename);
  console.log('   File Size:', data.file_size, 'bytes');
  console.log('   S3 Key:', data.s3_key);
  console.log('   Status:', data.status || 'pending');
  
  const query = `
    INSERT INTO documents (id, filename, original_filename, file_size, mime_type, s3_key, s3_bucket, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const values = [
    data.id,
    data.filename,
    data.original_filename,
    data.file_size,
    data.mime_type,
    data.s3_key,
    data.s3_bucket,
    data.status || 'pending',
  ];

  const result = await pool.query(query, values);
  console.log('✅ [DATABASE] Document metadata saved successfully');
  return result.rows[0];
};

export const updateDocumentStatus = async (
  id: string,
  status: 'pending' | 'completed' | 'failed'
): Promise<void> => {
  console.log('🗄️  [DATABASE] Updating document status');
  console.log('   Document ID:', id);
  console.log('   New Status:', status);
  
  const query = `
    UPDATE documents 
    SET status = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2
  `;
  
  await pool.query(query, [status, id]);
  console.log('✅ [DATABASE] Document status updated');
};

export const getCompletedDocuments = async (): Promise<Document[]> => {
  console.log('🗄️  [DATABASE] Fetching completed documents from PostgreSQL');
  const query = `
    SELECT * FROM documents 
    WHERE status = 'completed' 
    ORDER BY uploaded_at DESC
  `;
  const result = await pool.query(query);
  console.log(`✅ [DATABASE] Retrieved ${result.rows.length} completed documents`);
  return result.rows;
};

export const getAllDocuments = async (): Promise<Document[]> => {
  console.log('🗄️  [DATABASE] Fetching all documents from PostgreSQL');
  const query = 'SELECT * FROM documents ORDER BY uploaded_at DESC';
  const result = await pool.query(query);
  console.log(`✅ [DATABASE] Retrieved ${result.rows.length} documents`);
  return result.rows;
};

export const getDocumentById = async (id: string): Promise<Document | null> => {
  const query = 'SELECT * FROM documents WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const deleteDocument = async (id: string): Promise<boolean> => {
  const query = 'DELETE FROM documents WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
