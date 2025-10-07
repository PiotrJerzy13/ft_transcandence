import React, { useState, useEffect } from 'react';
import { Shield, QrCode, Copy, Check, AlertTriangle, Download } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { usePlayerData } from '../context/PlayerDataContext';

interface TwoFactorSetupProps {
  onSetupComplete: () => void;
  onCancel: () => void;
}

interface SetupData {
  qrCodeUrl: string;
  backupCodes: string[];
  secret: string;
}

export default function TwoFactorSetup({ onSetupComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const { playerData } = usePlayerData();

  // Generate 2FA setup when component mounts
  useEffect(() => {
    generateSetup();
  }, []);

  const generateSetup = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_SETUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: playerData?.user?.username || 'user' })
      });

      if (!response.ok) {
        throw new Error('Failed to generate 2FA setup');
      }

      const data = await response.json();
      setSetupData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_VERIFY_SETUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: verificationCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid verification code');
      }

      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = `FT Transcendence - Backup Codes\n\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `IMPORTANT: Store these codes in a safe place!\n\n` +
      setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n') +
      `\n\nEach code can only be used once.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ft-transcendence-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading && !setupData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-400">Generating 2FA setup...</span>
      </div>
    );
  }

  if (!setupData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Setup Failed</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={generateSetup}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Step 1: QR Code */}
      {step === 'qr' && (
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg mb-6 inline-block">
            <img 
              src={setupData.qrCodeUrl} 
              alt="2FA QR Code" 
              className="w-48 h-48"
            />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4">Scan QR Code</h3>
          <p className="text-gray-400 mb-6">
            Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code.
          </p>

          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-400 mb-2">Can't scan? Enter this code manually:</p>
            <div className="flex items-center justify-center space-x-2">
              <code className="bg-gray-700 px-3 py-2 rounded text-white font-mono text-sm">
                {setupData.secret}
              </code>
              <button
                onClick={copySecret}
                className="p-2 hover:bg-gray-600 rounded transition-colors"
                title="Copy secret"
              >
                {copiedSecret ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            I've Added the Account
          </button>
        </div>
      )}

      {/* Step 2: Verification */}
      {step === 'verify' && (
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-4">Verify Setup</h3>
          <p className="text-gray-400 mb-6">
            Enter the 6-digit code from your authenticator app to verify the setup.
          </p>

          <div className="mb-6">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-purple-500"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('qr')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={verifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 'backup' && (
        <div className="text-center">
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <h4 className="text-yellow-400 font-semibold mb-2">Save Your Backup Codes!</h4>
            <p className="text-yellow-200 text-sm">
              These codes can be used to access your account if you lose your authenticator device.
              Each code can only be used once.
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h4 className="text-white font-semibold mb-4">Your Backup Codes:</h4>
            <div className="grid grid-cols-2 gap-2 text-left">
              {setupData.backupCodes.map((code, index) => (
                <div key={index} className="bg-gray-700 px-3 py-2 rounded text-white font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 mb-6">
            <button
              onClick={downloadBackupCodes}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(setupData.backupCodes.join('\n'))}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy All</span>
            </button>
          </div>

          <button
            onClick={onSetupComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Complete Setup
          </button>
        </div>
      )}

      {/* Cancel Button */}
      <div className="mt-6 text-center">
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Cancel Setup
        </button>
      </div>
    </div>
  );
}