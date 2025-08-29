import React, { useState, useEffect } from 'react';
import { useSimpleToasts } from '../context/SimpleToastContext';
import { API_ENDPOINTS } from '../config/api';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
  backupCodesCount: number;
}

export default function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [disableToken, setDisableToken] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const { addToast } = useSimpleToasts();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_STATUS, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);
      } else {
        console.error('Failed to fetch 2FA status');
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    fetchStatus();
    addToast('2FA has been enabled successfully!', 'success');
  };

  const handleDisable2FA = async () => {
    if (!disableToken || disableToken.length !== 6) {
      addToast('Please enter a valid 6-digit token', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_DISABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: disableToken }),
      });

      if (response.ok) {
        addToast('2FA has been disabled successfully!', 'success');
        setShowDisableModal(false);
        setDisableToken('');
        fetchStatus();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || 'Failed to disable 2FA', 'error');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      addToast('Failed to disable 2FA', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupCodes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_BACKUP_CODES, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.data.backupCodes);
        setShowBackupCodes(true);
      } else {
        const errorData = await response.json();
        addToast(errorData.message || 'Failed to fetch backup codes', 'error');
      }
    } catch (error) {
      console.error('Error fetching backup codes:', error);
      addToast('Failed to fetch backup codes', 'error');
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes.length) return;

    const codesText = backupCodes.join('\n');
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

  if (!status) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Two-Factor Authentication</h3>

      {status.enabled ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400 font-medium">2FA is enabled</span>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Backup Codes</h4>
            <p className="text-gray-300 text-sm mb-3">
              You have {status.backupCodesCount} backup codes remaining. 
              Use these if you lose access to your authenticator app.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={fetchBackupCodes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Backup Codes
              </button>
              
              <button
                onClick={() => setShowDisableModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-400 font-medium">2FA is disabled</span>
          </div>

          <p className="text-gray-300 text-sm">
            Enable two-factor authentication to add an extra layer of security to your account.
          </p>

          <button
            onClick={() => setShowSetup(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Enable 2FA
          </button>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {showSetup && (
        <TwoFactorSetup
          onSetupComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
        />
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-6">Backup Codes</h3>
            
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </p>
              
              <div className="bg-slate-700 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="text-yellow-400 font-mono">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Download
                </button>
                
                <button
                  onClick={() => setShowBackupCodes(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-6">Disable 2FA</h3>
            
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Enter your 6-digit authenticator code to disable two-factor authentication.
              </p>
              
              <input
                type="text"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none text-center text-lg tracking-widest"
                maxLength={6}
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDisable2FA}
                  disabled={isLoading || disableToken.length !== 6}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Disabling...' : 'Disable 2FA'}
                </button>
                
                <button
                  onClick={() => {
                    setShowDisableModal(false);
                    setDisableToken('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
