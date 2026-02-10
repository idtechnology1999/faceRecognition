import { useState, useEffect } from 'react';
import './OnboardingOne.css';

interface OnboardingOneProps {
  onNext: () => void;
}

const OnboardingOne: React.FC<OnboardingOneProps> = ({ onNext }) => {
  const [animate, setAnimate] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  return (
    <div className="onboarding-container">
      <div className={`onboarding-content ${animate ? 'animate' : ''}`}>
        {/* Animated Brain Icon */}
        <div className="brain-icon-container">
          <div className="brain-icon">🧠</div>
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>

        {/* Project Title */}
        <h1 className="project-title">
          <span className="gradient-text">EMOSCAN</span>
        </h1>
        <p className="project-subtitle">Real-Time Facial Emotion Recognition System</p>

        {/* Unified Details Card */}
        <div className="details-card">
          {/* Project Information Grid */}
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-icon">👨‍🎓</div>
              <div className="detail-content">
                <span className="detail-label">Student</span>
                <span className="detail-value">Adesiyan Temidayo Toluwani</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">🏛️</div>
              <div className="detail-content">
                <span className="detail-label">Institution</span>
                <span className="detail-value">Ajayi Crowther University</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">💻</div>
              <div className="detail-content">
                <span className="detail-label">Course</span>
                <span className="detail-value">Computer Science</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">👨‍🏫</div>
              <div className="detail-content">
                <span className="detail-label">Project Supervisor</span>
                <span className="detail-value">Dr. Oyediran</span>
              </div>
            </div>
          </div>

          {/* Detectable Emotions Section */}
          <h3 className="card-section-title">Detectable Emotions</h3>
          <div className="features-preview">
            <div className="feature-badge">😊 Happy</div>
            <div className="feature-badge">😢 Sad</div>
            <div className="feature-badge">😴 Bored</div>
            <div className="feature-badge">😠 Angry</div>
            <div className="feature-badge">😲 Surprised</div>
          </div>

          {/* Action Button */}
          <button className="next-button" onClick={onNext}>
            <span>Begin Experience</span>
            <span className="arrow">→</span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="progress-dots">
          <div className="dot active"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingOne;