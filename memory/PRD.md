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

1. **Ana Sayfa (Dashboard)** - Stats cards for all modules with navigation
2. **TOKİ Yönetimi** - Project CRUD, Ada/Parsel, Media, Documents, Videos, Map Layers
3. **e-İPAT Yönetimi** - Land parcel CRUD (İl, İlçe, Mahalle, Ada, Parsel, m2, İmar, Gelişim)
4. **Mega Projeler** - Manual mega projects + auto-mapped TOKİ projects
5. **Eğitim Yönetimi** - Courses and Seminars CRUD with tabs
6. **Topluluk Yönetimi** - Community post management
7. **Arsa Fırsatları** - Investment opportunities (potential, risk, price)
8. **Piyasa Analizi** - Market data (avg price/m2, change %)

### Features:
- Admin login with JWT
- Excel import for bulk ada/parsel upload
- Cloud file storage (Emergent Object Storage)
- Media categories: Altyapı, Blok Resimleri, Peyzaj, Zemin, Drone, Master Plan
- Document types: Zemin Etüt, Jeoloji, ÇED, İhale, Plan Notları, Vaziyet Planı, Diğer
- Map layers: KML, KMZ, GeoJSON
- YouTube video embed
- Collapsible sidebar navigation

## User-Facing Pages (Complete)
- **Dashboard** - Module cards with navigation
- **TOKİ Search** - City/project dropdowns, project cards
- **Project Detail** - 6 tabs: Genel Bilgi, Ada/Parsel, Harita, Galeri, Videolar, Belgeler
- **Investment Calculator** - ROI simulation
- **Mega Projects Map** - Leaflet/OpenStreetMap
- Placeholder pages for remaining modules

## Credentials
- Admin: ipatarazi@gmail.com / As537273

## Backlog
- P1: Dependent İlçe dropdown in search
- P1: e-İPAT module integration from GitHub
- P2: User-facing pages for Land Parcels, Education, Community, Opportunities, Market
- P2: Backend modularization (split server.py into routers)
