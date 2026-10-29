/**
 * Multi-Cloud Backup System — Express API Server
 * Provides secure REST endpoints for storage operations, replication, disaster recovery,
 * and multi-cloud health checks.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const config = require('./src/config');
const storageManager = require('./src/storage/storageManager');
const auditLogger = require('./src/auditLogger');
const { sanitizeFilename } = require('./src/utils/security');

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets directly from root directory
app.use(express.static(path.resolve(__dirname)));

// Configure Multer for in-memory multipart uploads with 50 MB cap
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeBytes // 50 MB guardrail
  }
});

// Helper for client IP
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
}

// ==========================================
// API Routes
// ==========================================

/**
 * GET /api/health
 * Verifies connectivity of both primary and secondary storage targets.
 */
app.get('/api/health', async (req, res, next) => {
  try {
    const health = await storageManager.getHealth();
    res.json(health);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/files
 * Returns unified inventory of all objects across primary and secondary storage.
 */
app.get('/api/files', async (req, res, next) => {
  try {
    const inventory = await storageManager.listFiles();
    res.json(inventory);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/upload
 * Ingests a file directly into Primary storage.
 */
app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  const ip = getClientIp(req);

  try {
    if (!req.file) {
      const err = new Error('No file provided in multipart request (expected field "file")');
      err.status = 400;
      throw err;
    }

    if (req.file.size === 0) {
      const err = new Error('Cannot upload empty (0 byte) files.');
      err.status = 400;
      throw err;
    }

    const safeName = sanitizeFilename(req.file.originalname);

    const result = await storageManager.upload(safeName, req.file.buffer, {
      contentType: req.file.mimetype
    });

    auditLogger.log({
      action: 'UPLOAD',
      status: 'SUCCESS',
      filename: safeName,
      details: { size: req.file.size, etag: result.etag, target: storageManager.primaryProvider.name },
      ip
    });

    res.status(201).json({
      success: true,
      message: `File "${safeName}" successfully uploaded to ${storageManager.primaryProvider.name}`,
      file: result
    });
  } catch (err) {
    auditLogger.log({
      action: 'UPLOAD',
      status: 'FAILURE',
      filename: req.file ? req.file.originalname : 'unknown',
      details: { error: err.message },
      ip
    });
    next(err);
  }
});

/**
 * GET /api/download/:filename
 * Resolves a secure download link (presigned URL for cloud or local download route).
 */
app.get('/api/download/:filename', async (req, res, next) => {
  const ip = getClientIp(req);
  try {
    const safeName = sanitizeFilename(req.params.filename);
    const resource = await storageManager.getDownloadResource(safeName);

    if (!resource) {
      const err = new Error(`Object "${safeName}" not found in storage`);
      err.status = 404;
      throw err;
    }

    auditLogger.log({
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      filename: safeName,
      details: { type: resource.type, recoveredFromSecondary: resource.recoveredFromSecondary || false },
      ip
    });

    if (resource.type === 'url') {
      res.json({
        success: true,
        downloadUrl: resource.url,
        recoveredFromSecondary: resource.recoveredFromSecondary || false
      });
    } else {
      res.json({
        success: true,
        downloadUrl: `/api/download/file/${encodeURIComponent(safeName)}`,
        recoveredFromSecondary: resource.recoveredFromSecondary || false
      });
    }
  } catch (err) {
    auditLogger.log({
      action: 'DOWNLOAD',
      status: 'FAILURE',
      filename: req.params.filename,
      details: { error: err.message },
      ip
    });
    next(err);
  }
});

/**
 * GET /api/download/file/:filename
 * Direct file streaming endpoint with safe headers for local mode downloads.
 */
app.get('/api/download/file/:filename', async (req, res, next) => {
  try {
    const safeName = sanitizeFilename(req.params.filename);
    const resource = await storageManager.getDownloadResource(safeName);

    if (!resource || resource.type !== 'stream') {
      const err = new Error(`File "${safeName}" not available for direct download`);
      err.status = 404;
      throw err;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Content-Type', resource.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', resource.size);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    resource.stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/files/:filename?scope=primary|secondary|both
 * Deletes object from targeted storage domain(s).
 */
app.delete('/api/files/:filename', async (req, res, next) => {
  const ip = getClientIp(req);
  try {
    const safeName = sanitizeFilename(req.params.filename);
    const scope = (req.query.scope || 'both').toLowerCase();

    if (!['primary', 'secondary', 'both'].includes(scope)) {
      const err = new Error('Invalid delete scope. Allowed values: primary, secondary, both');
      err.status = 400;
      throw err;
    }

    const result = await storageManager.deleteFile(safeName, scope);

    auditLogger.log({
      action: 'DELETE',
      status: 'SUCCESS',
      filename: safeName,
      details: { scope, ...result },
      ip
    });

    res.json({
      success: true,
      message: `Object "${safeName}" deleted from scope: ${scope}`,
      ...result
    });
  } catch (err) {
    auditLogger.log({
      action: 'DELETE',
      status: 'FAILURE',
      filename: req.params.filename,
      details: { error: err.message },
      ip
    });
    next(err);
  }
});

/**
 * POST /api/backup/:filename
 * Replicates a specific object from Primary to Secondary storage.
 */
app.post('/api/backup/:filename', async (req, res, next) => {
  const ip = getClientIp(req);
  try {
    const safeName = sanitizeFilename(req.params.filename);
    const backupResult = await storageManager.backup(safeName);

    auditLogger.log({
      action: 'BACKUP',
      status: 'SUCCESS',
      filename: safeName,
      details: {
        etag: backupResult.etag,
        size: backupResult.size,
        target: storageManager.secondaryProvider ? storageManager.secondaryProvider.name : 'unknown'
      },
      ip
    });

    res.json({
      success: true,
      message: `Replicated "${safeName}" to ${storageManager.secondaryProvider.name}`,
      backup: backupResult
    });
  } catch (err) {
    auditLogger.log({
      action: 'BACKUP',
      status: 'FAILURE',
      filename: req.params.filename,
      details: { error: err.message },
      ip
    });
    next(err);
  }
});

/**
 * POST /api/recover/:filename
 * Restores a missing object from Secondary storage back to Primary storage (Disaster Recovery).
 */
app.post('/api/recover/:filename', async (req, res, next) => {
  const ip = getClientIp(req);
  try {
    const safeName = sanitizeFilename(req.params.filename);
    const restoreResult = await storageManager.recover(safeName);

    auditLogger.log({
      action: 'RECOVER',
      status: 'SUCCESS',
      filename: safeName,
      details: {
        etag: restoreResult.etag,
        size: restoreResult.size,
        target: storageManager.primaryProvider.name
      },
      ip
    });

    res.json({
      success: true,
      message: `Recovered "${safeName}" from Secondary backup into ${storageManager.primaryProvider.name}`,
      recovered: restoreResult
    });
  } catch (err) {
    auditLogger.log({
      action: 'RECOVER',
      status: 'FAILURE',
      filename: req.params.filename,
      details: { error: err.message },
      ip
    });
    next(err);
  }
});

/**
 * POST /api/backup/all
 * Batch replicates all unbacked primary objects to secondary storage.
 */
app.post('/api/backup/all', async (req, res, next) => {
  const ip = getClientIp(req);
  try {
    const batchResult = await storageManager.backupAll();

    auditLogger.log({
      action: 'BACKUP_ALL',
      status: 'SUCCESS',
      details: batchResult,
      ip
    });

    res.json({
      success: true,
      message: `Batch backup completed: ${batchResult.syncedCount} of ${batchResult.unbackedCount} pending objects replicated.`,
      ...batchResult
    });
  } catch (err) {
    auditLogger.log({
      action: 'BACKUP_ALL',
      status: 'FAILURE',
      details: { error: err.message },
      ip
    });
    next(err);
  }
});

/**
 * GET /api/audit
 * Audits multi-cloud redundancy, verifies replicas, and returns recent audit logs.
 */
app.get('/api/audit', async (req, res, next) => {
  const ip = getClientIp(req);
  try {
    const auditReport = await storageManager.audit();
    const recentLogs = auditLogger.getRecentLogs(20);

    auditLogger.log({
      action: 'AUDIT',
      status: 'SUCCESS',
      details: { isFullySynced: auditReport.isFullySynced },
      ip
    });

    res.json({
      success: true,
      ...auditReport,
      recentLogs
    });
  } catch (err) {
    auditLogger.log({
      action: 'AUDIT',
      status: 'FAILURE',
      details: { error: err.message },
      ip
    });
    next(err);
  }
});

// ==========================================
// Multer & General Error Handling
// ==========================================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `File too large. Maximum allowed size is ${Math.round(config.maxFileSizeBytes / (1024 * 1024))} MB.`
      });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json({ error: message });
});

// ==========================================
// Start Server
// ==========================================
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` Multi-Cloud Backup System Server Active`);
  console.log(` Listening on: http://localhost:${config.port}`);
  console.log(` Storage Mode: ${config.storageMode.toUpperCase()}`);
  console.log(` Primary Target:   ${storageManager.primaryProvider.name}`);
  console.log(` Secondary Target: ${storageManager.secondaryProvider ? storageManager.secondaryProvider.name : 'None (Unconfigured)'}`);
  console.log(` Max File Size: ${Math.round(config.maxFileSizeBytes / (1024 * 1024))} MB`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
