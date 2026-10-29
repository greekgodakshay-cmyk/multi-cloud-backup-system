/**
 * StorageProvider Interface (Base Abstract Class)
 * Defines standard contract for all storage targets (Local, AWS S3, Cloudflare R2, Backblaze B2).
 */

class StorageProvider {
  /**
   * @param {string} name - Human-readable provider name (e.g. "Local Primary", "Cloudflare R2")
   * @param {string} type - Provider type identifier ("local" | "s3")
   */
  constructor(name, type) {
    if (new.target === StorageProvider) {
      throw new TypeError('Cannot construct StorageProvider instances directly');
    }
    this.name = name;
    this.type = type;
  }

  /**
   * Verified connectivity test
   * @returns {Promise<{ connected: boolean, name: string, type: string, error?: string }>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * List all objects stored in target
   * @returns {Promise<Array<{ name: string, size: number, etag: string, lastModified: Date }>>}
   */
  async listFiles() {
    throw new Error('listFiles() must be implemented by subclass');
  }

  /**
   * Get file stream and metadata for downloading/piping
   * @param {string} filename 
   * @returns {Promise<{ stream: import('stream').Readable, size: number, contentType?: string, etag: string } | null>}
   */
  async getFileStream(filename) {
    throw new Error('getFileStream() must be implemented by subclass');
  }

  /**
   * Read full file content into a Buffer
   * @param {string} filename 
   * @returns {Promise<Buffer>}
   */
  async getFileBuffer(filename) {
    throw new Error('getFileBuffer() must be implemented by subclass');
  }

  /**
   * Store an object
   * @param {string} filename 
   * @param {Buffer} buffer 
   * @param {Object} [options]
   * @returns {Promise<{ name: string, size: number, etag: string, lastModified: Date }>}
   */
  async putFile(filename, buffer, options = {}) {
    throw new Error('putFile() must be implemented by subclass');
  }

  /**
   * Delete an object
   * @param {string} filename 
   * @returns {Promise<boolean>} True if deleted, false if file did not exist
   */
  async deleteFile(filename) {
    throw new Error('deleteFile() must be implemented by subclass');
  }

  /**
   * Generate a download URL (presigned URL for S3 or local download endpoint)
   * @param {string} filename 
   * @returns {Promise<string | null>}
   */
  async getDownloadUrl(filename) {
    throw new Error('getDownloadUrl() must be implemented by subclass');
  }
}

module.exports = StorageProvider;
