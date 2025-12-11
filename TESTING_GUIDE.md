# 🧪 Testing Guide - Full Stack Flow

## Current Status ✅

All services are running:
- ✅ **Frontend**: http://localhost:3000 (React + Vite)
- ✅ **Backend**: http://localhost:3001 (Express + TypeScript)
- ✅ **PostgreSQL**: localhost:5432
- ✅ **LocalStack S3**: http://localhost:4566

## How to Test the Full Flow

### 1. Open Browser Console
Open http://localhost:3000 in your browser and **open the Developer Console** (F12 or Cmd+Option+I on Mac)

### 2. Watch Terminal Logs
You should have terminals open for:
- **Backend Terminal**: Shows backend API logs with detailed flow
- **Docker Terminal** (optional): `docker-compose logs -f` to see LocalStack/PostgreSQL logs

### 3. Upload a File

**Steps:**
1. Drag and drop a file OR click the upload area
2. Watch the console logs in your browser
3. Watch the backend terminal for detailed logging

### Expected Log Flow

#### 📱 Frontend (Browser Console):
```
🚀 [FRONTEND] Starting file upload...
   Filename: example.pdf
   Size: 12345 bytes
   Type: application/pdf
📡 [FRONTEND] Sending POST request to backend: http://localhost:3001/api/upload
✅ [FRONTEND] Upload successful! Response: {...}
```

#### 🖥️ Backend (Terminal):
```
================================================================================
[2025-12-11T...] 📥 INCOMING REQUEST
Method: POST | Path: /api/upload
Headers: {...}
================================================================================

🎬 [UPLOAD FLOW] Starting file upload process...
📄 [UPLOAD FLOW] File received from frontend:
   Original filename: example.pdf
   Size: 12345 bytes
   MIME type: application/pdf

⬆️  [STEP 1/2] Uploading to LocalStack S3...
☁️  [LOCALSTACK S3] Uploading file to S3
   Bucket: dragdrop-documents
   Key: uploads/abc-123-example.pdf
   File Size: 12345 bytes
   Content Type: application/pdf
✅ [LOCALSTACK S3] File uploaded successfully to S3

⬆️  [STEP 2/2] Saving metadata to PostgreSQL...
🗄️  [DATABASE] Inserting document metadata into PostgreSQL
   Document ID: xyz-789
   Filename: example.pdf
   File Size: 12345 bytes
   S3 Key: uploads/abc-123-example.pdf
✅ [DATABASE] Document metadata saved successfully

🎉 [UPLOAD FLOW] Upload completed successfully!
   Document ID: xyz-789

[...] 📤 OUTGOING RESPONSE
Status: 201
================================================================================
```

### 4. View Documents List

After upload, the page automatically refreshes the document list.

**Browser Console:**
```
📋 [FRONTEND] Fetching documents list from backend...
✅ [FRONTEND] Received 1 documents
```

**Backend Terminal:**
```
================================================================================
[...] 📥 INCOMING REQUEST
Method: GET | Path: /api/documents
================================================================================

🗄️  [DATABASE] Fetching all documents from PostgreSQL
✅ [DATABASE] Retrieved 1 documents

[...] 📤 OUTGOING RESPONSE
Status: 200
================================================================================
```

### 5. Download a File

Click the download button on any file.

**Browser Console:**
```
⬇️  [FRONTEND] Requesting download URL for document: xyz-789
✅ [FRONTEND] Download URL received
```

**Backend Terminal:**
```
================================================================================
[...] 📥 INCOMING REQUEST
Method: GET | Path: /api/documents/xyz-789/download
================================================================================

☁️  [LOCALSTACK S3] Generating presigned URL for download
   Bucket: dragdrop-documents
   Key: uploads/abc-123-example.pdf
✅ [LOCALSTACK S3] Presigned URL generated (expires in 1 hour)

[...] 📤 OUTGOING RESPONSE
Status: 200
================================================================================
```

### 6. Delete a File

Click the delete button and confirm.

**Browser Console:**
```
🗑️  [FRONTEND] Deleting document: xyz-789
✅ [FRONTEND] Document deleted successfully
```

**Backend Terminal:**
```
================================================================================
[...] 📥 INCOMING REQUEST
Method: DELETE | Path: /api/documents/xyz-789
================================================================================

☁️  [LOCALSTACK S3] Deleting file from S3
   Bucket: dragdrop-documents
   Key: uploads/abc-123-example.pdf
✅ [LOCALSTACK S3] File deleted from S3

🗄️  [DATABASE] Deleting document from PostgreSQL
✅ [DATABASE] Document deleted successfully

[...] 📤 OUTGOING RESPONSE
Status: 200
================================================================================
```

## Communication Flow Diagram

```
┌──────────┐
│ Browser  │
│ (React)  │
└─────┬────┘
      │ 1. Upload file via FormData
      ├─────────────────────────────────────────┐
      │                                         │
      ▼                                         │
┌─────────────┐                                 │
│   Express   │                                 │
│   Backend   │                                 │
└──────┬──────┘                                 │
       │ 2. Upload to S3                        │
       ├──────────────────┐                     │
       │                  │                     │
       ▼                  │                     │
┌──────────────┐          │                     │
│  LocalStack  │          │                     │
│  S3 Bucket   │          │                     │
└──────────────┘          │                     │
       │                  │ 3. Save metadata    │
       │                  ▼                     │
       │           ┌─────────────┐              │
       │           │ PostgreSQL  │              │
       │           │  Database   │              │
       │           └─────────────┘              │
       │                  │                     │
       └──────────────────┴─────────────────────┘
                          │ 4. Return response
                          ▼
                    ┌──────────┐
                    │ Browser  │
                    └──────────┘
```

## Verify Everything Works

### Check Database
```bash
docker exec -it postgres-db psql -U postgres -d dragdrop -c "SELECT id, original_filename, file_size FROM documents;"
```

### Check LocalStack S3
```bash
aws --endpoint-url=http://localhost:4566 s3 ls s3://dragdrop-documents/uploads/
```

### Check Backend Health
```bash
curl http://localhost:3001/health
```

## What to Look For

✅ **Console logs show the full flow**: Frontend → Backend → S3 → Database
✅ **Colored emojis** make it easy to identify each step
✅ **Timestamps** on all backend requests
✅ **Clear step markers** (STEP 1/2, STEP 2/2)
✅ **Success confirmations** (✅) after each operation

## Troubleshooting

If you don't see logs:
1. Make sure browser console is open (F12)
2. Check backend terminal is showing output
3. Refresh the page at http://localhost:3000
4. Try uploading a small test file

Happy testing! 🚀
