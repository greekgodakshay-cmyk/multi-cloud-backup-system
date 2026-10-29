/**
 * Security and Validation Utilities
 * Enforces path sanitization, prevents path traversal, and computes file integrity hashes.
 */

const path = require('path');
const crypto = require('crypto');

/**
 * Windows reserved device names that must not be used as file names
 */
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

/**
 * Validates and sanitizes an incoming filename.
 * Prevents directory traversal attacks (e.g. '../', '..\\', absolute paths, null bytes).
 * 
 * @param {string} rawName - Raw input filename
 * @returns {string} Sanitized, safe basename
 * @throws {Error} if filename is invalid, malicious, or violates naming constraints
 */
function sanitizeFilename(rawName) {
  if (typeof rawName !== 'string' || !rawName.trim()) {
    const err = new Error('Filename must be a non-empty string');
    err.status = 400;
    throw err;
  }

  // Reject null bytes or control characters
  if (/[\x00-\x1F\x7F]/.test(rawName)) {
    const err = new Error('Filename contains invalid control characters or null bytes');
    err.status = 400;
    throw err;
  }

  // Strip path traversal attempts and extract basename
  const baseName = path.basename(rawName).trim();

  // Reject path separators or relative directory markers
  if (rawName.includes('/') || rawName.includes('\\') || rawName.includes('..') || baseName !== rawName.trim()) {
    const err = new Error('Path traversal sequence detected. Only plain filenames are allowed.');
    err.status = 400;
    throw err;
  }

  // Reject Windows reserved names
  if (WINDOWS_RESERVED_NAMES.test(baseName)) {
    const err = new Error(`Filename "${baseName}" is a reserved system device name.`);
    err.status = 400;
    throw err;
  }

  // Limit length to safe filesystem constraint (255 chars)
  if (baseName.length > 255) {
    const err = new Error('Filename exceeds maximum allowed length of 255 characters.');
    err.status = 400;
    throw err;
  }

  // Allow only safe printable characters
  const safeRegex = /^[a-zA-Z0-9_\-\.\s\(\)\[\]\+]+$/;
  if (!safeRegex.test(baseName)) {
    const err = new Error('Filename contains illegal characters. Use alphanumeric, dashes, dots, or underscores.');
    err.status = 400;
    throw err;
  }

  return baseName;
}

/**
 * Computes an MD5 hex hash for a buffer (compatible with AWS S3 ETag format).
 * @param {Buffer} buffer 
 * @returns {string} MD5 hash string
 */
function computeMD5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Computes a SHA-256 hex hash for a buffer.
 * @param {Buffer} buffer 
 * @returns {string} SHA-256 hash string
 */
function computeSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  sanitizeFilename,
  computeMD5,
  computeSHA256
};
