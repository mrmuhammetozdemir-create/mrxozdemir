import { useNavigate } from 'react-router-dom';
import { LogIn, X, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginRequiredModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
        data-testid="login-required-modal"
      >
        {/* Top gradient strip */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

        <div className="p-6">
          {/* Close button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              data-testid="modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Icon + Logo */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mb-3">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-extrabold text-slate-900">
                mrx<span className="text-emerald-600">akademi</span>
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">
              Giriş Yapmanız Gerekiyor
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Bu özelliği kullanabilmek için mrxakademi hesabınıza giriş yapmanız gerekmektedir.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-2.5">
            <Button
              onClick={() => navigate('/auth')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-semibold text-sm"
              data-testid="modal-login-btn"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Giriş Yap
            </Button>
            <Button
              onClick={() => navigate('/auth?mode=register')}
              variant="outline"
              className="w-full rounded-xl h-11 font-semibold text-sm border-slate-200 text-slate-700"
              data-testid="modal-register-btn"
            >
              Ücretsiz Kayıt Ol
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Kayıt olmak tamamen ücretsizdir.
          </p>
        </div>
      </div>
    </div>
  );
}
