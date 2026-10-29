---
milestone: multi-cloud-backup-system
version: 1.0.0
updated: 2026-10-28T19:48:00+05:30
---

# Multi-Cloud Backup System Roadmap

> **Current Status:** `PLANNING` — Phased Plan Established
> **Target Runtimes:** Node.js v24+, Cloudflare R2, Backblaze B2, Google Antigravity
> **Guiding Principle:** Spec-Driven Development via GSD. Zero code without verified plan; mandatory verification and human approval checkpoints.

---

## Must-Haves (from SPEC.md)

- [ ] Zero secrets in client-side code; 100% presigned URL workflow.
- [ ] Automated replication from Primary (R2) to Secondary (B2).
- [ ] Integrity verification via ETags/hashes across both clouds.
- [ ] One-click disaster recovery drill with automated fallback download.
- [ ] Human approval gate before live infrastructure provisioning or destructive actions.

---

## Phased Execution Plan

### Phase 1: Architecture Specification, Security Baseline & API Contract
**Status:** 🔄 In Progress  
**Objective:** Formalize the system architecture, lock the API contract expected by `script.js`, establish threat model, and configure local secret hygiene.  
**Requirements:** REQ-01, REQ-02, REQ-03  
**Dependencies:** None  

**Implementation Tasks:**
- Task 1.1: Document exact request/response schemas for `/api/health`, `/api/files`, `/api/upload`, `/api/sync`, `/api/drill`, `/api/files/:fileName`, and `/api/files/:fileName/verify`.
- Task 1.2: Audit `index.html` and `script.js` to confirm all DOM hooks, event listeners, and API expectations are documented.
- Task 1.3: Create `.env.example` defining required credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `B2_ENDPOINT`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`).
- Task 1.4: Configure `.gitignore` to prevent committing `.env`, credentials, or temporary files.

**Verification Criteria:**
- OpenAPI / JSON schema validation for all endpoints.
- Static security verification that no secrets or API keys are present in repository files.
- Human review and approval of the API baseline before server construction.

---

### Phase 2: Secure Backend Core & Presigned URL Ingest Engine
**Status:** ⬜ Not Started  
**Objective:** Build the Node.js Express server (`localhost:5000/api`) with Cloudflare R2 S3 SDK client, presigned URL generator, and health monitor.  
**Requirements:** REQ-04, REQ-05, REQ-06, REQ-07  
**Dependencies:** Phase 1  

**Implementation Tasks:**
- Task 2.1: Initialize server package configuration (`package.json`) with dependencies: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `express`, `cors`, `dotenv`.
- Task 2.2: Implement Cloudflare R2 S3 client with endpoint `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`.
- Task 2.3: Implement `/api/health` returning live status and bucket connection indicators.
- Task 2.4: Implement `/api/upload` endpoint generating presigned `PUT` URLs with 15-minute TTL and 50 MB size limit header.
- Task 2.5: Implement `/api/files` listing primary objects from Cloudflare R2 bucket.
- Task 2.6: Implement unit test suite covering presigned URL generation, validation, and error handling.

**Security & Cost Checks:**
- Ensure R2 bucket is private (public access disabled).
- Validate that uploads reject files exceeding 50 MB to prevent free-tier overrun.
- Verify CORS configuration permits only origin `http://localhost:*` or trusted domains.

**Verification Criteria:**
- Unit test suite passes with 100% coverage on core endpoints.
- Integration test verifies upload of a test object to R2 via presigned URL.
- Health endpoint returns HTTP 200 with R2 connected status.

---

### Phase 3: Secondary Storage & Async Replication Worker
**Status:** ⬜ Not Started  
**Objective:** Integrate Backblaze B2 as secondary replica, implement asynchronous replication pipeline, and verify byte-level checksums.  
**Requirements:** REQ-08, REQ-09, REQ-10  
**Dependencies:** Phase 2  

**Implementation Tasks:**
- Task 3.1: Implement Backblaze B2 S3-compatible client (`https://s3.<region>.backblazeb2.com`).
- Task 3.2: Create asynchronous replication worker that reads newly uploaded objects from R2 and streams them to B2.
- Task 3.3: Implement `/api/sync` triggering manual bulk synchronization of un-replicated objects.
- Task 3.4: Implement `/api/files/:fileName/verify` computing and comparing ETags/MD5 hashes between R2 and B2.
- Task 3.5: Implement `/api/files/:fileName` delete endpoint with deletion propagation to both clouds.

**Security & Cost Checks:**
- Stream data directly in memory (pipe) without writing unencrypted temporary files to local disk.
- Apply batch pacing to prevent throttling or sudden egress costs.
- Enforce deletion confirmation check in backend.

**Verification Criteria:**
- Automated test verifies that an object uploaded to R2 appears in B2 within replication SLA.
- Checksum verification confirms 100% byte equivalence between primary and replica.
- Deletion test confirms synchronized cleanup across both cloud providers.

---

### Phase 4: Disaster Recovery, Health Monitoring & Failure Drill Simulation
**Status:** ⬜ Not Started  
**Objective:** Implement simulated failover drills, automated degradation routing to B2, and end-to-end dashboard integration.  
**Requirements:** REQ-11, REQ-12, REQ-13  
**Dependencies:** Phase 3  

**Implementation Tasks:**
- Task 4.1: Implement `/api/drill` endpoint allowing toggling simulated primary cloud outage.
- Task 4.2: Implement download fallback logic: if R2 is simulated down or unreachable, presigned download URLs are automatically minted from B2.
- Task 4.3: Implement live metrics calculation: primary object count/size, secondary count/size, replication sync percentage.
- Task 4.4: Wire up frontend `script.js` to live backend, verifying all pills, progress bars, table rows, and modals.
- Task 4.5: Build End-to-End browser test suite using Playwright MCP verifying full upload, sync, drill, and delete flow.

**Security & Cost Checks:**
- Verify that failover presigned URLs from B2 carry identical short-lived security constraints.
- Verify audit log captures drill execution and failover events.

**Verification Criteria:**
- Simulated outage test confirms download requests route seamlessly to B2 without downtime.
- Playwright E2E test runs headless and passes all UI interaction assertions.

---

### Phase 5: Infrastructure as Code & Production Readiness Gate
**Status:** ⬜ Not Started  
**Objective:** Provide reproducible Infrastructure-as-Code (Terraform / Wrangler) templates, automated CI checks, cost estimation model, and human sign-off checkpoint.  
**Requirements:** REQ-14, REQ-15, REQ-16, REQ-17  
**Dependencies:** Phase 4  

**Implementation Tasks:**
- Task 5.1: Create declarative Terraform / Wrangler templates for Cloudflare R2 bucket and Backblaze B2 bucket provisioning with least-privilege IAM policies.
- Task 5.2: Create GitHub Actions / CI pipeline configuration running automated linting, security scanning (Trivy / GitGuardian check), and unit tests.
- Task 5.3: Document multi-cloud cost model comparing monthly storage, operations, and egress under 10GB, 100GB, and 1TB workloads.
- Task 5.4: Formalize Human Approval Gate before any live cloud infrastructure application.

**Security, Safety & Approval Gate:**
- ⚠️ **HUMAN APPROVAL MANDATORY**: Antigravity agent will not run `terraform apply`, `wrangler r2 bucket create`, or cloud provisioning commands without explicit interactive user authorization.
- Zero secret credentials in version control.

**Verification Criteria:**
- `terraform plan` / `wrangler` configuration passes validation with zero errors.
- Pre-commit and CI scans report zero leaked secrets and zero critical vulnerabilities.
- User review and manual sign-off recorded.
