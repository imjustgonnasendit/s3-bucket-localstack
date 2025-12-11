import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as documentService from '../services/documentService';
import * as s3Service from '../services/s3Service';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    console.log('\n🎬 [UPLOAD FLOW] Starting file upload process...');
    
    if (!req.file) {
      console.log('❌ [UPLOAD FLOW] No file provided in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📄 [UPLOAD FLOW] File received from frontend:');
    console.log('   Original filename:', req.file.originalname);
    console.log('   Size:', req.file.size, 'bytes');
    console.log('   MIME type:', req.file.mimetype);

    // Upload to S3
    console.log('\n⬆️  [STEP 1/2] Uploading to LocalStack S3...');
    const { key, bucket } = await s3Service.uploadToS3(req.file);

    // Save metadata to database
    console.log('\n⬆️  [STEP 2/2] Saving metadata to PostgreSQL...');
    const document = await documentService.createDocument({
      id: uuidv4(),
      filename: req.file.filename || req.file.originalname,
      original_filename: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      s3_key: key,
      s3_bucket: bucket,
    });

    console.log('\n🎉 [UPLOAD FLOW] Upload completed successfully!');
    console.log('   Document ID:', document.id);

    res.status(201).json({
      message: 'File uploaded successfully',
      document,
    });
  } catch (error) {
    console.error('\n❌ [UPLOAD FLOW] Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await documentService.getAllDocuments();
    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const downloadUrl = await s3Service.getDownloadUrl(document.s3_key);

    res.json({ downloadUrl, document });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from S3
    await s3Service.deleteFromS3(document.s3_key);

    // Delete from database
    await documentService.deleteDocument(id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
