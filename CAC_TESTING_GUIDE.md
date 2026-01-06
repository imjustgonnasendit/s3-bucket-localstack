# CAC Card Testing Guide

## Quick Start - Test Your CAC Card Now! 🚀

### Prerequisites

✅ Server certificates generated (already done!)
✅ CAC card and reader
✅ CAC middleware installed on your Mac
✅ Docker containers running (PostgreSQL, LocalStack)

### Step 1: Set HTTPS Mode

```bash
cd /Users/team_rainier/Desktop/workspace/drag-drop-app/backend
```

Edit `.env` and change:

```
USE_HTTPS=false
```

to:

```
USE_HTTPS=true
```

### Step 2: Start HTTPS Server with CAC Support

```bash
npm run dev:cac
```

You should see:

```
🔐 HTTPS Server with CAC authentication running on port 3001
✅ CAC Validation Service initialized with 49 DOD certificates
```

### Step 3: Insert Your CAC Card

1. Insert your CAC card into the reader
2. Enter your PIN when prompted by the CAC middleware

### Step 4: Test in Browser

#### Option A: Browser-Based Authentication (Recommended for First Test)

1. Open Chrome or Safari
2. Navigate to: `https://localhost:3001`
3. Accept the self-signed certificate warning:
   - Click **"Advanced"**
   - Click **"Proceed to localhost (unsafe)"**
4. Browser will prompt you to select a certificate:
   - Choose your **Authentication Certificate** (usually labeled "DOD EMAIL CA-XX")
   - **NOT** the email or signature certificate
5. You should see "Welcome to DragDrop CAC API"

#### Option B: API Testing with curl

```bash
# Test with your CAC certificate
curl --cert /path/to/your/cac-cert.pem \
     --key /path/to/your/cac-key.pem \
     --cacert backend/certs/dod-full-chain.pem \
     -X POST https://localhost:3001/api/auth/login

# Expected response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "edipi": "1234567890",
    "firstName": "JOHN",
    "lastName": "DOE",
    "email": "john.doe@mail.mil",
    "certExpiration": "2025-03-15T00:00:00.000Z"
  }
}
```

## What Happens Behind the Scenes

### 1. TLS Handshake

- Browser/client presents your CAC certificate
- Server requests certificate during TLS handshake
- Server loads DOD CA bundle (49 certificates) as trusted CAs

### 2. Certificate Validation (`cacValidationService.ts`)

```javascript
✓ Parse certificate with node-forge
✓ Check expiration date
✓ Verify certificate chain to DOD Root CA
✓ Validate key usage (digitalSignature, nonRepudiation)
✓ Extract user info from certificate subject:
  - EDI-PI (10-digit DoD ID number)
  - First name, Last name
  - Email address
  - Organizational unit
  - Issuer (which DOD CA issued the cert)
```

### 3. User Management (`userService.ts`)

```javascript
✓ Check if user exists (by EDI-PI)
✓ If new user → Create account
✓ If existing user → Update last_login and cert_expiration
✓ Store certificate details for audit trail
```

### 4. JWT Token Generation (`cacAuth.ts`)

```javascript
✓ Generate JWT token (8 hour expiration)
✓ Include: userId, edipi in payload
✓ Sign with JWT_SECRET
✓ Return token to client
```

### 5. Database Record

```sql
-- New record created in users table
INSERT INTO users (
  edipi,              -- '1234567890'
  first_name,         -- 'JOHN'
  last_name,          -- 'DOE'
  common_name,        -- 'DOE.JOHN.MIDDLE.1234567890'
  email,              -- 'john.doe@mail.mil'
  organizational_unit,-- 'DOD'
  cert_issuer,        -- 'CN=DOD ID CA-70'
  cert_serial_number, -- 'A1B2C3D4'
  cert_expiration,    -- '2025-03-15'
  last_login          -- NOW()
) VALUES ...
```

## Using the JWT Token

After successful login, use the JWT token for all API requests:

```javascript
// Store token
localStorage.setItem("authToken", response.data.token);

// Use in subsequent requests
const config = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

// Upload file
const presignedUrl = await axios.post(
  "/api/documents/upload/request",
  { filename, contentType, size },
  config
);

// List documents
const documents = await axios.get("/api/documents", config);
```

## Troubleshooting

### Browser Doesn't Prompt for Certificate

**Problem:** Browser shows "This site can't be reached" or doesn't ask for certificate

**Solutions:**

1. Make sure `USE_HTTPS=true` in `.env`
2. Restart the server: `npm run dev:cac`
3. Clear browser cache and try again
4. Check server logs for errors
5. Try a different browser (Chrome vs Safari)

### "Certificate Validation Failed"

**Problem:** Server rejects your CAC certificate

**Common Causes:**

- **Expired certificate**: Check cert expiration date
- **Wrong certificate selected**: Use Authentication cert, NOT email cert
- **Certificate chain issue**: Your cert must chain to DOD Root CA 3, 4, 5, or 6
- **Certificate not issued by DOD**: Only DOD-issued CAC certs work

**Debug Steps:**

```bash
# Check server logs for detailed error
# Look for output from cacValidationService.ts

# Verify your certificate details
openssl x509 -in your-cert.pem -text -noout

# Check issuer (should be DOD ID CA-XX)
openssl x509 -in your-cert.pem -noout -issuer

# Check expiration
openssl x509 -in your-cert.pem -noout -dates
```

### "No User Info in Certificate"

**Problem:** Server can't extract EDI-PI from certificate

**Cause:** Subject DN format doesn't match expected pattern

**Expected Format:**

```
CN=DOE.JOHN.MIDDLE.1234567890
```

**Debug:**
Check the subject DN of your certificate:

```bash
openssl x509 -in your-cert.pem -noout -subject
```

### CAC Middleware Not Working on Mac

**Problem:** Browser doesn't see CAC card

**Solutions:**

1. **Install DOD certificates in Keychain:**

   ```bash
   # Open Keychain Access
   # File → Import Items → Select backend/certs/dod-root-bundle.pem
   # Select "System" keychain
   # Set trust to "Always Trust" for DOD Root CAs
   ```

2. **Install CAC enabler:**
   - Download from: https://www.cac.mil/Common-Access-Card/
   - Follow Mac installation instructions

3. **Test card reader:**

   ```bash
   # Check if card is detected
   pcsctest
   ```

4. **Restart browser** after installing certificates

## Server Logs to Watch For

### ✅ Successful Authentication

```
🔐 Client certificate detected:
   Subject: CN=DOE.JOHN.MIDDLE.1234567890
   Issuer: CN=DOD ID CA-70
   Valid until: 2025-03-15
✅ Certificate validation successful
✅ User found/created: JOHN DOE (EDI-PI: 1234567890)
🎫 JWT token generated (expires in 8h)
```

### ❌ Authentication Failed

```
❌ Certificate validation failed: Certificate has expired
```

or

```
❌ Certificate validation failed: Unable to verify certificate chain
```

or

```
⚠️  No client certificate provided
```

## Testing Checklist

- [ ] Server starts with `npm run dev:cac`
- [ ] Browser shows certificate selection prompt
- [ ] Can select CAC authentication certificate
- [ ] POST `/api/auth/login` returns JWT token
- [ ] Token includes user info (edipi, name, email)
- [ ] Database record created in `users` table
- [ ] GET `/api/auth/me` returns user info with valid token
- [ ] Protected routes work with token in Authorization header
- [ ] Invalid/expired tokens rejected with 401
- [ ] Token expires after 8 hours

## Next Steps After Successful CAC Test

1. **Protect Document Routes**
   - Apply `authenticateJWT` middleware to all document endpoints
   - Filter documents by `user_id`

2. **Build Frontend Login UI**
   - Create login page explaining CAC authentication
   - Handle JWT token storage
   - Add Authorization header to all requests
   - Display user info (name, EDI-PI, cert expiration)

3. **Production Deployment**
   - Use real SSL certificate (not self-signed)
   - Configure nginx with TLS client authentication
   - Set `rejectUnauthorized: true` (strict mode)
   - Implement certificate revocation checking (OCSP/CRL)
   - Set up monitoring for certificate expiration

## Certificate Files Reference

```
backend/certs/
├── server-key.pem           # ✅ Server private key (GENERATED)
├── server-cert.pem          # ✅ Server certificate (GENERATED)
├── dod-root-bundle.pem      # ✅ 49 DOD Root/Intermediate CAs
├── dod-full-chain.pem       # ✅ Complete trust chain
└── Certificates_PKCS7_v5_14_DoD/  # Original DISA download
```

## Security Notes

### Self-Signed Certificates

- ⚠️ **TESTING ONLY** - Never use in production
- Browser warnings are expected and safe to bypass for localhost
- Certificate not trusted by browsers (not signed by public CA)

### Production Requirements

- Obtain valid SSL certificate (Let's Encrypt or DOD-issued)
- Use `rejectUnauthorized: true` for strict validation
- Implement OCSP/CRL checking for revoked certificates
- Monitor certificate expiration dates
- Use reverse proxy (nginx) for TLS termination

### JWT Token Security

- 8 hour expiration (configurable in `.env`)
- Stored client-side (localStorage or httpOnly cookie)
- Must be included in Authorization header
- Server validates signature on every request
- No refresh tokens (re-authenticate with CAC after expiration)

## API Endpoints for CAC Authentication

### POST `/api/auth/login`

**Authentication:** CAC certificate (TLS client cert)

**Request:** No body needed (cert extracted from TLS)

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "edipi": "1234567890",
    "firstName": "JOHN",
    "lastName": "DOE",
    "commonName": "DOE.JOHN.MIDDLE.1234567890",
    "email": "john.doe@mail.mil",
    "organizationalUnit": "DOD",
    "certIssuer": "CN=DOD ID CA-70",
    "certSerialNumber": "A1B2C3D4",
    "certExpiration": "2025-03-15T00:00:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

### GET `/api/auth/me`

**Authentication:** CAC certificate (TLS client cert)

**Headers:** None needed (cert extracted from TLS)

**Response:** Same as `/login` (returns user info without new token)

### POST `/api/auth/logout`

**Authentication:** None (client-side token deletion)

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

## Rate Limits

- **Auth endpoints** (`/api/auth/*`): 5 requests per 15 minutes
- **Upload endpoints**: 10 requests per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **Download endpoints**: 20 requests per 5 minutes

Exceeded limits return `429 Too Many Requests`

## Support

For issues:

1. Check server logs for detailed error messages
2. Verify CAC middleware installation
3. Confirm DOD certificates in Keychain (Mac)
4. Review troubleshooting section above
5. Check CAC card expiration date

---

**Ready to test?** Run `npm run dev:cac` and insert your CAC card! 🚀
