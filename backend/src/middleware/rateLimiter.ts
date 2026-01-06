import rateLimit from "express-rate-limit";

/**
 * Rate limiter for upload endpoints
 * Prevents abuse of file upload system
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 uploads per 15 minutes per IP
  message: {
    error: "Too many upload requests",
    message: "You have exceeded the upload limit. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from the count
  skipSuccessfulRequests: false,
  // Skip failed requests from the count
  skipFailedRequests: true,
});

/**
 * General API rate limiter
 * Prevents API abuse
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: {
    error: "Too many requests",
    message: "You have made too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter (stricter for login attempts)
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 minutes
  message: {
    error: "Too many login attempts",
    message: "Too many failed login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Download rate limiter
 * Prevents bandwidth abuse
 */
export const downloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Max 20 downloads per 5 minutes
  message: {
    error: "Too many downloads",
    message: "You have exceeded the download limit. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
