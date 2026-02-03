import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, VideoOff, AlertCircle } from 'lucide-react';

interface VideoCaptureProps {
  isActive: boolean;
  onFrameCapture?: (frameData: string) => void;
  captureInterval?: number;
  className?: string;
}

export default function VideoCapture({ 
  isActive, 
  onFrameCapture,
  captureInterval = 5000,
  className = ''
}: VideoCaptureProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [error, setError] = useState('');
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start video stream
  const startVideo = async () => {
    try {
      setError('');
      setIsInitializing(true);
      
      console.log('Requesting camera access...');
      
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera access granted, setting up video...');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Force video to play
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.log('Video play error (might be normal):', playError);
        }
        
        // Set a timeout in case onloadedmetadata never fires
        const timeout = setTimeout(() => {
          if (!isVideoEnabled && stream.active) {
            console.log('Video metadata timeout, forcing enable...');
            setIsVideoEnabled(true);
            setIsInitializing(false);
          }
        }, 3000); // 3 second timeout
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded successfully');
          clearTimeout(timeout);
          setIsVideoEnabled(true);
          setIsInitializing(false);
        };
        
        // Also listen for canplay event as backup
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
          if (!isVideoEnabled) {
            clearTimeout(timeout);
            setIsVideoEnabled(true);
            setIsInitializing(false);
          }
        };
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'Camera access denied. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera access in your browser. Click the camera icon in the address bar or check browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'Camera is being used by another application. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not meet requirements. Try a different camera.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      setIsVideoEnabled(false);
      setIsInitializing(false);
    }
  };

  // Stop video stream
  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoEnabled(false);
  };

  // Capture a frame from video
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isVideoEnabled) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 JPEG (without data URL prefix for API)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataUrl.split(',')[1]; // Remove "data:image/jpeg;base64," prefix

    return base64Data;
  }, [isVideoEnabled]);

  // Auto-capture frames during active session (for future use)
  useEffect(() => {
    if (isActive && isVideoEnabled && onFrameCapture) {
      // Capture immediately
      const frameData = captureFrame();
      if (frameData) {
        setCapturedFrames(prev => [...prev, frameData]);
        onFrameCapture(frameData);
      }

      // Set up interval for periodic captures
      captureIntervalRef.current = setInterval(() => {
        const frameData = captureFrame();
        if (frameData) {
          setCapturedFrames(prev => {
            const newFrames = [...prev, frameData];
            return newFrames.slice(-10);
          });
          onFrameCapture(frameData);
        }
      }, captureInterval);

      return () => {
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
        }
      };
    }
  }, [isActive, isVideoEnabled, captureFrame, captureInterval, onFrameCapture]);

  // Get all captured frames
  const getAllFrames = useCallback(() => {
    return capturedFrames;
  }, [capturedFrames]);

  // Expose method to parent component
  useEffect(() => {
    (window as any).__getVideoFrames = getAllFrames;
  }, [getAllFrames]);

  // Auto-start camera when active
  useEffect(() => {
    if (isActive && !isVideoEnabled && !error && !isInitializing) {
      console.log('Auto-starting camera...');
      const timer = setTimeout(() => {
        startVideo();
      }, 100); // Small delay to ensure component is mounted
      return () => clearTimeout(timer);
    }
  }, [isActive, isVideoEnabled, error, isInitializing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Video Container with Rounded Rectangle */}
      <div 
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-700"
        style={{ aspectRatio: '3/4', maxHeight: '500px', minHeight: '400px' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 z-10">
            <div className="text-center p-6 max-w-sm">
              {isInitializing ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white text-lg font-medium mb-2">Starting Camera...</p>
                  <p className="text-gray-400 text-sm mb-3">Please wait while we connect to your camera</p>
                  <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-3 text-xs text-blue-200">
                    <p className="font-medium mb-1">💡 If prompted, click "Allow" for camera access</p>
                    <p className="text-blue-300">Look for camera icon 🎥 in browser address bar</p>
                  </div>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <p className="text-white text-lg font-medium mb-3">Camera Access Issue</p>
                  <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 mb-4 text-left">
                    <p className="text-red-200 text-sm mb-3">{error}</p>
                    <div className="text-xs text-red-300 space-y-1">
                      <p className="font-semibold">📍 How to fix:</p>
                      <p>1. Click the camera icon 🎥 in your browser's address bar</p>
                      <p>2. Select "Allow" for camera access</p>
                      <p>3. On Mac: System Settings → Privacy & Security → Camera</p>
                      <p>4. Make sure your browser has camera permission</p>
                    </div>
                  </div>
                  <button 
                    onClick={startVideo}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-lg"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <VideoOff className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-sm">Initializing camera...</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Camera Active Indicator */}
        {isVideoEnabled && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-500 bg-opacity-90 text-white px-3 py-1.5 rounded-full shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Camera On</span>
          </div>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Export helper function to get frames
export function getVideoFrames(): string[] {
  return (window as any).__getVideoFrames?.() || [];
}

