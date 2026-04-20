import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Star, BookOpen, Play, FileText, Lock, CheckCircle, Mic } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import LoginRequiredModal from '@/components/LoginRequiredModal';

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const fileUrl = (p) => p ? `${BACKEND}/api/files/${p}` : null;

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [openModule, setOpenModule] = useState(null);

  const isLoggedIn = () => !!(localStorage.getItem('app_user'));

  useEffect(() => {
    api.get(`/education/courses/${id}`)
      .then(r => setCourse(r.data))
      .catch(() => toast.error('Kurs bulunamadı'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F8F8' }}>
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0F3D2E', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F8F8F8' }}>
      <p className="text-slate-600 mb-4">Kurs bulunamadı</p>
      <button onClick={() => navigate('/education')} className="text-sm font-semibold underline" style={{ color: '#0F3D2E' }}>Eğitimlere Dön</button>
    </div>
  );

  const totalLessons = (course.modules || []).reduce((a, m) => a + (m.lessons || []).length, 0);

  return (
    <div className="min-h-screen" style={{ background: '#F8F8F8', fontFamily: 'system-ui, sans-serif' }}>
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0a2016, #0F3D2E)' }}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <button onClick={() => navigate('/education')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" />Eğitimlere Dön
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2">
              {course.level && (
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-white/70 mb-4 inline-block">
                  {course.level}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
                {course.title}
              </h1>
              <p className="text-slate-300 text-[15px] leading-relaxed mb-6">{course.short_description}</p>

              <div className="flex flex-wrap gap-5 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Star className="w-4 h-4 fill-[#C8A96A] text-[#C8A96A]" />
                  <span className="font-semibold text-white">{course.rating || 5.0}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="w-4 h-4 text-[#C8A96A]" />
                  {(course.student_count || 0).toLocaleString('tr-TR')} öğrenci
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <BookOpen className="w-4 h-4 text-[#C8A96A]" />
                  {(course.modules || []).length} modül · {totalLessons} ders
                </div>
              </div>
            </div>

            {/* Purchase card */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              {course.cover_image ? (
                <img src={fileUrl(course.cover_image)} alt={course.title} className="w-full rounded-xl mb-4 object-cover h-44" />
              ) : (
                <div className="w-full h-44 rounded-xl bg-gradient-to-br from-[#0F3D2E] to-[#1a6645] flex items-center justify-center mb-4">
                  <BookOpen className="w-16 h-16 text-white/30" />
                </div>
              )}
              <div className="mb-4">
                {course.discount_price ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold" style={{ color: '#0F3D2E' }}>₺{course.discount_price.toLocaleString('tr-TR')}</span>
                    <span className="text-lg text-slate-400 line-through">₺{course.price?.toLocaleString('tr-TR')}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-extrabold" style={{ color: '#0F3D2E' }}>
                    {course.price > 0 ? `₺${course.price.toLocaleString('tr-TR')}` : 'Ücretsiz'}
                  </span>
                )}
              </div>
              <button
                onClick={() => { if (!isLoggedIn()) { setShowLoginModal(true); return; } toast.success('Eğitime kaydınız alındı!'); }}
                className="w-full py-3.5 rounded-xl font-bold text-[#0F3D2E] text-[15px] mb-3 hover:scale-[1.02] transition-transform"
                style={{ background: 'linear-gradient(135deg, #C8A96A, #e8c84a)' }}
                data-testid="course-enroll-btn"
              >
                Eğitime Katıl
              </button>
              <div className="space-y-2">
                {['30 gün para iade garantisi', 'Sertifika dahil', 'Ömür boyu erişim'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Full Description */}
            {course.full_description && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                <h2 className="text-lg font-bold text-[#0F3D2E] mb-3">Eğitim Hakkında</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{course.full_description}</p>
              </div>
            )}

            {/* Modules & Lessons */}
            {(course.modules || []).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-[#0F3D2E] mb-4">
                  Eğitim İçeriği — {(course.modules || []).length} modül, {totalLessons} ders
                </h2>
                <div className="space-y-2">
                  {(course.modules || []).sort((a, b) => a.order - b.order).map(mod => (
                    <div key={mod.module_id} className="border border-slate-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenModule(openModule === mod.module_id ? null : mod.module_id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                      >
                        <span className="font-semibold text-sm text-[#0F3D2E]">{mod.title}</span>
                        <span className="text-xs text-slate-500">{(mod.lessons || []).length} ders</span>
                      </button>
                      {openModule === mod.module_id && (
                        <div className="divide-y divide-slate-50">
                          {(mod.lessons || []).sort((a, b) => a.order - b.order).map(lesson => (
                            <div key={lesson.lesson_id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                              {lesson.is_preview ? (
                                <Play className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                              )}
                              <span className="text-sm text-slate-700 flex-1">{lesson.title}</span>
                              {lesson.duration && <span className="text-xs text-slate-400">{lesson.duration}</span>}
                              {lesson.is_preview && <span className="text-xs text-emerald-600 font-medium">Önizleme</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            {(course.tags || []).length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-[#0F3D2E] mb-3">Konular</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map(t => (
                    <span key={t} className="text-xs px-3 py-1 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E] font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
