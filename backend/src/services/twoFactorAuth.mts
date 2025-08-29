import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  backupCodeUsed?: boolean;
}

export class TwoFactorAuthService {
  private static readonly BACKUP_CODES_COUNT = 10;
  private static readonly BACKUP_CODE_LENGTH = 8;

  /**
   * Generate a new 2FA secret and QR code
   */
  static async generateSecret(username: string, appName: string = 'FT Transcendence'): Promise<TwoFactorSetup> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${appName} (${username})`,
      issuer: appName,
      length: 32
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify a TOTP token
   */
  static verifyToken(token: string, secret: string, window: number = 2): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window
    });
  }

  /**
   * Verify a backup code
   */
  static verifyBackupCode(code: string, backupCodes: string[]): boolean {
    return backupCodes.includes(code);
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = crypto.randomBytes(this.BACKUP_CODE_LENGTH)
        .toString('hex')
        .toUpperCase()
        .slice(0, this.BACKUP_CODE_LENGTH);
      
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Remove a used backup code
   */
  static removeBackupCode(code: string, backupCodes: string[]): string[] {
    return backupCodes.filter(backupCode => backupCode !== code);
  }

  /**
   * Format backup codes for display
   */
  static formatBackupCodes(codes: string[]): string[] {
    return codes.map(code => {
      // Format as XXXX-XXXX for better readability
      return code.slice(0, 4) + '-' + code.slice(4);
    });
  }
}

