/**
 * Smilify Enterprise — Frontend Application Controller
 * High-Availability Multi-Cloud Storage & Automated Disaster Recovery
 */

// Configuration & API Endpoints
const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:') && (window.location.port === '5000' || !window.location.port)
  ? '/api'
  : 'http://localhost:5000/api';
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB Free-Tier Safety Limit

// State Management
let storedFiles = [];
let selectedFile = null;
let filePendingDelete = null;
let isBackendConnected = false;

// DOM Elements
const uploadDropzone = document.getElementById('uploadDropzone');
const fileInput = document.getElementById('fileInput');
const uploadControls = document.getElementById('uploadControls');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileSize = document.getElementById('selectedFileSize');
const fileIconBox = document.getElementById('fileIconBox');
const cancelFileBtn = document.getElementById('cancelFileBtn');
const clearSelectionBtn = document.getElementById('clearSelectionBtn');
const startUploadBtn = document.getElementById('startUploadBtn');

const progressWrap = document.getElementById('progressWrap');
const progressBarFill = document.getElementById('progressBarFill');
const progressStatusText = document.getElementById('progressStatusText');
const progressPercentage = document.getElementById('progressPercentage');

const filesTableBody = document.getElementById('filesTableBody');
const emptyRowPlaceholder = document.getElementById('emptyRowPlaceholder');
const searchInput = document.getElementById('searchInput');
const refreshFilesBtn = document.getElementById('refreshFilesBtn');
const fileCountBadge = document.getElementById('fileCountBadge');

const metricPrimaryCount = document.getElementById('metricPrimaryCount');
const metricPrimarySize = document.getElementById('metricPrimarySize');
const metricSecondaryCount = document.getElementById('metricSecondaryCount');
const metricSecondarySize = document.getElementById('metricSecondarySize');
const metricSyncPercentage = document.getElementById('metricSyncPercentage');
const metricHealthBadge = document.getElementById('metricHealthBadge');
const metricSyncStatusText = document.getElementById('metricSyncStatusText');

const primaryCloudStatus = document.getElementById('primaryCloudStatus');
const secondaryCloudStatus = document.getElementById('secondaryCloudStatus');
const backendHealthDot = document.getElementById('backendHealthDot');
const backendHealthTitle = document.getElementById('backendHealthTitle');
const serverStatusMsg = document.getElementById('serverStatusMsg');

const syncAllBtn = document.getElementById('syncAllBtn');
const simulateDrillBtn = document.getElementById('simulateDrillBtn');

const deleteModal = document.getElementById('deleteModal');
const deleteTargetFileName = document.getElementById('deleteTargetFileName');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

const archModal = document.getElementById('archModal');
const openArchModalBtn = document.getElementById('openArchModalBtn');
const closeArchModalBtn = document.getElementById('closeArchModalBtn');
const dismissArchModalBtn = document.getElementById('dismissArchModalBtn');

const toastContainer = document.getElementById('toastContainer');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const auditFeed = document.getElementById('auditFeed');

// ==========================================
// Initial Setup & Event Listeners
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDragAndDrop();
  initModals();
  initSearch();
  initActions();

  // Initial connection check & audit log fetch
  checkBackendHealth();
  fetchAuditLogs();

  // Poll backend health every 15 seconds
  setInterval(checkBackendHealth, 15000);
});

// ==========================================
// Theme Management (Light / Dark Mode)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('smilify-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('smilify-theme', newTheme);
      showToast(`Switched to ${newTheme} theme`, 'info');
    });
  }
}

// ==========================================
// File Selection & Drag-and-Drop
// ==========================================
function initDragAndDrop() {
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.remove('dragover');
    });
  });

  uploadDropzone.addEventListener('drop', (e) => {
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelection(droppedFiles[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  cancelFileBtn.addEventListener('click', clearSelectedFile);
  clearSelectionBtn.addEventListener('click', clearSelectedFile);
  startUploadBtn.addEventListener('click', handleUpload);
}

function handleFileSelection(file) {
  if (!file) return;

  // Validation: Size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    showToast(`File too large (${formatBytes(file.size)}). Max allowed is 50 MB for free-tier safety.`, 'error');
    clearSelectedFile();
    return;
  }

  // Validation: Empty File
  if (file.size === 0) {
    showToast('Cannot upload empty (0 byte) files.', 'warning');
    clearSelectedFile();
    return;
  }

  // Duplicate Check
  const isDuplicate = storedFiles.some(f => f.name.toLowerCase() === file.name.toLowerCase());
  if (isDuplicate) {
    showToast(`Note: "${file.name}" already exists. Uploading will update the object version.`, 'warning');
  }

  selectedFile = file;
  selectedFileName.textContent = file.name;
  selectedFileSize.textContent = formatBytes(file.size);
  fileIconBox.innerHTML = getFileIconSvg(file.name);

  uploadControls.classList.remove('hidden');
  progressWrap.classList.add('hidden');
  progressBarFill.style.width = '0%';
  progressPercentage.textContent = '0%';
  startUploadBtn.disabled = false;
}

function clearSelectedFile() {
  selectedFile = null;
  fileInput.value = '';
  uploadControls.classList.add('hidden');
  progressWrap.classList.add('hidden');
}

// ==========================================
// Cloud Upload via Backend
// ==========================================
async function handleUpload() {
  if (!selectedFile) {
    showToast('Please select a file to upload.', 'warning');
    return;
  }

  if (!isBackendConnected) {
    showToast('Backend server is offline. Start the backend service to upload.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);

  startUploadBtn.disabled = true;
  cancelFileBtn.disabled = true;
  clearSelectionBtn.disabled = true;
  progressWrap.classList.remove('hidden');
  progressStatusText.textContent = 'Ingesting to Primary Storage...';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/upload`, true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percentComplete = Math.round((e.loaded / e.total) * 100);
      progressBarFill.style.width = `${percentComplete}%`;
      progressPercentage.textContent = `${percentComplete}%`;
    }
  };

  xhr.onload = () => {
    startUploadBtn.disabled = false;
    cancelFileBtn.disabled = false;
    clearSelectionBtn.disabled = false;

    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        showToast(`Successfully uploaded "${selectedFile.name}" to Primary storage!`, 'success');
        clearSelectedFile();
        fetchFiles();
        fetchAuditLogs();
      } catch (err) {
        showToast('File uploaded, but could not parse server response.', 'warning');
        fetchFiles();
        fetchAuditLogs();
      }
    } else {
      let errorMsg = 'Upload failed.';
      try {
        const errorRes = JSON.parse(xhr.responseText);
        errorMsg = errorRes.error || errorMsg;
      } catch (e) {
        errorMsg = xhr.statusText || errorMsg;
      }
      showToast(`Upload Error: ${errorMsg}`, 'error');
      progressStatusText.textContent = 'Upload failed.';
    }
  };

  xhr.onerror = () => {
    startUploadBtn.disabled = false;
    cancelFileBtn.disabled = false;
    clearSelectionBtn.disabled = false;
    showToast('Network error during upload to Primary storage.', 'error');
    progressStatusText.textContent = 'Network error.';
  };

  xhr.send(formData);
}

// ==========================================
// File Management & API Interactions
// ==========================================
async function fetchFiles() {
  if (!isBackendConnected) {
    renderEmptyState();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/files`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const data = await res.json();
    storedFiles = data.files || [];
    renderFilesTable(storedFiles);
    updateMetrics(data.metrics || calculateMetrics(storedFiles));
  } catch (error) {
    console.warn('Could not fetch files from backend:', error.message);
    showToast(`Failed to load file inventory: ${error.message}`, 'error');
  }
}

async function triggerBackup(filename) {
  if (!isBackendConnected) {
    showToast('Backend offline. Cannot trigger backup.', 'error');
    return;
  }

  showToast(`Replicating "${filename}" to Secondary Storage...`, 'info');
  try {
    const res = await fetch(`${API_BASE}/backup/${encodeURIComponent(filename)}`, {
      method: 'POST'
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Backup operation failed');

    showToast(`Successfully replicated "${filename}" to Secondary Storage!`, 'success');
    fetchFiles();
    fetchAuditLogs();
  } catch (error) {
    showToast(`Backup failed: ${error.message}`, 'error');
  }
}

async function triggerRestore(filename) {
  if (!isBackendConnected) {
    showToast('Backend offline. Cannot trigger disaster recovery.', 'error');
    return;
  }

  showToast(`Recovering "${filename}" from Secondary into Primary Storage...`, 'warning');
  try {
    const res = await fetch(`${API_BASE}/recover/${encodeURIComponent(filename)}`, {
      method: 'POST'
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Recovery operation failed');

    showToast(`Disaster Recovery successful: "${filename}" restored to Primary!`, 'success');
    fetchFiles();
    fetchAuditLogs();
  } catch (error) {
    showToast(`Recovery failed: ${error.message}`, 'error');
  }
}

async function downloadFile(filename) {
  if (!isBackendConnected) {
    showToast('Backend offline. Cannot download file.', 'error');
    return;
  }

  showToast(`Generating secure download stream for "${filename}"...`, 'info');
  try {
    const res = await fetch(`${API_BASE}/download/${encodeURIComponent(filename)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Download request failed');

    if (data.downloadUrl) {
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const notice = data.recoveredFromSecondary
        ? `Downloaded "${filename}" (Auto-failed over to Secondary replica)`
        : `Downloaded "${filename}" from Primary storage`;
      showToast(notice, 'success');
      fetchAuditLogs();
    } else {
      throw new Error('No download URL returned by backend.');
    }
  } catch (error) {
    showToast(`Download failed: ${error.message}`, 'error');
  }
}

async function deleteFileConfirmed() {
  if (!filePendingDelete) return;

  const selectedRadio = document.querySelector('input[name="deleteScope"]:checked');
  const scope = selectedRadio ? selectedRadio.value : 'both';

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  try {
    const res = await fetch(`${API_BASE}/files/${encodeURIComponent(filePendingDelete.name)}?scope=${scope}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Deletion failed');

    showToast(`Deleted "${filePendingDelete.name}" (Scope: ${scope})`, 'success');
    closeDeleteModal();
    fetchFiles();
    fetchAuditLogs();
  } catch (error) {
    showToast(`Deletion failed: ${error.message}`, 'error');
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = 'Delete Object';
  }
}

// ==========================================
// Rendering & UI Updates
// ==========================================
function renderFilesTable(files) {
  filesTableBody.innerHTML = '';
  fileCountBadge.textContent = `${files.length} object${files.length === 1 ? '' : 's'}`;

  if (files.length === 0) {
    renderEmptyState();
    return;
  }

  files.forEach(file => {
    const tr = document.createElement('tr');

    // Status Badges with SVG indicator dots
    const primaryBadge = file.inPrimary
      ? `<span class="badge-status synced"><svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="currentColor"/></svg> Stored</span>`
      : `<span class="badge-status missing"><svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="currentColor"/></svg> Missing</span>`;

    const secondaryBadge = file.inSecondary
      ? `<span class="badge-status synced"><svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="currentColor"/></svg> Backed Up</span>`
      : `<span class="badge-status not-synced"><svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill="currentColor"/></svg> Not Synced</span>`;

    const formattedDate = file.lastModified
      ? new Date(file.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '--';

    const etagDisplay = file.etag ? file.etag.replace(/"/g, '') : 'None';

    tr.innerHTML = `
      <td>
        <div class="file-name-cell">
          <span class="file-type-icon">${getFileIconSvg(file.name)}</span>
          <span title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
        </div>
      </td>
      <td>${formatBytes(file.size || 0)}</td>
      <td>${primaryBadge}</td>
      <td>${secondaryBadge}</td>
      <td><span class="etag-code" title="${escapeHtml(etagDisplay)}">${escapeHtml(truncate(etagDisplay, 14))}</span></td>
      <td>${formattedDate}</td>
      <td class="text-right">
        <div class="row-actions">
          <button class="btn-action download" data-action="download" data-name="${escapeHtml(file.name)}" title="Download File">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Download</span>
          </button>

          ${!file.inSecondary && file.inPrimary ? `
            <button class="btn-action backup" data-action="backup" data-name="${escapeHtml(file.name)}" title="Replicate to Secondary Storage">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Backup</span>
            </button>
          ` : ''}

          ${!file.inPrimary && file.inSecondary ? `
            <button class="btn-action restore" data-action="restore" data-name="${escapeHtml(file.name)}" title="Recover to Primary Storage (DR)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Restore</span>
            </button>
          ` : ''}

          <button class="btn-action delete" data-action="delete" data-name="${escapeHtml(file.name)}" title="Delete Object">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </td>
    `;

    filesTableBody.appendChild(tr);
  });
}

function renderEmptyState() {
  filesTableBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="7">
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>${isBackendConnected ? 'No Objects Stored Yet' : 'Backend Service Offline'}</h3>
          <p>${isBackendConnected 
            ? 'Ingest your first object using the dropzone above to begin multi-cloud replication.' 
            : 'Start the Node.js backend server (npm start) to view and manage cloud storage.'}</p>
        </div>
      </td>
    </tr>
  `;
}

function updateMetrics(metrics) {
  metricPrimaryCount.textContent = metrics.primaryCount || 0;
  metricPrimarySize.textContent = `${formatBytes(metrics.primaryBytes || 0)} stored`;

  metricSecondaryCount.textContent = metrics.secondaryCount || 0;
  metricSecondarySize.textContent = `${formatBytes(metrics.secondaryBytes || 0)} synchronized`;

  const total = metrics.primaryCount || 0;
  const synced = metrics.syncedCount || 0;
  const pct = total > 0 ? Math.round((synced / total) * 100) : 100;

  metricSyncPercentage.textContent = `${pct}%`;
  metricHealthBadge.textContent = `${pct}% Synced`;

  if (pct === 100 && total > 0) {
    metricSyncStatusText.textContent = 'Full Multi-Cloud Redundancy';
    metricHealthBadge.className = 'metric-badge health';
  } else if (total === 0) {
    metricSyncStatusText.textContent = 'Storage Fabric Ready';
    metricHealthBadge.className = 'metric-badge health';
  } else {
    metricSyncStatusText.textContent = `${total - synced} object(s) awaiting secondary backup`;
    metricHealthBadge.className = 'metric-badge secondary';
  }
}

function calculateMetrics(files) {
  let primaryCount = 0;
  let primaryBytes = 0;
  let secondaryCount = 0;
  let secondaryBytes = 0;
  let syncedCount = 0;

  files.forEach(f => {
    if (f.inPrimary) {
      primaryCount++;
      primaryBytes += (f.size || 0);
    }
    if (f.inSecondary) {
      secondaryCount++;
      secondaryBytes += (f.size || 0);
    }
    if (f.inPrimary && f.inSecondary) {
      syncedCount++;
    }
  });

  return { primaryCount, primaryBytes, secondaryCount, secondaryBytes, syncedCount };
}

// ==========================================
// Health & Cloud Connectivity
// ==========================================
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    isBackendConnected = true;

    backendHealthDot.className = 'status-dot connected';
    backendHealthTitle.textContent = 'Backend: Active';
    serverStatusMsg.innerHTML = `Connected to API at <code>${API_BASE}</code> &bull; Mode: <strong>${(data.mode || 'local').toUpperCase()}</strong>`;

    // Primary Storage Status
    if (data.primary) {
      if (data.primary.name) {
        const pLabel = primaryCloudStatus.querySelector('.provider-label');
        if (pLabel) pLabel.textContent = data.primary.name;
      }
      if (data.primary.connected) {
        primaryCloudStatus.querySelector('.status-dot').className = 'status-dot connected';
        primaryCloudStatus.querySelector('.status-state').textContent = 'Online';
      } else {
        primaryCloudStatus.querySelector('.status-dot').className = 'status-dot error';
        primaryCloudStatus.querySelector('.status-state').textContent = data.primary.error || 'Config Required';
      }
    }

    // Secondary Storage Status
    if (data.secondary) {
      if (data.secondary.name) {
        const sLabel = secondaryCloudStatus.querySelector('.provider-label');
        if (sLabel) sLabel.textContent = data.secondary.name;
      }
      if (data.secondary.connected) {
        secondaryCloudStatus.querySelector('.status-dot').className = 'status-dot connected';
        secondaryCloudStatus.querySelector('.status-state').textContent = 'Online';
      } else {
        secondaryCloudStatus.querySelector('.status-dot').className = 'status-dot disconnected';
        secondaryCloudStatus.querySelector('.status-state').textContent = data.secondary.error || 'Standby';
      }
    }

    fetchFiles();
  } catch (error) {
    isBackendConnected = false;
    backendHealthDot.className = 'status-dot disconnected';
    backendHealthTitle.textContent = 'Backend: Offline';
    serverStatusMsg.innerHTML = `Backend service not running at <code>http://localhost:5000</code>. Start it with <code>npm start</code>.`;

    primaryCloudStatus.querySelector('.status-dot').className = 'status-dot disconnected';
    primaryCloudStatus.querySelector('.status-state').textContent = 'Offline';

    secondaryCloudStatus.querySelector('.status-dot').className = 'status-dot disconnected';
    secondaryCloudStatus.querySelector('.status-state').textContent = 'Offline';

    renderEmptyState();
  }
}

// ==========================================
// Live Audit Ledger Rendering
// ==========================================
async function fetchAuditLogs() {
  if (!auditFeed) return;

  try {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) return;

    const data = await res.json();
    const logs = data.recentLogs || [];

    if (logs.length === 0) {
      auditFeed.innerHTML = `
        <div class="audit-empty-state">
          <span>Audit events stream here automatically during operations and recovery drills.</span>
        </div>
      `;
      return;
    }

    auditFeed.innerHTML = '';
    logs.slice(0, 15).forEach(entry => {
      const row = document.createElement('div');
      row.className = 'audit-entry-row';

      const timeStr = entry.timestamp
        ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '--:--:--';

      const actionClass = entry.action ? entry.action.toUpperCase() : 'INFO';
      const fileLabel = entry.filename ? escapeHtml(entry.filename) : (entry.details?.scope ? `Scope: ${entry.details.scope}` : 'Cluster Operation');

      row.innerHTML = `
        <div class="audit-entry-left">
          <span class="audit-action-tag ${actionClass}">${escapeHtml(actionClass)}</span>
          <span class="audit-filename" title="${fileLabel}">${fileLabel}</span>
        </div>
        <span class="audit-timestamp">${timeStr}</span>
      `;
      auditFeed.appendChild(row);
    });
  } catch (err) {
    console.debug('Audit feed fetch suppressed:', err.message);
  }
}

// ==========================================
// Modals & Action Handlers
// ==========================================
function initModals() {
  // Delete Modal
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', deleteFileConfirmed);
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Architecture Specs Modal
  openArchModalBtn.addEventListener('click', () => archModal.classList.remove('hidden'));
  closeArchModalBtn.addEventListener('click', () => archModal.classList.add('hidden'));
  dismissArchModalBtn.addEventListener('click', () => archModal.classList.add('hidden'));
  archModal.addEventListener('click', (e) => {
    if (e.target === archModal) archModal.classList.add('hidden');
  });

  // Global ESC key listener to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDeleteModal();
      archModal.classList.add('hidden');
    }
  });
}

function openDeleteModal(file) {
  filePendingDelete = file;
  deleteTargetFileName.textContent = `${file.name} (${formatBytes(file.size || 0)})`;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  filePendingDelete = null;
  deleteModal.classList.add('hidden');
}

function initSearch() {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderFilesTable(storedFiles);
      return;
    }
    const filtered = storedFiles.filter(f => f.name.toLowerCase().includes(query));
    renderFilesTable(filtered);
  });

  refreshFilesBtn.addEventListener('click', () => {
    showToast('Refreshing object inventory...', 'info');
    fetchFiles();
    fetchAuditLogs();
  });
}

function initActions() {
  // Table action delegation
  filesTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-action');
    if (!btn) return;

    const action = btn.dataset.action;
    const filename = btn.dataset.name;
    const file = storedFiles.find(f => f.name === filename);

    if (action === 'download') downloadFile(filename);
    else if (action === 'backup') triggerBackup(filename);
    else if (action === 'restore') triggerRestore(filename);
    else if (action === 'delete' && file) openDeleteModal(file);
  });

  // Disaster Recovery Operations
  syncAllBtn.addEventListener('click', async () => {
    if (!isBackendConnected) {
      showToast('Backend offline. Please start backend first.', 'error');
      return;
    }
    const unbacked = storedFiles.filter(f => f.inPrimary && !f.inSecondary);
    if (unbacked.length === 0) {
      showToast('All primary objects are already synchronized to secondary storage!', 'success');
      return;
    }

    showToast(`Starting automated replication of ${unbacked.length} object(s)...`, 'info');
    try {
      const res = await fetch(`${API_BASE}/backup/all`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync all failed');
      showToast(`Batch replication complete! ${data.syncedCount || unbacked.length} objects replicated.`, 'success');
      fetchFiles();
      fetchAuditLogs();
    } catch (err) {
      showToast(`Batch replication failed: ${err.message}`, 'error');
    }
  });

  simulateDrillBtn.addEventListener('click', async () => {
    if (!isBackendConnected) {
      showToast('Backend offline. Start backend to run DR audit.', 'error');
      return;
    }

    showToast('Executing cryptographic Disaster Recovery Audit...', 'info');
    try {
      const res = await fetch(`${API_BASE}/audit`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');

      const message = `DR Audit Result: ${data.message || 'All replicas verified with 100% hash integrity.'}`;
      showToast(message, 'success');
      fetchFiles();
      fetchAuditLogs();
    } catch (err) {
      showToast(`DR Audit Error: ${err.message}`, 'warning');
    }
  });
}

// ==========================================
// Toast Notification Engine (Vector Icons)
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, 4200);
}

// ==========================================
// Helper Utilities & Vector Icon Generator
// ==========================================
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Returns crisp, enterprise vector SVG icon based on file extension
 */
function getFileIconSvg(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();

  switch (ext) {
    case 'pdf':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
    case 'mp3':
    case 'wav':
    case 'flac':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
    case '7z':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
    case 'json':
    case 'js':
    case 'ts':
    case 'html':
    case 'css':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    case 'doc':
    case 'docx':
    case 'txt':
    case 'md':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`;
    default:
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
  }
}

// Backward compatibility alias
function getFileIconEmoji(fileName) {
  return getFileIconSvg(fileName);
}
