/**
 * Configuration Module
 * Loads environment variables and provides sensible defaults for local mode and multi-cloud providers.
 */

const path = require('path');
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 52428800, // 50 MB
  presignedUrlTtlSeconds: parseInt(process.env.PRESIGNED_URL_TTL_SECONDS, 10) || 900, // 15 min

  // Storage selection: 'local' (default) or 'cloud'
  storageMode: (process.env.STORAGE_MODE || 'local').toLowerCase(),

  // Local Storage Paths
  localStorage: {
    primaryDir: path.resolve(process.env.LOCAL_PRIMARY_DIR || './data/primary'),
    secondaryDir: path.resolve(process.env.LOCAL_SECONDARY_DIR || './data/secondary'),
    // Whether secondary backup target is active in local mode (default: true for complete local testing)
    enableSecondary: process.env.ENABLE_LOCAL_SECONDARY !== 'false'
  },

  // Cloudflare R2 (Primary S3-Compatible Target)
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET_NAME || '',
    endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')
  },

  // Backblaze B2 (Secondary S3-Compatible Target)
  // Supports standard BACKBLAZE_* variables (and B2_* aliases for backwards compatibility)
  b2: {
    keyId: process.env.BACKBLAZE_KEY_ID || process.env.B2_KEY_ID || '',
    applicationKey: process.env.BACKBLAZE_APPLICATION_KEY || process.env.B2_APPLICATION_KEY || '',
    bucket: process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET_NAME || '',
    bucketId: process.env.BACKBLAZE_BUCKET_ID || process.env.B2_BUCKET_ID || '',
    region: process.env.BACKBLAZE_REGION || process.env.B2_REGION || 'us-east-005',
    endpoint: process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT || (
      (process.env.BACKBLAZE_REGION || process.env.B2_REGION)
        ? `https://s3.${process.env.BACKBLAZE_REGION || process.env.B2_REGION}.backblazeb2.com`
        : ''
    ),
    forcePathStyle: process.env.BACKBLAZE_FORCE_PATH_STYLE === 'true' || process.env.B2_FORCE_PATH_STYLE === 'true'
  },

  // Standard AWS S3 (Alternative Primary/Secondary)
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_BUCKET_NAME || '',
    endpoint: process.env.AWS_ENDPOINT || undefined
  },

  /**
   * Safe configuration validator for Backblaze B2.
   * Validates presence, formatting, and sanity without exposing sensitive secret values.
   * 
   * @returns {{ isConfigured: boolean, isValid: boolean, issues: string[] }}
   */
  validateBackblazeConfig() {
    const issues = [];
    const b2 = config.b2;

    const isConfigured = Boolean(b2.bucket || b2.keyId || b2.applicationKey);
    if (!isConfigured) {
      return { isConfigured: false, isValid: false, issues: ['Backblaze B2 is not configured.'] };
    }

    if (!b2.bucket) {
      issues.push('Bucket name is missing (BACKBLAZE_BUCKET_NAME / B2_BUCKET_NAME).');
    }

    if (!b2.keyId) {
      issues.push('Key ID is missing (BACKBLAZE_KEY_ID / B2_KEY_ID).');
    } else if (b2.keyId.includes('your_') || b2.keyId.includes('placeholder')) {
      issues.push('Key ID appears to be a placeholder value.');
    } else if (b2.keyId.length < 20) {
      issues.push(`Key ID length is ${b2.keyId.length} characters (standard B2 key IDs are 25 hex characters).`);
    }

    if (!b2.applicationKey) {
      issues.push('Application Key secret is missing (BACKBLAZE_APPLICATION_KEY / B2_APPLICATION_KEY).');
    } else if (b2.applicationKey.includes('your_') || b2.applicationKey.includes('placeholder')) {
      issues.push('Application Key secret appears to be a placeholder value.');
    } else if (b2.applicationKey.length < 30) {
      issues.push(`Application Key secret appears malformed or truncated (${b2.applicationKey.length} characters; Backblaze application keys are 31 characters).`);
    }

    if (!b2.endpoint) {
      issues.push('Endpoint is missing (BACKBLAZE_ENDPOINT / B2_ENDPOINT).');
    } else if (!b2.endpoint.startsWith('https://')) {
      issues.push('Endpoint must use secure HTTPS protocol.');
    }

    return {
      isConfigured,
      isValid: issues.length === 0,
      issues
    };
  }
};

module.exports = config;
