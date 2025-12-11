# 🚀 One-Command Startup Guide

Everything runs in Docker now! No need to manage multiple terminals.

## Start Everything

```bash
docker-compose up --build
```

This will:

- Build and start all services (LocalStack, PostgreSQL, Backend, Frontend)
- Initialize the S3 bucket automatically
- Set up the database schema
- Start with full logging enabled

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/health
- **LocalStack S3**: http://localhost:4566

## View Logs

### All services:

```bash
docker-compose logs -f
```

### Specific service:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f localstack
```

## Stop Everything

```bash
docker-compose down
```

## Stop and Reset (Remove all data)

```bash
docker-compose down -v
```

## Rebuild After Code Changes

```bash
docker-compose up --build
```

## Troubleshooting

### Services won't start

```bash
docker-compose down -v
docker-compose up --build
```

### Check service status

```bash
docker-compose ps
```

### Access backend container

```bash
docker exec -it backend-api sh
```

### Check database

```bash
docker exec -it postgres-db psql -U postgres -d dragdrop -c "SELECT * FROM documents;"
```

### Check S3 bucket

```bash
docker exec -it localstack-s3 awslocal s3 ls s3://dragdrop-documents
```

## Development Workflow

1. Start services: `docker-compose up --build`
2. Make code changes (they auto-reload with volumes)
3. Test in browser at http://localhost:3000
4. View logs: `docker-compose logs -f backend frontend`
5. Stop when done: `docker-compose down`

That's it! No more managing multiple terminal windows. 🎉
