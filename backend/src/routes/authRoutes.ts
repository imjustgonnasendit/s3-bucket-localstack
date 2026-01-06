import { Router, Request, Response } from "express";
import {
  authenticateCAC,
  generateToken,
  AuthRequest,
} from "../middleware/cacAuth";

const router = Router();

/**
 * CAC Login Endpoint
 * Client presents CAC certificate, receives JWT token
 */
router.post(
  "/login",
  authenticateCAC,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication failed" });
      }

      // Generate JWT token for subsequent requests
      const token = generateToken(req.user);

      console.log(`✅ [AUTH] User logged in: ${req.user.common_name}`);

      return res.json({
        message: "Authentication successful",
        token,
        user: {
          id: req.user.id,
          edipi: req.user.edipi,
          firstName: req.user.first_name,
          lastName: req.user.last_name,
          commonName: req.user.common_name,
          email: req.user.email,
          organizationalUnit: req.user.organizational_unit,
          certExpiration: req.user.cert_expiration,
        },
      });
    } catch (error) {
      console.error("❌ [AUTH] Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  }
);

/**
 * Get current user info
 */
router.get("/me", authenticateCAC, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    return res.json({
      user: {
        id: req.user.id,
        edipi: req.user.edipi,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        commonName: req.user.common_name,
        email: req.user.email,
        organizationalUnit: req.user.organizational_unit,
        certExpiration: req.user.cert_expiration,
        lastLogin: req.user.last_login,
      },
    });
  } catch (error) {
    console.error("❌ [AUTH] Get user error:", error);
    return res.status(500).json({ error: "Failed to get user info" });
  }
});

/**
 * Logout endpoint (client should discard token)
 */
router.post("/logout", (req: Request, res: Response) => {
  // With JWT, logout is client-side (discard token)
  // Could implement token blacklist for enhanced security
  return res.json({ message: "Logged out successfully" });
});

export default router;
