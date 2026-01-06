import fs from "fs";
import path from "path";
import forge from "node-forge";

const CERT_DIR = path.join(__dirname, "../../certs");
const ROOT_BUNDLE_PATH = path.join(CERT_DIR, "dod-root-bundle.pem");
const INTERMEDIATE_BUNDLE_PATH = path.join(
  CERT_DIR,
  "dod-intermediate-bundle.pem"
);

interface CACUserInfo {
  edipi: string;
  commonName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  organizationalUnit: string;
  issuer: string;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
}

interface ValidationResult {
  valid: boolean;
  userInfo?: CACUserInfo;
  error?: string;
}

class CACValidationService {
  private rootCerts: forge.pki.Certificate[] = [];
  private intermediateCerts: forge.pki.Certificate[] = [];
  private initialized = false;

  constructor() {
    this.loadCertificates();
  }

  private loadCertificates(): void {
    try {
      console.log("🔐 Loading DOD PKI certificates...");

      // Load root CA bundle
      if (fs.existsSync(ROOT_BUNDLE_PATH)) {
        const rootPem = fs.readFileSync(ROOT_BUNDLE_PATH, "utf-8");
        const rootCertPems = this.splitPemBundle(rootPem);

        rootCertPems.forEach((pem) => {
          try {
            const cert = forge.pki.certificateFromPem(pem);
            this.rootCerts.push(cert);
            console.log(
              `  ✓ Loaded root CA: ${cert.subject.getField("CN")?.value}`
            );
          } catch (error) {
            console.error("  ✗ Failed to parse root cert:", error);
          }
        });
      } else {
        console.warn(
          "⚠️  Root CA bundle not found. Run: npm run download-dod-certs"
        );
      }

      // Load intermediate CA bundle
      if (fs.existsSync(INTERMEDIATE_BUNDLE_PATH)) {
        const intermediatePem = fs.readFileSync(
          INTERMEDIATE_BUNDLE_PATH,
          "utf-8"
        );
        const intermediateCertPems = this.splitPemBundle(intermediatePem);

        intermediateCertPems.forEach((pem) => {
          try {
            const cert = forge.pki.certificateFromPem(pem);
            this.intermediateCerts.push(cert);
          } catch (error) {
            console.error("  ✗ Failed to parse intermediate cert:", error);
          }
        });

        console.log(
          `  ✓ Loaded ${this.intermediateCerts.length} intermediate CAs`
        );
      }

      if (this.rootCerts.length === 0) {
        console.error(
          "❌ No root certificates loaded. CAC validation will fail."
        );
      } else {
        this.initialized = true;
        console.log(`✅ CAC validation service initialized`);
        console.log(`   Root CAs: ${this.rootCerts.length}`);
        console.log(`   Intermediate CAs: ${this.intermediateCerts.length}\n`);
      }
    } catch (error) {
      console.error("❌ Error loading certificates:", error);
    }
  }

  private splitPemBundle(pemBundle: string): string[] {
    const certs: string[] = [];
    const certRegex =
      /(-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----)/g;
    let match;

    while ((match = certRegex.exec(pemBundle)) !== null) {
      certs.push(match[1]);
    }

    return certs;
  }

  /**
   * Validate a client certificate from a CAC card
   */
  public async validateCertificate(
    clientCertPem: string
  ): Promise<ValidationResult> {
    if (!this.initialized) {
      return {
        valid: false,
        error:
          "CAC validation service not initialized. Missing DOD certificates.",
      };
    }

    try {
      // Parse the client certificate
      const clientCert = forge.pki.certificateFromPem(clientCertPem);

      // 1. Check certificate expiration
      const now = new Date();
      const notBefore = clientCert.validity.notBefore;
      const notAfter = clientCert.validity.notAfter;

      if (now < notBefore) {
        return {
          valid: false,
          error: "Certificate not yet valid",
        };
      }

      if (now > notAfter) {
        return {
          valid: false,
          error: "Certificate has expired",
        };
      }

      // 2. Verify certificate chain
      const chainValid = this.verifyCertificateChain(clientCert);
      if (!chainValid) {
        return {
          valid: false,
          error: "Certificate chain validation failed. Not issued by DOD CA.",
        };
      }

      // 3. Check key usage (must include Client Authentication)
      if (!this.hasClientAuthExtension(clientCert)) {
        return {
          valid: false,
          error: "Certificate does not have Client Authentication key usage",
        };
      }

      // 4. Extract user information
      const userInfo = this.extractUserInfo(clientCert);

      if (!userInfo.edipi) {
        return {
          valid: false,
          error: "Certificate missing EDI-PI (required for CAC cards)",
        };
      }

      console.log(
        `✅ CAC validation successful for: ${userInfo.commonName} (${userInfo.edipi})`
      );

      return {
        valid: true,
        userInfo,
      };
    } catch (error) {
      console.error("❌ Certificate validation error:", error);
      return {
        valid: false,
        error: `Certificate validation failed: ${error}`,
      };
    }
  }

  /**
   * Verify the certificate chain up to DOD root CA
   */
  private verifyCertificateChain(clientCert: forge.pki.Certificate): boolean {
    try {
      // Find the issuing intermediate CA
      const issuerCN = clientCert.issuer.getField("CN")?.value;
      const issuerCert = this.intermediateCerts.find(
        (cert) => cert.subject.getField("CN")?.value === issuerCN
      );

      if (!issuerCert) {
        console.warn(`⚠️  Issuing CA not found: ${issuerCN}`);
        // Try to validate against roots directly (for testing)
        return this.verifyAgainstRoots(clientCert);
      }

      // Verify client cert was signed by intermediate
      if (!issuerCert.verify(clientCert)) {
        console.error("❌ Client cert signature verification failed");
        return false;
      }

      // Verify intermediate cert was signed by root
      return this.verifyAgainstRoots(issuerCert);
    } catch (error) {
      console.error("❌ Chain verification error:", error);
      return false;
    }
  }

  /**
   * Verify a certificate against root CAs
   */
  private verifyAgainstRoots(cert: forge.pki.Certificate): boolean {
    for (const rootCert of this.rootCerts) {
      try {
        if (rootCert.verify(cert)) {
          console.log(
            `  ✓ Verified against root: ${rootCert.subject.getField("CN")?.value}`
          );
          return true;
        }
      } catch (error) {
        // Try next root
        continue;
      }
    }
    return false;
  }

  /**
   * Check if certificate has Client Authentication extended key usage
   */
  private hasClientAuthExtension(cert: forge.pki.Certificate): boolean {
    const ext = cert.getExtension("extKeyUsage") as any;
    if (!ext || !ext.clientAuth) {
      return false;
    }
    return ext.clientAuth === true;
  }

  /**
   * Extract user information from CAC certificate
   */
  private extractUserInfo(cert: forge.pki.Certificate): CACUserInfo {
    const subject = cert.subject;
    const issuer = cert.issuer;

    // Extract CN (format: LAST.FIRST.MIDDLE.EDIPI)
    const cn = subject.getField("CN")?.value || "";
    const cnParts = cn.split(".");

    let lastName = "";
    let firstName = "";
    let middleName = "";
    let edipi = "";

    if (cnParts.length >= 4) {
      lastName = cnParts[0];
      firstName = cnParts[1];
      middleName = cnParts.slice(2, -1).join(".");
      edipi = cnParts[cnParts.length - 1];
    } else if (cnParts.length === 3) {
      lastName = cnParts[0];
      firstName = cnParts[1];
      edipi = cnParts[2];
    }

    // Extract email from Subject Alternative Name extension
    let email: string | undefined;
    try {
      const sanExt = cert.getExtension("subjectAltName") as any;
      if (sanExt && sanExt.altNames) {
        const emailAlt = sanExt.altNames.find((alt: any) => alt.type === 1); // RFC822Name
        if (emailAlt) {
          email = emailAlt.value;
        }
      }
    } catch (error) {
      // Email not found, that's okay
    }

    return {
      edipi,
      commonName: cn,
      firstName,
      lastName,
      middleName: middleName || undefined,
      email,
      organizationalUnit: subject.getField("OU")?.value || "",
      issuer: issuer.getField("CN")?.value || "",
      serialNumber: cert.serialNumber,
      notBefore: cert.validity.notBefore,
      notAfter: cert.validity.notAfter,
    };
  }

  /**
   * Get certificate information without full validation (for debugging)
   */
  public getCertificateInfo(clientCertPem: string): CACUserInfo | null {
    try {
      const clientCert = forge.pki.certificateFromPem(clientCertPem);
      return this.extractUserInfo(clientCert);
    } catch (error) {
      console.error("Error parsing certificate:", error);
      return null;
    }
  }
}

// Singleton instance
export const cacValidationService = new CACValidationService();
export { CACUserInfo, ValidationResult };
