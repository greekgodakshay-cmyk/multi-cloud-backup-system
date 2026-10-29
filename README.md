# Smilify Enterprise — Multi-Cloud Backup & Data Fabric

A full-stack, enterprise-grade **Multi-Cloud Object Storage, Replication, and Disaster Recovery System** designed for high availability, zero credential exposure, and cost-free evaluation. Inspired by Linear, Stripe, and Microsoft 365.

Built with **HTML5, CSS3, Vanilla JavaScript, Node.js, Express**, and the **AWS SDK for JavaScript v3** (`@aws-sdk/client-s3`).

---

## 1. System Architecture

```mermaid
flowchart TD
    User["Web Browser Dashboard (Port 5000)"]
    
    subgraph Host ["Application Server (Zero-Trust Tier)"]
        UI["Vanilla Web UI (index.html, style.css, script.js)"]
        API["Express API Server (server.js)"]
        Audit["Audit Logger (logs/audit.log)"]
        SM["Storage Manager (storageManager.js)"]
        Sec["Security & Sanitizer (security.js)"]
    end

    subgraph Primary_Target ["Primary Storage Domain"]
        LocalPri["Local Primary Directory (data/primary)"]
        R2["Cloudflare R2 (S3 Protocol / $0 Egress)"]
        AWSPri["AWS S3 Bucket (Primary)"]
    end

    subgraph Secondary_Target ["Secondary Storage Domain (Disaster Recovery)"]
        LocalSec["Local Secondary Replica (data/secondary)"]
        B2["Backblaze B2 (S3 Protocol / Free Tier)"]
        AWSSec["AWS S3 Bucket (Secondary)"]
    end

    User <-->|HTTP / REST| API
    API --> UI
    API --> Sec
    API --> Audit
    API --> SM
    
    SM -.->|Local Mode (Default)| LocalPri
    SM -.->|Local Mode (Default)| LocalSec
    SM -.->|Cloud Mode| R2
    SM -.->|Cloud Mode| B2
    SM -.->|AWS Mode| AWSPri
    SM -.->|AWS Mode| AWSSec
```

### Key Architectural Tenets
1. **Zero Credential Exposure:** Secret keys, account tokens, and cloud endpoints exist *only* in server-side environment variables (`.env`). The client never receives or stores storage credentials.
2. **Provider Abstraction:** All operations (Upload, Download, Replicate, Recover, Delete, List) go through a standardized `StorageProvider` interface. Switching between Local Mode, Cloudflare R2, AWS S3, or Backblaze B2 requires **zero frontend changes**.
3. **Honest Provider Verification:** The server performs live connection validation (`HeadBucket`/`ListObjectsV2`) and never reports a provider as connected unless verified.
4. **Disaster Recovery (DR) Failover:** If an object in Primary storage is corrupted or deleted, the download endpoint automatically falls back to the Secondary replica, and the recovery endpoint restores the file to Primary.

---

## 2. Storage Modes

| Mode | Target 1 (Primary) | Target 2 (Secondary) | Cost | Setup Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Local Mode (Default)** | `./data/primary/` | `./data/secondary/` | **$0.00** | **None** (runs out of the box, no cards, no accounts) |
| **Multi-Cloud Mode** | Cloudflare R2 | Backblaze B2 | **$0.00** | 10 GB free on R2 ($0 egress) + 10 GB free on B2 (no credit card required) |
| **AWS S3 Mode** | AWS S3 Bucket | Secondary S3 Bucket | AWS Free Tier | AWS Account & S3 Bucket policies |

---

## 3. Quick Start Guide (Windows PowerShell)

### Step 1: Open Terminal in Project Directory
Ensure you are in the workspace directory:
```powershell
cd "C:\Users\Akshay aravind .rv\OneDrive\Documents\multi-cloud-backup-system"
```

### Step 2: Install Dependencies
Install Express, Multer, AWS SDK v3, and supporting utilities:
```powershell
npm install
```

### Step 3: Run the Automated Test Suite
Verify that all 30 integration test cases pass:
```powershell
npm test
```

### Step 4: Start the Server
Launch the application:
```powershell
npm start
```
*The server will start on `http://localhost:5000`.*

### Step 5: Open the Web Dashboard
Open your web browser and navigate to:
```
http://localhost:5000
```

---

## 4. Environment Configuration (`.env`)

For **Local Mode**, no configuration is needed. The server automatically creates `./data/primary` and `./data/secondary` if they do not exist.

To connect real cloud providers:
1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Edit `.env` and configure your keys:

### Cloudflare R2 + Backblaze B2 Configuration Example:
```env
PORT=5000
STORAGE_MODE=cloud

# Cloudflare R2 (Primary)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=multi-cloud-primary-backup

# Backblaze B2 (Secondary Backup)
B2_KEY_ID=your_backblaze_key_id
B2_APPLICATION_KEY=your_backblaze_application_key
B2_BUCKET_NAME=multi-cloud-secondary-backup
B2_REGION=us-west-004
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com

# Safety Limits
MAX_FILE_SIZE_BYTES=52428800 # 50 MB
PRESIGNED_URL_TTL_SECONDS=900
```

### AWS S3 Configuration Example:
```env
PORT=5000
STORAGE_MODE=cloud

AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXUtn...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=my-primary-s3-bucket
```

---

## 5. API Reference

All endpoints return JSON responses and standard HTTP status codes (`200`, `201`, `400`, `404`, `413`, `500`, `503`).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Live connection verification of Primary and Secondary storage |
| `GET` | `/api/files` | Unified inventory of objects, sync status, and storage metrics |
| `POST` | `/api/upload` | Multipart file upload (`file` field). Enforces 50 MB limit |
| `GET` | `/api/download/:filename` | Resolves secure presigned download link or streaming route |
| `GET` | `/api/download/file/:filename` | Streams raw file attachment with safe headers (Local mode) |
| `DELETE` | `/api/files/:filename?scope=` | Deletes file with targeting: `scope=primary`, `secondary`, or `both` |
| `POST` | `/api/backup/:filename` | Replicates specified object from Primary to Secondary |
| `POST` | `/api/recover/:filename` | Restores missing object from Secondary to Primary (DR) |
| `POST` | `/api/backup/all` | Batch replicates all un-synchronized objects |
| `GET` | `/api/audit` | Audits redundancy, replica hashes, and returns recent audit events |

---

## 6. Security & Guardrails

1. **Path Traversal Protection:** Every filename parameter is passed through `sanitizeFilename()`. Sequences like `../`, `..\\`, absolute paths, null bytes (`\0`), and Windows reserved names (`CON`, `PRN`, `AUX`, `NUL`) are rejected with `400 Bad Request`.
2. **File Size Enforcement:** Uploads are strictly capped at 50 MB via Multer memory limits. Requests exceeding this threshold receive `413 Payload Too Large`.
3. **Safe Download Headers:** Streams set `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment`, and accurate MIME types.
4. **Append-Only Audit Logging:** All mutations (`UPLOAD`, `DOWNLOAD`, `BACKUP`, `RECOVER`, `DELETE`, `AUDIT`) are recorded to `logs/audit.log` (JSON Lines format) with timestamps and client IP.
5. **Git Protection:** `.gitignore` excludes `.env`, `node_modules/`, `data/`, and `logs/` to prevent sensitive credentials and uploaded files from being committed.

---

## 7. College Project Demonstration Script

When demonstrating this project to a professor or evaluator, follow this 5-step workflow:

1. **Demonstrate System Health (`/api/health`):**
   * Point out the status pills in the top-right corner.
   * Explain that status is not hardcoded; the server performs a live verification call to the storage provider.
2. **Upload an Object:**
   * Drag and drop a file (e.g. `report.pdf`) into the dropzone.
   * Show that it uploads directly to Primary storage with status `Stored` (Green) and `Not Synced` (Yellow) in Secondary.
3. **Execute Backup Replication:**
   * Click **Backup** next to the file.
   * Show that both clouds now display `Stored` and `Backed Up` with a 100% Replication Health badge.
4. **Simulate a Disaster Outage:**
   * Click **Delete**, choose **Delete from Primary Only**, and confirm.
   * Show that the object is marked `Missing` in Primary, but remains intact in Secondary.
   * Demonstrate **Download Failover**: Click **Download**; the backend automatically retrieves the file from Secondary backup.
5. **Execute Disaster Recovery (DR):**
   * Click **Restore**; the backend pulls the replica from Secondary and writes it back into Primary.
   * Click **Run DR Audit** to show that replica checksums match with 100% integrity.
   * Open the **Architecture** modal to review the zero-trust cloud security model.
