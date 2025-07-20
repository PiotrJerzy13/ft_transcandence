import React, { createContext, useState, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import AchievementToast from '../components/AchievementToast';
import type { Achievement } from '../types';

interface Toast extends Achievement {
  id: number; // Ensure unique key
}

interface ToastContextType {
  addToast: (achievement: Achievement) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts must be used within a ToastProvider');
  return context;
};

let idCounter = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((achievement: Achievement) => {
    const id = idCounter++;
    setToasts(prevToasts => [...prevToasts, { ...achievement, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50">
        {toasts.map(toast => (
          <AchievementToast key={toast.id} achievement={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
