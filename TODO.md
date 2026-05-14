# TODO - Share Host Cloud App (RN + Cloud)

## Step 1 — Feasibility decision (done)
- [x] Confirm iOS 8 runtime must be supported (real devices).
- [x] Decide to use dual-track approach: legacy iOS client vs modern clients.

## Step 2 — Repo scaffold (after approval)
- [x] Create monorepo structure:
  - [x] `apps/mobile-modern/` (React Native modern)
  - [x] `apps/mobile-legacy-ios8/` (legacy iOS client)
  - [x] `packages/backend/` (API + auth + upload + share + signed URLs)
  - [x] `packages/shared/` (shared types/helpers)
  - [x] `infra/` (S3/CloudFront/video transcoding docs + env templates)

## Step 3 — Backend baseline
- [x] Initialize Fastify + Prisma + Redis in `packages/backend/`
- [x] Implement DB schema (Prisma models for users, folders, files, share links, upload sessions, roles)
- [x] Auth flow (register/login/refresh/logout + device/session tracking + Argon2)
- [x] Workspace/folder/file metadata + permission checks
- [x] Upload pipeline endpoints (multipart/chunk session init/parts/complete)
- [x] Signed URL endpoints (download + stream) with server-side validation
- [ ] Rate limiting + secure middleware

## Step 4 — Modern mobile baseline
- [x] Scaffold `apps/mobile-modern` (RN CLI + TS + Zustand + React Query + MMKV + Navigation)
- [x] Auth screens + token refresh (Infrastructure)
- [ ] Gallery/folder browsing + file viewer
- [ ] Signed URL download/playback integration
- [ ] Upload UI skeleton (chunked upload orchestration)
- [ ] Offline caching scaffold (local index + queued uploads)

## Step 5 — Legacy iOS 8 client baseline
- [x] Decide legacy stack + add minimal viewer/upload skeleton (Objective-C)
- [ ] Share link access + signed URL usage (download/playback)

## Step 6 — CI + local dev
- [ ] Add env templates
- [ ] Add dev scripts (backend start, mobile start/build)
- [ ] Add CI workflows (modern app + backend)

## Step 7 — End-to-end testing checklist
- [ ] Upload -> permissioned view -> signed URL download
- [ ] Share link access controls + expiry
- [ ] Video playback reliability (transcoding if necessary)

## Step 8 — Deployment & production hardening
- [ ] Docker Compose (backend + postgres + redis + minio dev)
- [ ] Nginx reverse proxy config
- [ ] Logging/monitoring + crash reporting scaffolds
- [ ] Background worker for thumbnails/transcoding (optional)

