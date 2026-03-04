import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import DashboardPage from '@/pages/DashboardPage';
import TOKISearchPage from '@/pages/TOKISearchPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import LandSearchPage from '@/pages/LandSearchPage';
import LandDetailPage from '@/pages/LandDetailPage';
import InvestmentCalculatorPage from '@/pages/InvestmentCalculatorPage';
import MegaProjectsPage from '@/pages/MegaProjectsPage';
import EducationPage from '@/pages/EducationPage';
import CommunityPage from '@/pages/CommunityPage';
import OpportunitiesPage from '@/pages/OpportunitiesPage';
import MarketAnalysisPage from '@/pages/MarketAnalysisPage';
import AdminPanelPage from '@/pages/AdminPanelPage';
import AuthPage, { AuthCallback } from '@/pages/AuthPage';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/toki" element={<TOKISearchPage />} />
          <Route path="/toki/:id" element={<ProjectDetailPage />} />
          <Route path="/project/:id" element={<ProjectDetailPage />} />
          <Route path="/land" element={<LandSearchPage />} />
          <Route path="/land/:id" element={<LandDetailPage />} />
          <Route path="/investment" element={<InvestmentCalculatorPage />} />
          <Route path="/mega-projects" element={<MegaProjectsPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/market" element={<MarketAnalysisPage />} />
          <Route path="/admin" element={<AdminPanelPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
