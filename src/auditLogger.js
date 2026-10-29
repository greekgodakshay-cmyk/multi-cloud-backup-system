/**
 * Audit Logger Module
 * Records all storage mutations (uploads, downloads, backups, restores, deletions)
 * to an append-only JSONL log file and an in-memory ring buffer.
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(process.cwd(), 'logs');
const AUDIT_LOG_FILE = path.join(LOGS_DIR, 'audit.log');
const MAX_MEMORY_LOGS = 100;

class AuditLogger {
  constructor() {
    this.memoryLogs = [];
    this._ensureLogDirectory();
  }

  _ensureLogDirectory() {
    try {
      if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('[AuditLogger] Failed to initialize logs directory:', err.message);
    }
  }

  /**
   * Log an event
   * @param {Object} event
   * @param {string} event.action - e.g. UPLOAD, DOWNLOAD, BACKUP, RECOVER, DELETE, AUDIT
   * @param {string} event.status - SUCCESS | FAILURE
   * @param {string} [event.filename] - Filename involved
   * @param {Object} [event.details] - Arbitrary additional metadata
   * @param {string} [event.ip] - Request IP
   */
  log({ action, status, filename = null, details = {}, ip = '127.0.0.1' }) {
    const entry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      status,
      filename,
      details,
      ip
    };

    // Keep in-memory ring buffer for quick retrieval
    this.memoryLogs.unshift(entry);
    if (this.memoryLogs.length > MAX_MEMORY_LOGS) {
      this.memoryLogs.pop();
    }

    // Append to file asynchronously (fire-and-forget to never block requests)
    try {
      fs.appendFile(AUDIT_LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
        if (err) {
          console.error('[AuditLogger] Error writing audit log:', err.message);
        }
      });
    } catch (err) {
      console.error('[AuditLogger] Exception appending log:', err.message);
    }

    return entry;
  }

  /**
   * Retrieve recent logs
   * @param {number} limit 
   * @returns {Array<Object>}
   */
  getRecentLogs(limit = 50) {
    return this.memoryLogs.slice(0, limit);
  }
}

// Export singleton instance
module.exports = new AuditLogger();
