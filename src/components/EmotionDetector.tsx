import { useState, useRef, useEffect } from 'react';
import './EmotionDetector.css';
import * as faceapi from 'face-api.js';

interface EmotionDetectorProps {
  userName: string;
}

type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'neutral';

interface ScanResult {
  emotion: Emotion;
  confidence: number;
  timestamp: string;
  allEmotions: Record<Emotion, number>;
  faceSize: string;
  quality: 'excellent' | 'good' | 'poor';
}

const EmotionDetector: React.FC<EmotionDetectorProps> = ({ userName }) => {
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const CONFIDENCE_THRESHOLD = 0.5;

  useEffect(() => {
    console.log('🚀 EMOSCAN Component mounted');
    loadModels();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadModels = async () => {
    console.log('📦 Loading AI models...');
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      setModelsLoaded(true);
      console.log('✓ AI models loaded successfully!');
    } catch (error) {
      console.error('❌ Error loading models:', error);
      alert('Failed to load AI models. Please check your internet connection.');
    }
  };

  const emotionEmojis: Record<Emotion, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    surprised: '😲',
    fearful: '😨',
    disgusted: '🤢',
    neutral: '😐'
  };

  const emotionColors: Record<Emotion, string> = {
    happy: '#4ade80',
    sad: '#60a5fa',
    angry: '#f87171',
    surprised: '#fbbf24',
    fearful: '#a78bfa',
    disgusted: '#34d399',
    neutral: '#94a3b8'
  };

  const emotionDescriptions: Record<Emotion, string> = {
    happy: 'Feeling joyful and positive',
    sad: 'Feeling down or melancholic',
    angry: 'Feeling frustrated or irritated',
    surprised: 'Feeling shocked or amazed',
    fearful: 'Feeling worried or anxious',
    disgusted: 'Feeling repulsed or averse',
    neutral: 'Feeling calm and composed'
  };

  const startCamera = async () => {
    if (isStartingRef.current || isCameraOn || streamRef.current) {
      return;
    }

    if (!modelsLoaded) {
      alert('AI models are still loading. Please wait...');
      return;
    }

    isStartingRef.current = true;
    console.log('📷 Starting camera...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }, 
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      });
      
      console.log('✓ Camera access granted');
      await new Promise(resolve => setTimeout(resolve, 0));
      
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        isStartingRef.current = false;
        return;
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      await videoRef.current.play();

      const handleMetadata = () => {
        console.log('✓ Camera ready');
        setIsCameraOn(true);
        isStartingRef.current = false;
        setScanResult(null); // Clear previous result
      };

      videoRef.current.onloadedmetadata = handleMetadata;

      setTimeout(() => {
        if (!isCameraOn && videoRef.current && videoRef.current.videoWidth > 0) {
          handleMetadata();
        }
      }, 2000);

    } catch (error: any) {
      console.error('❌ Camera error:', error);
      isStartingRef.current = false;
      
      if (error.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera found. Please connect a camera.');
      } else {
        alert('Unable to access camera: ' + error.message);
      }
    }
  };

  const stopCamera = () => {
    console.log('🛑 Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOn(false);
    setScanResult(null);
  };

  const performScan = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || isScanning) {
      return;
    }

    if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      alert('Camera is not ready yet. Please wait a moment.');
      return;
    }

    setIsScanning(true);
    console.log('🔍 Scanning...');

    try {
      // Detect face with expressions
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceExpressions();

      if (!detections) {
        // NO FACE DETECTED
        console.log('❌ No face detected');
        setIsScanning(false);
        alert('No face detected! Please position your face in front of the camera and try again.');
        return;
      }

      // FACE DETECTED - Build detailed result
      const expressions = detections.expressions;
      const emotionEntries = Object.entries(expressions) as [string, number][];
      const sortedEmotions = emotionEntries.sort((a, b) => b[1] - a[1]);
      const [topEmotion, topConfidence] = sortedEmotions[0];

      // Calculate quality
      const detection = detections.detection;
      const faceSize = detection.box.width * detection.box.height;
      const videoSize = videoRef.current.videoWidth * videoRef.current.videoHeight;
      const faceRatio = faceSize / videoSize;

      let quality: 'excellent' | 'good' | 'poor';
      if (faceRatio > 0.15) {
        quality = 'excellent';
      } else if (faceRatio > 0.08) {
        quality = 'good';
      } else {
        quality = 'poor';
      }

      // Map emotions
      const emotionMap: Record<string, Emotion> = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'angry',
        'surprised': 'surprised',
        'fearful': 'fearful',
        'disgusted': 'disgusted',
        'neutral': 'neutral'
      };

      const mappedEmotion = emotionMap[topEmotion] || 'neutral';

      // Get all emotions with their percentages
      const allEmotions: Record<Emotion, number> = {
        happy: expressions.happy,
        sad: expressions.sad,
        angry: expressions.angry,
        surprised: expressions.surprised,
        fearful: expressions.fearful,
        disgusted: expressions.disgusted,
        neutral: expressions.neutral
      };

      // Create result object
      const result: ScanResult = {
        emotion: mappedEmotion,
        confidence: topConfidence,
        timestamp: new Date().toLocaleString(),
        allEmotions: allEmotions,
        faceSize: `${Math.round(detection.box.width)}x${Math.round(detection.box.height)}px`,
        quality: quality
      };

      console.log('✓ Scan complete:', result);
      setScanResult(result);
      setScanCount(prev => prev + 1);
      setIsScanning(false);

    } catch (error) {
      console.error('❌ Scan error:', error);
      setIsScanning(false);
      alert('Error during scan. Please try again.');
    }
  };

  const getGreeting = (emotion: Emotion): string => {
    const greetings: Record<Emotion, string> = {
      happy: `${userName}, you're radiating joy! 🌟`,
      sad: `${userName}, I'm here for you 💙`,
      angry: `${userName}, take a deep breath 🌊`,
      surprised: `Wow ${userName}, what a surprise! ⚡`,
      fearful: `${userName}, you're safe here 🛡️`,
      disgusted: `${userName}, something's not right? 🤔`,
      neutral: `${userName}, feeling calm 🧘`
    };
    return greetings[emotion];
  };

  return (
    <div className="emotion-detector">
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">🧠</div>
          <h1 className="app-title">EMOSCAN</h1>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Snapshot Mode
          </p>
        </div>
        <div className={`ai-status ${modelsLoaded ? 'ready' : 'loading'}`}>
          <div className="status-indicator"></div>
          <span>
            {modelsLoaded ? '✅ Ready' : '⏳ Loading...'}
          </span>
        </div>
      </header>

      <div className="main-content">
        <div className="video-section">
          <div className="video-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="video-feed"
              style={{ display: isCameraOn ? 'block' : 'none' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {isCameraOn ? (
              <>
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  CAMERA ON
                </div>
                {isScanning && (
                  <div className="analyzing-overlay">
                    <div className="scanning-line"></div>
                    <p>Scanning your emotion...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="camera-placeholder">
                <div className="camera-icon">📷</div>
                <p>Start camera to begin</p>
                {!modelsLoaded && (
                  <p style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.5rem' }}>
                    ⏳ Loading AI models...
                  </p>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {!isCameraOn ? (
              <button
                className="camera-button start"
                onClick={startCamera}
                disabled={!modelsLoaded}
                style={{ flex: 1 }}
              >
                <span className="button-icon">📷</span>
                Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={performScan}
                  disabled={isScanning}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    background: scanResult ? '#fbbf24' : '#4ade80',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    opacity: isScanning ? 0.5 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  {isScanning ? '⏳ Scanning...' : scanResult ? '🔄 Rescan' : '🔍 Scan Now'}
                </button>
                <button
                  className="camera-button stop"
                  onClick={stopCamera}
                  style={{ flex: 0.3 }}
                >
                  <span className="button-icon">🔴</span>
                  Stop
                </button>
              </>
            )}
          </div>

          {isCameraOn && !scanResult && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#4ade80',
              textAlign: 'center'
            }}>
              👉 Position your face in the camera and click "Scan Now"
            </div>
          )}

          {scanCount > 0 && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem', 
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center'
            }}>
              Total scans: {scanCount}
            </div>
          )}
        </div>

        <div className="analysis-section">
          {scanResult ? (
            <>
              {/* Main Result Card */}
              <div className="emotion-card">
                <h3 className="card-title">SCAN RESULT</h3>
                <div className="emotion-display">
                  <div 
                    className="emotion-emoji-large"
                    style={{ 
                      background: `linear-gradient(135deg, ${emotionColors[scanResult.emotion]}40, ${emotionColors[scanResult.emotion]}20)`,
                      borderColor: emotionColors[scanResult.emotion]
                    }}
                  >
                    {emotionEmojis[scanResult.emotion]}
                  </div>
                  <div className="emotion-label">
                    <h2 style={{ color: emotionColors[scanResult.emotion] }}>
                      {scanResult.emotion.charAt(0).toUpperCase() + scanResult.emotion.slice(1)}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
                      {emotionDescriptions[scanResult.emotion]}
                    </p>
                    <div className="confidence-bar" style={{ marginTop: '1rem' }}>
                      <div 
                        className="confidence-fill"
                        style={{ 
                          width: `${Math.round(scanResult.confidence * 100)}%`,
                          background: emotionColors[scanResult.emotion]
                        }}
                      ></div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                      Confidence: {Math.round(scanResult.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis Card */}
              <div className="analysis-card">
                <h3 className="card-title">DETAILED ANALYSIS</h3>
                <div className="analysis-content">
                  <p className="greeting-message" style={{ marginBottom: '1.5rem' }}>
                    {getGreeting(scanResult.emotion)}
                  </p>

                  {/* All Emotions Breakdown */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                      Emotion Breakdown:
                    </h4>
                    {Object.entries(scanResult.allEmotions)
                      .sort((a, b) => b[1] - a[1])
                      .map(([emotion, value]) => (
                        <div key={emotion} style={{ marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <span>
                              {emotionEmojis[emotion as Emotion]} {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                            </span>
                            <span style={{ color: emotionColors[emotion as Emotion] }}>
                              {Math.round(value * 100)}%
                            </span>
                          </div>
                          <div style={{ 
                            width: '100%', 
                            height: '4px', 
                            background: 'rgba(255,255,255,0.1)', 
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              width: `${value * 100}%`, 
                              height: '100%', 
                              background: emotionColors[emotion as Emotion],
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Scan Details */}
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Scan Time:</strong> {scanResult.timestamp}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Face Size:</strong> {scanResult.faceSize}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong>Quality:</strong> 
                      <span style={{ 
                        color: scanResult.quality === 'excellent' ? '#4ade80' : 
                               scanResult.quality === 'good' ? '#fbbf24' : '#f87171'
                      }}>
                        {scanResult.quality === 'excellent' && '✅ Excellent'}
                        {scanResult.quality === 'good' && '👍 Good'}
                        {scanResult.quality === 'poor' && '⚠️ Poor'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="emotion-card">
              <h3 className="card-title">WAITING FOR SCAN</h3>
              <div className="emotion-display">
                <div className="no-face-icon">📸</div>
                <p className="no-face-text">
                  {isCameraOn ? 'Click "Scan Now" to analyze your emotion' : 'Start camera to begin'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionDetector;