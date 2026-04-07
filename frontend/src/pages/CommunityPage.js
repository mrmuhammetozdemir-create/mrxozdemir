import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users as UsersIcon, MessageSquare, Plus } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

export default function CommunityPage() {
  const navigate = useNavigate();
  useSEO('topluluk', { title: 'Topluluk Forumu | mrxakademi' });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'tartışma',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/community/posts');
      setPosts(data);
    } catch (error) {
      toast.error('Gönderiler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/community/posts', formData);
      toast.success('Gönderi oluşturuldu');
      setFormData({ title: '', content: '', category: 'tartışma' });
      setShowCreateForm(false);
      fetchPosts();
    } catch (error) {
      toast.error('Gönderi oluşturulamadı');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Manrope']">Topluluk</h1>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-cyan-500 hover:bg-cyan-600" data-testid="create-post-button">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Gönderi
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {showCreateForm && (
          <Card className="p-6 border-slate-200" data-testid="create-post-form">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Yeni Gönderi Oluştur</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="mt-1.5"
                  data-testid="post-title-input"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="mt-1.5" data-testid="post-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tartışma">Tartışma</SelectItem>
                    <SelectItem value="soru">Soru</SelectItem>
                    <SelectItem value="paylaşım">Paylaşım</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">İçerik</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={6}
                  className="mt-1.5"
                  data-testid="post-content-input"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600" data-testid="submit-post-button">
                  Paylaş
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} data-testid="cancel-post-button">
                  İptal
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Gönderiler ({posts.length})</h2>
          {loading ? (
            <div className="text-center py-12 text-slate-600">Yükleniyor...</div>
          ) : posts.length === 0 ? (
            <Card className="p-12 text-center border-slate-200">
              <p className="text-slate-600">Henüz gönderi bulunmuyor</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="p-6 border-slate-200" data-testid={`post-card-${post.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full">{post.category}</span>
                        <span className="text-xs text-slate-500">{post.author_email}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h3>
                      <p className="text-base text-slate-700">{post.content}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
