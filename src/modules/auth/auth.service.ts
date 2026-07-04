import { Injectable, UnauthorizedException, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, and, gt, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { users, refreshTokens, passwordResetOtps } from '../../database/schema';
import { LoginDto, RegisterDto, AuthTokensResponse } from './dto/auth.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, dto.phone));

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
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

  async refreshTokens(refreshToken: string): Promise<AuthTokensResponse> {
    const tokenHash = await bcrypt.hash(refreshToken, 8);

    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      );

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id));

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, storedToken.userId));

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = await bcrypt.hash(refreshToken, 8);

    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
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

    if (!storedToken || storedToken.revokedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, storedToken.userId));

    // Revoke the reset token
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, storedToken.id));

    return { message: 'Password reset successful' };
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
}
