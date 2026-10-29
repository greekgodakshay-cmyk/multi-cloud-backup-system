/**
 * LocalStorageProvider
 * Filesystem-backed storage provider for offline testing and development.
 * Completely isolates primary and secondary replicas without requiring cloud credentials.
 */

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const StorageProvider = require('./StorageProvider');
const { sanitizeFilename, computeMD5 } = require('../utils/security');

class LocalStorageProvider extends StorageProvider {
  /**
   * @param {string} name - Display name (e.g. "Local Storage (Primary)")
   * @param {string} baseDir - Directory path on disk
   */
  constructor(name, baseDir) {
    super(name, 'local');
    this.baseDir = path.resolve(baseDir);
    this._ensureDirectory();
  }

  _ensureDirectory() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch (err) {
      console.error(`[LocalStorageProvider:${this.name}] Directory init failed:`, err.message);
    }
  }

  _getFilePath(filename) {
    const safeName = sanitizeFilename(filename);
    return path.join(this.baseDir, safeName);
  }

  async testConnection() {
    try {
      this._ensureDirectory();
      // Test read/write permissions
      fs.accessSync(this.baseDir, fs.constants.R_OK | fs.constants.W_OK);
      return {
        connected: true,
        name: this.name,
        type: 'local'
      };
    } catch (err) {
      return {
        connected: false,
        name: this.name,
        type: 'local',
        error: `Local directory inaccessible: ${err.message}`
      };
    }
  }

  async listFiles() {
    this._ensureDirectory();
    try {
      const files = await fs.promises.readdir(this.baseDir);
      const results = [];

      for (const file of files) {
        // Skip hidden files or subdirectories
        if (file.startsWith('.')) continue;

        try {
          const filePath = path.join(this.baseDir, file);
          const stat = await fs.promises.stat(filePath);

          if (!stat.isFile()) continue;

          // Compute MD5 hash as ETag (matching S3 standard)
          const content = await fs.promises.readFile(filePath);
          const etag = computeMD5(content);

          results.push({
            name: file,
            size: stat.size,
            etag: etag,
            lastModified: stat.mtime
          });
        } catch (innerErr) {
          console.warn(`[LocalStorageProvider] Could not stat "${file}":`, innerErr.message);
        }
      }

      // Sort alphabetically by name
      return results.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      console.error(`[LocalStorageProvider:${this.name}] listFiles error:`, err.message);
      return [];
    }
  }

  async getFileStream(filename) {
    const filePath = this._getFilePath(filename);
    try {
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) return null;

      const content = await fs.promises.readFile(filePath);
      const etag = computeMD5(content);
      const stream = fs.createReadStream(filePath);
      const contentType = mime.lookup(filename) || 'application/octet-stream';

      return {
        stream,
        size: stat.size,
        contentType,
        etag
      };
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  async getFileBuffer(filename) {
    const filePath = this._getFilePath(filename);
    return await fs.promises.readFile(filePath);
  }

  async putFile(filename, buffer, options = {}) {
    const filePath = this._getFilePath(filename);
    await fs.promises.writeFile(filePath, buffer);

    const stat = await fs.promises.stat(filePath);
    const etag = computeMD5(buffer);

    return {
      name: sanitizeFilename(filename),
      size: stat.size,
      etag: etag,
      lastModified: stat.mtime
    };
  }

  async deleteFile(filename) {
    const filePath = this._getFilePath(filename);
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }

  async getDownloadUrl(filename) {
    const safeName = sanitizeFilename(filename);
    return `/api/download/file/${encodeURIComponent(safeName)}`;
  }
}

module.exports = LocalStorageProvider;
