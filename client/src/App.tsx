import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import FlashcardView from './pages/FlashcardView'
import FlashcardEditor from './pages/FlashcardEditor'
import Analytics from './pages/Analytics'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

function PageFade({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-fade-in">
      { children }
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PageFade><Login /></PageFade>} />
        <Route path="/signup" element={<PageFade><Signup /></PageFade>} />
        <Route path="/forgot-password" element={<PageFade><ForgotPassword /></PageFade>} />
        <Route path="/reset-password" element={<PageFade><ResetPassword /></PageFade>} />
        <Route path="/dashboard" element={<PageFade><Dashboard /></PageFade>} />
        <Route path="/flashcards/:setId" element={<PageFade><FlashcardView /></PageFade>} />
        <Route path="/flashcards/:setId/edit" element={<PageFade><FlashcardEditor /></PageFade>} />
        <Route path="/analytics" element={<PageFade><Analytics /></PageFade>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App