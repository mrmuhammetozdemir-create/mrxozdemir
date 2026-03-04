import { useState } from 'react';
import { X, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function SeminarRegistrationModal({ seminar, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !email) { toast.error('Lütfen tüm alanları doldurun'); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/education/seminars/${seminar.id}/register`, { name, phone, email });
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()} data-testid="seminar-registration-modal">
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #0F3D2E, #C8A96A)' }} />

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#0F3D2E' }}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#0F3D2E] mb-2">Kaydınız Alındı!</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Kaydınız başarıyla alındı. Seminer bilgileri size SMS ve email ile gönderilecektir.
            </p>
            <Button onClick={onClose} className="w-full h-11 font-semibold" style={{ background: '#0F3D2E' }}>
              Tamam
            </Button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#0F3D2E]">Seminere Kayıt</h3>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{seminar?.title}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Ad Soyad *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız" className="pl-9 h-11" required data-testid="reg-name" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Telefon *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0555 123 45 67" className="pl-9 h-11" required data-testid="reg-phone" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">E-posta *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ornek@email.com" className="pl-9 h-11" required data-testid="reg-email" />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 font-bold text-sm" style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)', color: '#0F3D2E' }} data-testid="reg-submit">
                {loading ? 'Kaydediliyor...' : 'Seminere Kayıt Ol'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
