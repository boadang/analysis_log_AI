// App.jsx
import { Routes, Route } from "react-router-dom";
import AuthPage from './pages/auth';
import HomePage from './pages/home';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/header';
import Footer from './components/footer';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
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