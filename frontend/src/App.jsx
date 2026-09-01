import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import QuizGenerator from './components/QuizGenerator';
import ProfilePage from './components/ProfilePage';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'quiz' | 'profile'

  if (view === 'quiz') {
    return <QuizGenerator onGoHome={() => setView('landing')} />;
  }

  if (view === 'profile') {
    return <ProfilePage onGoHome={() => setView('landing')} />;
  }

  return (
    <LandingPage
      onOpenQuiz={() => setView('quiz')}
      onOpenProfile={() => setView('profile')}
    />
  );
}
