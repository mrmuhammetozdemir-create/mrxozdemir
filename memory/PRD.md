# PropTech Turkey - PRD

## Original Problem Statement
Modern PropTech web platform for real estate and land investment analysis in Turkey. UI in Turkish, mobile-friendly.

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **File Storage:** Emergent Object Storage (cloud)
- **Maps:** Leaflet.js + OpenStreetMap

## Admin Panel (Complete) - Feb/Mar 2026
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

## Credentials
- Admin: ipatarazi@gmail.com / As537273

## Backlog
- P1: Dependent İlçe dropdown in search
- P1: e-İPAT module from GitHub
- P2: User-facing pages for each module
- P2: Backend modularization
