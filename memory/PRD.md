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

## User Management (Admin) - Feb 2026
- Admin panel "Kullanıcılar" sayfası (sidebar'da UserCog ikonu)
- Tablo: Ad Soyad, Email/Telefon, Rol, Plan, Durum, Son Giriş + arama + 3 filtre (Rol/Plan/Durum)
- Sağdan açılan drawer (UserDrawer) - 5 sekme:
  - **Özet**: Ad, Telefon, Rol düzenleme + hızlı aksiyon (Aktif/Pasif/Ban/Oturum Sonlandır)
  - **Üyelik**: Free/Pro/Yıllık plan, başlangıç/bitiş tarihi, uzatma (gün bazlı)
  - **Yetkiler**: 9 modül × 4 yetki seviyesi (none/view/edit/admin)
  - **Aktivite**: Giriş ve durum değişikliği logları (pagination)
  - **Notlar**: Admin notu + etiketler
- Kaydetmeden çıkma uyarısı (isDirty kontrolü)
- Backend endpoints: GET/PUT /api/admin/app-users/* (7 endpoint)

- Shared `LoginRequiredModal` component in `/components/LoginRequiredModal.js`
- TOKİ, Arazi ve Yatırım Simülatörü sayfalarında arama/hesaplama yapılırken giriş kontrolü
- Giriş yapılmamışsa modal çıkar: "Giriş Yap" + "Ücretsiz Kayıt Ol" butonları

## Education Page Redesign (Complete) - Feb 2026
- **Hero**: Koyu yeşil (#0a1f14) arka plan, altın "Profesyonel" text, 4 istatistik
- **Section 1**: 4 Ücretsiz Seminer kartı (Muhammet Özdemir), krem arka plan, yeşil badge
- **Section 2**: 5 Ücretli Eğitim kartı, Masterclass dark style, yıldızlar + seviye + fiyat
- **Section 3**: Haftalık Canlı Online Eğitim, 4 özellik kutusu
- **Section 4**: Arsa Yatırımcı Topluluğu, 4 kanal (#Yenişehir, #Arnavutköy, #Kanal İstanbul, #Yatırım Fırsatları)
- Tüm CTA giriş kontrolü (LoginRequiredModal)


## Credentials
- Admin: ipatarazi@gmail.com / As537273
- Test user: testuser@test.com / Test1234!

## Backlog
- P1: Dependent İlçe dropdown in TOKI search (city → district)
- P1: e-İPAT module from GitHub
- P2: User-facing pages for each module
- P2: Backend modularization (split server.py into routers)
