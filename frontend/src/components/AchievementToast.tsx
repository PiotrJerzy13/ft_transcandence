import { useEffect, useState } from 'react';
    import { Award } from 'lucide-react';
    import type { Achievement } from '../../types';

    interface ToastProps {
      achievement: Achievement;
      onDismiss: () => void;
    }

    export default function AchievementToast({ achievement, onDismiss }: ToastProps) {
      const [isVisible, setIsVisible] = useState(false);
      const [showModal, setShowModal] = useState(true); // Show modal on unlock

      useEffect(() => {
        setIsVisible(true); // Trigger fade-in
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300); // Wait for fade-out before removing
        }, 5000); // Disappear after 5 seconds
        return () => clearTimeout(timer);
      }, [onDismiss]);

      // Modal popup for achievement
      if (showModal) {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-slate-900 border-2 border-yellow-400 rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-xs">
              <Award className="w-12 h-12 text-yellow-400 mb-2" />
              <h2 className="text-xl font-bold text-yellow-300 mb-1">Achievement Unlocked!</h2>
              <p className="text-lg text-white font-semibold mb-2">{achievement.name}</p>
              <p className="text-sm text-gray-300 mb-4">{achievement.description}</p>
              <button
                className="mt-2 px-4 py-2 bg-yellow-400 text-slate-900 font-bold rounded hover:bg-yellow-300 transition"
                onClick={() => setShowModal(false)}
                autoFocus
              >
                Close
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className={`
          flex items-start p-4 mb-4 w-80 max-w-sm bg-slate-800 border border-yellow-500/50 rounded-lg shadow-lg 
          transform transition-all duration-300 ease-out
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}>
          <div className="flex-shrink-0">
            <Award className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-bold text-yellow-300">Achievement Unlocked!</p>
            <p className="mt-1 text-sm text-white">{achievement.name}</p>
          </div>
        </div>
      );
    }
