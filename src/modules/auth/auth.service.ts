import { Injectable, UnauthorizedException, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, and, gt, isNull, or } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { users, refreshTokens, passwordResetOtps } from '../../database/schema';
import { LoginDto, RegisterDto, AuthTokensResponse, LoginResponse } from './dto/auth.dto';
import { MfaService } from './mfa.service';
import { AuthAuditService } from './auth-audit.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mfaService: MfaService,
    private readonly auditService: AuthAuditService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    if (!dto.phone && !dto.email) {
      throw new BadRequestException('Phone or email is required');
    }

    const conditions: any[] = [];
    if (dto.phone) conditions.push(eq(users.phone, dto.phone));
    if (dto.email) conditions.push(eq(users.email, dto.email));

    const [user] = await this.db
      .select()
      .from(users)
      .where(conditions.length > 1 ? or(...conditions) : conditions[0]);

    if (!user) {
      await this.auditService.log({ event: 'login_fail', metadata: { reason: 'user_not_found' } });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.auditService.log({ userId: user.id, event: 'login_fail', metadata: { reason: 'account_deactivated' } });
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      await this.auditService.log({ userId: user.id, event: 'login_fail', metadata: { reason: 'account_locked' } });
      throw new UnauthorizedException('Account is temporarily locked. Try again later.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: attempts, updatedAt: new Date() };

      if (attempts >= LOCKOUT_THRESHOLD) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
        updateData.lockedUntil = lockedUntil;
        await this.auditService.log({ userId: user.id, event: 'account_locked', metadata: { lockedUntil: lockedUntil.toISOString() } });
      }

      await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id));

      await this.auditService.log({ userId: user.id, event: 'login_fail', metadata: { reason: 'bad_password', attempts } });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Successful login — reset lockout fields and revoke all existing sessions
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.db
        .update(users)
        .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    await this.revokeAllUserTokens(user.id);

    await this.auditService.log({ userId: user.id, event: 'login_success' });

    // If MFA is enabled, return a pending token instead of full tokens
    if (user.mfaEnabled) {
      const mfaPendingToken = this.jwtService.sign(
        { sub: user.id, type: 'mfa_pending' },
        {
          secret: this.configService.get<string>('app.jwt.accessSecret'),
          expiresIn: '5m',
        },
      );
      return { mfaRequired: true, mfaPendingToken };
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async register(dto: RegisterDto): Promise<AuthTokensResponse> {
    const [existing] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, dto.phone));

    if (existing) {
      throw new ConflictException('Phone number already registered');
    }

    if (dto.email) {
      const [emailExists] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, dto.email));

      if (emailExists) {
        throw new ConflictException('Email already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [newUser] = await this.db
      .insert(users)
      .values({
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: 'employee',
      })
      .returning();

    return this.generateTokens(newUser.id, newUser.email, newUser.role);
  }

  async verifyMfaToken(mfaPendingToken: string, token: string): Promise<AuthTokensResponse> {
    let payload: any;
    try {
      payload = this.jwtService.verify(mfaPendingToken, {
        secret: this.configService.get<string>('app.jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA pending token');
    }

    if (payload.type !== 'mfa_pending') {
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = payload.sub;
    const valid = await this.mfaService.verifyToken(userId, token);
    if (!valid) {
      await this.auditService.log({ userId, event: 'mfa_fail' });
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.auditService.log({ userId, event: 'mfa_success' });

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokensResponse> {
    const tokenHash = await bcrypt.hash(refreshToken, 8);

    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash));

    // Token not found at all — invalid
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token expired
    if (new Date(storedToken.expiresAt) <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Token is revoked — possible reuse detection
    if (storedToken.revoked) {
      const revokedAt = new Date(storedToken.revokedAt);
      const now = new Date();
      const graceWindowMs = 10_000; // 10 seconds

      if (now.getTime() - revokedAt.getTime() <= graceWindowMs && storedToken.replacedByTokenId) {
        // Within grace window — likely frontend double-fire, return tokens from the replacement chain
        const [replacementToken] = await this.db
          .select()
          .from(refreshTokens)
          .where(eq(refreshTokens.id, storedToken.replacedByTokenId));

        if (replacementToken && !replacementToken.revoked) {
          const [user] = await this.db
            .select()
            .from(users)
            .where(eq(users.id, replacementToken.userId));
          if (user && user.isActive) {
            return this.generateTokens(user.id, user.email, user.role);
          }
        }
      }

      // Outside grace window or replacement chain broken — token theft detected
      await this.revokeAllUserTokens(storedToken.userId);
      await this.auditService.log({ userId: storedToken.userId, event: 'refresh_token_reuse_detected', metadata: { tokenId: storedToken.id } });
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
    }

    // Token is valid — issue new pair and link them
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, storedToken.userId));

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    const newTokens = await this.generateTokens(user.id, user.email, user.role);

    // Revoke old token and link to new one
    const newTokenHash = await bcrypt.hash(newTokens.refreshToken, 8);
    const [newRefreshToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, newTokenHash));

    if (newRefreshToken) {
      await this.db
        .update(refreshTokens)
        .set({
          revoked: true,
          revokedAt: new Date(),
          replacedByTokenId: newRefreshToken.id,
        })
        .where(eq(refreshTokens.id, storedToken.id));
    }

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = await bcrypt.hash(refreshToken, 8);

    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash));

    await this.db
      .update(refreshTokens)
      .set({ revoked: true, revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));

    if (storedToken) {
      await this.auditService.log({ userId: storedToken.userId, event: 'logout' });
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.revoked, false),
        ),
      );
  }

  async requestPasswordReset(phone: string): Promise<{ message: string }> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, phone));

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the phone number is registered, you will receive an OTP' };
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 8);

    // Store OTP (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.db.insert(passwordResetOtps).values({
      userId: user.id,
      otpHash,
      expiresAt,
    });

    // Send OTP via email
    try {
      await this.emailQueue.add('send-otp', {
        to: user.email || '',
        otp,
        userName: user.fullName,
      });
    } catch (error) {
      console.error('Failed to queue OTP email:', error);
    }

    return { message: 'If the phone number is registered, you will receive an OTP' };
  }

  async verifyPasswordReset(phone: string, otp: string): Promise<{ token: string }> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, phone));

    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    // Find valid OTP
    const [otpRecord] = await this.db
      .select()
      .from(passwordResetOtps)
      .where(
        and(
          eq(passwordResetOtps.userId, user.id),
          gt(passwordResetOtps.expiresAt, new Date()),
          isNull(passwordResetOtps.usedAt),
        ),
      )
      .orderBy(passwordResetOtps.createdAt)
      .limit(1);

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const otpValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!otpValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark OTP as used
    await this.db
      .update(passwordResetOtps)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetOtps.id, otpRecord.id));

    // Generate reset token (short-lived)
    const resetToken = uuidv4();
    const resetTokenHash = await bcrypt.hash(resetToken, 8);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: resetTokenHash,
      expiresAt,
    });

    return { token: resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = await bcrypt.hash(resetToken, 8);

    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      );

    if (!storedToken || storedToken.revoked) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, storedToken.userId));

    // Revoke the reset token and all existing sessions
    await this.db
      .update(refreshTokens)
      .set({ revoked: true, revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id));

    await this.revokeAllUserTokens(storedToken.userId);

    await this.auditService.log({ userId: storedToken.userId, event: 'password_reset' });

    return { message: 'Password reset successful' };
  }

  async validateAccessToken(token: string): Promise<{ id: string; email: string; role: string; fullName: string }> {
    const payload = this.jwtService.verify(token, {
      secret: this.configService.get<string>('app.jwt.accessSecret'),
    });

    return this.validateAccessTokenByUserId(payload.sub);
  }

  async validateAccessTokenByUserId(userId: string): Promise<{ id: string; email: string; role: string; fullName: string }> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
  }

  private async generateTokens(
    userId: string,
    email: string | null,
    role: string,
  ): Promise<AuthTokensResponse> {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('app.jwt.accessSecret'),
      expiresIn: this.configService.get('app.jwt.accessExpiration', '15m') as any,
    });

    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 8);

    const expiresDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async changePassword(userId: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await this.revokeAllUserTokens(userId);

    return { message: 'Password changed successfully' };
  }
}
