/**
 * S3StorageProvider
 * Connects to any AWS S3-compatible cloud storage (Cloudflare R2, Backblaze B2, AWS S3).
 * Uses official @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner.
 */

const {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const mime = require('mime-types');
const StorageProvider = require('./StorageProvider');
const { sanitizeFilename } = require('../utils/security');

class S3StorageProvider extends StorageProvider {
  /**
   * @param {Object} options
   * @param {string} options.name - Human-readable name (e.g. "Cloudflare R2", "Backblaze B2")
   * @param {string} options.bucket - Target bucket name
   * @param {string} [options.endpoint] - Custom S3 endpoint (required for R2 & B2)
   * @param {string} [options.region='auto'] - Cloud region
   * @param {string} options.accessKeyId - S3 Access Key ID
   * @param {string} options.secretAccessKey - S3 Secret Access Key
   * @param {number} [options.presignedTtl=900] - Presigned URL expiration in seconds (15 min)
   */
  constructor(options) {
    super(options.name, 's3');
    this.bucket = options.bucket;
    this.presignedTtl = options.presignedTtl || 900;
    this.isConfigured = Boolean(
      options.bucket &&
      options.accessKeyId &&
      options.secretAccessKey
    );

    if (this.isConfigured) {
      const clientConfig = {
        region: options.region || 'auto',
        credentials: {
          accessKeyId: options.accessKeyId,
          secretAccessKey: options.secretAccessKey
        }
      };

      if (options.endpoint) {
        clientConfig.endpoint = options.endpoint;
      }

      if (typeof options.forcePathStyle === 'boolean') {
        clientConfig.forcePathStyle = options.forcePathStyle;
      }

      this.client = new S3Client(clientConfig);
    } else {
      this.client = null;
    }
  }

  async testConnection() {
    if (!this.isConfigured || !this.client) {
      return {
        connected: false,
        name: this.name,
        type: 's3',
        error: 'Missing required credentials or bucket name in environment'
      };
    }

    try {
      // Run a lightweight test call (HeadBucket or List with MaxKeys=1)
      await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          MaxKeys: 1
        })
      );

      return {
        connected: true,
        name: this.name,
        type: 's3'
      };
    } catch (err) {
      const errName = err.name || 'Error';
      let safeMsg = err.message || 'Unknown connection error';

      if (errName === 'SignatureDoesNotMatch') {
        safeMsg = 'Signature validation failed (check application key secret)';
      } else if (errName === 'InvalidAccessKeyId') {
        safeMsg = 'Invalid access key ID (key ID not recognized)';
      } else if (errName === 'NoSuchBucket') {
        safeMsg = `Bucket "${this.bucket}" does not exist in the configured region/endpoint`;
      } else if (errName === 'AccessDenied') {
        safeMsg = 'Access denied (insufficient key permissions for this bucket)';
      }

      return {
        connected: false,
        name: this.name,
        type: 's3',
        error: `Cloud verification failed: ${errName} - ${safeMsg}`
      };
    }
  }

  async listFiles() {
    if (!this.isConfigured || !this.client) {
      return [];
    }

    try {
      const command = new ListObjectsV2Command({ Bucket: this.bucket });
      const response = await this.client.send(command);

      if (!response.Contents) return [];

      return response.Contents.map(obj => ({
        name: obj.Key,
        size: obj.Size || 0,
        etag: (obj.ETag || '').replace(/"/g, ''),
        lastModified: obj.LastModified || new Date()
      })).sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error(`[S3StorageProvider:${this.name}] listFiles error:`, err.message);
      throw new Error(`Failed to list objects in ${this.name}: ${err.message}`);
    }
  }

  async getFileStream(filename) {
    if (!this.isConfigured || !this.client) {
      throw new Error(`${this.name} is not configured.`);
    }

    const safeName = sanitizeFilename(filename);
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: safeName
      });
      const response = await this.client.send(command);

      return {
        stream: response.Body,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        etag: (response.ETag || '').replace(/"/g, '')
      };
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getFileBuffer(filename) {
    const fileData = await this.getFileStream(filename);
    if (!fileData || !fileData.stream) {
      throw new Error(`Object "${filename}" not found in ${this.name}`);
    }

    // Convert stream to Buffer
    return new Promise((resolve, reject) => {
      const chunks = [];
      fileData.stream.on('data', chunk => chunks.push(chunk));
      fileData.stream.on('error', reject);
      fileData.stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async putFile(filename, buffer, options = {}) {
    if (!this.isConfigured || !this.client) {
      throw new Error(`${this.name} is not configured.`);
    }

    const safeName = sanitizeFilename(filename);
    const contentType = options.contentType || mime.lookup(safeName) || 'application/octet-stream';

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: safeName,
      Body: buffer,
      ContentType: contentType
    });

    const response = await this.client.send(command);

    return {
      name: safeName,
      size: buffer.length,
      etag: (response.ETag || '').replace(/"/g, ''),
      lastModified: new Date()
    };
  }

  async deleteFile(filename) {
    if (!this.isConfigured || !this.client) {
      throw new Error(`${this.name} is not configured.`);
    }

    const safeName = sanitizeFilename(filename);
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: safeName
    });

    await this.client.send(command);
    return true;
  }

  async getDownloadUrl(filename) {
    if (!this.isConfigured || !this.client) {
      return null;
    }

    const safeName = sanitizeFilename(filename);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: safeName
    });

    // Generate secure short-lived presigned download URL
    return await getSignedUrl(this.client, command, {
      expiresIn: this.presignedTtl
    });
  }
}

module.exports = S3StorageProvider;
