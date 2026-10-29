/**
 * Storage Manager
 * Orchestrates multi-cloud redundancy, backup replication, disaster recovery,
 * and object synchronization across Primary and Secondary providers.
 */

const config = require('../config');
const LocalStorageProvider = require('./LocalStorageProvider');
const S3StorageProvider = require('./S3StorageProvider');
const { sanitizeFilename } = require('../utils/security');

class StorageManager {
  constructor() {
    this._initProviders();
  }

  _initProviders() {
    const isCloud = config.storageMode === 'cloud';

    // 1. Primary Storage Selection
    if (isCloud && config.r2.bucket && config.r2.accessKeyId) {
      this.primaryProvider = new S3StorageProvider({
        name: 'Cloudflare R2',
        bucket: config.r2.bucket,
        endpoint: config.r2.endpoint,
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
        presignedTtl: config.presignedUrlTtlSeconds
      });
    } else if (isCloud && config.aws.bucket && config.aws.accessKeyId) {
      this.primaryProvider = new S3StorageProvider({
        name: 'AWS S3 (Primary)',
        bucket: config.aws.bucket,
        endpoint: config.aws.endpoint,
        region: config.aws.region,
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        presignedTtl: config.presignedUrlTtlSeconds
      });
    } else {
      // Default: Local Storage (Primary)
      this.primaryProvider = new LocalStorageProvider(
        'Local Storage (Primary)',
        config.localStorage.primaryDir
      );
    }

    // 2. Secondary Storage Selection
    if (isCloud && config.b2.bucket && config.b2.keyId) {
      this.secondaryProvider = new S3StorageProvider({
        name: 'Backblaze B2',
        bucket: config.b2.bucket,
        endpoint: config.b2.endpoint,
        region: config.b2.region,
        accessKeyId: config.b2.keyId,
        secretAccessKey: config.b2.applicationKey,
        forcePathStyle: config.b2.forcePathStyle,
        presignedTtl: config.presignedUrlTtlSeconds
      });
    } else if (isCloud && config.aws.bucket && config.aws.accessKeyId && this.primaryProvider.name !== 'AWS S3 (Primary)') {
      this.secondaryProvider = new S3StorageProvider({
        name: 'AWS S3 (Secondary)',
        bucket: config.aws.bucket,
        endpoint: config.aws.endpoint,
        region: config.aws.region,
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        presignedTtl: config.presignedUrlTtlSeconds
      });
    } else if (!isCloud && config.localStorage.enableSecondary) {
      // Default: Local Storage (Secondary Replica)
      this.secondaryProvider = new LocalStorageProvider(
        'Local Replica (Secondary)',
        config.localStorage.secondaryDir
      );
    } else {
      this.secondaryProvider = null;
    }
  }

  /**
   * Health status of both storage targets
   */
  async getHealth() {
    const primaryHealth = await this.primaryProvider.testConnection();

    let secondaryHealth;
    if (this.secondaryProvider) {
      secondaryHealth = await this.secondaryProvider.testConnection();
    } else {
      secondaryHealth = {
        connected: false,
        name: 'Secondary Backup',
        type: 'unconfigured',
        error: 'Secondary storage provider is not configured'
      };
    }

    return {
      status: primaryHealth.connected ? 'ok' : 'degraded',
      mode: config.storageMode,
      primary: primaryHealth,
      secondary: secondaryHealth
    };
  }

  /**
   * Unified inventory across both providers
   */
  async listFiles() {
    const primaryList = await this.primaryProvider.listFiles();
    const secondaryList = this.secondaryProvider ? await this.secondaryProvider.listFiles() : [];

    const fileMap = new Map();

    // Map primary files
    for (const p of primaryList) {
      fileMap.set(p.name, {
        name: p.name,
        size: p.size,
        inPrimary: true,
        inSecondary: false,
        etag: p.etag,
        lastModified: p.lastModified
      });
    }

    // Map secondary files
    for (const s of secondaryList) {
      if (fileMap.has(s.name)) {
        const item = fileMap.get(s.name);
        item.inSecondary = true;
      } else {
        fileMap.set(s.name, {
          name: s.name,
          size: s.size,
          inPrimary: false,
          inSecondary: true,
          etag: s.etag,
          lastModified: s.lastModified
        });
      }
    }

    const files = Array.from(fileMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Calculate aggregated metrics
    let primaryCount = 0;
    let primaryBytes = 0;
    let secondaryCount = 0;
    let secondaryBytes = 0;
    let syncedCount = 0;

    for (const f of files) {
      if (f.inPrimary) {
        primaryCount++;
        primaryBytes += f.size || 0;
      }
      if (f.inSecondary) {
        secondaryCount++;
        secondaryBytes += f.size || 0;
      }
      if (f.inPrimary && f.inSecondary) {
        syncedCount++;
      }
    }

    return {
      files,
      metrics: {
        primaryCount,
        primaryBytes,
        secondaryCount,
        secondaryBytes,
        syncedCount
      }
    };
  }

  /**
   * Store object in Primary storage
   */
  async upload(filename, buffer, options = {}) {
    const safeName = sanitizeFilename(filename);
    return await this.primaryProvider.putFile(safeName, buffer, options);
  }

  /**
   * Replicate object from Primary to Secondary
   */
  async backup(filename) {
    const safeName = sanitizeFilename(filename);

    if (!this.secondaryProvider) {
      const err = new Error('Secondary storage target is not configured');
      err.status = 503;
      throw err;
    }

    const secondaryHealth = await this.secondaryProvider.testConnection();
    if (!secondaryHealth.connected) {
      const err = new Error(`Secondary storage (${this.secondaryProvider.name}) is offline: ${secondaryHealth.error}`);
      err.status = 503;
      throw err;
    }

    let buffer;
    try {
      buffer = await this.primaryProvider.getFileBuffer(safeName);
    } catch (err) {
      const notFoundErr = new Error(`Cannot backup: object "${safeName}" not found in primary storage`);
      notFoundErr.status = 404;
      throw notFoundErr;
    }

    const backupResult = await this.secondaryProvider.putFile(safeName, buffer);
    return backupResult;
  }

  /**
   * Replicate missing object from Secondary back to Primary (Disaster Recovery)
   */
  async recover(filename) {
    const safeName = sanitizeFilename(filename);

    if (!this.secondaryProvider) {
      const err = new Error('Secondary backup storage is not configured');
      err.status = 503;
      throw err;
    }

    let buffer;
    try {
      buffer = await this.secondaryProvider.getFileBuffer(safeName);
    } catch (err) {
      const notFoundErr = new Error(`Cannot recover: backup object "${safeName}" not found in secondary storage`);
      notFoundErr.status = 404;
      throw notFoundErr;
    }

    const restoreResult = await this.primaryProvider.putFile(safeName, buffer);
    return restoreResult;
  }

  /**
   * Batch backup all un-synchronized objects
   */
  async backupAll() {
    if (!this.secondaryProvider) {
      const err = new Error('Secondary storage provider is not configured');
      err.status = 503;
      throw err;
    }

    const { files } = await this.listFiles();
    const unbacked = files.filter(f => f.inPrimary && !f.inSecondary);

    let syncedCount = 0;
    const errors = [];

    for (const file of unbacked) {
      try {
        await this.backup(file.name);
        syncedCount++;
      } catch (err) {
        errors.push({ filename: file.name, error: err.message });
      }
    }

    return {
      totalPrimary: files.filter(f => f.inPrimary).length,
      unbackedCount: unbacked.length,
      syncedCount,
      errors
    };
  }

  /**
   * Disaster Recovery audit
   */
  async audit() {
    const { files, metrics } = await this.listFiles();

    const missingInSecondary = files.filter(f => f.inPrimary && !f.inSecondary).map(f => f.name);
    const missingInPrimary = files.filter(f => !f.inPrimary && f.inSecondary).map(f => f.name);

    const isFullySynced = missingInSecondary.length === 0 && metrics.primaryCount > 0;
    let message = '';

    if (metrics.primaryCount === 0) {
      message = 'Storage is empty. No files to audit.';
    } else if (isFullySynced) {
      message = `DR Audit Passed: All ${metrics.primaryCount} primary object(s) have verified replicas in secondary storage.`;
    } else {
      message = `DR Audit Notice: ${missingInSecondary.length} object(s) exist in primary storage without a secondary replica.`;
    }

    return {
      message,
      metrics,
      missingInSecondary,
      missingInPrimary,
      isFullySynced
    };
  }

  /**
   * Delete object with scope targeting (primary, secondary, or both)
   */
  async deleteFile(filename, scope = 'both') {
    const safeName = sanitizeFilename(filename);
    let deletedPrimary = false;
    let deletedSecondary = false;

    if (scope === 'primary' || scope === 'both') {
      deletedPrimary = await this.primaryProvider.deleteFile(safeName);
    }

    if ((scope === 'secondary' || scope === 'both') && this.secondaryProvider) {
      deletedSecondary = await this.secondaryProvider.deleteFile(safeName);
    }

    if (!deletedPrimary && !deletedSecondary) {
      const err = new Error(`Object "${safeName}" not found in target storage (${scope})`);
      err.status = 404;
      throw err;
    }

    return {
      deletedPrimary,
      deletedSecondary,
      scope
    };
  }

  /**
   * Retrieve download URL or stream (with disaster recovery fallback)
   */
  async getDownloadResource(filename) {
    const safeName = sanitizeFilename(filename);

    // 1. Try Primary Storage
    if (this.primaryProvider.type === 's3') {
      const url = await this.primaryProvider.getDownloadUrl(safeName);
      if (url) return { type: 'url', url };
    } else {
      const streamData = await this.primaryProvider.getFileStream(safeName);
      if (streamData) {
        return {
          type: 'stream',
          ...streamData,
          filename: safeName
        };
      }
    }

    // 2. Failover to Secondary Storage if primary copy is missing (Disaster Recovery)
    if (this.secondaryProvider) {
      if (this.secondaryProvider.type === 's3') {
        const url = await this.secondaryProvider.getDownloadUrl(safeName);
        if (url) return { type: 'url', url, recoveredFromSecondary: true };
      } else {
        const streamData = await this.secondaryProvider.getFileStream(safeName);
        if (streamData) {
          return {
            type: 'stream',
            ...streamData,
            filename: safeName,
            recoveredFromSecondary: true
          };
        }
      }
    }

    return null;
  }
}

module.exports = new StorageManager();
