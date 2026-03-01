import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useState, useEffect } from 'react';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import TOKISearchPage from '@/pages/TOKISearchPage';
import TOKIDetailPage from '@/pages/TOKIDetailPage';
import LandSearchPage from '@/pages/LandSearchPage';
import LandDetailPage from '@/pages/LandDetailPage';
import InvestmentCalculatorPage from '@/pages/InvestmentCalculatorPage';
import MegaProjectsPage from '@/pages/MegaProjectsPage';
import EducationPage from '@/pages/EducationPage';
import CommunityPage from '@/pages/CommunityPage';
import OpportunitiesPage from '@/pages/OpportunitiesPage';
import MarketAnalysisPage from '@/pages/MarketAnalysisPage';
import AdminPanelPage from '@/pages/AdminPanelPage';
import '@/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage setUser={setUser} />} />
          <Route path="/" element={<DashboardPage user={user} setUser={setUser} />} />
          <Route path="/toki" element={user ? <TOKISearchPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/toki/:id" element={user ? <TOKIDetailPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/land" element={user ? <LandSearchPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/land/:id" element={user ? <LandDetailPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/investment" element={user ? <InvestmentCalculatorPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/mega-projects" element={user ? <MegaProjectsPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/education" element={user ? <EducationPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/community" element={user ? <CommunityPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/opportunities" element={user ? <OpportunitiesPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/market" element={user ? <MarketAnalysisPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminPanelPage user={user} setUser={setUser} /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
