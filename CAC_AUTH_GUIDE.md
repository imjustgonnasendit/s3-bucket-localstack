# 🎖️ DOD CAC Card Authentication Implementation Guide

## Overview

This application now supports **DOD Common Access Card (CAC) authentication** using PKI certificates. Users authenticate by presenting their CAC card certificate, which is validated against official DOD Certificate Authorities.

---

## 🏗️ Architecture

### Authentication Flow

```
┌──────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser    │────────▶│  Nginx/TLS   │────────▶│   Backend   │
│  + CAC Card  │  HTTPS  │   (mutual    │  Cert   │ CAC Service │
│              │◀────────│     auth)    │◀────────│  Validates  │
└──────────────┘  JWT    └──────────────┘  User   └─────────────┘
                                                          │
                                                          ▼
                                                   ┌─────────────┐
                                                   │  PostgreSQL │
                                                   │ Users Table │
                                                   └─────────────┘
```

### Certificate Chain

```
DOD Root CA 3 (or CA 2)
  └── DOD ID CA-XX (Intermediate CA)
      └── User's CAC Certificate
          Subject: LAST.FIRST.MIDDLE.EDIPI
          EDI-PI: 1234567890
```

---

## 📋 Setup Instructions

### Step 1: Download DOD Certificates

Run the automated script:

```bash
cd backend
npm run download-dod-certs
```

**Or manually:**

1. Visit https://public.cyber.mil/pki-pke/
2. Download "Certificates_PKCS7_v5.9_DoD.pem.zip"
3. Extract to `backend/certs/`
4. Run: `npm run setup-certs`

### Step 2: Update Database Schema

The users table has been added to `init.sql`. Apply it:

```bash
# Recreate database with new schema
docker compose down -v
docker compose up --build
```

**Or apply manually:**

```bash
docker compose exec postgres psql -U postgres -d dragdrop -f /docker-entrypoint-initdb.d/init.sql
```

### Step 3: Configure TLS/SSL for Client Certificates

You have two options:

#### Option A: Nginx Reverse Proxy (Recommended for Production)

Create `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.mil;

    # Server certificate
    ssl_certificate /path/to/server-cert.pem;
    ssl_certificate_key /path/to/server-key.pem;

    # Client certificate validation (CAC)
    ssl_client_certificate /path/to/dod-root-bundle.pem;
    ssl_verify_client on;
    ssl_verify_depth 3;

    # Forward client certificate to backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header X-SSL-Client-Cert $ssl_client_escaped_cert;
        proxy_set_header X-SSL-Client-S-DN $ssl_client_s_dn;
        proxy_set_header X-SSL-Client-Verify $ssl_client_verify;
    }
}
```

#### Option B: Direct Node.js TLS (Development/Testing)

Update `server.ts` to use HTTPS:

```typescript
import https from "https";
import fs from "fs";

const httpsOptions = {
  key: fs.readFileSync("path/to/server-key.pem"),
  cert: fs.readFileSync("path/to/server-cert.pem"),
  ca: fs.readFileSync("certs/dod-root-bundle.pem"),
  requestCert: true,
  rejectUnauthorized: true,
};

https.createServer(httpsOptions, app).listen(3001);
```

### Step 4: Configure Environment Variables

Update `.env`:

```bash
# Generate a secure JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Add to .env
JWT_SECRET=your-generated-secret-here
JWT_EXPIRATION=8h
```

### Step 5: Test CAC Authentication

**With physical CAC:**

1. Insert CAC card
2. Navigate to https://your-domain.mil
3. Select authentication certificate when prompted
4. Backend validates and creates/updates user

**Without CAC (development):**
Generate test certificates (see below)

---

## 🔐 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`

Authenticate with CAC certificate, receive JWT token

**Request:**

- Requires: Client TLS certificate
- Headers: `X-SSL-Client-Cert` (if using reverse proxy)

**Response:**

```json
{
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "edipi": "1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "commonName": "DOE.JOHN.M.1234567890",
    "email": "john.doe@mail.mil",
    "organizationalUnit": "USAF",
    "certExpiration": "2027-01-01T00:00:00Z"
  }
}
```

#### GET `/api/auth/me`

Get current user information

**Request:**

- Requires: Client TLS certificate OR JWT token
- Headers: `Authorization: Bearer <token>`

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "edipi": "1234567890",
    "firstName": "John",
    "lastName": "Doe"
    // ... user details
  }
}
```

#### POST `/api/auth/logout`

Logout (client discards JWT)

---

## 🔒 Security Features Implemented

### ✅ Certificate Validation

- **Chain Verification:** Validates full certificate chain to DOD Root CA
- **Expiration Check:** Rejects expired certificates
- **Key Usage:** Verifies Client Authentication extension
- **EDI-PI Extraction:** Validates 10-digit DOD identifier

### ✅ Rate Limiting

- **Login attempts:** 5 per 15 minutes
- **Upload requests:** 10 per 15 minutes
- **API calls:** 100 per 15 minutes
- **Downloads:** 20 per 5 minutes

### ✅ Security Headers (Helmet)

- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- And more...

### ✅ User Management

- Auto-create users on first login
- Update certificate info on each login
- Track last login timestamps
- Support for account deactivation

### ✅ JWT Tokens

- 8-hour session duration
- Contains user ID and EDI-PI
- Stateless authentication for API calls

---

## 🧪 Testing Without a Physical CAC

### Generate Test Certificates

Create `backend/src/scripts/generateTestCAC.ts`:

```typescript
import forge from "node-forge";
import fs from "fs";

const pki = forge.pki;

// Generate key pair
const keys = pki.rsa.generateKeyPair(2048);

// Create certificate
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = "01";
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 3);

// Set subject (mimics CAC format)
const attrs = [
  {
    name: "commonName",
    value: "DOE.JOHN.M.1234567890",
  },
  {
    name: "countryName",
    value: "US",
  },
  {
    name: "organizationName",
    value: "U.S. Government",
  },
  {
    name: "organizationalUnitName",
    value: "USAF",
  },
];

cert.setSubject(attrs);
cert.setIssuer(attrs); // Self-signed for testing

// Add extensions
cert.setExtensions([
  {
    name: "basicConstraints",
    cA: false,
  },
  {
    name: "keyUsage",
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
  },
  {
    name: "extKeyUsage",
    clientAuth: true,
  },
  {
    name: "subjectAltName",
    altNames: [
      {
        type: 1, // RFC822Name
        value: "john.doe@mail.mil",
      },
    ],
  },
]);

// Self-sign
cert.sign(keys.privateKey, forge.md.sha256.create());

// Save to files
const certPem = pki.certificateToPem(cert);
const keyPem = pki.privateKeyToPem(keys.privateKey);

fs.writeFileSync("test-cac.pem", certPem);
fs.writeFileSync("test-cac-key.pem", keyPem);

console.log("✅ Test CAC certificate generated");
console.log("   Certificate: test-cac.pem");
console.log("   Private Key: test-cac-key.pem");
```

Run:

```bash
ts-node src/scripts/generateTestCAC.ts
```

### Test with curl

```bash
curl --cert test-cac.pem --key test-cac-key.pem \
     --cacert certs/dod-root-bundle.pem \
     https://localhost:3001/api/auth/login
```

---

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    edipi VARCHAR(10) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    common_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    organizational_unit VARCHAR(100),
    cert_issuer VARCHAR(255),
    cert_serial_number VARCHAR(100),
    cert_expiration TIMESTAMP NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Documents Table (Updated)

```sql
ALTER TABLE documents ADD COLUMN user_id UUID;
ALTER TABLE documents ADD CONSTRAINT fk_documents_user
    FOREIGN KEY (user_id) REFERENCES users(id);
```

---

## 🚀 Deployment Checklist

### Before Production:

- [ ] Download latest DOD certificates from https://public.cyber.mil/pki-pke/
- [ ] Generate strong JWT secret: `crypto.randomBytes(64).toString('hex')`
- [ ] Configure nginx with TLS mutual authentication
- [ ] Obtain valid server SSL certificate
- [ ] Set up OCSP/CRL checking for revoked certificates
- [ ] Configure firewall to block port 3001 (only nginx should access)
- [ ] Enable HTTPS-only mode
- [ ] Set up certificate expiration monitoring
- [ ] Implement logging and monitoring
- [ ] Review and tighten rate limits
- [ ] Configure backup for users database
- [ ] Document user onboarding process
- [ ] Test failover scenarios

---

## 🐛 Troubleshooting

### "No client certificate found"

- **Cause:** Certificate not sent by browser
- **Fix:** Ensure CAC card is inserted and certificate is selected

### "Certificate chain validation failed"

- **Cause:** Certificate not issued by DOD CA
- **Fix:** Verify DOD root certificates are loaded correctly

### "Certificate has expired"

- **Cause:** CAC card expired
- **Fix:** User needs to renew their CAC

### "Certificate missing EDI-PI"

- **Cause:** Not a valid DOD ID certificate
- **Fix:** Ensure authentication certificate is selected (not email cert)

---

## 📚 Additional Resources

- [DISA PKI Documentation](https://public.cyber.mil/pki-pke/)
- [DOD PKI End User Guide](https://public.cyber.mil/pki-pke/end-users/)
- [CAC Card Management](https://www.cac.mil/)
- [node-forge Documentation](https://github.com/digitalbazaar/forge)

---

## 🔄 Next Steps

1. **Implement OCSP/CRL Checking:**
   - Validate certificates against revocation lists
   - Use http://ocsp.disa.mil and http://crl.disa.mil

2. **Add Role-Based Access Control (RBAC):**
   - Use `organizational_unit` for permissions
   - Implement admin/user roles

3. **Enhanced Logging:**
   - Log all authentication attempts
   - Track failed logins by EDI-PI
   - Alert on suspicious activity

4. **Certificate Renewal Notifications:**
   - Email users 30 days before expiration
   - Display warning in UI

5. **Audit Trail:**
   - Log all document access
   - Track who uploaded/downloaded what
   - Compliance reporting

---

**🎖️ Your application now has military-grade authentication! 🎖️**
