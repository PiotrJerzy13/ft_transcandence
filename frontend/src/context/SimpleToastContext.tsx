import React, { createContext, useState, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SimpleToastContextType {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const SimpleToastContext = createContext<SimpleToastContextType | undefined>(undefined);

export const useSimpleToasts = () => {
  const context = useContext(SimpleToastContext);
  if (!context) throw new Error('useSimpleToasts must be used within a SimpleToastProvider');
  return context;
};

let idCounter = 0;

export const SimpleToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = idCounter++;
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
  }, []);

  const getToastStyles = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-400 text-white';
      case 'error':
        return 'bg-red-500 border-red-400 text-white';
      case 'info':
        return 'bg-blue-500 border-blue-400 text-white';
      default:
        return 'bg-gray-500 border-gray-400 text-white';
    }
  };

  return (
    <SimpleToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${getToastStyles(toast.type)}`}
          >
            <div className="flex items-center justify-between">
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </SimpleToastContext.Provider>
  );
};
