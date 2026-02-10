import { useState, useEffect } from 'react';
import './OnboardingTwo.css';

interface OnboardingTwoProps {
  onSubmit: (name: string) => void;
}

const OnboardingTwo: React.FC<OnboardingTwoProps> = ({ onSubmit }) => {
  const [name, setName] = useState<string>('');
  const [animate, setAnimate] = useState<boolean>(false);
  const [typing, setTyping] = useState<boolean>(false);
  const [displayText, setDisplayText] = useState<string>('');
  const fullText = "How would you like me to address you?";

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
    
    // Typewriter effect
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
        setTyping(true);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(name);
  };

  const handleSkip = () => {
    onSubmit('');
  };

  return (
    <div className="onboarding-container-two">
      <div className={`onboarding-content-two ${animate ? 'animate' : ''}`}>
        {/* Animated Icon */}
        <div className="greeting-icon-container">
          <div className="greeting-icon">👋</div>
          <div className="sparkle sparkle-1">✨</div>
          <div className="sparkle sparkle-2">✨</div>
          <div className="sparkle sparkle-3">✨</div>
        </div>

        {/* Typewriter Text */}
        <h1 className="greeting-title">
          {displayText}
          <span className="cursor">|</span>
        </h1>

        <p className="greeting-subtitle">
          Let's personalize your experience
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="name-form">
          <div className="input-container">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="name-input"
              autoFocus
            />
            <div className="input-underline"></div>
          </div>

          {/* Action Buttons - Skip left, Continue right */}
          <div className="button-group">
            <button type="button" onClick={handleSkip} className="skip-button">
              <span>Skip</span>
              <span className="button-icon">→</span>
            </button>
            
            <button type="submit" className="submit-button">
              <span>Continue</span>
              <span className="button-icon">✓</span>
            </button>
          </div>
        </form>

        {/* Preview Section */}
        {name && (
          <div className="preview-section">
            <div className="preview-bubble">
              <span className="preview-label">Preview:</span>
              <span className="preview-text">"Hello, <strong>{name}</strong>! 😊"</span>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="progress-dots">
          <div className="dot"></div>
          <div className="dot active"></div>
        </div>
      </div>

      {/* Floating Emojis Background */}
      <div className="floating-emojis">
        <span className="emoji" style={{ left: '10%', animationDelay: '0s' }}>😊</span>
        <span className="emoji" style={{ left: '30%', animationDelay: '1s' }}>😢</span>
        <span className="emoji" style={{ left: '50%', animationDelay: '2s' }}>😴</span>
        <span className="emoji" style={{ left: '70%', animationDelay: '1.5s' }}>😠</span>
        <span className="emoji" style={{ left: '90%', animationDelay: '0.5s' }}>😲</span>
      </div>
    </div>
  );
};

export default OnboardingTwo;