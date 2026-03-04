import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Map, Calculator, MapPin, GraduationCap, LogIn, Shield, LogOut, Settings, X, BookOpen } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

const topModules = [
  { id: 'toki', title: 'e-TOKİ', subtitle: 'Konut Piyasası Analizleri', icon: Building2, color: 'bg-blue-500', path: '/toki', testId: 'module-toki' },
  { id: 'land', title: 'e-İPAT', subtitle: 'Arazi Parsel Veri Erişimi', icon: Map, color: 'bg-green-600', path: '/land', testId: 'module-land' },
  { id: 'investment', title: 'Investment Simulator', subtitle: 'Proje ROI Tahmini', icon: Calculator, color: 'bg-amber-500', path: '/investment', testId: 'module-investment' },
  { id: 'mega', title: 'Mega Project Map', subtitle: 'Altyapı Öngörüleri', icon: MapPin, color: 'bg-cyan-500', path: '/mega-projects', testId: 'module-mega' },
  { id: 'education', title: 'Real Estate Education', subtitle: 'PropTech Kursları', icon: GraduationCap, color: 'bg-teal-600', path: '/education', testId: 'module-education' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => { if (data.role === 'admin') setUser(data); })
        .catch(() => {});
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') { toast.error('Admin yetkisi yok'); return; }
      localStorage.setItem('admin_token', data.access_token);
      setUser(data.user);
      setShowLogin(false);
      setEmail(''); setPassword('');
      toast.success('Giriş başarılı');
    } catch { toast.error('E-posta veya şifre hatalı'); }
    finally { setLoggingIn(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    toast.success('Çıkış yapıldı');
  };

  const go = (path) => navigate(path);

  return (
    <div className="min-h-screen h-screen bg-[#F5E6D3] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              mrx<span className="text-emerald-600">akademi</span>
            </span>
          </div>
          {/* Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-1">
                <Button onClick={() => navigate('/admin')} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-3 h-7 text-[10px] font-semibold" data-testid="admin-panel-btn">
                  <Settings className="w-3 h-3 mr-1" />Yönetim Paneli
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="h-7 w-7 p-0 text-slate-400" data-testid="dashboard-logout-btn"><LogOut className="w-3 h-3" /></Button>
              </div>
            ) : (
              <Button onClick={() => setShowLogin(true)} variant="outline" size="sm" className="rounded-full h-7 px-3 text-[10px] border-slate-300" data-testid="dashboard-login-btn">
                <LogIn className="w-3 h-3 mr-1" />Giriş Yap
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content area fills remaining space */}
      <div className="flex-1 flex flex-col px-3 py-1.5 max-w-lg mx-auto w-full overflow-hidden">
        {/* Module icons row */}
        <div className="flex justify-between gap-1 mb-1 flex-shrink-0">
          {topModules.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.id} onClick={() => go(m.path)} className="flex-1 cursor-pointer group text-center" data-testid={m.testId}>
                <div className={`w-11 h-11 ${m.color} rounded-xl mx-auto flex items-center justify-center group-hover:scale-105 transition-transform shadow-md`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-[8px] font-semibold text-slate-800 mt-0.5 leading-tight">{m.title}</p>
                <p className="text-[7px] text-slate-500 leading-tight">{m.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1 mb-1 flex-shrink-0">
          {[0,1,2,3,4,5].map(i => <div key={i} className={`h-1 rounded-full ${i === 0 ? 'w-3 bg-slate-700' : 'w-1 bg-slate-400'}`} />)}
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg px-3 py-1.5 mb-1.5 flex-shrink-0">
          <h2 className="text-xs sm:text-sm font-bold text-white italic" style={{ fontFamily: 'Georgia, serif' }}>PropTech Potansiyelini Açığa Çıkar</h2>
          <p className="text-[9px] text-slate-400">Akıllı gayrimenkul yatırımı için araçlarımızı keşfedin.</p>
        </div>

        {/* Cards grid - fills remaining space */}
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          {/* 2x2 grid */}
          <div className="flex-[4] grid grid-cols-2 gap-1.5 min-h-0">
            {/* e-TOKI */}
            <div onClick={() => go('/toki')} className="relative rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all" data-testid="feature-toki">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700" />
              <div className="relative p-2 h-full flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-white leading-tight">e-TOKİ</h3>
                  <div className="bg-white/90 rounded px-1 py-0.5 shadow-sm">
                    <p className="text-[6px] font-medium text-slate-800 leading-tight">Öğren: Fiyat<br/>Trendleri</p>
                  </div>
                </div>
                <p className="text-[7px] text-white/70">Konut Piyasası Analizleri</p>
                <div className="flex-1 flex items-end justify-center">
                  <img src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/734282e01767374da9bc679f601f445092a7881c4b10dacf1c3d8a95df28ace5.png"
                    alt="e-TOKI" className="w-4/5 max-h-full object-contain" />
                </div>
              </div>
            </div>

            {/* e-IPAT */}
            <div onClick={() => go('/land')} className="relative rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all" data-testid="feature-land">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-700 to-teal-800" />
              <div className="relative p-2 h-full flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-white leading-tight">e-İPAT</h3>
                  <div className="bg-white rounded-full p-1 shadow-sm"><Map className="w-3 h-3 text-teal-700" /></div>
                </div>
                <p className="text-[7px] text-white/70">e-İPAT | İmarPlan...</p>
                <div className="flex-1 flex items-end justify-center">
                  <img src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/7edec0cb91fb852c91fb6400497a6ee104913e28c06a9628ce096af48303cb6a.png"
                    alt="e-IPAT" className="w-4/5 max-h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Investment Simulator */}
            <div onClick={() => go('/investment')} className="relative rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all" data-testid="feature-investment">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400" />
              <div className="relative p-2 h-full flex flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="text-[11px] font-bold text-slate-900 leading-tight">Investment<br/>Simulator</h3>
                  <div className="bg-white/90 rounded px-1 py-0.5 shadow-sm">
                    <p className="text-[6px] font-medium text-slate-800 leading-tight">Keşfet:<br/>ROI</p>
                  </div>
                </div>
                <p className="text-[7px] text-slate-600">Proje ROI Tahmini</p>
                <div className="flex-1 flex items-end justify-center">
                  <img src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/b2c4ff22b8c574ea1d3f66cf1b9ebc0468da47b29dbe1249cc02040edbf75b1c.png"
                    alt="Investment" className="w-4/5 max-h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Mega Project Map */}
            <div onClick={() => go('/mega-projects')} className="relative rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all" data-testid="feature-mega">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-500" />
              <div className="relative p-2 h-full flex flex-col">
                <h3 className="text-[11px] font-bold text-white leading-tight">Mega Project Map</h3>
                <p className="text-[7px] text-white/70">Altyapı Öngörüleri</p>
                <div className="flex-1 flex items-end justify-center">
                  <img src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/eab64624fef67dada87f9740213e291d5137a4ed123bfd3116d641cc04a2639c.png"
                    alt="Mega Map" className="w-4/5 max-h-full object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* Education Card - bottom */}
          <div onClick={() => go('/education')} className="relative rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all flex-[1] min-h-[72px]" data-testid="feature-education">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-teal-500" />
            <div className="relative px-3 py-1.5 flex items-center justify-between h-full">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Gayrimenkul Eğitim Merkezi</h3>
                <p className="text-[8px] text-slate-800 mb-1">Sertifikalı PropTech Kursları</p>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-3 h-5 text-[9px] shadow-md"
                  onClick={(e) => { e.stopPropagation(); go('/education'); }}>
                  Başla
                </Button>
              </div>
              <img src="https://static.prod-images.emergentagent.com/jobs/188d7137-7a2f-40e2-9241-c0824080af66/images/86dedebcca4ac76d1db0aed111fca43e1825812d80d254ca59d8f6e6cc54edfd.png"
                alt="Education" className="w-16 h-14 object-contain flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
                <h3 className="font-bold text-slate-900">Giriş Yap</h3>
              </div>
              <button onClick={() => setShowLogin(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="E-posta" required data-testid="dash-login-email" />
              <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Şifre" required data-testid="dash-login-password" />
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loggingIn} data-testid="dash-login-submit">
                {loggingIn ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
