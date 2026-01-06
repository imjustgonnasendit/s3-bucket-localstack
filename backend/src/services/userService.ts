import pool from "../config/database";
import { v4 as uuidv4 } from "uuid";
import { CACUserInfo } from "./cacValidationService";

export interface User {
  id: string;
  edipi: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  common_name: string;
  email?: string;
  organizational_unit: string;
  cert_issuer: string;
  cert_serial_number: string;
  cert_expiration: Date;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export const findOrCreateUser = async (cacInfo: CACUserInfo): Promise<User> => {
  console.log("🔍 [USER SERVICE] Looking up user by EDI-PI:", cacInfo.edipi);

  // Try to find existing user by EDI-PI
  const existingUser = await pool.query<User>(
    "SELECT * FROM users WHERE edipi = $1",
    [cacInfo.edipi]
  );

  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];
    console.log("✅ [USER SERVICE] Found existing user:", user.common_name);

    // Update user's last login and certificate info
    await pool.query(
      `UPDATE users 
       SET last_login = CURRENT_TIMESTAMP,
           cert_serial_number = $1,
           cert_expiration = $2,
           cert_issuer = $3,
           email = COALESCE($4, email),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        cacInfo.serialNumber,
        cacInfo.notAfter,
        cacInfo.issuer,
        cacInfo.email,
        user.id,
      ]
    );

    return user;
  }

  // Create new user
  console.log("➕ [USER SERVICE] Creating new user:", cacInfo.commonName);

  const userId = uuidv4();
  const result = await pool.query<User>(
    `INSERT INTO users (
      id, edipi, first_name, last_name, middle_name, 
      common_name, email, organizational_unit, 
      cert_issuer, cert_serial_number, cert_expiration, 
      last_login, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, TRUE)
    RETURNING *`,
    [
      userId,
      cacInfo.edipi,
      cacInfo.firstName,
      cacInfo.lastName,
      cacInfo.middleName || null,
      cacInfo.commonName,
      cacInfo.email || null,
      cacInfo.organizationalUnit,
      cacInfo.issuer,
      cacInfo.serialNumber,
      cacInfo.notAfter,
    ]
  );

  console.log("✅ [USER SERVICE] User created successfully");

  return result.rows[0];
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const result = await pool.query<User>("SELECT * FROM users WHERE id = $1", [
    userId,
  ]);
  return result.rows[0] || null;
};

export const getUserByEdipi = async (edipi: string): Promise<User | null> => {
  const result = await pool.query<User>(
    "SELECT * FROM users WHERE edipi = $1",
    [edipi]
  );
  return result.rows[0] || null;
};

export const updateUserLastLogin = async (userId: string): Promise<void> => {
  await pool.query(
    "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
    [userId]
  );
};

export const deactivateUser = async (userId: string): Promise<void> => {
  await pool.query(
    "UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [userId]
  );
};

export const getAllUsers = async (): Promise<User[]> => {
  const result = await pool.query<User>(
    "SELECT * FROM users ORDER BY last_login DESC"
  );
  return result.rows;
};
