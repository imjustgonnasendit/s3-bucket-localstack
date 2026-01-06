import https from "https";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CERT_DIR = path.join(__dirname, "../../certs");
const DOD_CERT_URL =
  "https://dl.dod.cyber.mil/wp-content/uploads/pki-pke/zip/unclass-certificates_pkcs7_DoD.zip";
const ZIP_FILE = path.join(CERT_DIR, "dod-certs.zip");

async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading DOD certificates from: ${url}`);

    const file = fs.createWriteStream(outputPath);

    https
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            console.log(`🔄 Following redirect to: ${redirectUrl}`);
            return downloadFile(redirectUrl, outputPath)
              .then(resolve)
              .catch(reject);
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log("✅ Download complete");
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
  });
}

function extractZip(zipPath: string, extractPath: string): void {
  console.log(`📦 Extracting certificates to: ${extractPath}`);

  try {
    // Use unzip command (available on macOS/Linux)
    execSync(`unzip -o "${zipPath}" -d "${extractPath}"`, { stdio: "inherit" });
    console.log("✅ Extraction complete");
  } catch (error) {
    console.error(
      "❌ Extraction failed. Please manually extract the ZIP file."
    );
    throw error;
  }
}

function organizeCertificates(): void {
  console.log("🗂️  Organizing certificates...");

  const rootCerts: string[] = [];
  const intermediateCerts: string[] = [];

  // Read all PEM files
  const files = fs
    .readdirSync(CERT_DIR)
    .filter((f) => f.endsWith(".pem") || f.endsWith(".cer"));

  files.forEach((file) => {
    const content = fs.readFileSync(path.join(CERT_DIR, file), "utf-8");

    // Identify root vs intermediate by subject/issuer
    if (content.includes("DOD ROOT CA") || file.includes("root")) {
      rootCerts.push(file);
      console.log(`  📌 Root CA: ${file}`);
    } else if (
      content.includes("DOD ID CA") ||
      content.includes("DOD EMAIL CA")
    ) {
      intermediateCerts.push(file);
      console.log(`  🔗 Intermediate CA: ${file}`);
    }
  });

  // Create combined bundle for easy validation
  const rootBundle = rootCerts
    .map((f) => fs.readFileSync(path.join(CERT_DIR, f), "utf-8"))
    .join("\n");

  fs.writeFileSync(path.join(CERT_DIR, "dod-root-bundle.pem"), rootBundle);
  console.log("✅ Created root CA bundle: dod-root-bundle.pem");

  const intermediateBundle = intermediateCerts
    .map((f) => fs.readFileSync(path.join(CERT_DIR, f), "utf-8"))
    .join("\n");

  fs.writeFileSync(
    path.join(CERT_DIR, "dod-intermediate-bundle.pem"),
    intermediateBundle
  );
  console.log("✅ Created intermediate CA bundle: dod-intermediate-bundle.pem");

  console.log(`\n📊 Summary:`);
  console.log(`   Root CAs: ${rootCerts.length}`);
  console.log(`   Intermediate CAs: ${intermediateCerts.length}`);
}

async function main() {
  console.log("🎖️  DOD PKI Certificate Downloader\n");

  // Create certs directory if it doesn't exist
  if (!fs.existsSync(CERT_DIR)) {
    fs.mkdirSync(CERT_DIR, { recursive: true });
  }

  try {
    // Step 1: Download
    if (!fs.existsSync(ZIP_FILE)) {
      await downloadFile(DOD_CERT_URL, ZIP_FILE);
    } else {
      console.log("✅ Certificate ZIP already exists, skipping download");
    }

    // Step 2: Extract
    extractZip(ZIP_FILE, CERT_DIR);

    // Step 3: Organize
    organizeCertificates();

    console.log("\n🎉 DOD certificates setup complete!\n");
    console.log("Next steps:");
    console.log("  1. Review certificates in ./certs directory");
    console.log("  2. Run: npm install to add certificate validation packages");
    console.log("  3. Configure TLS client certificate authentication\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    console.log("\n⚠️  Automatic download failed. Manual setup instructions:");
    console.log("  1. Visit: https://public.cyber.mil/pki-pke/");
    console.log('  2. Download: "Certificates_PKCS7_v5.9_DoD.pem.zip"');
    console.log(`  3. Extract to: ${CERT_DIR}`);
    console.log("  4. Run this script again\n");
    process.exit(1);
  }
}

main();
