import express from "express";
import * as documentController from "../controllers/documentController";

const router = express.Router();

// Direct-to-S3 upload flow (no multer needed)
router.post("/upload/request", documentController.requestUploadUrl);
router.post("/upload/confirm/:documentId", documentController.confirmUpload);

// Document management routes
router.get("/documents", documentController.getDocuments);
router.get("/documents/:id", documentController.getDocument);
router.get("/documents/:id/download", documentController.downloadDocument);
router.delete("/documents/:id", documentController.deleteDocument);

export default router;
