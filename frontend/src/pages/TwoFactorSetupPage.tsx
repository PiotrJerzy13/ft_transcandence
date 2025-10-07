import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TwoFactorSetup from '../components/TwoFactorSetup';

export default function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);

  const handleSetupComplete = () => {
    setIsComplete(true);
    setTimeout(() => {
      navigate('/settings/2fa');
    }, 2000);
  };

  const handleCancel = () => {
    navigate('/settings/2fa');
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">2FA Setup Complete!</h2>
          <p className="text-gray-400">Your account is now protected with two-factor authentication.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-xl max-w-lg w-full">
        <TwoFactorSetup 
          onSetupComplete={handleSetupComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
