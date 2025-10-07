import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';

interface TwoFactorVerifyProps {
  onVerify: (code: string) => void;
  onBack: () => void;
  onUseBackupCode: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function TwoFactorVerify({ 
  onVerify, 
  onBack, 
  onUseBackupCode, 
  isLoading = false, 
  error = null 
}: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === (isBackupMode ? 8 : 6)) {
      onVerify(code);
    }
  };

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const maxLength = isBackupMode ? 8 : 6;
    setCode(cleaned.slice(0, maxLength));
  };

  const toggleMode = () => {
    setIsBackupMode(!isBackupMode);
    setCode('');
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-400">
          {isBackupMode 
            ? 'Enter one of your backup codes' 
            : 'Enter the 6-digit code from your authenticator app'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {isBackupMode ? 'Backup Code' : 'Authentication Code'}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={isBackupMode ? 'XXXXXXXX' : '000000'}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-purple-500"
            maxLength={isBackupMode ? 8 : 6}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading || code.length !== (isBackupMode ? 8 : 6)}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Verify</span>
              </>
            )}
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            
            <button
              type="button"
              onClick={toggleMode}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isBackupMode ? 'Use App Code' : 'Use Backup Code'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Don't have access to your authenticator?{' '}
          <button
            onClick={onUseBackupCode}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Use a backup code instead
          </button>
        </p>
      </div>
    </div>
  );
}
