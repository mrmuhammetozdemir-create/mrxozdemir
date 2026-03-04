# PropTech Turkey - PRD

## Original Problem Statement
Modern PropTech web platform for real estate and land investment analysis in Turkey. UI in Turkish, mobile-friendly.

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **File Storage:** Emergent Object Storage (cloud)
- **Maps:** Leaflet.js + OpenStreetMap
- **Auth:** JWT (admin) + Session tokens (users) + Emergent Google OAuth

## Admin Panel (Complete) - Feb 2026
Sidebar-based admin panel at `/admin` with 8 module pages:

1. **Ana Sayfa (Dashboard)** - Stats cards for all modules
2. **TOKİ Yönetimi** - Project CRUD, Ada/Parsel, Media, Documents, Videos, Map Layers + Excel Import
3. **e-İPAT Yönetimi** - Land parcel CRUD
4. **Mega Projeler** - Manual + auto-mapped TOKİ projects
5. **Eğitim Yönetimi** - Courses and Seminars
6. **Topluluk Yönetimi** - Community posts
7. **Arsa Fırsatları** - Investment opportunities
8. **Piyasa Analizi** - Market data

### Key Features:
- **Excel Import for Projects**: Bulk TOKİ project creation via XLSX/XLS/CSV (17 columns)
- **Excel Import for Ada/Parsel**: Bulk ada/parsel import per project
- **GeoJSON Map Preview**: Live map preview before uploading map layers (red=preview, blue=existing)
- Cloud file storage (Emergent Object Storage)
- Media categories (6), Document types (7), Map layers (KML/KMZ/GeoJSON)
- YouTube video embed, Project statistics, Progress bar

## User Authentication System (Complete) - Feb 2026
- `/auth` page with login + register modes (tabs: Abone Girişi / Partner Girişi)
- Email/password registration (`POST /api/auth/register`)
- Email/password login (`POST /api/auth/user-login`)
- Google social login (Emergent OAuth, redirects to `/auth/callback`)
- Session tokens stored in localStorage: `app_user`, `app_session_token`
- Dashboard shows user name after login, logout button clears session
- KVKK consent checkbox in registration

## Dashboard UI (Complete) - Feb 2026
- All text in Turkish (Yatırım Simülatörü, Mega Projeler Haritası, Eğitim Merkezi)
- Enlarged header + module icons (w-14 h-14)
- Compact feature cards (flex-[2] ratio)
- "Giriş Yap" → navigates to `/auth`

## Credentials
- Admin: ipatarazi@gmail.com / As537273
- Test user: testuser@test.com / Test1234!

## Backlog
- P1: Dependent İlçe dropdown in TOKI search (city → district)
- P1: e-İPAT module from GitHub
- P2: User-facing pages for each module
- P2: Backend modularization (split server.py into routers)
