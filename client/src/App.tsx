import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import FlashcardView from './pages/FlashcardView'
import FlashcardEditor from './pages/FlashcardEditor'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/flashcards/:setId" element={<FlashcardView />} />
        <Route path="/flashcards/:setId/edit" element={<FlashcardEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
