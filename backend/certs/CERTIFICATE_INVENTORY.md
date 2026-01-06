# 📜 DOD PKI Certificates Inventory

## Overview

This directory contains **official DOD Public Key Infrastructure (PKI) certificates** downloaded from the public DISA website at https://public.cyber.mil/pki-pke/

**Download Date:** January 6, 2026  
**Bundle Version:** v5.14  
**Source:** Certificates_PKCS7_v5_14_DoD.pem.p7b

---

## 📊 Certificate Inventory

### Total Certificates: 49

- **Root CAs:** 4
- **ID CAs (for CAC authentication):** 13
- **Email CAs:** 13
- **Software CAs:** 14
- **Derived Identity CAs:** 5

---

## 🔐 Root Certificate Authorities

These are the **trust anchors** for all DOD PKI certificates:

1. **DoD Root CA 3**
   - Subject: `C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DoD Root CA 3`
   - Status: Legacy (still valid for older certificates)

2. **DoD Root CA 4**
   - Subject: `C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DoD Root CA 4`
   - Status: Active

3. **DoD Root CA 5**
   - Subject: `C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DoD Root CA 5`
   - Status: Active

4. **DoD Root CA 6**
   - Subject: `C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DoD Root CA 6`
   - Status: Active (Primary)
   - Valid Until: January 24, 2053

---

## 🎖️ ID Certificate Authorities (CAC Authentication)

These CAs issue the **authentication certificates** found on CAC cards:

1. DOD ID CA-59
2. DOD ID CA-62
3. DOD ID CA-63
4. DOD ID CA-64
5. DOD ID CA-65
6. DOD ID CA-70
7. DOD ID CA-71
8. DOD ID CA-72
9. DOD ID CA-73
10. DOD ID CA-78
11. DOD ID CA-79
12. DOD ID CA-80
13. DOD ID CA-81

**Usage:** These are the CAs you'll see in the "Issuer" field of CAC authentication certificates.

**Certificate Format:**

```
Subject: C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DOD ID CA-XX
Issuer: C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DoD Root CA X
```

---

## 📧 Email Certificate Authorities

These CAs issue certificates for **encrypted email (S/MIME)**:

1. DOD EMAIL CA-59
2. DOD EMAIL CA-62
3. DOD EMAIL CA-63
4. DOD EMAIL CA-64
5. DOD EMAIL CA-65
6. DOD EMAIL CA-70
7. DOD EMAIL CA-71
8. DOD EMAIL CA-72
9. DOD EMAIL CA-73
10. DOD EMAIL CA-78
11. DOD EMAIL CA-79
12. DOD EMAIL CA-80
13. DOD EMAIL CA-81

**Usage:** These certificates are used for email encryption and digital signatures.

---

## 💻 Software Certificate Authorities

These CAs issue certificates for **code signing and software authentication**:

1. DOD SW CA-60
2. DOD SW CA-61
3. DOD SW CA-66
4. DOD SW CA-67
5. DOD SW CA-68
6. DOD SW CA-69
7. DOD SW CA-74
8. DOD SW CA-75
9. DOD SW CA-76
10. DOD SW CA-77
11. DOD SW CA-82
12. DOD SW CA-83
13. DOD SW CA-84
14. DOD SW CA-85

**Usage:** For signing applications, drivers, and software packages.

---

## 🔑 Derived Identity Certificate Authorities

These CAs issue certificates for **mobile devices and derived credentials**:

1. DOD DERILITY CA-1
2. DOD DERILITY CA-3
3. DOD DERILITY CA-4
4. DOD DERILITY CA-5
5. DOD DERILITY CA-6

**Usage:** For CAC-less authentication on smartphones, tablets, and other mobile devices (Purebred, Thursby PKard).

---

## 📁 Certificate Bundle Files

### In This Directory:

- **`dod-root-bundle.pem`** - All 4 DOD root CAs (trust anchors)
- **`dod-intermediate-bundle.pem`** - All intermediate CAs (ID, Email, SW, Derived)
- **`dod-full-chain.pem`** - Complete trust chain (roots + intermediates)
- **`roots/`** - Individual root CA files

### Original Files:

- **`Certificates_PKCS7_v5_14_DoD/`** - Original download from DISA
  - `all_dod_certs.pem` - All certificates extracted from PKCS#7 bundle
  - `Certificates_PKCS7_v5_14_DoD.pem.p7b` - Original PKCS#7 bundle
  - `DoD_PKE_CA_chain.pem` - Certificate chain for bundle verification
  - `README.txt` - Official DISA documentation

---

## 🔍 Certificate Validation Chain

A typical CAC authentication certificate follows this chain:

```
User's CAC Certificate
  Subject: LAST.FIRST.MIDDLE.EDIPI
  Key Usage: Digital Signature, Non-Repudiation
  Extended Key Usage: Client Authentication (1.3.6.1.5.5.7.3.2)
  Issuer: DOD ID CA-XX
    ↓
DOD ID CA-XX (Intermediate)
  Subject: C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DOD ID CA-XX
  Issuer: DoD Root CA 6
    ↓
DoD Root CA 6 (Trust Anchor)
  Subject: C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DoD Root CA 6
  Issuer: C=US, O=U.S. Government, OU=DoD, OU=PKI, CN=DoD Root CA 6
  (Self-signed)
```

---

## 🛡️ Security Verification

### Verify Bundle Integrity:

```bash
cd Certificates_PKCS7_v5_14_DoD

# 1. Check the root CA fingerprint
openssl x509 -in DoD_PKE_CA_chain.pem -fingerprint -noout

# 2. Compare against official DISA website
# Visit: https://crl.disa.mil and verify the SHA-1 fingerprint

# 3. Verify the S/MIME signature (Mac/Linux)
openssl smime -verify -in Certificates_PKCS7_v5_14_DoD.sha256 \
  -inform DER -CAfile DoD_PKE_CA_chain.pem | shasum -a 256 -c
```

**Expected Output:** `Verification successful`

---

## 📅 Certificate Expiration Dates

**Root CAs:**

- DoD Root CA 6: Valid until January 24, 2053 ✅
- DoD Root CA 5: Valid until ~2050 ✅
- DoD Root CA 4: Valid until ~2040 ✅
- DoD Root CA 3: Legacy support (check expiration)

**Intermediate CAs:**

- Vary by CA, typically 10-20 year validity periods
- Check individual certificates for specific dates

---

## 🔄 Updating Certificates

DOD releases new certificate bundles periodically. To update:

```bash
# Download latest bundle
npm run download-dod-certs

# Organize certificates
npm run organize-certs
```

**Check for updates at:**

- https://public.cyber.mil/pki-pke/pkipke-document-library/
- https://crl.disa.mil

---

## 💡 Usage in Application

### For CAC Validation:

```typescript
import { cacValidationService } from "../services/cacValidationService";

// Service automatically loads certificates from:
// - dod-root-bundle.pem (trust anchors)
// - dod-intermediate-bundle.pem (ID CAs)

// Validate a CAC certificate
const result = await cacValidationService.validateCertificate(clientCertPem);

if (result.valid) {
  console.log("Valid CAC card!");
  console.log("EDI-PI:", result.userInfo.edipi);
  console.log("Name:", result.userInfo.commonName);
}
```

### For TLS Server Configuration:

```nginx
# nginx.conf
ssl_client_certificate /path/to/dod-full-chain.pem;
ssl_verify_client on;
ssl_verify_depth 3;
```

---

## 📚 References

- **Official DOD PKI Site:** https://public.cyber.mil/pki-pke/
- **Certificate Downloads:** https://public.cyber.mil/pki-pke/pkipke-document-library/
- **CRL Distribution:** https://crl.disa.mil
- **OCSP Responder:** http://ocsp.disa.mil
- **CAC Information:** https://www.cac.mil

---

## ⚠️ Important Notes

1. **Public Certificates:** These CA certificates are **publicly available** and not classified.

2. **Trust Anchors:** Only trust DOD Root CAs 3, 4, 5, and 6. Never accept self-signed or third-party roots.

3. **Revocation Checking:** In production, always check certificate revocation status via OCSP or CRL.

4. **Certificate Pinning:** For maximum security, pin specific CA certificates rather than accepting any DOD CA.

5. **Regular Updates:** DOD releases new intermediate CAs periodically. Update your bundle regularly.

6. **Testing Only:** The extracted certificates are for validation purposes. You cannot use them to issue new certificates.

---

**✅ Your application now has access to the complete DOD PKI trust chain!**

Last Updated: January 6, 2026
