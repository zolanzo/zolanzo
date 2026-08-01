# ZOLANZO — Mobile-First Worker Experience Specification

**Date:** 2026-07-31  
**Phase:** Phase 5.5 — Mobile-First Worker Experience  
**Target Device Tier:** Low-to-Mid-Range Android Smartphones (2G/3G/4G Networks)  
**Target Benchmark:** Best Workforce Mobile Experience in Africa  

---

## Executive Overview

The **Worker Mobile Experience** provides an intuitive, high-performance, one-handed mobile application tailored for field workers across urban and rural markets in Africa. Designed with extreme hardware constraints in mind, it delivers offline resilience, low-bandwidth optimization, instant PWA caching, and transparent earnings trust.

---

## Mobile Worker Directory (18 Sections)

| Mobile Section | Core User Value | Mobile UX & Technical Optimization |
| --- | --- | --- |
| **1. Home** | Daily summary & quick start | Active task summary card, 1-tap claim CTA, earnings balance widget |
| **2. Nearby Opportunities** | GPS opportunity discovery radar | Map/List view toggle, distance radius slider (1–10km), payout badges |
| **3. Assignments** | Accepted task management | Active tasks filter, deadline countdown timer, step-by-step progress bar |
| **4. Task Details** | Task instructions & guidelines | Large legible typography, requirement checklist, location pin |
| **5. Navigation** | Turn-by-turn task site guidance | Deep-link to Google Maps / Waze, offline location fallback text |
| **6. Check-in** | Geofenced GPS location verification | 1-Tap Check-in button (48px+), GPS accuracy indicator, offline timestamping |
| **7. Evidence Upload** | Photo, video & text submission | Offline IndexedDB queueing, client WEBP compression, background retry |
| **8. Trust Passport** | Verification status & trust level | Visual Trust Gauge (0–100), verification checklist (ID, Selfie, Phone) |
| **9. Wallet** | Available earnings & cashout | Instant Paystack bank / Mobile Money withdrawal, transaction log |
| **10. Payments** | Payment receipts & payout status | Payout confirmation cards, transaction hash, bank status chip |
| **11. History** | Past completed task archive | Filters by Date/Earnings, task completion proof receipts |
| **12. Notifications** | Task alerts & earnings updates | Push notifications, in-app toast stack, 1-tap action links |
| **13. Messages** | Direct customer / support chat | Low-data text chat, voice note recording, photo attachments |
| **14. Support** | Instant help & issue escalation | FAQ accordion, 1-tap WhatsApp support escalation button |
| **15. Profile** | Worker identity & bio | Worker avatar upload, skills tags, completed task metrics |
| **16. Verification** | KYC identity verification wizard | ID document camera capture, liveness selfie check, verification status |
| **17. Achievements** | Gamified badges & streaks | Streak counter (e.g. 10 Tasks On-Time), milestone badges, rewards |
| **18. Learning** | Micro-certification courses | Interactive 1-minute video/quiz modules for premium task unlocks |

---

## Mobile Performance & Technical Architecture

### 1. Ergonomic Thumb-Zone Design (One-Handed Operation)

- **Bottom Action Bars**: All primary CTA buttons (`Check In`, `Claim Task`, `Submit Evidence`, `Cashout`) are anchored to the bottom 25% of the mobile screen within natural thumb reach.
- **Minimum Touch Targets**: All interactive elements (Buttons, Form inputs, Checkboxes, Icons) maintain a minimum target size of **48px × 48px** to prevent mis-taps on low-resolution displays.
- **Bottom Sheet Drawers**: Replace full-screen modals with fluid bottom-sheet sliders for filters, confirmation dialogs, and task details.

### 2. Low-Bandwidth Data & Image Optimization

- **Client WEBP Compression**: Images captured via camera are compressed on-device using HTML Canvas (`image/webp` quality 0.75, max dimension 800px) before queuing, reducing upload size by up to 85% (from 4MB to ~250KB).
- **JSON Payload Slimming**: API responses strip unused fields; responses are gzipped/brotli compressed.
- **Low-Data Mode**: Auto-detects 2G/3G network conditions (`navigator.connection.effectiveType`) and pauses auto-download of non-essential thumbnail images.

### 3. Offline-First Resilience (IndexedDB + Web Workers)

- **Offline Evidence Storage**: Submissions captured while offline are persisted in browser `IndexedDB`.
- **Background Sync Queue**: A background Web Worker monitors network availability (`navigator.onLine`) and automatically retries uploading queued evidence when connectivity is restored.
- **PWA Asset Caching**: Service Worker caches shell HTML, CSS tokens (`styles/tokens.css`), icons, and static Javascript bundles for offline app launch.

### 4. Progressive Skeleton Loaders

- **Zero Layout Shifts**: Shimmer skeleton blocks (`animate-pulse bg-muted/60`) mirror exact task card and balance layout dimensions during network fetches, eliminating visual jitter.
