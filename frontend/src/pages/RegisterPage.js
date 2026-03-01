import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Building2 } from 'lucide-react';

export default function RegisterPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.parse(data.user));
      setUser(data.user);
      toast.success('Kayıt başarılı!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border border-slate-200" data-testid="register-card">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 font-['Manrope']">Kayıt Ol</h1>
          <p className="text-slate-600 mt-2 text-center">PropTech Turkey'e hoş geldiniz</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="text-slate-700">Ad Soyad</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adınız Soyadınız"
              required
              className="mt-1.5"
              data-testid="register-fullname-input"
            />
          </div>

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
              data-testid="register-email-input"
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
              data-testid="register-password-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            data-testid="register-submit-button"
          >
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium" data-testid="login-link">
              Giriş Yap
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
