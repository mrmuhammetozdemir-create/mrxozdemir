import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, GraduationCap, Play, Calendar } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function EducationPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, seminarsRes] = await Promise.all([
        api.get('/education/courses'),
        api.get('/education/seminars'),
      ]);
      setCourses(coursesRes.data);
      setSeminars(seminarsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Eğitim Merkezi</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="text-center py-12 text-slate-600">Yükleniyor...</div>
        ) : (
          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="courses" data-testid="tab-courses">
                <Play className="w-4 h-4 mr-2" />
                Kurslar
              </TabsTrigger>
              <TabsTrigger value="seminars" data-testid="tab-seminars">
                <Calendar className="w-4 h-4 mr-2" />
                Seminerler
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              {courses.length === 0 ? (
                <Card className="p-12 text-center border-slate-200">
                  <p className="text-slate-600">Henüz kurs eklenmemiş</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden border-slate-200" data-testid={`course-card-${course.id}`}>
                      <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover" />
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{course.description}</p>
                        <p className="text-xs text-slate-500 mb-4">{course.duration_minutes} dakika</p>
                        <Button className="w-full bg-amber-500 hover:bg-amber-600" data-testid={`watch-course-${course.id}`}>
                          <Play className="w-4 h-4 mr-2" />
                          İzle
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="seminars" className="mt-6">
              {seminars.length === 0 ? (
                <Card className="p-12 text-center border-slate-200">
                  <p className="text-slate-600">Henüz seminer eklenmemiş</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {seminars.map((seminar) => (
                    <Card key={seminar.id} className="overflow-hidden border-slate-200" data-testid={`seminar-card-${seminar.id}`}>
                      <img src={seminar.thumbnail} alt={seminar.title} className="w-full h-48 object-cover" />
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{seminar.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{seminar.description}</p>
                        <p className="text-xs text-slate-500 mb-1">
                          <span className="font-medium">Konuşmacı:</span> {seminar.speaker}
                        </p>
                        <p className="text-xs text-slate-500 mb-4">
                          <span className="font-medium">Tarih:</span> {new Date(seminar.date).toLocaleDateString('tr-TR')}
                        </p>
                        {seminar.registration_link && (
                          <Button className="w-full bg-amber-500 hover:bg-amber-600" asChild data-testid={`register-seminar-${seminar.id}`}>
                            <a href={seminar.registration_link} target="_blank" rel="noopener noreferrer">
                              Kayıt Ol
                            </a>
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
