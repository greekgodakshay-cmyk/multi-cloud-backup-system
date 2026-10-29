# SPEC.md — Multi-Cloud Backup System Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: System specifications and scope locked. Phase plans must conform to this specification.

---

## 1. Vision & Architecture Overview

The **Multi-Cloud Backup System** is a resilient, disaster-resilient object storage and replication platform that guarantees high availability and zero vendor lock-in by pairing **Cloudflare R2** (as primary storage with zero egress fees) with **Backblaze B2** (as secondary backup replica).

The system allows clients to upload files securely via pre-signed URLs directly to primary storage, triggers automated asynchronous replication to secondary storage, verifies cryptographic integrity (ETags/checksums) across cloud boundaries, and provides a single-pane-of-glass dashboard for monitoring replication health and executing disaster recovery drills.

---

## 2. Core Goals

1. **Zero Vendor Lock-in & Redundancy**: Dual-cloud object replication across distinct cloud infrastructures (Cloudflare R2 + Backblaze B2).
2. **Zero-Trust & Zero-Secrets Security**: Storage buckets are 100% private. All object ingest and retrieval use short-lived presigned URLs. No long-lived credentials or secret keys are ever exposed to the client or public network.
3. **Automated Asynchronous Replication**: Uploads to primary storage automatically queue a replication task to duplicate the object to secondary storage.
4. **Cryptographic Integrity Verification**: Multi-cloud reconciliation using content hashes and ETags to detect byte-level drift or synchronization failure.
5. **Disaster Recovery & Failover Drills**: Simulated failure modes enabling one-click failover to secondary replica without service interruption.
6. **Cost Optimization & Guardrails**: Capitalize on Cloudflare R2's zero egress fees for primary reads and Backblaze B2's low-cost archive pricing; enforce a 50 MB per-file safety ceiling for free-tier budget compliance.

---

## 3. Non-Goals (Out of Scope)

- **Arbitrary Cloud Providers**: Initial architecture strictly targets Cloudflare R2 and Backblaze B2 (S3-compatible APIs). AWS S3, GCP Cloud Storage, and Azure Blob are out of scope for Milestone 1.
- **Direct Public CDN Buckets**: No public bucket URLs.
- **Relational Metadata Database**: Initial phases use filesystem/JSON-backed state or direct bucket enumeration to keep the architecture lightweight and serverless-ready.
- **Multi-Gigabyte Streaming Chunks**: 50 MB per file limit prevents unexpected billing spikes in free tiers.

---

## 4. Technical Constraints & Policies

1. **Storage Protocol**: Standard AWS S3 SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) for cross-cloud compatibility.
2. **Security & Secrets**: All cloud credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`) are read strictly from local `.env` (never committed, ignored via `.gitignore`).
3. **Presigned URL Expiration**: Maximum TTL of 900 seconds (15 minutes).
4. **Human Approval Checkpoint**: Any destructive operation (e.g. bucket deletion, multi-file purge) or live cloud infrastructure provisioning requires explicit human approval.

---

## 5. Success Criteria

- [ ] Node.js Express backend on port 5000 matches all contracts expected by `script.js` (`/api/health`, `/api/files`, `/api/upload`, `/api/sync`, `/api/drill`, `/api/delete`).
- [ ] Direct file upload to Cloudflare R2 succeeds via presigned URL.
- [ ] Asynchronous worker replicates uploaded objects to Backblaze B2 with matching ETag.
- [ ] Dashboard displays accurate status pills (Cloudflare R2: Connected, Backblaze B2: Connected), object counts, and replication percentage.
- [ ] Disaster recovery drill simulation successfully routes client download requests to secondary replica.
- [ ] Comprehensive test suite (unit + integration + security scans) passes with 100% clean exit codes.
