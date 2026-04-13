import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

// ======= GOOGLE AUTH CALLBACK =======
export function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) { navigate('/auth'); return; }

    const sessionId = match[1];
    api.post('/auth/google-session', { session_id: sessionId }, { withCredentials: true })
      .then(({ data }) => {
        localStorage.setItem('app_user', JSON.stringify(data.user));
        localStorage.setItem('app_session_token', data.session_token);
        navigate('/', { state: { user: data.user } });
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || 'Google ile giriş başarısız. Lütfen tekrar deneyin.';
        toast.error(msg);
        navigate('/auth');
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ======= MAIN AUTH PAGE =======
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loginTab, setLoginTab] = useState('abone'); // 'abone' | 'partner'

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const [loading, setLoading] = useState(false);

  // Check if already logged in or mode param
  useEffect(() => {
    const user = localStorage.getItem('app_user');
    const params = new URLSearchParams(location.search);
    const from = params.get('redirect') || location.state?.from || '/panel';
    if (user) navigate(from);
    if (params.get('mode') === 'register') setMode('register');
  }, [navigate, location.search, location.state]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/user-login', { email: loginEmail, password: loginPassword });
      
      // Cookies are set automatically by backend (httpOnly)
      // Store only non-sensitive user info in localStorage for UI purposes
      localStorage.setItem('app_user', JSON.stringify(data.user));
      
      toast.success('Giriş başarılı');
      const from = new URLSearchParams(location.search).get('redirect') || location.state?.from || '/panel';
      navigate(from);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Giriş başarısız');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!kvkkAccepted) { toast.error('KVKK onayı zorunludur'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        full_name: regName, phone: regPhone, email: regEmail, password: regPassword,
      });
      
      // Cookies are set automatically by backend (httpOnly)
      // Store only non-sensitive user info in localStorage for UI purposes
      localStorage.setItem('app_user', JSON.stringify(data.user));
      
      toast.success('Kayıt başarılı');
      const from = new URLSearchParams(location.search).get('redirect') || location.state?.from || '/panel';
      navigate(from);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kayıt başarısız');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900">mrx<span className="text-emerald-600">akademi</span></span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {mode === 'login' ? (
            <>
              {/* LOGIN */}
              <h1 className="text-2xl font-bold text-slate-900 mb-0.5" data-testid="auth-title">GİRİŞ</h1>
              <p className="text-sm text-slate-500 mb-5">Hesabınıza giriş yapın</p>

              {/* Tabs */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setLoginTab('abone')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${loginTab === 'abone' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  data-testid="tab-abone"
                >
                  Abone Girişi
                </button>
                <button
                  onClick={() => setLoginTab('partner')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${loginTab === 'partner' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  data-testid="tab-partner"
                >
                  Partner Girişi
                </button>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors mb-4"
                data-testid="google-login-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google ile devam et
              </button>

              {/* Separator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">veya</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-600">E-posta</Label>
                  <Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} type="email" placeholder="E-posta adresi" required className="mt-1 rounded-xl" data-testid="login-email" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Şifre</Label>
                  <div className="relative mt-1">
                    <Input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} type={showLoginPass ? 'text' : 'password'} placeholder="Şifre" required className="rounded-xl pr-16" data-testid="login-password" />
                    <button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-medium flex items-center gap-1">
                      {showLoginPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showLoginPass ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={rememberMe} onCheckedChange={setRememberMe} />
                    <span className="text-xs text-slate-600">Oturumum açık kalsın</span>
                  </label>
                  <button type="button" className="text-xs text-emerald-600 font-medium hover:underline">Şifremi Unuttum</button>
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-sm font-semibold" disabled={loading} data-testid="login-submit-btn">
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-5">
                Hesabınız yok mu?{' '}
                <button onClick={() => setMode('register')} className="text-emerald-600 font-semibold hover:underline" data-testid="go-register">Kayıt Ol</button>
              </p>
            </>
          ) : (
            <>
              {/* REGISTER */}
              <h1 className="text-2xl font-bold text-slate-900 mb-0.5" data-testid="auth-title">KAYIT</h1>
              <p className="text-sm text-slate-500 mb-1">Yeni hesap oluşturun</p>
              <p className="text-xs text-slate-400 mb-5">Hızlıca kayıt olun ve sorgulamaya başlayın.</p>

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors mb-4"
                data-testid="google-register-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google ile devam et
              </button>

              {/* Separator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">veya</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600">Ad Soyad</Label>
                  <Input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ad Soyad" required className="mt-1 rounded-xl" data-testid="reg-name" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Telefon</Label>
                  <Input value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" className="mt-1 rounded-xl" data-testid="reg-phone" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">E-posta</Label>
                  <Input value={regEmail} onChange={e => setRegEmail(e.target.value)} type="email" placeholder="E-posta adresi" required className="mt-1 rounded-xl" data-testid="reg-email" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Şifre</Label>
                  <div className="relative mt-1">
                    <Input value={regPassword} onChange={e => setRegPassword(e.target.value)} type={showRegPass ? 'text' : 'password'} placeholder="Şifre" required className="rounded-xl pr-16" data-testid="reg-password" />
                    <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-medium flex items-center gap-1">
                      {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showRegPass ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={kvkkAccepted} onCheckedChange={setKvkkAccepted} className="mt-0.5" data-testid="kvkk-checkbox" />
                  <span className="text-xs text-slate-600 leading-tight">
                    <button type="button" className="text-emerald-600 font-medium hover:underline">KVKK Aydınlatma Metni</button>'ni okudum, kişisel verilerimin işlenmesine açık rıza veriyorum.
                  </span>
                </label>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 text-sm font-semibold" disabled={loading} data-testid="register-submit-btn">
                  {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol ve Devam Et'}
                </Button>
              </form>

              <p className="text-center text-[10px] text-slate-400 mt-3">
                Devam ederek <button type="button" className="text-emerald-600 hover:underline">Kullanım Koşulları</button> ve <button type="button" className="text-emerald-600 hover:underline">KVKK metnini</button> kabul etmiş sayılırsınız.
              </p>

              <p className="text-center text-sm text-slate-500 mt-4">
                Zaten hesabınız var mı?{' '}
                <button onClick={() => setMode('login')} className="text-emerald-600 font-semibold hover:underline" data-testid="go-login">Giriş Yap</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
