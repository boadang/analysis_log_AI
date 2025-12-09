// frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import AuthPage from './pages/auth';
import HomePage from './pages/home';
import AIAnalysisPage from "./pages/ai_analysis";
import ProtectedRoute from './components/ProtectedRoute';
import ThreatHuntingPage from './pages/threatHunting';
import LogsPage from './pages/logs';
import Setting from './pages/setting';
import Header from './components/header';
import Footer from './components/footer';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/aiAnalysis" element={<AIAnalysisPage />} />
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