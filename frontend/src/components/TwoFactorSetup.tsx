import React, { useState, useEffect } from 'react';
import { useSimpleToasts } from '../context/SimpleToastContext';
import { API_ENDPOINTS } from '../config/api';

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
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const { addToast } = useSimpleToasts();

  // Get current user's username for 2FA setup
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Get username from localStorage or context
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUsername(user.username || '');
    }
  }, []);

  const generateSetup = async () => {
    if (!username) {
      addToast('Username not found. Please log in again.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_SETUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data.data);
        setStep('verify');
        addToast('2FA setup generated successfully!', 'success');
      } else {
        const errorData = await response.json();
        addToast(errorData.message || 'Failed to generate 2FA setup', 'error');
      }
    } catch (error) {
      console.error('Error generating 2FA setup:', error);
      addToast('Failed to generate 2FA setup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!token || token.length !== 6) {
      addToast('Please enter a valid 6-digit token', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_VERIFY_SETUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        addToast('2FA enabled successfully!', 'success');
        onSetupComplete();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || 'Failed to verify 2FA setup', 'error');
      }
    } catch (error) {
      console.error('Error verifying 2FA setup:', error);
      addToast('Failed to verify 2FA setup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const codesText = setupData.backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 'setup') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">Enable Two-Factor Authentication</h2>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Two-factor authentication adds an extra layer of security to your account. 
              You'll need to scan a QR code with an authenticator app like Google Authenticator or Authy.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={generateSetup}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Generating...' : 'Generate Setup'}
              </button>
              
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Complete 2FA Setup</h2>
        
        <div className="space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-4">Scan QR Code</h3>
            {setupData?.qrCodeUrl && (
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={setupData.qrCodeUrl} 
                  alt="2FA QR Code" 
                  className="w-48 h-48"
                />
              </div>
            )}
            <p className="text-gray-300 text-sm mt-2">
              Scan this QR code with your authenticator app
            </p>
          </div>

          {/* Manual Entry */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Manual Entry</h3>
            <p className="text-gray-300 text-sm mb-2">
              If you can't scan the QR code, enter this secret manually:
            </p>
            <div className="bg-slate-700 p-3 rounded-lg">
              <code className="text-green-400 font-mono text-sm break-all">
                {setupData?.secret}
              </code>
            </div>
          </div>

          {/* Backup Codes */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Backup Codes</h3>
            <p className="text-gray-300 text-sm mb-3">
              Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
            </p>
            <div className="bg-slate-700 p-3 rounded-lg mb-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {setupData?.backupCodes.map((code, index) => (
                  <code key={index} className="text-yellow-400 font-mono">
                    {code}
                  </code>
                ))}
              </div>
            </div>
            <button
              onClick={downloadBackupCodes}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Download Backup Codes
            </button>
          </div>

          {/* Verification */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Verify Setup</h3>
            <p className="text-gray-300 text-sm mb-3">
              Enter the 6-digit code from your authenticator app to complete setup:
            </p>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={verifySetup}
              disabled={isLoading || token.length !== 6}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Enable 2FA'}
            </button>
            
            <button
              onClick={() => setStep('setup')}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
