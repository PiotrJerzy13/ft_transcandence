import { useEffect, useState } from 'react';
    import { Award } from 'lucide-react';
    import type { Achievement } from '../../types';

    interface ToastProps {
      achievement: Achievement;
      onDismiss: () => void;
    }

    export default function AchievementToast({ achievement, onDismiss }: ToastProps) {
      const [isVisible, setIsVisible] = useState(false);

      useEffect(() => {
        setIsVisible(true); // Trigger fade-in
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onDismiss, 300); // Wait for fade-out before removing
        }, 5000); // Disappear after 5 seconds
        return () => clearTimeout(timer);
      }, [onDismiss]);

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
