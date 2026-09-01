import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import QuizGenerator from './components/QuizGenerator';
import ProfilePage from './components/ProfilePage';
import AuthModal from './components/AuthModal';
import { initAuth, getCurrentUser } from './services/auth';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'quiz' | 'profile'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initAuth();
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('landing');
  };

  const handleOpenAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      {view === 'quiz' && (
        <QuizGenerator onGoHome={() => setView('landing')} />
      )}

      {view === 'profile' && (
        <ProfilePage
          onGoHome={() => setView('landing')}
          onLogout={handleLogout}
        />
      )}

      {view === 'landing' && (
        <LandingPage
          currentUser={currentUser}
          onOpenAuthModal={handleOpenAuthModal}
          onOpenQuiz={() => setView('quiz')}
          onOpenProfile={() => setView('profile')}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
