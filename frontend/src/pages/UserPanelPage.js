import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, FolderOpen, CreditCard, FileText, ClipboardList,
  Award, ScrollText, Radio, CalendarDays, Users, Calendar,
  Bell, ChevronDown, LogOut, User, Search, Download, Trash2,
  Play, CheckCircle, Clock, AlertCircle, X, Menu, Filter,
  ChevronLeft, ChevronRight, MapPin, Loader2, ExternalLink,
  Star, Phone, Mail, Edit2, Save, Zap, Crown, Shield, Package
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

const COURSE_THUMB = "https://static.prod-images.emergentagent.com/jobs/40cb78a3-0995-452a-bd7f-4b6b9aca923e/images/b80408b1b6bee4cfd784c820efa68cd92cd676f85ef6d5bc2cc3cbce764341ec.png";
const COURSE_THUMB2 = "https://static.prod-images.emergentagent.com/jobs/40cb78a3-0995-452a-bd7f-4b6b9aca923e/images/2ab78b22b1c06ccc00e32ca5daf14f407de3b10761216cd12c82aca1114c3413.png";

const AVATAR_COLORS = [
  { id: 'emerald', bg: 'bg-emerald-600', hex: '#059669' },
  { id: 'blue', bg: 'bg-blue-600', hex: '#2563eb' },
  { id: 'violet', bg: 'bg-violet-600', hex: '#7c3aed' },
  { id: 'rose', bg: 'bg-rose-600', hex: '#e11d48' },
  { id: 'amber', bg: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'teal', bg: 'bg-teal-600', hex: '#0d9488' },
  { id: 'orange', bg: 'bg-orange-500', hex: '#f97316' },
  { id: 'slate', bg: 'bg-slate-600', hex: '#475569' },
];

const PLAN_LABELS = { free: 'Ücretsiz', basic: 'Temel', pro: 'Pro', corporate: 'Kurumsal' };
const PLAN_COLORS = { free: 'bg-slate-700 text-slate-300', basic: 'bg-emerald-900 text-emerald-300', pro: 'bg-blue-900 text-blue-300', corporate: 'bg-amber-900 text-amber-300' };

function getInitials(name) {
  if (!name) return 'K';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}
function getAvatarHex(colorId) {
  return AVATAR_COLORS.find(c => c.id === colorId)?.hex || '#059669';
}

const NAV_ITEMS = [
  { id: 'home', label: 'Anasayfa', icon: Home },
  { id: 'packages', label: 'Paketler & Üyelik', icon: Star },
  { id: 'courses', label: 'Eğitimlerim', icon: BookOpen },
  { id: 'files', label: 'Dosyalarım', icon: FolderOpen },
  { id: 'payments', label: 'Ödemelerim', icon: CreditCard },
  { id: 'contracts', label: 'Sözleşmelerim', icon: FileText },
  { id: 'exams', label: 'Eğitim Sınavlarım', icon: ClipboardList },
  { id: 'certificates', label: 'Eğitim Sertifikalarım', icon: Award },
  { id: 'transcript', label: 'Transkript', icon: ScrollText },
  { id: 'live', label: 'Canlı Yayınlar', icon: Radio },
  { id: 'live-calendar', label: 'Canlı Yayın Takvimi', icon: CalendarDays },
  { id: 'supervision', label: 'Süpervizyon Eğitimler', icon: Users },
  { id: 'supervision-calendar', label: 'Süpervizyon Takvimi', icon: Calendar },
];

// ===== PROMO BANNER =====
function PromoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 h-11 flex items-center justify-center gap-3 px-4"
      style={{ fontFamily: "'Outfit', sans-serif" }}>
      <span className="text-xs sm:text-sm font-bold text-yellow-900 text-center">
        SİZE ÖZEL UZMANLIK TEKLİFİ — YETENEKLERİNİ TAMAMLA:
        <span className="mx-1 font-extrabold">%25 EK İNDİRİM!</span>
      </span>
      <button
        className="bg-yellow-900 text-yellow-100 text-xs font-bold px-3 py-1 rounded-lg hover:bg-yellow-800 transition-colors whitespace-nowrap"
        data-testid="promo-banner-btn"
      >
        HEMEN AL
      </button>
      <span className="hidden sm:inline text-xs text-yellow-800 font-medium">Sınırlı kontenjan için geçerlidir.</span>
    </div>
  );
}

// ===== SIDEBAR =====
function Sidebar({ active, onNav, user, onLogout, onProfile, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onMobileClose} />}
      <aside
        className={`fixed top-11 left-0 bottom-0 w-64 bg-slate-900 flex flex-col z-40 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {/* User info */}
        <button
          onClick={onProfile}
          data-testid="sidebar-profile-btn"
          className="w-full p-5 border-b border-slate-800 flex items-center gap-3 hover:bg-slate-800/60 transition-colors text-left"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
            style={{ background: getAvatarHex(user?.avatar_color) }}
          >
            {getInitials(user?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{user?.full_name || 'Kullanıcı'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PLAN_COLORS[user?.plan || 'free']}`}>
                {PLAN_LABELS[user?.plan || 'free']}
              </span>
            </div>
          </div>
          <Edit2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              data-testid={`nav-${id}`}
              onClick={() => { onNav(id); onMobileClose(); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all duration-150
                ${active === id
                  ? 'bg-slate-800 text-white border-l-2 border-emerald-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-l-2 border-transparent'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            data-testid="sidebar-logout-btn"
            className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm font-medium transition-colors px-2 py-2 rounded-lg hover:bg-slate-800/60"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
          <p className="text-center text-slate-600 text-xs mt-3">
            <button className="hover:text-slate-400 transition-colors">Hakkımızda</button>
            {' | '}
            <button className="hover:text-slate-400 transition-colors">İletişim</button>
          </p>
        </div>
      </aside>
    </>
  );
}

// ===== TOP HEADER =====
function TopHeader({ user, onLogout, onMenuToggle, onProfile }) {
  const [dropOpen, setDropOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header
      className="fixed top-11 left-0 lg:left-64 right-0 h-14 bg-white border-b border-black/5 flex items-center justify-between px-4 sm:px-6 z-20"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-slate-500 hover:text-slate-700" onClick={onMenuToggle} data-testid="mobile-menu-btn">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 hidden sm:block">mrx<span className="text-emerald-600">akademi</span></span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" data-testid="notifications-btn">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDropOpen(!dropOpen)}
            data-testid="user-dropdown-btn"
            className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: getAvatarHex(user?.avatar_color) }}
            >
              {getInitials(user?.full_name)}
            </div>
            <span className="text-sm font-semibold text-slate-700 hidden sm:block truncate max-w-[100px]">
              {user?.full_name?.split(' ')[0] || 'Kullanıcı'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/5 py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { onProfile(); setDropOpen(false); }}
                data-testid="profile-dropdown-profile"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
              >
                <User className="w-4 h-4 text-slate-400" /> Profilim
              </button>
              <button
                onClick={() => { onLogout(); setDropOpen(false); }}
                data-testid="profile-dropdown-logout"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 font-medium"
              >
                <LogOut className="w-4 h-4" /> Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ===== PROFILE MODAL =====
function ProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || 'emerald');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('İsim zorunludur'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/user/profile', { full_name: name, phone, avatar_color: avatarColor }, { withCredentials: true });
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('app_user') || '{}');
      const updated = { ...stored, full_name: data.full_name, phone: data.phone, avatar_color: data.avatar_color, plan: data.plan };
      localStorage.setItem('app_user', JSON.stringify(updated));
      toast.success('Profil güncellendi');
      onSave(updated);
      onClose();
    } catch { toast.error('Güncelleme başarısız'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" data-testid="profile-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Profili Düzenle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar preview + color picker */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg"
              style={{ background: getAvatarHex(avatarColor) }}
              data-testid="profile-avatar-preview"
            >
              {getInitials(name || user?.full_name)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 text-center mb-2">Avatar Rengi</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setAvatarColor(c.id)}
                    data-testid={`avatar-color-${c.id}`}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{ background: c.hex, outline: avatarColor === c.id ? `3px solid ${c.hex}` : 'none', outlineOffset: '2px' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Ad Soyad *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  data-testid="profile-name-input"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  data-testid="profile-phone-input"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="+90 555 000 00 00"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={user?.email || ''}
                  readOnly
                  data-testid="profile-email-input"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 pl-1">E-posta değiştirilemez</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Üyelik Planı</label>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${PLAN_COLORS[user?.plan || 'free']}`}>
                <Crown className="w-3.5 h-3.5" />
                {PLAN_LABELS[user?.plan || 'free']}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">İptal</button>
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="profile-save-btn"
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== PACKAGES SECTION =====
function PackagesSection({ user, onUpgrade }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentPlan = user?.plan || 'free';

  useEffect(() => {
    api.get('/packages').then(r => setPackages(r.data)).catch(() => setPackages([])).finally(() => setLoading(false));
  }, []);

  const ICONS = { free: Package, basic: Shield, pro: Zap, corporate: Crown };
  const COLOR_MAP = {
    slate: { border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', btn: 'bg-slate-900 hover:bg-slate-700', check: 'text-slate-500' },
    emerald: { border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', check: 'text-emerald-500' },
    blue: { border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700', check: 'text-blue-500' },
    amber: { border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600', check: 'text-amber-500' },
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Manrope', sans-serif" }} data-testid="packages-section">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Üyelik</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Paketler & Üyelik</h1>
        <p className="text-sm text-slate-500 mt-1">Hedeflerinize uygun paketi seçin, hemen erişim kazanın.</p>
      </div>

      {/* Current plan banner */}
      <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Crown className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Mevcut Planınız</p>
            <p className="text-white font-bold text-sm">{PLAN_LABELS[currentPlan]} Plan</p>
          </div>
        </div>
        {currentPlan === 'free' && (
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg">Yükseltilebilir</span>
        )}
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {packages.map(pkg => {
          const c = COLOR_MAP[pkg.color] || COLOR_MAP.slate;
          const Icon = ICONS[pkg.id] || Package;
          const isCurrent = pkg.id === currentPlan;
          return (
            <div
              key={pkg.id}
              data-testid={`package-card-${pkg.id}`}
              className={`relative bg-white rounded-2xl border-2 p-5 transition-all ${isCurrent ? 'border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]' : c.border + ' hover:shadow-md'}`}
            >
              {pkg.popular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide">
                  En Popüler
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide">
                  Mevcut Plan
                </span>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${c.badge} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  {pkg.price === 0 ? (
                    <span className="text-xl font-black text-slate-900">Ücretsiz</span>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-slate-900">₺{pkg.price.toLocaleString('tr-TR')}</span>
                      <span className="text-xs text-slate-400 ml-1">/{pkg.period}</span>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-3">{pkg.name}</h3>
              <ul className="space-y-2 mb-5">
                {pkg.features.map((f, i) => (
                  <li key={`feat-${i}`} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${c.check}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isCurrent && toast.info('Ödeme sistemi yakında aktif olacak!')}
                data-testid={`package-btn-${pkg.id}`}
                className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all ${isCurrent ? 'bg-emerald-600 cursor-default opacity-80' : c.btn}`}
              >
                {isCurrent ? 'Aktif Plan' : pkg.price === 0 ? 'Ücretsiz Başla' : 'Planı Seç'}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Sıkça Sorulan Sorular</h3>
        <div className="space-y-3">
          {[
            { q: 'Planımı istediğim zaman değiştirebilir miyim?', a: 'Evet, istediğiniz zaman planınızı yükseltebilir veya iptal edebilirsiniz.' },
            { q: 'Ödeme güvenli mi?', a: 'Tüm ödemeler SSL şifreli altyapı ile güvenli şekilde işlenir.' },
            { q: 'Ücretsiz denemem var mı?', a: 'Pro plan için 7 günlük ücretsiz deneme hakkınız bulunmaktadır.' },
          ].map((item) => (
            <details key={item.q} className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-slate-700 py-2">
                {item.q}
                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <p className="text-sm text-slate-500 pb-2 pt-1">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== HOME SECTION =====
function HomeSection({ progress }) {
  const mainCourse = progress?.[0];
  const mainPct = mainCourse?.progress_pct || 0;

  return (
    <div className="space-y-6" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Genel Bakış</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Hoş Geldiniz</h1>
      </div>

      {/* Progress card */}
      <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Eğitim İlerlemen</span>
          <span className="text-xs font-bold text-emerald-600">{mainPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className="h-full bg-emerald-600 rounded-full transition-all duration-700" style={{ width: `${mainPct}%` }}></div>
        </div>

        {/* Featured course */}
        {mainCourse ? (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            <img
              src={mainCourse.cover_image || COURSE_THUMB}
              alt={mainCourse.title}
              className="w-20 h-14 rounded-xl object-cover shrink-0"
              onError={e => { e.target.src = COURSE_THUMB; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium mb-1">Devam Eden Eğitim</p>
              <p className="text-sm font-bold text-slate-900 truncate">{mainCourse.title}</p>
              <p className="text-xs text-slate-500 mt-1">{mainCourse.completed_lessons}/{mainCourse.total_lessons} ders tamamlandı</p>
            </div>
            <button
              data-testid="continue-course-btn"
              className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Devam Et
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-2">Henüz bir eğitime başlamadınız.</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Ders', value: progress?.reduce((a, c) => a + c.total_lessons, 0) || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tamamlanan', value: progress?.reduce((a, c) => a + c.completed_lessons, 0) || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sertifika', value: progress?.filter(c => c.progress_pct >= 90).length || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Kurs Sayısı', value: progress?.length || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-black/5`}>
            <p className={`text-2xl font-bold ${stat.color}`} style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recommended */}
      <div className="bg-white rounded-2xl p-6 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <h3 className="text-sm font-bold text-slate-900 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Önerilen Eğitimler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Arsa Hukuku Temelleri', level: 'Başlangıç', thumb: COURSE_THUMB2 },
            { title: 'İmar Planı Analizi', level: 'Orta', thumb: COURSE_THUMB },
          ].map((c) => (
            <div key={c.title} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer">
              <img src={c.thumb} alt={c.title} className="w-12 h-9 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                <p className="text-xs text-slate-500">{c.level}</p>
              </div>
              <Play className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== COURSES SECTION =====
function CoursesSection({ progress }) {
  const [tab, setTab] = useState('videos');
  const [search, setSearch] = useState('');

  const filtered = (progress || []).filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">İçeriklerim</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Eğitimlerim</h1>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-4 pt-4 gap-1">
          {['videos', 'docs'].map(t => (
            <button
              key={t}
              data-testid={`courses-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${tab === t ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'videos' ? 'Videolar' : 'Dokümanlar'}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Eğitim ara..."
              data-testid="courses-search"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">Eğitim bulunamadı.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map(course => (
                <div key={course.course_id} data-testid={`course-item-${course.course_id}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all">
                  <img
                    src={course.cover_image || COURSE_THUMB}
                    alt={course.title}
                    onError={e => { e.target.src = COURSE_THUMB; }}
                    className="w-16 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${course.progress_pct}%` }}></div>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{course.progress_pct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${course.progress_pct >= 100 ? 'bg-emerald-100 text-emerald-700' : course.progress_pct > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                      {course.progress_pct >= 100 ? 'Tamamlandı' : course.progress_pct > 0 ? 'Devam ediyor' : 'Başlanmadı'}
                    </span>
                    <button data-testid={`course-play-${course.course_id}`}
                      className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {course.progress_pct > 0 ? 'Tekrar İzle' : 'İzle'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== FILES SECTION =====
function FilesSection() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.get('/user/files', { withCredentials: true })
      .then(r => setFiles(r.data))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  const deleteFile = async (id) => {
    await api.delete(`/user/files/${id}`, { withCredentials: true });
    setFiles(f => f.filter(x => x.id !== id));
    toast.success('Dosya silindi');
  };

  const filtered = files.filter(f => f.file_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Depolama</p>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Dosyalarım</h1>
        </div>
        <button data-testid="add-file-btn"
          className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors">
          + Yeni Dosya Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Dosya ara..."
              data-testid="files-search"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No records found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 rounded-xl">
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Dosya Adı</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3 hidden sm:table-cell">Tarih</th>
                  <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3 hidden sm:table-cell">Durum</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{f.file_name}</td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{f.created_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{f.status || 'Aktif'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" data-testid={`download-file-${f.id}`}><Download className="w-4 h-4" /></button>
                        <button onClick={() => deleteFile(f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" data-testid={`delete-file-${f.id}`}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== PAYMENTS SECTION =====
function PaymentsSection() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.get('/user/payments', { withCredentials: true })
      .then(r => setPayments(r.data))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const mockPayments = [
    { id: 'p1', course_name: 'Arsa Yatırım Uzmanlığı Eğitimi', amount: '₺2.500', status: 'completed', date: '2025-03-15' },
    { id: 'p2', course_name: 'İmar Planı Analizi', amount: '₺1.200', status: 'pending', date: '2025-04-01' },
  ];

  const data = payments.length ? payments : mockPayments;

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Finans</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Ödemelerim</h1>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-4">Eğitim Adı</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-4 hidden sm:table-cell">Tutar</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-4">Durum</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-4">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/30">
                  <td className="px-6 py-4 font-semibold text-slate-800">{p.course_name}</td>
                  <td className="px-6 py-4 text-slate-600 hidden sm:table-cell">{p.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.status === 'completed' ? 'Ödeme Tamamlandı' : 'Beklemede'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button data-testid={`payment-detail-${p.id}`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">Detay Gör</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ===== CONTRACTS SECTION =====
function ContractsSection() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.get('/user/contracts', { withCredentials: true })
      .then(r => setContracts(r.data))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, []);

  const mockContracts = [
    { id: 'c1', contract_name: 'Kullanım Koşulları Sözleşmesi', status: 'approved', signed_at: '2025-03-10' },
    { id: 'c2', contract_name: 'Eğitim Hizmet Sözleşmesi', status: 'pending', signed_at: null },
    { id: 'c3', contract_name: 'KVKK Onay Belgesi', status: 'approved', signed_at: '2025-03-10' },
  ];

  const data = contracts.length ? contracts : mockContracts;

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Belgeler</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Sözleşmelerim</h1>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-4">Sözleşme Adı</th>
              <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-4">Onay Durumu</th>
              <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-4">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/30">
                <td className="px-6 py-4 font-semibold text-slate-800">{c.contract_name}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {c.status === 'approved' ? 'Onaylandı' : 'Beklemede'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button data-testid={`view-contract-${c.id}`} className="text-xs font-semibold text-emerald-600 hover:underline">Görüntüle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== EXAMS SECTION =====
function ExamsSection() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.get('/user/exams', { withCredentials: true })
      .then(r => setExams(r.data))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  const submitExam = async () => {
    if (!activeExam) return;
    const totalQ = activeExam.questions?.length || 0;
    if (Object.keys(answers).length < totalQ) {
      toast.error('Tüm soruları cevaplayın');
      return;
    }
    try {
      const { data } = await api.post(`/user/exams/${activeExam.id}/submit`, { answers }, { withCredentials: true });
      setResult(data);
      setExams(prev => prev.map(e => e.id === activeExam.id ? { ...e, attempt: data } : e));
    } catch {
      toast.error('Sınav gönderilemedi');
    }
  };

  if (activeExam && !result) {
    return (
      <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveExam(null); setAnswers({}); }} className="text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{activeExam.title}</h1>
        </div>

        <div className="space-y-4">
          {activeExam.questions?.map((q, qi) => (
            <div key={q.id} className="bg-white rounded-2xl p-6 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-bold text-slate-900 mb-4">{qi + 1}. {q.text}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} data-testid={`exam-opt-${q.id}-${oi}`}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all
                      ${answers[q.id] === opt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                      onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="accent-emerald-600" />
                    <span className="text-sm text-slate-700 font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={submitExam} data-testid="submit-exam-btn"
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors">
          Sınavı Gönder
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${result.passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {result.passed ? <CheckCircle className="w-10 h-10 text-emerald-600" /> : <X className="w-10 h-10 text-red-500" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {result.passed ? 'Tebrikler!' : 'Tekrar Deneyin'}
        </h2>
        <p className="text-slate-500 text-sm">Puanınız: <span className={`font-bold text-lg ${result.passed ? 'text-emerald-600' : 'text-red-500'}`}>{result.score}</span></p>
        <p className="text-slate-400 text-xs">{result.passed ? 'Sınavı başarıyla geçtiniz!' : 'Geçme notu 70. Tekrar deneyebilirsiniz.'}</p>
        <button onClick={() => { setActiveExam(null); setAnswers({}); setResult(null); }}
          data-testid="back-to-exams-btn"
          className="bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors">
          Sınavlara Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Değerlendirme</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Eğitim Sınavlarım</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/5">
          <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Henüz sınav bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map(exam => (
            <div key={exam.id} data-testid={`exam-card-${exam.id}`}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{exam.title}</p>
                <p className="text-xs text-slate-500 mt-1">{exam.questions?.length || 0} soru • Geçme notu: {exam.pass_score || 70}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {exam.attempt && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${exam.attempt.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {exam.attempt.score} puan
                  </span>
                )}
                <button
                  onClick={() => { setActiveExam(exam); setAnswers({}); setResult(null); }}
                  data-testid={`start-exam-${exam.id}`}
                  className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  {exam.attempt ? 'Tekrar Gir' : 'Sınava Gir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== CERTIFICATES SECTION =====
function CertificatesSection({ progress }) {
  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Başarılarım</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Eğitim Sertifikalarım</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 font-medium">Sertifikanız eğitim tamamlandıktan (%%90+) sonra hazırlanır.</p>
      </div>

      {(!progress || progress.length === 0) ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/5">
          <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Henüz sertifika bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {progress.map(course => (
            <div key={course.course_id} data-testid={`cert-card-${course.course_id}`}
              className={`bg-white rounded-2xl p-5 border shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all ${course.progress_pct >= 90 ? 'border-emerald-200 hover:border-emerald-400' : 'border-black/5 opacity-70'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${course.progress_pct >= 90 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <Award className={`w-5 h-5 ${course.progress_pct >= 90 ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{course.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${course.progress_pct >= 90 ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${course.progress_pct}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{course.progress_pct}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${course.progress_pct >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {course.progress_pct >= 90 ? 'Sertifika Hazır' : 'Devam Ediyor'}
                </span>
                {course.progress_pct >= 90 && (
                  <button data-testid={`view-cert-${course.course_id}`}
                    className="text-xs font-semibold text-emerald-600 hover:underline">Görüntüle</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== TRANSCRIPT SECTION =====
function TranscriptSection({ progress }) {
  const eligible = (progress || []).filter(c => c.progress_pct >= 90);

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Akademik Kayıt</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Transkript</h1>
      </div>

      {eligible.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/5">
          <ScrollText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Transkript için eğitimlerin en az %%90'ını tamamlamanız gerekiyor.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">Tamamlanan Eğitimler</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-3">Eğitim Adı</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-3">Tamamlanma</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-400 px-6 py-3">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {eligible.map(c => (
                <tr key={c.course_id} data-testid={`transcript-row-${c.course_id}`} className="hover:bg-slate-50/30">
                  <td className="px-6 py-3 font-semibold text-slate-800">{c.title}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.progress_pct}%` }}></div>
                      </div>
                      <span className="text-xs text-slate-500">{c.progress_pct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-xs font-bold text-emerald-600">A</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== LIVE STREAMS SECTION =====
function LiveStreamsSection() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    api.get('/live-streams').then(r => setStreams(r.data)).catch(() => setStreams([])).finally(() => setLoading(false));
  }, []);

  const statusInfo = (s) => {
    if (s === 'live') return { label: 'CANLI', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' };
    if (s === 'upcoming') return { label: 'Yakında', color: 'bg-blue-100 text-blue-600', dot: '' };
    return { label: 'Sona Erdi', color: 'bg-slate-100 text-slate-500', dot: '' };
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Yayınlar</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Canlı Yayınlar</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="space-y-3">
          {streams.map(s => {
            const info = statusInfo(s.status);
            return (
              <div key={s.id} data-testid={`live-stream-${s.id}`}
                className="bg-white rounded-2xl p-5 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(s.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${info.color}`}>
                    {info.dot && <span className={`w-1.5 h-1.5 rounded-full ${info.dot} animate-pulse`}></span>}
                    {info.label}
                  </span>
                  {s.status !== 'ended' && (
                    <a href={s.join_url || '#'} target="_blank" rel="noopener noreferrer"
                      data-testid={`join-stream-${s.id}`}
                      className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Katıl
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== CALENDAR SECTION (Generic) =====
function CalendarSection({ title, events, cityFilter }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [citySearch, setCitySearch] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const filtered = events.filter(e =>
    !citySearch || e.city?.toLowerCase().includes(citySearch.toLowerCase()) ||
    e.title?.toLowerCase().includes(citySearch.toLowerCase())
  );

  const getEventsForDay = (day) => {
    return filtered.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Takvim</p>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h1>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {['month', 'week'].map(v => (
            <button key={v} onClick={() => setView(v)} data-testid={`calendar-view-${v}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {v === 'month' ? 'Ay' : 'Hafta'}
            </button>
          ))}
        </div>
      </div>

      {cityFilter && (
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={citySearch} onChange={e => setCitySearch(e.target.value)}
            placeholder="Şehir veya etkinlik filtrele..."
            data-testid="calendar-city-filter"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" data-testid="cal-prev-month">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <h3 className="text-sm font-bold text-slate-900">{monthNames[month]} {year}</h3>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" data-testid="cal-next-month">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              return (
                <div key={day} data-testid={`cal-day-${day}`}
                  className={`min-h-[44px] p-1 rounded-xl ${isToday ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'hover:bg-slate-50'} transition-colors`}>
                  <span className={`text-xs font-semibold block mb-1 text-center ${isToday ? 'text-emerald-700' : 'text-slate-700'}`}>{day}</span>
                  {dayEvents.slice(0, 1).map((e, ei) => (
                    <div key={ei} className="bg-emerald-600 text-white text-[10px] font-semibold rounded-md px-1 py-0.5 truncate leading-tight">{e.title?.slice(0, 12)}</div>
                  ))}
                  {dayEvents.length > 1 && <div className="text-[9px] text-emerald-600 font-bold text-center">+{dayEvents.length - 1}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Yaklaşan Etkinlikler</p>
          {filtered.filter(e => e.status !== 'ended').map(e => (
            <div key={e.id} className="bg-white rounded-xl p-4 border border-black/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">{e.location || e.platform} • {new Date(e.date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
              {e.join_url && (
                <a href={e.join_url} target="_blank" rel="noopener noreferrer" data-testid={`join-event-${e.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                  Katıl <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== SUPERVISION SECTION =====
function SupervisionSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/supervision/events').then(r => setEvents(r.data)).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Yüz Yüze</p>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Süpervizyon Eğitimler</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-black/5">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Yaklaşan süpervizyon eğitimi bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(e => (
            <div key={e.id} data-testid={`supervision-${e.id}`}
              className="bg-white rounded-2xl p-5 border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {e.location}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${e.status === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {e.status === 'upcoming' ? `${e.registered || 0}/${e.capacity || 0} Kayıtlı` : 'Sona Erdi'}
                </span>
                {e.status === 'upcoming' && (
                  <button data-testid={`join-supervision-${e.id}`}
                    className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors">
                    Katıl
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== MAIN USER PANEL PAGE =====
export default function UserPanelPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState('home');
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progress, setProgress] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [supervisionEvents, setSupervisionEvents] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('app_user');
    if (!stored) { navigate('/auth', { state: { from: '/panel' } }); return; }
    try { setUser(JSON.parse(stored)); } catch { navigate('/auth', { state: { from: '/panel' } }); return; }

    // Load data
    api.get('/user/progress', { withCredentials: true })
      .then(r => setProgress(r.data)).catch(() => setProgress([]));
    api.get('/live-streams').then(r => setLiveStreams(r.data)).catch(() => setLiveStreams([]));
    api.get('/supervision/events').then(r => setSupervisionEvents(r.data)).catch(() => setSupervisionEvents([]));
    // Fetch full profile (avatar_color, plan etc.)
    api.get('/user/profile', { withCredentials: true }).then(r => {
      const stored2 = JSON.parse(localStorage.getItem('app_user') || '{}');
      const merged = { ...stored2, ...r.data };
      localStorage.setItem('app_user', JSON.stringify(merged));
      setUser(merged);
    }).catch(() => {});
  }, [navigate]);

  const handleLogout = () => {
    api.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
    localStorage.removeItem('app_user');
    navigate('/auth');
    toast.success('Çıkış yapıldı');
  };

  const renderSection = () => {
    switch (active) {
      case 'home': return <HomeSection progress={progress} />;
      case 'packages': return <PackagesSection user={user} />;
      case 'courses': return <CoursesSection progress={progress} />;
      case 'files': return <FilesSection />;
      case 'payments': return <PaymentsSection />;
      case 'contracts': return <ContractsSection />;
      case 'exams': return <ExamsSection />;
      case 'certificates': return <CertificatesSection progress={progress} />;
      case 'transcript': return <TranscriptSection progress={progress} />;
      case 'live': return <LiveStreamsSection />;
      case 'live-calendar': return <CalendarSection title="Canlı Yayın Takvimi" events={liveStreams} cityFilter={false} />;
      case 'supervision': return <SupervisionSection />;
      case 'supervision-calendar': return <CalendarSection title="Süpervizyon Takvimi" events={supervisionEvents} cityFilter={true} />;
      default: return <HomeSection progress={progress} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={updated => setUser(updated)}
        />
      )}
      <PromoBanner />

      <Sidebar
        active={active}
        onNav={setActive}
        user={user}
        onLogout={handleLogout}
        onProfile={() => setShowProfile(true)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <TopHeader
        user={user}
        onLogout={handleLogout}
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        onProfile={() => setShowProfile(true)}
      />

      {/* Main content */}
      <main className="lg:ml-64 pt-[calc(2.75rem+3.5rem)] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
