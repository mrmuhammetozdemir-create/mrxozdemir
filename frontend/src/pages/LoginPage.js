import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Building2 } from 'lucide-react';

export default function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
      toast.success('Giriş başarılı!');
      navigate('/');
    } catch (error) {
      toast.error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border border-slate-200" data-testid="login-card">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Manrope']">PropTech Turkey</h1>
          <p className="text-slate-600 mt-2 text-center">Gayrimenkul ve Arsa Yatırım Platformu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-slate-700">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              className="mt-1.5"
              data-testid="login-email-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-700">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
              className="mt-1.5"
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            data-testid="login-submit-button"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium" data-testid="register-link">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
