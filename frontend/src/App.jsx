// frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import AuthPage from './pages/auth';
import HomePage from './pages/home';
import JobDetail from './pages/ai_analysis/JobDetail';
import AIAnalysisPage from "./pages/ai_analysis";
import ProtectedRoute from './components/ProtectedRoute';
import ThreatHuntingPage from './pages/threatHunting';
import LogsPage from './pages/logs';
import Setting from './pages/setting';
import Header from './components/header';
import Footer from './components/footer';
import JobList from "./pages/ai_analysis/JobList";
import CreateJob from "./pages/ai_analysis/CreateJob";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/ai-analysis" element={<JobList />} />
        <Route path="/ai-analysis/create" element={<CreateJob />} />
        <Route path="/ai-analysis/:jobId" element={<JobDetail />} />
        <Route path="/threatHunting" element={<ThreatHuntingPage />}/>
        <Route path="/logs" element={<LogsPage />}/>
        <Route path="/settings" element={<Setting />}/>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Footer />
    </>
  );
}

export default App;