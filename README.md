# Drag & Drop File Upload Application

A full-stack TypeScript application with drag-and-drop file upload functionality, using LocalStack to simulate AWS S3, PostgreSQL database, and a React frontend.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + TypeScript + Node.js
- **Database**: PostgreSQL
- **Storage**: LocalStack (AWS S3 simulator)

## 📋 Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## 🚀 Quick Start

### One Command Setup

```bash
docker-compose up --build
```

That's it! This single command will:

1. ✅ Start LocalStack (S3 simulator)
2. ✅ Start PostgreSQL database
3. ✅ Initialize the S3 bucket
4. ✅ Start the backend API
5. ✅ Start the frontend

**Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- LocalStack S3: http://localhost:4566
- PostgreSQL: localhost:5432

### Stop Everything

```bash
docker-compose down
```

### Stop and Remove All Data

```bash
docker-compose down -v
```

## 🎯 Usage

1. Open `http://localhost:3000` in your browser
2. Drag and drop files onto the upload area, or click to browse
3. View uploaded files in the document list
4. Download or delete files using the action buttons

## 📁 Project Structure

```
drag-drop-app/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and S3 configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # TypeScript interfaces
│   │   ├── routes/          # Express routes
│   │   ├── scripts/         # Utility scripts
│   │   ├── services/        # Business logic
│   │   └── server.ts        # Main server file
│   ├── init.sql             # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service layer
│   │   ├── styles/          # CSS files
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── docker-compose.yml       # Docker services configuration
```

## 🔧 API Endpoints

### Upload File

```
POST /api/upload
Content-Type: multipart/form-data
Body: file (FormData)
```

### Get All Documents

```
GET /api/documents
```

### Get Document by ID

```
GET /api/documents/:id
```

### Download Document

```
GET /api/documents/:id/download
Response: { downloadUrl: string, document: Document }
```

### Delete Document

```
DELETE /api/documents/:id
```

### Health Check

```
GET /health
```

## 🐳 Docker Services

### LocalStack (S3)

- Endpoint: `http://localhost:4566`
- Service: S3
- Bucket: `dragdrop-documents`

### PostgreSQL

- Host: `localhost`
- Port: `5432`
- Database: `dragdrop`
- User: `postgres`
- Password: `postgres`

## 🛠️ Development Commands

### Backend

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm run init-localstack  # Initialize LocalStack S3 bucket
```

### Frontend

```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🌟 Features

- ✅ Drag and drop file upload
- ✅ Click to browse and upload
- ✅ File size validation (50MB max)
- ✅ Real-time upload progress
- ✅ Document list with metadata
- ✅ File download with presigned URLs
- ✅ File deletion
- ✅ Responsive design
- ✅ TypeScript throughout
- ✅ LocalStack S3 integration
- ✅ PostgreSQL database

## 🔐 Environment Variables

### Backend (.env)

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dragdrop
DB_USER=postgres
DB_PASSWORD=postgres
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_ENDPOINT=http://localhost:4566
S3_BUCKET_NAME=dragdrop-documents
```

## 🧪 Testing LocalStack

You can test LocalStack S3 using AWS CLI:

```bash
# List buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List objects in bucket
aws --endpoint-url=http://localhost:4566 s3 ls s3://dragdrop-documents
```

## 📝 Database Schema

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🐛 Troubleshooting

### LocalStack not connecting

- Ensure Docker is running: `docker ps`
- Check LocalStack logs: `docker logs localstack-s3`
- Verify endpoint: `http://localhost:4566`

### Database connection failed

- Check PostgreSQL is running: `docker ps`
- Verify credentials in `.env`
- Check logs: `docker logs postgres-db`

### Upload fails

- Check backend is running on port 3001
- Verify LocalStack bucket is initialized
- Check file size (max 50MB)

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
