#!/usr/bin/env ts-node
import fs from "fs";
import path from "path";

const CERT_DIR = path.join(
  __dirname,
  "../../certs/Certificates_PKCS7_v5_14_DoD"
);
const OUTPUT_DIR = path.join(__dirname, "../../certs");

interface CertificateInfo {
  subject: string;
  issuer: string;
  isRoot: boolean;
  isIntermediate: boolean;
  commonName: string;
  pem: string;
}

function parseCertificates(pemBundle: string): CertificateInfo[] {
  const certs: CertificateInfo[] = [];
  const certRegex =
    /(-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----)/g;
  let match;

  while ((match = certRegex.exec(pemBundle)) !== null) {
    const certPem = match[1];

    // Extract subject and issuer (basic parsing)
    const subjectMatch = certPem.match(/subject[=:]\s*(.+)/i);
    const issuerMatch = certPem.match(/issuer[=:]\s*(.+)/i);
    const cnMatch = certPem.match(/CN\s*=\s*([^,\n]+)/i);

    const subject = subjectMatch ? subjectMatch[1].trim() : "";
    const issuer = issuerMatch ? issuerMatch[1].trim() : "";
    const commonName = cnMatch ? cnMatch[1].trim() : "Unknown";

    // Determine if root or intermediate
    const isRoot =
      subject === issuer || commonName.toLowerCase().includes("root");
    const isIntermediate =
      !isRoot &&
      (commonName.toLowerCase().includes("ca-") ||
        commonName.toLowerCase().includes("id ca") ||
        commonName.toLowerCase().includes("email ca"));

    certs.push({
      subject,
      issuer,
      isRoot,
      isIntermediate,
      commonName,
      pem: certPem,
    });
  }

  return certs;
}

function organizeCertificates() {
  console.log("📂 Organizing DOD PKI Certificates\n");

  // Read the all_dod_certs.pem file
  const allCertsPath = path.join(CERT_DIR, "all_dod_certs.pem");

  if (!fs.existsSync(allCertsPath)) {
    console.error(
      "❌ all_dod_certs.pem not found. Run the extraction script first."
    );
    process.exit(1);
  }

  const allCertsPem = fs.readFileSync(allCertsPath, "utf-8");
  const certificates = parseCertificates(allCertsPem);

  console.log(`📊 Found ${certificates.length} certificates total\n`);

  // Separate root and intermediate
  const rootCerts = certificates.filter((c) => c.isRoot);
  const intermediateCerts = certificates.filter((c) => c.isIntermediate);
  const otherCerts = certificates.filter((c) => !c.isRoot && !c.isIntermediate);

  console.log(`🔐 Root CAs: ${rootCerts.length}`);
  rootCerts.forEach((cert) => {
    console.log(`   └─ ${cert.commonName}`);
  });

  console.log(`\n🔗 Intermediate CAs: ${intermediateCerts.length}`);
  intermediateCerts.slice(0, 10).forEach((cert) => {
    console.log(`   └─ ${cert.commonName}`);
  });
  if (intermediateCerts.length > 10) {
    console.log(`   └─ ... and ${intermediateCerts.length - 10} more`);
  }

  console.log(`\n📄 Other Certificates: ${otherCerts.length}\n`);

  // Create bundles
  const rootBundle = rootCerts.map((c) => c.pem).join("\n\n");
  const intermediateBundle = intermediateCerts.map((c) => c.pem).join("\n\n");

  fs.writeFileSync(path.join(OUTPUT_DIR, "dod-root-bundle.pem"), rootBundle);
  console.log(`✅ Created: dod-root-bundle.pem (${rootCerts.length} root CAs)`);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "dod-intermediate-bundle.pem"),
    intermediateBundle
  );
  console.log(
    `✅ Created: dod-intermediate-bundle.pem (${intermediateCerts.length} intermediate CAs)`
  );

  // Create a full trust chain bundle (roots + intermediates)
  const fullChain = rootBundle + "\n\n" + intermediateBundle;
  fs.writeFileSync(path.join(OUTPUT_DIR, "dod-full-chain.pem"), fullChain);
  console.log(`✅ Created: dod-full-chain.pem (complete trust chain)`);

  // Save individual root CAs
  const rootsDir = path.join(OUTPUT_DIR, "roots");
  if (!fs.existsSync(rootsDir)) {
    fs.mkdirSync(rootsDir);
  }

  rootCerts.forEach((cert, index) => {
    const filename = cert.commonName.replace(/[^a-zA-Z0-9]/g, "_") + ".pem";
    fs.writeFileSync(path.join(rootsDir, filename), cert.pem);
  });
  console.log(
    `✅ Created: ${rootCerts.length} individual root CA files in ./certs/roots/`
  );

  console.log("\n🎉 Certificate organization complete!");
  console.log("\n📋 Summary:");
  console.log(`   Total Certificates: ${certificates.length}`);
  console.log(`   Root CAs: ${rootCerts.length}`);
  console.log(`   Intermediate CAs: ${intermediateCerts.length}`);
  console.log(`   Other: ${otherCerts.length}`);
  console.log("\n✨ Ready for CAC validation!\n");
}

organizeCertificates();
