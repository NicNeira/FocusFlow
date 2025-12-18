import { useState, useEffect, useCallback, useRef } from 'react';
import { pipService } from '../services/pipService';

interface UsePictureInPictureProps {
  time: string;
  isRunning: boolean;
  isBreakTime?: boolean;
  status?: string;
  hasElapsedTime?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSave?: () => void;
  onReset?: () => void;
}

interface UsePictureInPictureReturn {
  isSupported: boolean;
  isActive: boolean;
  openPiP: () => Promise<void>;
  closePiP: () => void;
  togglePiP: () => Promise<void>;
}

export function usePictureInPicture({
  time,
  isRunning,
  isBreakTime = false,
  status,
  hasElapsedTime = false,
  onPlay,
  onPause,
  onSave,
  onReset,
}: UsePictureInPictureProps): UsePictureInPictureReturn {
  const [isActive, setIsActive] = useState(false);
  const isSupported = pipService.isSupported();
  const controlsSetup = useRef(false);

  // Update PiP display when timer state changes
  useEffect(() => {
    if (isActive && pipService.isActive()) {
      pipService.updateDisplay({
        time,
        isRunning,
        isBreakTime,
        status,
        hasElapsedTime,
      });
    }
  }, [time, isRunning, isBreakTime, status, hasElapsedTime, isActive]);

  // Setup controls when PiP becomes active
  useEffect(() => {
    if (isActive && pipService.isActive() && !controlsSetup.current) {
      pipService.setupControls({
        onPlay,
        onPause,
        onSave,
        onStop: onReset,
      });
      controlsSetup.current = true;
    }

    if (!isActive) {
      controlsSetup.current = false;
    }
  }, [isActive, onPlay, onPause, onSave, onReset]);

  // Handle PiP close
  useEffect(() => {
    pipService.onClose(() => {
      setIsActive(false);
      controlsSetup.current = false;
    });

    return () => {
      pipService.destroy();
    };
  }, []);

  const openPiP = useCallback(async () => {
    if (!isSupported) {
      console.warn('Picture-in-Picture is not supported in this browser');
      return;
    }

    const pipWindow = await pipService.open();

    if (pipWindow) {
      setIsActive(true);
      controlsSetup.current = false;

      // Initial update
      pipService.updateDisplay({
        time,
        isRunning,
        isBreakTime,
        status,
        hasElapsedTime,
      });

      // Setup controls
      pipService.setupControls({
        onPlay,
        onPause,
        onSave,
        onStop: onReset,
      });
      controlsSetup.current = true;
    }
  }, [isSupported, time, isRunning, isBreakTime, status, hasElapsedTime, onPlay, onPause, onSave, onReset]);

  const closePiP = useCallback(() => {
    pipService.close();
    setIsActive(false);
    controlsSetup.current = false;
  }, []);

  const togglePiP = useCallback(async () => {
    if (isActive) {
      closePiP();
    } else {
      await openPiP();
    }
  }, [isActive, openPiP, closePiP]);

  return {
    isSupported,
    isActive,
    openPiP,
    closePiP,
    togglePiP,
  };
}

export default usePictureInPicture;
