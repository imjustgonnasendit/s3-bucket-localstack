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
        connectSrc: [
          "'self'",
          "http://localhost:4566",
          "http://localstack:4566",
        ], // LocalStack
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
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body:`, JSON.stringify(req.body, null, 2));
  }
  console.log("=".repeat(80));

  // Log response
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

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Drag & Drop File Upload API with CAC Authentication",
    version: "2.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      upload: "/api/upload",
      documents: "/api/documents",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", documentRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

export default app;
