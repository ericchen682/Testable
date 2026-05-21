import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import { useEffect, useState } from 'react';
import Flashcard from './components/Flashcard';
import FlashcardSet from './components/FlashcardSet';
import Analytics from './pages/Analytics'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </BrowserRouter>
      <div style={{ padding: '2rem' }}>

        {!token && (
          <>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <small>
              At least 8 characters, with a capital letter, number, and special character.
            </small>

            <button onClick={handleSignup}>Sign up</button>
            <button onClick={handleLogin}>Log in</button>
          </>
        )}

        {token && (
          <>
            <button onClick={handleLogout}>Log out</button>
          </>
        )}

        <p>{message}</p>

        {flashcards.length > 0 && (
          <FlashcardSet flashcardList={flashcards} />
        )}
      </div>
    </>
  );
}

export default App
