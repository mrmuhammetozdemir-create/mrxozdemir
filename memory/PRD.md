# PropTech Turkey - PRD

## Original Problem Statement
Modern PropTech web platform for real estate and land investment analysis in Turkey. UI in Turkish, mobile-friendly, inspired by Turkish super-apps.

## Core Modules
1. **TOKI Housing Analysis** - Search and analyze TOKI projects ✅
2. **Land Parcel Analysis (e-İPAT)** - Search and analyze land parcels (placeholder)
3. **Investment Calculator** - Simulate real estate investment ROI ✅
4. **Mega Project Map** - Interactive map with infrastructure projects ✅
5. **Education Platform** - Video courses and seminars (placeholder)
6. **Community & Network** - Discussion forums (placeholder)
7. **Land Opportunities** - Curated investment opportunities (placeholder)
8. **Market Analysis** - Market data, price trends (placeholder)

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **File Storage:** Emergent Object Storage (cloud)
- **Maps:** Leaflet.js + OpenStreetMap

## What's Been Implemented

### Admin Panel (Complete) - Feb 2026
- Admin login at `/admin` (email: ipatarazi@gmail.com)
- Project CRUD with expanded fields (type, housing counts, dates, progress)
- Ada (Block) management system - unlimited blocks per project
- Parsel (Parcel) management - unlimited parcels per block
- Excel Import for bulk ada/parsel upload (XLSX/XLS/CSV)
- Excel template download
- Media upload with 6 categories (Altyapı, Blok Resimleri, Peyzaj, Zemin, Drone, Master Plan)
- YouTube video link management
- Document upload with 7 types (Zemin Etüt, Jeoloji, ÇED, İhale, Plan Notları, Vaziyet Planı, Diğer)
- Map layer upload (KML/KMZ/GeoJSON)
- Cloud storage via Emergent Object Storage

### User-Facing Project Detail Page (Complete) - Feb 2026
- 6 tabbed sections: Genel Bilgi, Ada/Parsel, Harita, Galeri, Videolar, Belgeler
- Project statistics cards (Konut, Ticari, Okul, Cami, Sosyal Tesis)
- Construction progress bar with dates
- Interactive map with GeoJSON overlay support
- Image gallery with category filtering and lightbox
- YouTube video embed player
- Document viewer with external link

### Dashboard ✅
- Module cards with navigation
- Feature cards with images

### TOKİ Search Page ✅
- City/district/project name dropdowns
- Project card grid with navigation

## Key API Endpoints
- `POST /api/auth/login` - Admin login
- `GET/POST /api/admin/projects` - Project CRUD
- `PUT/DELETE /api/admin/projects/{id}` - Update/delete project
- `GET/POST /api/admin/projects/{id}/adas` - Ada management
- `GET/POST /api/admin/adas/{id}/parsels` - Parsel management
- `POST /api/admin/projects/{id}/import-excel` - Bulk import
- `GET /api/admin/excel-template` - Download template
- `POST /api/admin/projects/{id}/media` - Upload media
- `POST /api/admin/projects/{id}/documents` - Upload documents
- `POST /api/admin/projects/{id}/videos` - Add video
- `POST /api/admin/projects/{id}/map-layers` - Upload map layer
- `GET /api/files/{path}` - Serve uploaded files
- `GET /api/projects` - List all projects (public)
- `GET /api/projects/{id}` - Project detail (public)
- `GET /api/toki/projects` - Backward compatible TOKI endpoint

## Database Collections
- `users` - Admin users
- `projects` - Project data with all fields
- `project_adas` - Ada (block) records
- `project_parsels` - Parsel records
- `project_media` - Media file references
- `project_documents` - Document file references
- `project_map_layers` - Map layer file references
- `toki_projects` - Legacy TOKI projects (backward compat)

## Credentials
- Admin: ipatarazi@gmail.com / As537273

## Backlog (P1/P2)
- P1: Dependent İlçe dropdown in search
- P1: e-İPAT module integration from GitHub
- P2: Land Parcel Analysis module
- P2: Education Platform module
- P2: Community & Network module
- P2: Land Opportunities module
- P2: Market Analysis module
- P2: Backend modularization (split server.py into routers)
