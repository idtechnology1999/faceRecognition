import { useState, useEffect } from 'react';
import OnboardingOne from './components/OnboardingOne';
import OnboardingTwo from './components/OnboardingTwo';
import EmotionDetector from './components/EmotionDetector';
import './App.css';

type Screen = 'onboarding1' | 'onboarding2' | 'main';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding1');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Check if user has already onboarded
    const storedName = sessionStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
      setCurrentScreen('main');
    }
  }, []);

  const handleOnboardingOneComplete = () => {
    setCurrentScreen('onboarding2');
  };

  const handleNameSubmit = (name: string) => {
    const finalName = name.trim() || 'User';
    setUserName(finalName);
    sessionStorage.setItem('userName', finalName);
    setCurrentScreen('main');
  };

  return (
    <div className="app">
      {currentScreen === 'onboarding1' && (
        <OnboardingOne onNext={handleOnboardingOneComplete} />
      )}
      {currentScreen === 'onboarding2' && (
        <OnboardingTwo onSubmit={handleNameSubmit} />
      )}
      {currentScreen === 'main' && (
        <EmotionDetector userName={userName} />
      )}
    </div>
  );
}

export default App;