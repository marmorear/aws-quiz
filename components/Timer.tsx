
import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
  isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialTime, onTimeUp, isPaused }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeLeft(initialTime); 
  }, [initialTime]);

  useEffect(() => {
    if (isPaused) {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    if (timeLeft <= 0) {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      onTimeUp();
      return;
    }

    intervalIdRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => {
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
      }
    };
  }, [timeLeft, onTimeUp, isPaused]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`font-mono text-lg p-2 rounded-md ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-700'} bg-gray-100 shadow-sm border border-gray-200`}>
      Tempo: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
};

export default Timer;