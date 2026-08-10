import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { users, mfaBackupCodes } from '../../database/schema';
import { encrypt, decrypt } from '../../common/crypto/encryption';

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

@Injectable()
export class MfaService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly configService: ConfigService,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!this.configService.get<string>('app.mfaEncryptionKey')) {
      throw new BadRequestException('MFA is not configured on this server. Set MFA_ENCRYPTION_KEY to enable.');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const companyName = this.configService.get<string>('app.companyName', 'Kassahun');
    const secret = speakeasy.generateSecret({
      name: `${companyName} (${user.email || user.phone})`,
      issuer: companyName,
      length: 20,
    });

    // Encrypt and store the secret temporarily (mfa_enabled stays false until confirm)
    const encryptedSecret = encrypt(secret.base32);
    await this.db
      .update(users)
      .set({ mfaSecret: encryptedSecret, updatedAt: new Date() })
      .where(eq(users.id, userId));

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url!,
      qrCodeDataUrl,
    };
  }

  async confirmSetup(userId: string, token: string): Promise<string[]> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated. Call /mfa/setup first.');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const decryptedSecret = decrypt(user.mfaSecret);
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Enable MFA
    await this.db
      .update(users)
      .set({ mfaEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Generate backup codes
    const backupCodes = await this.generateBackupCodes(userId);

    return backupCodes;
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA not configured');
    }

    // Check if it's a backup code (8 alphanumeric characters)
    if (/^[A-Za-z0-9]{8}$/.test(token)) {
      return this.verifyBackupCode(userId, token);
    }

    // Otherwise treat as TOTP
    const decryptedSecret = decrypt(user.mfaSecret);
    return speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const [backupCode] = await this.db
      .select()
      .from(mfaBackupCodes)
      .where(
        and(
          eq(mfaBackupCodes.userId, userId),
          eq(mfaBackupCodes.used, false),
        ),
      );

    if (!backupCode) {
      return false;
    }

    // Check all unused codes (they're hashed, so we need to compare each)
    const unusedCodes = await this.db
      .select()
      .from(mfaBackupCodes)
      .where(
        and(
          eq(mfaBackupCodes.userId, userId),
          eq(mfaBackupCodes.used, false),
        ),
      );

    for (const bc of unusedCodes) {
      const match = await bcrypt.compare(code, bc.codeHash);
      if (match) {
        // Mark as used
        await this.db
          .update(mfaBackupCodes)
          .set({ used: true })
          .where(eq(mfaBackupCodes.id, bc.id));
        return true;
      }
    }

    return false;
  }

  async regenerateBackupCodes(userId: string, currentToken: string): Promise<string[]> {
    // Verify current TOTP first
    const valid = await this.verifyToken(userId, currentToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Invalidate old backup codes
    await this.db
      .update(mfaBackupCodes)
      .set({ used: true })
      .where(
        and(
          eq(mfaBackupCodes.userId, userId),
          eq(mfaBackupCodes.used, false),
        ),
      );

    return this.generateBackupCodes(userId);
  }

  async disable(userId: string, password: string, token: string): Promise<void> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Require password
    const bcrypt = require('bcrypt');
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Require current TOTP
    const decryptedSecret = decrypt(user.mfaSecret!);
    const totpValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!totpValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    // Disable MFA and clear secret
    await this.db
      .update(users)
      .set({ mfaEnabled: false, mfaSecret: null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Invalidate all backup codes
    await this.db
      .delete(mfaBackupCodes)
      .where(eq(mfaBackupCodes.userId, userId));
  }

  private async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];
    const codeHashes: { userId: string; codeHash: string }[] = [];

    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      const code = this.randomBackupCode();
      codes.push(code);
      const codeHash = await bcrypt.hash(code, 8);
      codeHashes.push({ userId, codeHash });
    }

    await this.db.insert(mfaBackupCodes).values(codeHashes);

    return codes;
  }

  private randomBackupCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0, O, 1, I)
    let code = '';
    for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
      code += chars[randomInt(0, chars.length)];
    }
    return code;
  }
}
