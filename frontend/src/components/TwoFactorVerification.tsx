import React, { useState } from 'react';
import { useSimpleToasts } from '../context/SimpleToastContext';

interface TwoFactorVerificationProps {
  onVerify: (token: string) => void;
  onCancel: () => void;
  onUseBackupCode: () => void;
  isLoading?: boolean;
}

export default function TwoFactorVerification({ 
  onVerify, 
  onCancel, 
  onUseBackupCode, 
  isLoading = false 
}: TwoFactorVerificationProps) {
  const [token, setToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { addToast } = useSimpleToasts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useBackupCode) {
      if (!token || token.length !== 9) {
        addToast('Please enter a valid backup code (XXXX-XXXX format)', 'error');
        return;
      }
    } else {
      if (!token || token.length !== 6) {
        addToast('Please enter a valid 6-digit token', 'error');
        return;
      }
    }

    onVerify(token);
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    if (useBackupCode) {
      // Allow letters and numbers for backup codes, format as XXXX-XXXX
      value = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
      if (value.length >= 4) {
        value = value.slice(0, 4) + '-' + value.slice(4);
      }
    } else {
      // Only allow numbers for TOTP tokens
      value = value.replace(/\D/g, '').slice(0, 6);
    }
    
    setToken(value);
  };

  const handleBackupCodeClick = () => {
    setUseBackupCode(true);
    onUseBackupCode();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Two-Factor Authentication
        </h2>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-gray-300">
              {useBackupCode 
                ? 'Enter your backup code to access your account'
                : 'Enter the 6-digit code from your authenticator app'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={token}
                onChange={handleTokenChange}
                placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none text-center text-xl tracking-widest"
                maxLength={useBackupCode ? 9 : 6}
                autoFocus
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading || token.length !== (useBackupCode ? 9 : 6)}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>

          {!useBackupCode && (
            <div className="text-center">
              <button
                onClick={handleBackupCodeClick}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Use backup code instead
              </button>
            </div>
          )}

          <div className="text-center text-xs text-gray-400">
            <p>
              {useBackupCode 
                ? 'Backup codes are 8-character codes you received when setting up 2FA'
                : 'The code refreshes every 30 seconds'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
