#!/usr/bin/env ts-node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const CERTS_DIR = path.join(__dirname, "../../certs");

console.log("🔐 Generating Self-Signed Server Certificates for CAC Testing\n");

// Create certs directory if it doesn't exist
if (!fs.existsSync(CERTS_DIR)) {
  fs.mkdirSync(CERTS_DIR, { recursive: true });
}

try {
  console.log("📝 Generating server private key...");
  execSync(
    `openssl genrsa -out "${path.join(CERTS_DIR, "server-key.pem")}" 2048`,
    { stdio: "inherit" }
  );
  console.log("✅ Server private key created: server-key.pem\n");

  console.log("📝 Generating server certificate...");
  execSync(
    `openssl req -new -x509 -key "${path.join(CERTS_DIR, "server-key.pem")}" ` +
      `-out "${path.join(CERTS_DIR, "server-cert.pem")}" -days 365 ` +
      `-subj "/C=US/ST=State/L=City/O=Testing/CN=localhost"`,
    { stdio: "inherit" }
  );
  console.log("✅ Server certificate created: server-cert.pem\n");

  console.log("🎉 Server certificates generated successfully!\n");
  console.log("📍 Certificate files location:");
  console.log(`   ${path.join(CERTS_DIR, "server-key.pem")}`);
  console.log(`   ${path.join(CERTS_DIR, "server-cert.pem")}\n`);

  console.log("⚠️  IMPORTANT: Self-signed certificates");
  console.log("   - For TESTING only");
  console.log("   - Browser will show security warning (this is normal)");
  console.log('   - Click "Advanced" → "Proceed to localhost (unsafe)"\n');

  console.log("🚀 Next steps:");
  console.log("   1. Set USE_HTTPS=true in .env");
  console.log("   2. Insert your CAC card");
  console.log("   3. Run: npm run dev:cac");
  console.log("   4. Navigate to: https://localhost:3001\n");
} catch (error) {
  console.error("❌ Error generating certificates:", error);
  console.log("\n⚠️  Make sure OpenSSL is installed:");
  console.log("   macOS: brew install openssl");
  console.log("   Linux: apt-get install openssl\n");
  process.exit(1);
}
