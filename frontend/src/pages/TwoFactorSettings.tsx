import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Download, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { usePlayerData } from '../context/PlayerDataContext';
import { API_ENDPOINTS } from '../config/api';

interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
  backupCodesCount: number;
}

interface BackupCodes {
  backupCodes: string[];
}

export default function TwoFactorSettings() {
  const { playerData } = usePlayerData();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_STATUS, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch 2FA status');
      }

      const data = await response.json();
      setStatus(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupCodes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_BACKUP_CODES, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch backup codes');
      }

      const data = await response.json();
      setBackupCodes(data.data.backupCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backup codes');
    }
  };

  const regenerateBackupCodes = async () => {
    if (!disableCode.trim()) {
      setError('Please enter your 2FA code to regenerate backup codes');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_REGENERATE_BACKUP_CODES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: disableCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to regenerate backup codes');
      }

      const data = await response.json();
      setBackupCodes(data.data.backupCodes);
      setDisableCode('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate backup codes');
    }
  };

  const disable2FA = async () => {
    if (!disableCode.trim()) {
      setError('Please enter your 2FA code to disable 2FA');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.TWO_FACTOR_DISABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: disableCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disable 2FA');
      }

      setStatus(prev => prev ? { ...prev, enabled: false } : null);
      setBackupCodes([]);
      setDisableCode('');
      setShowDisableConfirm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    }
  };

  const downloadBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const content = `FT Transcendence - Backup Codes\n\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `IMPORTANT: Store these codes in a safe place!\n\n` +
      backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n') +
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

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-400">Loading 2FA settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Status Card */}
          <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Status</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                status?.enabled 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-gray-900/30 text-gray-400'
              }`}>
                {status?.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            {status?.enabled ? (
              <div className="space-y-4">
                <p className="text-gray-400">
                  Two-factor authentication is protecting your account. You'll need to enter a code from your authenticator app when signing in.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Backup Codes</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {status.backupCodesCount} codes remaining
                    </p>
                    <button
                      onClick={fetchBackupCodes}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      View Codes
                    </button>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">Regenerate Codes</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Create new backup codes
                    </p>
                    <button
                      onClick={() => setShowDisableConfirm(true)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">2FA Not Enabled</h3>
                <p className="text-gray-400 mb-6">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <button
                  onClick={() => window.location.href = '/settings/2fa/setup'}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Enable 2FA
                </button>
              </div>
            )}
          </div>

          {/* Backup Codes Display */}
          {backupCodes.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Backup Codes</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadBackupCodes}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="Download codes"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={copyBackupCodes}
                    className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy codes"
                  >
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <p className="text-yellow-200 text-sm">
                    Store these codes in a safe place. Each code can only be used once.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-gray-700 px-3 py-2 rounded text-white font-mono text-sm">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disable 2FA */}
          {status?.enabled && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Disabling 2FA will make your account less secure. You'll need to enter your current 2FA code to disable it.
              </p>
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Disable 2FA
              </button>
            </div>
          )}

          {/* Confirmation Modal */}
          {showDisableConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {backupCodes.length > 0 ? 'Regenerate Backup Codes' : 'Disable 2FA'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {backupCodes.length > 0 
                    ? 'Enter your 2FA code to regenerate backup codes.'
                    : 'Enter your 2FA code to disable two-factor authentication.'
                  }
                </p>
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-purple-500 mb-4"
                  maxLength={6}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDisableConfirm(false);
                      setDisableCode('');
                      setError(null);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={backupCodes.length > 0 ? regenerateBackupCodes : disable2FA}
                    disabled={disableCode.length !== 6}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {backupCodes.length > 0 ? 'Regenerate' : 'Disable'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
