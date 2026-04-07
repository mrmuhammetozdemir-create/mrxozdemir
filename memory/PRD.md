# PropTech Turkey - PRD

## Original Problem Statement
Modern PropTech web platform for real estate and land investment analysis in Turkey. UI in Turkish, mobile-friendly.

## Architecture
- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python) - monolithic server.py
- **Database:** MongoDB
- **File Storage:** Emergent Object Storage (cloud)
- **Maps:** Leaflet.js + OpenStreetMap
- **Auth:** JWT (admin) + Session tokens (users) + Emergent Google OAuth

## Admin Panel (Complete) - Feb 2026
Sidebar-based admin panel at `/admin` with 9 module pages:

1. **Ana Sayfa (Dashboard)** - Stats cards for all modules
2. **TOKİ Yönetimi** - Project CRUD, Ada/Parsel, Media, Documents, Videos, Map Layers + Excel Import
3. **e-İPAT Yönetimi** - Land parcel CRUD
4. **Mega Projeler** - Manual + auto-mapped TOKİ projects
5. **Eğitim Yönetimi** - Full 5-tab education manager (Kurslar, Seminerler, Haftalık Canlı, Medya, Sayfa Yönetimi)
6. **Topluluk Yönetimi** - Community posts
7. **Arsa Fırsatları** - Investment opportunities
8. **Piyasa Analizi** - Market data
9. **Kullanıcılar** - User management with drawer (5 tabs: Özet, Üyelik, Yetkiler, Aktivite, Notlar)

### Key Features:
- **Excel Import for Projects**: Bulk TOKİ project creation via XLSX/XLS/CSV (17 columns)
- **Excel Import for Ada/Parsel**: Bulk ada/parsel import per project
- **GeoJSON Map Preview**: Live map preview before uploading map layers
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

## Login Required Modal
- Shared `LoginRequiredModal` component in `/components/LoginRequiredModal.js`
- TOKİ, Arazi ve Yatırım Simülatörü sayfalarında arama/hesaplama yapılırken giriş kontrolü
- Giriş yapılmamışsa modal çıkar: "Giriş Yap" + "Ücretsiz Kayıt Ol" butonları

## Education Center (Complete) - Feb 2026

### Public Page (`/education`)
- **Hero**: Koyu yeşil (#0F3D2E) arka plan, altın "Profesyonel" text, 4 istatistik
- **Section 1**: Ücretsiz Seminerler kartları (DB'den yükler, fallback: statik 4 kart)
- **Section 2**: Ücretli Eğitimler kartları (DB'den yükler, fallback: statik 5 kart)
- **Section 3**: Haftalık Canlı Online Eğitim, 4 özellik kutusu
- **Section 4**: Arsa Yatırımcı Topluluğu, 4 kanal
- Seminer kayıt: `SeminarRegistrationModal` → POST /api/education/seminars/{id}/register
- Kurs detayı: `/course/:id` → `CourseDetailPage`
- **Smart fallback**: Statik veriler gösterilirken kurs/seminer aksiyonları LoginRequired modal'ı açar; DB verisi varsa gerçek aksiyon gerçekleşir

### Admin Panel (`/admin` → Eğitim Yönetimi)
5-sekme tam işlevsel yönetim paneli (`EducationManager.js`):
- **Kurslar**: CRUD + modül/ders yönetimi (nested), görsel yükleme
- **Seminerler**: CRUD + kayıt listesi görüntüleme, görsel yükleme  
- **Haftalık Canlı**: Başlık/gün/saat/zoom linki + arşiv kayıtları
- **Medya Kütüphanesi**: Drag-drop upload, klasör filtreleme, link kopyalama
- **Sayfa Yönetimi**: Public sayfanın başlık/açıklama/buton metinleri düzenlenebilir

### Backend APIs
- GET/POST /api/admin/education/courses + /{id} (PUT/DELETE) + /{id}/modules + /{id}/modules/{mid}/lessons
- GET/POST /api/admin/education/seminars + /{id} (PUT/DELETE) + /{id}/registrations
- GET/PUT /api/admin/education/live + /archives (POST/DELETE)
- GET /api/admin/education/media + /upload (POST) + /{id} (DELETE)
- GET/PUT /api/admin/education/page-settings
- GET /api/education/courses (public) + /{id}
- GET /api/education/seminars (public)
- POST /api/education/seminars/{id}/register
- GET /api/education/live (public)
- GET /api/education/page-settings (public)

## Credentials
- Admin: ipatarazi@gmail.com / As537273
- Test user: testuser@test.com / Test1234!

## Yatırım Fonu Sayfası - Feb 2026

### URL: `/yatirim-fonu`
Tam fonksiyonel landing page:

**10 Bölüm:**
1. Hero - Aerial İstanbul görseli, koyu yeşil overlay, 4 CTA butonu
2. Fon Nedir - 4 avantaj kartı
3. Fon Süreci - 5 adımlı timeline (01-05)
4. Yatırımcı Segmentleri - 3 premium tier kart (Başlangıç/Stratejik/Kurucu)
5. Katılım Şartları - koyu yeşil arka plan, 5 madde + alt not
6. Neden Bu Model - 4 değer önerisi kartı
7. Sunum Dosyası - Mock PDF preview card (gerçek PDF URL eklenince bağlanacak)
8. SSS - 6 sorulu accordion
9. Yatırımcı Başvuru Formu - 9 alan + 2 checkbox + başarı mesajı
10. Bekleme Listesi - 2 alan, yeşil arka plan section

**Backend Endpoints:**
- POST /api/yatirim-fonu/basvuru → db.yatirim_fonu_basvurulari
- POST /api/yatirim-fonu/bekleme-listesi → db.yatirim_fonu_bekleme
- GET /api/admin/yatirim-fonu/basvurular (admin JWT required)
- GET /api/admin/yatirim-fonu/bekleme-listesi (admin JWT required)

## e-Konut Module Updates - Feb 2026
- Redesigned ProjectDetailPage: top gallery banner, colorful stat cards, progress bar, colorful tabs
- Video stat card + bottom video section (YouTube embed)
- OpenLayers map with Google Maps satellite imagery
- KMZ/KML file support with auto lat/lon extraction
- Claude Sonnet AI Agent in AdminPanel for project CRUD via chat
- AdaParselView syntax error fixed (function declaration was missing)
- İl-İlçe dependent dropdown: districts now derived dynamically from project data
- **Geolocation added to map (Apr 2026)**: Google Maps-style pulsing blue dot for user location; floating locate button (top-right on map); "Konumumu Göster" + "Yol Tarifi Al" buttons below map

## Backlog (Prioritized)
- P1: e-İPAT module from GitHub
- P1: Yatırımcı Başvuru Formu email confirmation (Resend/SendGrid)
- P2: User Dashboard (my courses, my seminars, certificates)
- P2: Add real seminar/course content via admin panel
- P2: User-facing pages for each module (detailed TOKI, Land analysis, etc.)
- P3: Backend modularization (split server.py into FastAPI routers)
