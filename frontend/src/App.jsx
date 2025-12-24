// frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import AuthPage from './pages/auth';
import HomePage from './pages/home';
import JobDetail from './pages/ai_analysis/JobDetail';
import ProtectedRoute from './components/ProtectedRoute';
// import ThreatHuntingPage from './pages/threatHunting';
import LogsPage from './pages/logs';
import Setting from './pages/setting';
import Header from './components/header';
import Footer from './components/footer';
import JobList from "./pages/ai_analysis/JobList";
import CreateJob from "./pages/ai_analysis/CreateJob";
import ThreatHuntingPage from "./pages/threat_hunting/threatHuntingPage";
import ThreatHuntHistoryPage from "./pages/threat_hunting/ThreatHuntingHistoryPage";

function App() {
  return (
    <>
      <Header />
      <Routes>
        {/* History Page - Mặc định */}
        <Route 
          path="/threat-hunting" 
          element={<ThreatHuntHistoryPage />} 
        />

        {/* Create New Hunt */}
        <Route 
          path="/threat-hunting/new" 
          element={<ThreatHuntingPage />} 
        />

        {/* View Existing Hunt */}
        <Route 
          path="/threat-hunting/:huntId" 
          element={<ThreatHuntingPage />} 
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/ai-analysis" element={<JobList />} />
        <Route path="/ai-analysis/create" element={<CreateJob />} />
        <Route path="/ai-analysis/:jobId" element={<JobDetail />} />
        {/* <Route path="/threatHunting" element={<ThreatHuntingPage />}/> */}
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