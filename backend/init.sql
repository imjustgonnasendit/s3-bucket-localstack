-- Create documents table to store file metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    user_id UUID,  -- References users table
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table for CAC authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    edipi VARCHAR(10) UNIQUE NOT NULL,  -- EDI-PI (unique DoD identifier)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    common_name VARCHAR(255) NOT NULL,  -- Full CN from certificate
    email VARCHAR(255),
    organizational_unit VARCHAR(100),  -- USAF, USA, USMC, USN, CONTRACTOR, etc.
    cert_issuer VARCHAR(255),  -- Which DOD CA issued the cert
    cert_serial_number VARCHAR(100),  -- Certificate serial number
    cert_expiration TIMESTAMP NOT NULL,  -- When their CAC expires
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_users_edipi ON users(edipi);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add foreign key constraint
ALTER TABLE documents ADD CONSTRAINT fk_documents_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
