import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import * as documentService from "../services/documentService";
import * as s3Service from "../services/s3Service";

export const requestUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileSize, mimeType } = req.body;

    console.log("📝 [UPLOAD REQUEST] Client requesting presigned URL");
    console.log("   Filename:", fileName);
    console.log("   Size:", fileSize, "bytes");
    console.log("   Type:", mimeType);

    // Validate required fields
    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        error: "Missing required fields: fileName, fileSize, mimeType",
      });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ];

    if (!allowedTypes.includes(mimeType)) {
      console.log("❌ [UPLOAD REQUEST] File type not allowed:", mimeType);
      return res.status(400).json({
        error: `File type ${mimeType} not allowed`,
      });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (fileSize > maxSize) {
      console.log("❌ [UPLOAD REQUEST] File too large:", fileSize);
      return res.status(400).json({
        error: "File size exceeds 50MB limit",
      });
    }

    // Sanitize filename
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 255);

    // Generate unique ID and S3 key
    const documentId = uuidv4();
    const fileKey = `uploads/${documentId}-${sanitizedFileName}`;

    console.log("🔑 [UPLOAD REQUEST] Generated document ID:", documentId);
    console.log("🔑 [UPLOAD REQUEST] S3 key:", fileKey);

    // Create pending database record
    await documentService.createDocument({
      id: documentId,
      filename: sanitizedFileName,
      original_filename: fileName,
      file_size: fileSize,
      mime_type: mimeType,
      s3_key: fileKey,
      s3_bucket: process.env.S3_BUCKET_NAME || "dragdrop-documents",
      status: "pending",
    });

    console.log(
      "💾 [UPLOAD REQUEST] Metadata saved to database (status: pending)"
    );

    // Generate presigned POST URL
    const { uploadUrl, fields } = await s3Service.generatePresignedPost({
      key: fileKey,
      contentType: mimeType,
      fileSizeLimit: fileSize,
    });

    console.log("✅ [UPLOAD REQUEST] Presigned URL generated");

    res.json({
      uploadUrl,
      fileKey,
      documentId,
      fields,
      message: "Upload URL generated. Upload file directly to S3.",
    });
  } catch (error) {
    console.error("❌ [UPLOAD REQUEST] Error:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

export const confirmUpload = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    console.log(
      "✔️  [UPLOAD CONFIRM] Verifying upload for document:",
      documentId
    );

    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.status === "completed") {
      console.log("ℹ️  [UPLOAD CONFIRM] Already confirmed");
      return res.json({
        message: "Upload already confirmed",
        document,
      });
    }

    // Verify file exists in S3
    console.log("🔍 [UPLOAD CONFIRM] Checking S3 for key:", document.s3_key);
    const exists = await s3Service.verifyFileExists(document.s3_key);

    if (!exists) {
      console.log("❌ [UPLOAD CONFIRM] File not found in S3");
      return res.status(400).json({
        error: "File not found in S3. Upload may have failed.",
      });
    }

    // Update status to completed
    await documentService.updateDocumentStatus(documentId, "completed");

    console.log(
      "✅ [UPLOAD CONFIRM] Upload confirmed, status updated to completed"
    );

    const updatedDocument = await documentService.getDocumentById(documentId);

    res.json({
      message: "Upload confirmed successfully",
      document: updatedDocument,
    });
  } catch (error) {
    console.error("❌ [UPLOAD CONFIRM] Error:", error);
    res.status(500).json({ error: "Failed to confirm upload" });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await documentService.getCompletedDocuments();
    res.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to retrieve documents" });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ error: "Failed to retrieve document" });
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.status !== "completed") {
      return res.status(400).json({
        error: "Document upload not completed",
      });
    }

    const downloadUrl = await s3Service.getDownloadUrl(document.s3_key);

    res.json({ downloadUrl, document });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete from S3
    await s3Service.deleteFromS3(document.s3_key);

    // Delete from database
    await documentService.deleteDocument(id);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};
