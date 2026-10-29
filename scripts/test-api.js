/**
 * Automated API Test Suite
 * Tests all Multi-Cloud Backup System endpoints against the live Express server.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

// Helper: Make HTTP request using Node's native http module
function request(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString();
        let parsed = null;
        try {
          parsed = JSON.parse(rawBody);
        } catch (e) {
          parsed = rawBody;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBuffer: Buffer.concat(chunks)
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (Buffer.isBuffer(body) || typeof body === 'string') {
        req.write(body);
      }
    }
    req.end();
  });
}

// Helper: Multipart form builder
function createMultipartFormData(fieldName, filename, fileBuffer, mimeType = 'text/plain') {
  const boundary = '----MultiCloudTestBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';

  let pre = `--${boundary}${crlf}`;
  pre += `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"${crlf}`;
  pre += `Content-Type: ${mimeType}${crlf}${crlf}`;

  const post = `${crlf}--${boundary}--${crlf}`;

  const bodyBuffer = Buffer.concat([
    Buffer.from(pre, 'utf8'),
    fileBuffer,
    Buffer.from(post, 'utf8')
  ]);

  return {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuffer.length
    },
    body: bodyBuffer
  };
}

async function runTests() {
  console.log('\n=======================================================');
  console.log(' Starting Automated API Integration Tests');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    assert(health.status === 200, 'GET /api/health returns 200 OK');
    assert(health.body.primary && health.body.primary.connected === true, 'GET /api/health primary storage connected');
    assert(health.body.secondary && health.body.secondary.connected === true, 'GET /api/health secondary storage connected');

    // 2. Initial file listing
    const initialList = await request('GET', '/files');
    assert(initialList.status === 200, 'GET /api/files returns 200 OK');
    assert(Array.isArray(initialList.body.files), 'GET /api/files contains files array');

    // 3. Upload valid file
    const sampleContent = Buffer.from('Cloud Computing Multi-Cloud Backup Test Content ' + Date.now());
    const sampleFilename = `report-${Date.now()}.txt`;
    const multipart = createMultipartFormData('file', sampleFilename, sampleContent);

    const uploadRes = await request('POST', '/upload', multipart.headers, multipart.body);
    assert(uploadRes.status === 201, 'POST /api/upload returns 201 Created');
    assert(uploadRes.body.file && uploadRes.body.file.name === sampleFilename, 'Uploaded filename matches');

    // 4. Reject 0-byte file
    const emptyMultipart = createMultipartFormData('file', 'empty.txt', Buffer.alloc(0));
    const emptyUpload = await request('POST', '/upload', emptyMultipart.headers, emptyMultipart.body);
    assert(emptyUpload.status === 400, 'POST /api/upload rejects 0-byte files with 400 Bad Request');

    // 5. Reject invalid/reserved filename on upload (e.g. Windows reserved device name)
    const reservedMultipart = createMultipartFormData('file', 'CON.txt', Buffer.from('test content'));
    const reservedUpload = await request('POST', '/upload', reservedMultipart.headers, reservedMultipart.body);
    assert(reservedUpload.status === 400, 'POST /api/upload rejects reserved device filename (CON.txt) with 400 Bad Request');

    // 5b. Reject path traversal in URL parameter
    const traversalDownload = await request('GET', `/download/${encodeURIComponent('../../evil.txt')}`);
    assert(traversalDownload.status === 400, 'GET /api/download/:filename rejects path traversal in URL parameter with 400 Bad Request');

    // 6. Verify file appears in list with inPrimary=true and inSecondary=false
    const listAfterUpload = await request('GET', '/files');
    const uploadedItem = listAfterUpload.body.files.find(f => f.name === sampleFilename);
    assert(Boolean(uploadedItem), `File "${sampleFilename}" found in file inventory`);
    assert(uploadedItem && uploadedItem.inPrimary === true, 'Object is marked inPrimary = true');
    assert(uploadedItem && uploadedItem.inSecondary === false, 'Object is marked inSecondary = false before backup');

    // 7. Get download link
    const downloadRes = await request('GET', `/download/${encodeURIComponent(sampleFilename)}`);
    assert(downloadRes.status === 200, 'GET /api/download/:filename returns 200 OK');
    assert(Boolean(downloadRes.body.downloadUrl), 'GET /api/download returns downloadUrl');

    // 8. Stream download file directly and verify contents match
    const fileStreamRes = await request('GET', `/download/file/${encodeURIComponent(sampleFilename)}`);
    assert(fileStreamRes.status === 200, 'GET /api/download/file/:filename returns 200 OK');
    assert(fileStreamRes.rawBuffer.equals(sampleContent), 'Downloaded file content matches uploaded bytes exactly');

    // 9. Backup file to Secondary storage
    const backupRes = await request('POST', `/backup/${encodeURIComponent(sampleFilename)}`);
    assert(backupRes.status === 200, 'POST /api/backup/:filename returns 200 OK');

    // Verify replication status updated in file list
    const listAfterBackup = await request('GET', '/files');
    const backedUpItem = listAfterBackup.body.files.find(f => f.name === sampleFilename);
    assert(backedUpItem && backedUpItem.inSecondary === true, 'Object is marked inSecondary = true after backup');

    // 10. Disaster Recovery Simulation: Delete from Primary only, then Recover
    const deletePrimaryRes = await request('DELETE', `/files/${encodeURIComponent(sampleFilename)}?scope=primary`);
    assert(deletePrimaryRes.status === 200, 'DELETE /api/files/:filename?scope=primary succeeds');

    const listAfterPrimaryDelete = await request('GET', '/files');
    const itemAfterPrimaryDelete = listAfterPrimaryDelete.body.files.find(f => f.name === sampleFilename);
    assert(itemAfterPrimaryDelete && itemAfterPrimaryDelete.inPrimary === false, 'Object inPrimary = false after primary deletion');
    assert(itemAfterPrimaryDelete && itemAfterPrimaryDelete.inSecondary === true, 'Object replica preserved in secondary storage');

    // Download fallback test: download still succeeds via secondary recovery failover!
    const failoverDownload = await request('GET', `/download/${encodeURIComponent(sampleFilename)}`);
    assert(failoverDownload.status === 200 && failoverDownload.body.recoveredFromSecondary === true, 'Download failover to secondary replica succeeds during primary outage');

    // Recover from secondary
    const recoverRes = await request('POST', `/recover/${encodeURIComponent(sampleFilename)}`);
    assert(recoverRes.status === 200, 'POST /api/recover/:filename restores object to primary');

    const listAfterRecover = await request('GET', '/files');
    const recoveredItem = listAfterRecover.body.files.find(f => f.name === sampleFilename);
    assert(recoveredItem && recoveredItem.inPrimary === true && recoveredItem.inSecondary === true, 'Object fully restored to both clouds');

    // 11. Run DR Audit
    const auditRes = await request('GET', '/audit');
    assert(auditRes.status === 200, 'GET /api/audit returns 200 OK');
    assert(auditRes.body.isFullySynced === true, 'DR Audit reports full synchronization');
    assert(Array.isArray(auditRes.body.recentLogs) && auditRes.body.recentLogs.length > 0, 'Audit logs recorded');

    // 12. Delete object completely from both clouds
    const deleteBothRes = await request('DELETE', `/files/${encodeURIComponent(sampleFilename)}?scope=both`);
    assert(deleteBothRes.status === 200, 'DELETE /api/files/:filename?scope=both succeeds');

    const listAfterFinalDelete = await request('GET', '/files');
    const itemAfterFinalDelete = listAfterFinalDelete.body.files.find(f => f.name === sampleFilename);
    assert(!itemAfterFinalDelete, 'Object successfully purged from both storage targets');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n=======================================================');
  console.log(` Test Summary: ${passed} passed, ${failed} failed`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  let serverInstance = null;

  // Check if server is already running
  try {
    await request('GET', '/health');
  } catch (err) {
    // Not running; launch server locally for test execution
    console.log('[Test Runner] Launching local server instance for test execution...');
    const { server } = require('../server');
    serverInstance = server;
    // Wait 500ms for server port to bind
    await new Promise(r => setTimeout(r, 500));
  }

  try {
    await runTests();
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
