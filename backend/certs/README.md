# DOD PKI Certificates

## Official DOD PKI Certificate Download Sources

### Primary Source: DISA PKI

- **Public Certificates Bundle**: https://public.cyber.mil/pki-pke/pkipke-document-library/
- **Direct Download**: https://dl.dod.cyber.mil/wp-content/uploads/pki-pke/zip/unclass-certificates_pkcs7_DoD.zip

### Certificate Types Needed

1. **DOD Root CA Certificates** (Root of Trust)
   - DoD Root CA 3 (current)
   - DoD Root CA 2 (legacy support)

2. **DOD Intermediate CA Certificates**
   - DOD ID CA-59 through CA-72 (current CAs issuing CAC cards)
   - DOD Email CA-59 through CA-72

3. **Certificate Files to Download**
   ```
   Certificates_PKCS7_v5.9_DoD.pem.zip
   ```

## Setup Instructions

### Option 1: Manual Download

1. Visit https://public.cyber.mil/pki-pke/
2. Download "Certificates_PKCS7_v5.9_DoD.pem.zip" (or latest version)
3. Extract all .pem files to this directory
4. Run: `npm run setup-certs` to organize them

### Option 2: Automated Download (Recommended)

```bash
cd backend
npm run download-dod-certs
```

## Certificate Chain Validation

CAC cards follow this chain:

```
DOD Root CA 3
  └── DOD ID CA-XX (Intermediate)
      └── User's CAC Certificate (End Entity)
```

## Certificate Attributes in CAC Cards

### Subject Fields

- **CN** (Common Name): LAST.FIRST.MIDDLE.EDIPI
- **EDI-PI**: 10-digit Electronic Data Interchange Personal Identifier
- **OU**: Organizational Unit (e.g., "USAF", "USA", "CONTRACTOR")
- **O**: "U.S. Government"
- **C**: "US"

### Key Usage

- Digital Signature
- Non-Repudiation
- Key Encipherment

### Extended Key Usage

- Client Authentication (1.3.6.1.5.5.7.3.2)
- Email Protection

## Security Notes

1. **Certificate Revocation**:
   - Check OCSP: http://ocsp.disa.mil
   - Check CRL: http://crl.disa.mil/

2. **Certificate Expiration**:
   - CAC certs expire every 3 years
   - Always check expiration dates

3. **Trust Anchor**:
   - Only trust DOD Root CA 2 and 3
   - Reject self-signed or non-DOD chains

## Testing

For development/testing without a physical CAC:

- Generate test certificates that mimic CAC structure
- Use soft certificates with matching OIDs
- See: `scripts/generateTestCAC.ts`

## References

- [DISA PKI Documentation](https://public.cyber.mil/pki-pke/)
- [CAC PKI Guide](https://public.cyber.mil/pki-pke/end-users/getting-started/)
