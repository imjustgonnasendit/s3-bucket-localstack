import express from 'express';
import multer from 'multer';
import * as documentController from '../controllers/documentController';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Routes
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.getDocuments);
router.get('/documents/:id', documentController.getDocument);
router.get('/documents/:id/download', documentController.downloadDocument);
router.delete('/documents/:id', documentController.deleteDocument);

export default router;
