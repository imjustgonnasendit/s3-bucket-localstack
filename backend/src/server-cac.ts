import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import documentRoutes from "./routes/documentRoutes";
import authRoutes from "./routes/authRoutes";
import pool from "./config/database";
import { apiLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://www.youtube.com",
          "https://www.gstatic.com",
          "https://s.ytimg.com",
        ], // Allow YouTube API
        scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
        frameSrc: ["'self'", "https://www.youtube.com"], // Allow YouTube iframes
        connectSrc: [
          "'self'",
          "http://localhost:4566",
          "http://localstack:4566",
          "https://www.youtube.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://i.ytimg.com",
          "https://www.youtube.com",
        ], // Allow YouTube thumbnails
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log("\n" + "=".repeat(80));
  console.log(`[${timestamp}] 📥 INCOMING REQUEST`);
  console.log(`Method: ${req.method} | Path: ${req.path}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));

  // Log client certificate info if present
  const cert = (req.socket as any).getPeerCertificate?.();
  if (cert && Object.keys(cert).length > 0) {
    console.log("\n🎖️  CLIENT CERTIFICATE DETECTED:");
    console.log("   Subject:", cert.subject);
    console.log("   Issuer:", cert.issuer);
    console.log("   Valid From:", cert.valid_from);
    console.log("   Valid To:", cert.valid_to);
  }

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body:`, JSON.stringify(req.body, null, 2));
  }
  console.log("=".repeat(80));

  const originalSend = res.send;
  res.send = function (data: any) {
    console.log(`[${timestamp}] 📤 OUTGOING RESPONSE`);
    console.log(`Status: ${res.statusCode}`);
    console.log("=".repeat(80) + "\n");
    return originalSend.call(this, data);
  };

  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static test page
app.use(express.static(path.join(__dirname, "../public")));

// Serve React app static assets (CSS, JS, images) - MUST come before /app route
const frontendPath = path.join(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendPath)) {
  // Serve static assets from /assets/* (for CSS, JS bundles)
  app.use("/assets", express.static(path.join(frontendPath, "assets")));

  // Serve React app at /app
  app.get("/app*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Routes

// Redirect root to login page
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Certificate check endpoint (for login page)
app.get("/api/auth/check-cert", (req, res) => {
  const cert = (req.socket as any).getPeerCertificate?.();

  if (cert && Object.keys(cert).length > 0 && cert.subject) {
    // Certificate detected
    res.json({
      certificateDetected: true,
      certificate: {
        commonName: cert.subject.CN || "",
        issuer: cert.issuer.CN || "",
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
      },
    });
  } else {
    // No certificate
    res.json({
      certificateDetected: false,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api", documentRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: "connected",
      tls: "enabled",
      clientCert: (req.socket as any).getPeerCertificate
        ? "supported"
        : "not available",
    });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "An error occurred",
    });
  }
);

// HTTPS Configuration for CAC Testing
const CERTS_DIR = path.join(__dirname, "../certs");
const useHTTPS = process.env.USE_HTTPS === "true";

if (useHTTPS) {
  console.log(
    "🔐 Starting HTTPS server with client certificate authentication...\n"
  );

  // You'll need to generate self-signed server certificates for testing
  // Or use Let's Encrypt certificates for production

  const httpsOptions = {
    // Server's SSL certificate and key
    key: fs.existsSync(path.join(CERTS_DIR, "server-key.pem"))
      ? fs.readFileSync(path.join(CERTS_DIR, "server-key.pem"))
      : undefined,
    cert: fs.existsSync(path.join(CERTS_DIR, "server-cert.pem"))
      ? fs.readFileSync(path.join(CERTS_DIR, "server-cert.pem"))
      : undefined,

    // Trust the DOD root CAs for client certificates
    ca: fs.readFileSync(path.join(CERTS_DIR, "dod-full-chain.pem")),

    // Request client certificate
    requestCert: true,

    // Don't reject unauthorized (we'll handle validation in middleware)
    // Set to true for stricter validation
    rejectUnauthorized: false,
  };

  if (!httpsOptions.key || !httpsOptions.cert) {
    console.error("❌ Server SSL certificates not found!");
    console.log("   Please generate server certificates:");
    console.log("   npm run generate-server-cert\n");
    process.exit(1);
  }

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`✅ HTTPS Server running on port ${PORT}`);
    console.log(`   URL: https://localhost:${PORT}`);
    console.log(`   CAC Authentication: ENABLED`);
    console.log(`   Health check: https://localhost:${PORT}/health`);
    console.log("\n📋 Insert your CAC card and navigate to the URL above\n");
  });
} else {
  // Standard HTTP server (no CAC authentication)
  app.listen(PORT, () => {
    console.log(`✅ HTTP Server running on port ${PORT}`);
    console.log(`   Health check available at http://localhost:${PORT}/health`);
    console.log("\n⚠️  CAC Authentication DISABLED (USE_HTTPS=false)");
    console.log("   Set USE_HTTPS=true in .env to enable CAC authentication\n");
  });
}

export default app;
