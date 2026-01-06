import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { cacValidationService } from "../services/cacValidationService";
import { findOrCreateUser, User } from "../services/userService";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRATION = "8h"; // 8 hour session

export interface AuthRequest extends Request {
  user?: User;
  userId?: string;
}

/**
 * Middleware to authenticate requests using CAC client certificates
 * This extracts the certificate from the TLS connection
 */
export const authenticateCAC = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("\n🔐 [CAC AUTH] Authenticating request...");

    // In production with nginx/Apache, the client cert is forwarded via header
    // Format: X-SSL-Client-Cert: -----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
    const clientCertHeader = req.headers["x-ssl-client-cert"] as string;

    // For direct Node.js TLS (without reverse proxy)
    const clientCertTLS = (req.socket as any).getPeerCertificate?.();

    let clientCertPem: string | null = null;

    if (clientCertHeader) {
      // Certificate from reverse proxy (nginx/Apache)
      // Nginx sends it URL-encoded, decode it
      clientCertPem = decodeURIComponent(clientCertHeader);
      console.log("  📋 Certificate received from reverse proxy");
    } else if (clientCertTLS && Object.keys(clientCertTLS).length > 0) {
      // Certificate from direct TLS connection
      clientCertPem = convertCertToPem(clientCertTLS);
      console.log("  📋 Certificate received from TLS connection");
    } else {
      console.warn("  ⚠️  No client certificate found");
      return res.status(401).json({
        error: "Client certificate required",
        message:
          "Please insert your CAC card and select your authentication certificate",
      });
    }

    // Validate the certificate against DOD PKI
    const validationResult =
      await cacValidationService.validateCertificate(clientCertPem);

    if (!validationResult.valid || !validationResult.userInfo) {
      console.error(
        "  ❌ Certificate validation failed:",
        validationResult.error
      );
      return res.status(401).json({
        error: "Invalid certificate",
        message: validationResult.error || "Certificate validation failed",
      });
    }

    // Find or create user in database
    const user = await findOrCreateUser(validationResult.userInfo);

    if (!user.is_active) {
      console.warn("  ⚠️  User account is deactivated:", user.edipi);
      return res.status(403).json({
        error: "Account deactivated",
        message:
          "Your account has been deactivated. Please contact your administrator.",
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    console.log(`  ✅ User authenticated: ${user.common_name} (${user.edipi})`);

    next();
  } catch (error) {
    console.error("❌ [CAC AUTH] Error:", error);
    return res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during authentication",
    });
  }
};

/**
 * Middleware to authenticate requests using JWT tokens
 * Used for API calls after initial CAC login
 */
export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication token required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      edipi: string;
    };

    // You could optionally fetch the user from database here
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "Token expired",
        message: "Your session has expired. Please log in again.",
      });
    }

    return res.status(401).json({
      error: "Invalid token",
      message: "Authentication failed",
    });
  }
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      edipi: user.edipi,
      commonName: user.common_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Convert Node.js TLS certificate object to PEM format
 */
function convertCertToPem(cert: any): string {
  if (cert.raw) {
    const base64Cert = cert.raw.toString("base64");
    return `-----BEGIN CERTIFICATE-----\n${base64Cert.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----`;
  }
  throw new Error("Invalid certificate format");
}

/**
 * Optional: Middleware to check if user has specific role/permission
 * Can be extended based on organizational_unit or other fields
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Example: check organizational_unit
    if (!allowedRoles.includes(req.user.organizational_unit)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};
