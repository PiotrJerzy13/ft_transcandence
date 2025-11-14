import { useState, useEffect, useCallback } from 'react';

export function useCountdown(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    if (seconds <= 0) {
      setIsRunning(false);
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setSeconds(s => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, seconds, onComplete]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
  };
}

