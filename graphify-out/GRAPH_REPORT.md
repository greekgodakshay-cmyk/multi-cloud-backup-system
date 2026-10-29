# Graph Report - multi-cloud-backup-system  (2026-10-29)

## Corpus Check
- 117 files · ~61,819 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1283 nodes · 1317 edges · 124 communities (106 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- GSD-STYLE.md
- GSD Planner Agent
- script.js
- sanitizeFilename
- GSD Executor Agent
- GSD Runbook
- GSD Debugger Agent
- StorageProvider
- /map Workflow
- Verification Process
- /plan Workflow
- package.json
- GSD Plan Checker Agent
- Token Optimization Guide
- /execute Workflow
- 2c. Action: Close
- /verify Workflow
- Context Fetch Skill
- Token Budget Skill
- Analysis Domains
- Context Compressor Skill
- LocalStorageProvider.js
- Sprint {N} — {Sprint Name}
- /debug Workflow
- Context Health Monitor
- fetchFiles
- /new-project Workflow
- Empirical Validation
- phase_recommendations
- PROJECT_RULES.md — GSD Canonical Rules
- Example: Add User Authentication
- Session: YYYY-MM-DD HH:MM
- Technology Stack
- capabilities
- validate-all.sh script
- server.js
- /complete-milestone Workflow
- Phase {N} Summary
- SPEC.md — Project Specification
- test-api.js
- /insert-phase Workflow
- /new-milestone Workflow
- /pause Workflow
- /remove-phase Workflow
- /research-phase Workflow
- /web-search Workflow
- Cross-Platform Commands Reference
- Scenario: Building a Simple Todo API
- Gemini Adapter
- GPT & Open Source Models Adapter
- /add-phase Workflow
- /plan-milestone-gaps Workflow
- /update Workflow
- Subagent Delegation Protocol
- Phased Execution Plan
- Architecture
- fast_coder
- Claude Adapter
- /audit-milestone Workflow
- /discuss-phase Workflow
- /install Workflow
- /resume Workflow
- 2. Component Architecture
- GSD Quick Reference Card
- /list-phase-assumptions Workflow
- SPEC.md — Multi-Cloud Backup System Specification
- User Setup Template
- reasoning
- standard
- handleFileSelection
- /add-todo Workflow
- /progress Workflow
- /whats-new Workflow
- gsd-debugger.md
- gsd-executor.md
- gsd-planner.md
- gsd-researcher.md
- gsd-verifier.md
- GSD Methodology — Mission Control Rules
- Project State
- Context Template
- Debug Template
- State Snapshot Template
- LocalStorageProvider
- /check-todos Workflow
- Discovery Template
- Milestone Template
- Project Template
- Roadmap Template
- State Template
- TODO.md — Pending Items
- Token Report Template
- UAT Template
- Token Efficiency Rules
- setup_search.sh script
- Backblaze B2 Integration Audit & Verification Report
- GPT Models
- DECISIONS.md — Architecture Decision Records
- PLAN.md Template
- Requirements Template
- Summary Template
- values
- S3StorageProvider
- RESEARCH.md Template
- VERIFICATION.md Template
- refactoring
- deleteFileConfirmed
- graphify.md
- help.md
- search_repo.sh script
- showToast
- auditLogger.js
- StorageProvider
- @aws-sdk/client-s3
- scripts

## God Nodes (most connected - your core abstractions)
1. `sanitizeFilename()` - 19 edges
2. `/plan Workflow` - 17 edges
3. `GSD Planner Agent` - 14 edges
4. `PROJECT_RULES.md — GSD Canonical Rules` - 14 edges
5. `fetchFiles()` - 13 edges
6. `LocalStorageProvider` - 13 edges
7. `/map Workflow` - 13 edges
8. `showToast()` - 12 edges
9. `S3StorageProvider` - 12 edges
10. `StorageManager` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Key Architectural Tenets` --references--> `StorageProvider`  [INFERRED]
  README.md → src/storage/StorageProvider.js
- `5. Security Findings and Remediation Status` --references--> `sanitizeFilename()`  [INFERRED]
  docs/BACKBLAZE_INTEGRATION_AUDIT.md → src/utils/security.js
- `6. Security & Guardrails` --references--> `sanitizeFilename()`  [INFERRED]
  README.md → src/utils/security.js
- `1. Initial Findings` --references--> `LocalStorageProvider`  [INFERRED]
  docs/BACKBLAZE_INTEGRATION_AUDIT.md → src/storage/LocalStorageProvider.js
- `1. Initial Findings` --references--> `S3StorageProvider`  [INFERRED]
  docs/BACKBLAZE_INTEGRATION_AUDIT.md → src/storage/S3StorageProvider.js

## Import Cycles
- None detected.

## Communities (124 total, 18 thin omitted)

### Community 0 - "GSD-STYLE.md"
Cohesion: 0.04
Nodes (45): Anti-Patterns, Capability Tiers, Code Implementation, Code Review, Debugging, GSD Model-Agnostic Principle, Model Selection Playbook, Model Switching Mid-Session (+37 more)

### Community 1 - "GSD Planner Agent"
Cohesion: 0.04
Nodes (46): `<action>`, Anti-Patterns to Avoid, Building Dependencies, Checklist Before Submitting Plans, Checkpoint Reached, Context Budget Rules, Dependency Graph, `<done>` (+38 more)

### Community 2 - "script.js"
Cohesion: 0.04
Nodes (44): archModal, auditFeed, backendHealthDot, backendHealthTitle, cancelDeleteBtn, cancelFileBtn, clearSelectionBtn, closeArchModalBtn (+36 more)

### Community 4 - "GSD Executor Agent"
Cohesion: 0.07
Nodes (29): Anti-Patterns, ✅ Atomic commits, Authentication Gates, Checkpoint Protocol, Checkpoint Return Format, Checkpoint Types, Confirm the commit landed, Continuation Handling (+21 more)

### Community 5 - "GSD Runbook"
Cohesion: 0.07
Nodes (28): 3-Strike Rule, Build Verification, Checklist Templates, "Commit failed", Common Issues, "Context degrading", Context Pollution Recovery, Debugging Procedures (+20 more)

### Community 6 - "GSD Debugger Agent"
Cohesion: 0.07
Nodes (27): 3-Strike Rule, Binary Search / Divide and Conquer, CHECKPOINT REACHED, Cognitive Biases to Avoid, Comment Out Everything, Core Philosophy, DEBUG.md Structure, Debugging Techniques (+19 more)

### Community 7 - "StorageProvider"
Cohesion: 0.12
Nodes (16): 1. System Architecture, 2. Storage Modes, 3. Quick Start Guide (Windows PowerShell), 4. Environment Configuration (`.env`), 5. API Reference, 6. Security & Guardrails, 7. College Project Demonstration Script, AWS S3 Configuration Example: (+8 more)

### Community 8 - "/map Workflow"
Cohesion: 0.07
Nodes (26): 0. Delegate the Mapping, 10. Offer Next Steps, 1. Validate Project, 2. Analyze Project Structure, 2a. Directory Analysis, 2b. Entry Points, 2c. Component Detection, 3. Analyze Dependencies (+18 more)

### Community 9 - "Verification Process"
Cohesion: 0.08
Nodes (24): API Route Stubs, Core Principle, GSD Verifier Agent, Level 1: Existence, Level 2: Substantive, Level 3: Wired, React Component Stubs, Step 0: Check for Previous Verification (+16 more)

### Community 10 - "/plan Workflow"
Cohesion: 0.08
Nodes (23): 10. Offer Next Steps, 1. Validate Environment (Planning Lock), 2. Parse and Normalize Arguments, 3. Validate Phase, 4. Ensure Phase Directory, 5. Handle Research, 6. Create Plans, 6a. Gather Context (+15 more)

### Community 11 - "package.json"
Cohesion: 0.12
Nodes (21): author, dependencies, @aws-sdk/s3-request-presigner@^3.758.0, cors@^2.8.5, dotenv@^16.4.7, express@^4.21.2, mime-types@^2.1.35, multer@^1.4.5-lts.1 (+13 more)

### Community 12 - "GSD Plan Checker Agent"
Cohesion: 0.10
Nodes (20): Checking Process, Dimension 1: Requirement Coverage, Dimension 2: Task Completeness, Dimension 3: Dependency Correctness, Dimension 4: Key Links Planned, Dimension 5: Scope Sanity, Dimension 6: Verification Derivation, GSD Plan Checker Agent (+12 more)

### Community 13 - "Token Optimization Guide"
Cohesion: 0.10
Nodes (20): After Each Wave, Anti-Patterns to Avoid, Before Starting Work, Budget Checkpoints, By Content Type, By File Size, During Execution, Integration with GSD (+12 more)

### Community 14 - "/execute Workflow"
Cohesion: 0.10
Nodes (19): 10. Offer Next Steps, 1. Validate Environment, 2. Validate Phase Exists, 3. Ensure Phase Directory Exists, 4. Discover Plans, 5. Group Plans by Wave, 6. Execute Waves, 6a. Check Delegation Capability (+11 more)

### Community 15 - "2c. Action: Close"
Cohesion: 0.11
Nodes (18): 1. Parse Arguments, 2a. Action: New Sprint, 2b. Action: Status, 2c. Action: Close, Archive Sprint, Commit, Commit, Create Sprint File (+10 more)

### Community 16 - "/verify Workflow"
Cohesion: 0.11
Nodes (18): 0. Delegate to a Fresh Verifier, 1. Load Verification Context, 2. Extract Must-Haves, 3. Verify Each Must-Have, 3a. Determine Verification Method, 3b. Execute Verification, 3c. Record Evidence, 4. Create Verification Report (+10 more)

### Community 17 - "Context Fetch Skill"
Cohesion: 0.11
Nodes (18): Anti-Patterns, ❌ Broad Searches, Context Efficiency Metrics, Context Fetch Skill, Inputs, Integration with GSD, ❌ Loading Everything First, Outputs (+10 more)

### Community 18 - "Token Budget Skill"
Cohesion: 0.11
Nodes (18): 1. Progressive Loading, 2. Just-In-Time Loading, 3. Search Before Load, 4. Summarize & Compress, Anti-Patterns, At 50% Budget, At 70% Budget, Before Each Task (+10 more)

### Community 19 - "Analysis Domains"
Cohesion: 0.11
Nodes (17): 1. Structure Analysis, 2. Dependency Analysis, 3. Pattern Analysis, 4. Integration Analysis, 5. Technical Debt Analysis, Analysis Domains, ARCHITECTURE.md, Checklist (+9 more)

### Community 20 - "Context Compressor Skill"
Cohesion: 0.12
Nodes (16): Anti-Patterns, Automatic Compression Points, Compression Format Templates, Compression Strategies, Compression Triggers, Context Compressor Skill, Decompression Protocol, Diff Template (+8 more)

### Community 21 - "LocalStorageProvider.js"
Cohesion: 0.14
Nodes (8): fs, mime, path, { getSignedUrl }, mime, {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand
}, crypto, path

### Community 22 - "Sprint {N} — {Sprint Name}"
Cohesion: 0.13
Nodes (14): Action Items, Daily Log, Day 1 (YYYY-MM-DD), Day 2 (YYYY-MM-DD), Explicitly Excluded, Goal, Included, Retrospective (end of sprint) (+6 more)

### Community 23 - "/debug Workflow"
Cohesion: 0.14
Nodes (13): 1. Initialize Debug Session, 1b. Delegate to a Fresh Debugger, 2. Document Symptom, 3. Gather Evidence, 4. Form Hypotheses, 5. Test Hypotheses, 6. Apply Fix (If Root Cause Found), 7. Handle 3-Strike Rule (+5 more)

### Community 24 - "Context Health Monitor"
Cohesion: 0.14
Nodes (13): Auto-Save Protocol, Behavior Rules, Context Health Monitor, Integration, Purpose, Rule 1: The 3-Strike Rule, Rule 2: Circular Detection, Rule 3: Uncertainty Logging (+5 more)

### Community 25 - "fetchFiles"
Cohesion: 0.29
Nodes (10): calculateMetrics(), checkBackendHealth(), fetchFiles(), formatBytes(), initSearch(), openDeleteModal(), renderEmptyState(), renderFilesTable() (+2 more)

### Community 26 - "/new-project Workflow"
Cohesion: 0.15
Nodes (12): /new-project Workflow, Phase 10: Done, Phase 1: Setup, Phase 2: Brownfield Offer, Phase 3: Deep Questioning, Phase 4: Write SPEC.md, Phase 5: Research Decision, Phase 6: Define Requirements (+4 more)

### Community 27 - "Empirical Validation"
Cohesion: 0.15
Nodes (12): API Endpoint Verification, Before Marking Any Task "Done", Build Verification, Core Principle, Empirical Validation, Examples, Failure Handling, Forbidden Phrases (+4 more)

### Community 28 - "phase_recommendations"
Cohesion: 0.15
Nodes (13): preferred_profile, reason, preferred_profile, reason, phase_recommendations, debugging, implementation, planning (+5 more)

### Community 29 - "PROJECT_RULES.md — GSD Canonical Rules"
Cohesion: 0.15
Nodes (13): Commit Conventions, Context Management, Core Protocol, Delegation, Model Independence, PROJECT_RULES.md — GSD Canonical Rules, Proof Requirements, Quick Reference (+5 more)

### Community 30 - "Example: Add User Authentication"
Cohesion: 0.17
Nodes (11): 1. SPEC.md (Finalized), 2. ROADMAP.md (Phase Entry), 3. PLAN 1.1 (Wave 1), 4. Wave 1 Execution, 5. Wave 1 State Snapshot, 6. PLAN 1.2 (Wave 2), 7. Wave 2 Execution & Snapshot, 8. Verification (+3 more)

### Community 31 - "Session: YYYY-MM-DD HH:MM"
Cohesion: 0.17
Nodes (11): Accomplished, Accomplished, Blockers Encountered, Handoff Notes, JOURNAL.md — Session Log, Objective, Objective, Session: YYYY-MM-DD HH:MM (+3 more)

### Community 32 - "Technology Stack"
Cohesion: 0.17
Nodes (11): {Category 1}, {Category 2}, Configuration, Core Technologies, Dependencies, External Dependencies, File Size Inventory, Infrastructure (+3 more)

### Community 33 - "capabilities"
Cohesion: 0.17
Nodes (12): capabilities, long_context, speed_tier, thinking_mode, tools, benefits, description, description (+4 more)

### Community 34 - "validate-all.sh script"
Cohesion: 0.17
Nodes (6): validate-agents.sh script, validate-all.sh script, validate-encoding.sh script, validate-skills.sh script, validate-templates.sh script, validate-workflows.sh script

### Community 35 - "server.js"
Cohesion: 0.17
Nodes (9): app, cors, express, multer, path, server, upload, config (+1 more)

### Community 36 - "/complete-milestone Workflow"
Cohesion: 0.18
Nodes (10): 1. Verify All Phases Complete, 2. Run Final Verification, 3. Generate Milestone Summary, 4. Archive Current State, 5. Reset for Next Milestone, 5c. Refresh Architecture, 5d. Update Requirements, 6. Commit and Tag (+2 more)

### Community 37 - "Phase {N} Summary"
Cohesion: 0.18
Nodes (10): Commits, Deliverables, Lessons Learned, Next Steps, Objective, Phase {N} Summary, Plan {N}.1: {Plan Name}, Plan {N}.2: {Plan Name} (+2 more)

### Community 38 - "SPEC.md — Project Specification"
Cohesion: 0.18
Nodes (10): As a {user type}, As a {user type}, Constraints, Goals, Non-Goals (Out of Scope), SPEC.md — Project Specification, Success Criteria, Technical Requirements (Optional) (+2 more)

### Community 39 - "test-api.js"
Cohesion: 0.29
Nodes (7): createMultipartFormData(), fs, http, main(), path, request(), runTests()

### Community 40 - "/insert-phase Workflow"
Cohesion: 0.20
Nodes (9): 1. Parse Arguments, 2. Validate Position, 3. Gather Phase Information, 4. Renumber Existing Phases, 5. Insert New Phase, 6. Update STATE.md, 7. Commit, 8. Display Result (+1 more)

### Community 41 - "/new-milestone Workflow"
Cohesion: 0.20
Nodes (9): 1. Validate SPEC Exists, 2. Gather Milestone Information, 3. Generate Phase Breakdown, 4. Update ROADMAP.md, 5. Update STATE.md, 5b. Reset Session Files (if starting fresh), 6. Commit, 7. Offer Next Steps (+1 more)

### Community 42 - "/pause Workflow"
Cohesion: 0.20
Nodes (9): 1. Capture Current State, 2. Add Journal Entry, 3. Commit State, 4. Display Handoff, Auto-Save Protocol, Minimum Auto-Save Content, /pause Workflow, Proactive Auto-Save (Session Limit Protection) (+1 more)

### Community 43 - "/remove-phase Workflow"
Cohesion: 0.20
Nodes (9): 1. Validate Phase Exists, 2. Check Phase Status, 3. Check for Dependencies, 4. Confirm Removal, 5. Remove Phase, 6. Update STATE.md, 7. Commit, 8. Display Result (+1 more)

### Community 44 - "/research-phase Workflow"
Cohesion: 0.20
Nodes (9): 0. Delegate the Research, 1. Load Phase Context, 2. Identify Research Questions, 3. Conduct Research, 4. Generate RESEARCH.md, 5. Commit Research, 6. Offer Next Steps, Discovery Levels (+1 more)

### Community 45 - "/web-search Workflow"
Cohesion: 0.20
Nodes (9): 1. Formulate Query, 2. Execute Search, 3. Analyze Results, 4. Summarize Findings, 5. Offer Next Steps, Integration with GSD, Related, /web-search Workflow (+1 more)

### Community 46 - "Cross-Platform Commands Reference"
Cohesion: 0.20
Nodes (9): Common Operations, Cross-Platform Commands Reference, Environment Detection, /execute — Discover Plans, Git Operations (Same on Both), /map — Analyze Codebase, /plan — Check SPEC Status, /verify — Search TODOs (+1 more)

### Community 47 - "Scenario: Building a Simple Todo API"
Cohesion: 0.20
Nodes (9): GSD Workflow Example, Quick Commands Reference, Scenario: Building a Simple Todo API, Step 1: Define the Spec, Step 2: Map the Codebase (if existing), Step 3: Plan the Phases, Step 4: Execute the Phase, Step 5: Verify the Work (+1 more)

### Community 48 - "Gemini Adapter"
Cohesion: 0.22
Nodes (9): Anti-Patterns, Code Execution, Context Loading Pattern, Context Window Optimization, Flash vs Pro, Gemini Adapter, Grounding, Integration with .gemini/ (+1 more)

### Community 49 - "GPT & Open Source Models Adapter"
Cohesion: 0.22
Nodes (8): Anti-Patterns, General Guidance, GPT & Open Source Models Adapter, Local Deployment, Model-Specific Files, Open Source Models, Recommended Patterns, Shorter Context Strategies

### Community 50 - "/add-phase Workflow"
Cohesion: 0.22
Nodes (8): 1. Validate Roadmap Exists, 2. Determine Next Phase Number, 3. Gather Phase Information, 4. Add to ROADMAP.md, 5. Update STATE.md, 6. Commit, 7. Offer Next Steps, /add-phase Workflow

### Community 51 - "/plan-milestone-gaps Workflow"
Cohesion: 0.22
Nodes (8): 1. Load Gap Information, 2. Categorize Gaps, 3. Create Gap Closure Phase, 4. Create PLAN.md for Each Gap, 5. Update STATE.md, 6. Commit Plans, 7. Offer Execution, /plan-milestone-gaps Workflow

### Community 52 - "/update Workflow"
Cohesion: 0.22
Nodes (8): 1. Check Current Version, 2. Fetch Latest from GitHub, 3. Compare Versions, 4. Show Changes, 5. Apply Updates, 6. Cleanup, 7. Confirm, /update Workflow

### Community 53 - "Subagent Delegation Protocol"
Cohesion: 0.22
Nodes (8): Handling Results, Inline Fallback, Invocation, Requirements, Subagent Delegation Protocol, Tool Grants, What to Delegate, Workspace Isolation

### Community 54 - "Phased Execution Plan"
Cohesion: 0.22
Nodes (8): Multi-Cloud Backup System Roadmap, Must-Haves (from SPEC.md), Phase 1: Architecture Specification, Security Baseline & API Contract, Phase 2: Secure Backend Core & Presigned URL Ingest Engine, Phase 3: Secondary Storage & Async Replication Worker, Phase 4: Disaster Recovery, Health Monitoring & Failure Drill Simulation, Phase 5: Infrastructure as Code & Production Readiness Gate, Phased Execution Plan

### Community 55 - "Architecture"
Cohesion: 0.22
Nodes (8): Architecture, Component A, Component B, Components, Conventions, Data Flow, Overview, Technical Debt

### Community 56 - "fast_coder"
Cohesion: 0.22
Nodes (8): best_for, examples, long_context, speed_tier, thinking_mode, tools, profiles, fast_coder

### Community 57 - "Claude Adapter"
Cohesion: 0.25
Nodes (7): Anti-Patterns, Artifacts Mode, Claude Adapter, Context Optimization, Effort Levels, Extended Thinking Mode, File Conventions

### Community 58 - "/audit-milestone Workflow"
Cohesion: 0.25
Nodes (7): 1. Load Milestone Context, 2. Check Must-Haves Verification, 3. Review Technical Debt, 4. Analyze Phase Quality, 5. Generate Audit Report, 6. Offer Actions, /audit-milestone Workflow

### Community 59 - "/discuss-phase Workflow"
Cohesion: 0.25
Nodes (7): 1. Load Phase Context, 2. Analyze Requirements, 3. Present Discussion Points, 4. Gather User Input, 5. Document Decisions, 6. Offer Next Steps, /discuss-phase Workflow

### Community 60 - "/install Workflow"
Cohesion: 0.25
Nodes (7): 1. Check for Existing Installation, 2. Clone from GitHub, 3. Copy Files, 4. Cleanup, 5. Add to .gitignore (Optional), 6. Confirm Installation, /install Workflow

### Community 61 - "/resume Workflow"
Cohesion: 0.25
Nodes (7): 1. Load Saved State, 2. Display Context, 3. Load Recent Journal, 4. Check for Conflicts, 5. Update State, 6. Suggest Action, /resume Workflow

### Community 62 - "2. Component Architecture"
Cohesion: 0.25
Nodes (7): 1. High-Level Overview, 2. Component Architecture, 3. Security & Threat Modeling, A. Frontend Layer (Existing & Preserved), B. Backend API Gateway (To be implemented in Phase 2), C. Cloud Storage Layer, System Architecture: Multi-Cloud Backup System

### Community 63 - "GSD Quick Reference Card"
Cohesion: 0.25
Nodes (7): All Commands, Core Rules, GSD Quick Reference Card, Key Files, Priority Indicators, Workflow Lifecycle, XML Task Structure

### Community 64 - "/list-phase-assumptions Workflow"
Cohesion: 0.29
Nodes (6): 1. Load Phase Plans, 2. Extract Assumptions, 3. Categorize Assumptions, 4. Display Assumptions, 5. Offer Validation, /list-phase-assumptions Workflow

### Community 65 - "SPEC.md — Multi-Cloud Backup System Specification"
Cohesion: 0.29
Nodes (6): 1. Vision & Architecture Overview, 2. Core Goals, 3. Non-Goals (Out of Scope), 4. Technical Constraints & Policies, 5. Success Criteria, SPEC.md — Multi-Cloud Backup System Specification

### Community 66 - "User Setup Template"
Cohesion: 0.29
Nodes (6): 2. {Another Service}, Dashboard Configuration, File Template, User Setup Template, Verification Checklist, When Complete

### Community 67 - "reasoning"
Cohesion: 0.29
Nodes (7): reasoning, best_for, examples, long_context, speed_tier, thinking_mode, tools

### Community 68 - "standard"
Cohesion: 0.29
Nodes (7): standard, best_for, examples, long_context, speed_tier, thinking_mode, tools

### Community 69 - "handleFileSelection"
Cohesion: 0.47
Nodes (6): clearSelectedFile(), getFileIconEmoji(), getFileIconSvg(), handleFileSelection(), handleUpload(), initDragAndDrop()

### Community 70 - "/add-todo Workflow"
Cohesion: 0.33
Nodes (5): 1. Parse Arguments, 2. Ensure TODO.md Exists, 3. Add Todo Item, 4. Confirm, /add-todo Workflow

### Community 71 - "/progress Workflow"
Cohesion: 0.33
Nodes (5): 1. Load Current State, 2. Calculate Progress, 3. Display Status, 4. Suggest Action, /progress Workflow

### Community 72 - "/whats-new Workflow"
Cohesion: 0.33
Nodes (5): 1. Read CHANGELOG.md, 2. Display Recent Changes, Related, /whats-new Workflow, Workflows

### Community 73 - "gsd-debugger.md"
Cohesion: 0.33
Nodes (5): Debugging Rules, Invocation Contract, Return Contract, Shell Discipline, System Prompt

### Community 74 - "gsd-executor.md"
Cohesion: 0.33
Nodes (5): Execution Rules, Invocation Contract, Return Contract, Shell Discipline, System Prompt

### Community 75 - "gsd-planner.md"
Cohesion: 0.33
Nodes (5): Invocation Contract, Planning Rules, Return Contract, Self-Check Before Returning, System Prompt

### Community 76 - "gsd-researcher.md"
Cohesion: 0.33
Nodes (5): Invocation Contract, Research Rules, Return Contract, Shell Discipline, System Prompt

### Community 77 - "gsd-verifier.md"
Cohesion: 0.33
Nodes (5): Invocation Contract, Return Contract, Shell Discipline, System Prompt, Verification Rules

### Community 78 - "GSD Methodology — Mission Control Rules"
Cohesion: 0.33
Nodes (6): Canonical Rules, Core Principles, Gemini-Specific Tips, GSD Methodology — Mission Control Rules, Quick Reference, Workflow Integration

### Community 79 - "Project State"
Cohesion: 0.33
Nodes (5): Accumulated Project Decisions, Blockers & Next Actions, Current Position, Progress Overview, Project State

### Community 80 - "Context Template"
Cohesion: 0.33
Nodes (5): Context Template, File Template, Guidelines, How to Use, When to Create

### Community 81 - "Debug Template"
Cohesion: 0.33
Nodes (5): Debug Template, File Template, Lifecycle, Resume Behavior, Section Rules

### Community 82 - "State Snapshot Template"
Cohesion: 0.33
Nodes (5): Integration with STATE.md, Minimal Snapshot (Debug Session), State Snapshot Template, Template, When to Use

### Community 84 - "/check-todos Workflow"
Cohesion: 0.40
Nodes (4): 1. Load TODO.md, 2. Parse and Filter, 3. Display, /check-todos Workflow

### Community 85 - "Discovery Template"
Cohesion: 0.40
Nodes (4): Discovery Template, File Template, Output Structure, When to Use

### Community 86 - "Milestone Template"
Cohesion: 0.40
Nodes (4): File Template, Guidelines, Lifecycle, Milestone Template

### Community 87 - "Project Template"
Cohesion: 0.40
Nodes (4): File Template, Guidelines, Project Template, Status Flow

### Community 88 - "Roadmap Template"
Cohesion: 0.40
Nodes (4): File Template, Guidelines, Roadmap Template, Status Icons

### Community 89 - "State Template"
Cohesion: 0.40
Nodes (4): File Template, Resume Protocol, State Template, Update Rules

### Community 90 - "TODO.md — Pending Items"
Cohesion: 0.40
Nodes (4): Format, Items, Priority Levels, TODO.md — Pending Items

### Community 91 - "Token Report Template"
Cohesion: 0.40
Nodes (4): Quick Report (Minimal), Template, Token Report Template, When to Create

### Community 92 - "UAT Template"
Cohesion: 0.40
Nodes (4): File Template, Test Case Guidelines, UAT Template, Usage Guidelines

### Community 93 - "Token Efficiency Rules"
Cohesion: 0.40
Nodes (5): Budget Thresholds, Compression Protocol, Loading Rules, Per-Wave Efficiency, Token Efficiency Rules

### Community 94 - "setup_search.sh script"
Cohesion: 0.70
Nodes (4): check_fd(), check_ripgrep(), setup_search.sh script, suggest_install()

### Community 95 - "Backblaze B2 Integration Audit & Verification Report"
Cohesion: 0.17
Nodes (11): 10. Required Manual Steps to Complete Integration, 11. Final Status, 2. Files Inspected, 4. Environment-Variable Names Actually Used by the Application, 5. Security Findings and Remediation Status, 6. Tests Executed and Actual Results, 7. Tests Not Executed and Why, 8. Whether Authentication Was Verified (+3 more)

### Community 96 - "GPT Models"
Cohesion: 0.50
Nodes (4): Context Optimization, Function Calling, GPT Models, Model Selection

### Community 97 - "DECISIONS.md — Architecture Decision Records"
Cohesion: 0.50
Nodes (3): Decisions, DECISIONS.md — Architecture Decision Records, Template

### Community 98 - "PLAN.md Template"
Cohesion: 0.50
Nodes (3): PLAN.md Template, Task Types, Wave Assignment

### Community 99 - "Requirements Template"
Cohesion: 0.50
Nodes (3): File Template, Guidelines, Requirements Template

### Community 100 - "Summary Template"
Cohesion: 0.50
Nodes (3): File Template, Guidelines, Summary Template

### Community 101 - "values"
Cohesion: 0.50
Nodes (4): values, fast, reasoning, standard

### Community 106 - "refactoring"
Cohesion: 0.67
Nodes (3): refactoring, preferred_profile, reason

### Community 107 - "deleteFileConfirmed"
Cohesion: 1.00
Nodes (3): closeDeleteModal(), deleteFileConfirmed(), initModals()

### Community 119 - "showToast"
Cohesion: 0.50
Nodes (8): downloadFile(), escapeHtml(), fetchAuditLogs(), initActions(), initTheme(), showToast(), triggerBackup(), triggerRestore()

### Community 120 - "auditLogger.js"
Cohesion: 0.20
Nodes (5): AUDIT_LOG_FILE, AuditLogger, fs, LOGS_DIR, path

### Community 122 - "@aws-sdk/client-s3"
Cohesion: 0.40
Nodes (3): @aws-sdk/client-s3@^3.758.0, @aws-sdk/client-s3, {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
}

### Community 123 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, dev, start, test, verify:b2

## Knowledge Gaps
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sanitizeFilename()` connect `sanitizeFilename` to `server.js`, `S3StorageProvider`, `StorageProvider`, `LocalStorageProvider`, `LocalStorageProvider.js`, `Backblaze B2 Integration Audit & Verification Report`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `sanitizeFilename()` (e.g. with `5. Security Findings and Remediation Status` and `6. Security & Guardrails`) actually correct?**
  _`sanitizeFilename()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `GSD-STYLE.md` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Why does `Backblaze B2 Integration Audit & Verification Report` connect `Backblaze B2 Integration Audit & Verification Report` to `StorageProvider`, `S3StorageProvider`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Should `GSD Planner Agent` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `GSD Executor Agent` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._