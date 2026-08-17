import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, Request, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  LoginDto, RegisterDto, RefreshTokenDto, AuthTokensResponse, LoginResponse,
  MfaVerifyDto, MfaConfirmDto, MfaRegenerateDto, MfaDisableDto, ChangePasswordDto,
} from './dto/auth.dto';

const isProd = process.env.NODE_ENV === 'production';

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearTokenCookies(res: Response) {
  res.cookie('accessToken', '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
  res.cookie('refreshToken', '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone/email and password' })
  @ApiResponse({ status: 200, description: 'Tokens or MFA challenge returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    const result = await this.authService.login(dto);
    if (result.accessToken && result.refreshToken) {
      setTokenCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new employee account' })
  @ApiResponse({ status: 201, description: 'Account created, tokens returned' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response): Promise<AuthTokensResponse> {
    const result = await this.authService.register(dto);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponse> {
    const refreshToken = dto?.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    const result = await this.authService.refreshTokens(refreshToken);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = dto?.refreshToken || req.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    clearTokenCookies(res);
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  async forgotPassword(@Body() dto: { phone: string }): Promise<{ message: string }> {
    return this.authService.requestPasswordReset(dto.phone);
  }

  @Post('verify-reset-otp')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get reset token' })
  async verifyResetOtp(@Body() dto: { phone: string; otp: string }): Promise<{ token: string }> {
    return this.authService.verifyPasswordReset(dto.phone, dto.otp);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: { token: string; newPassword: string }): Promise<{ message: string }> {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ==================== MFA ENDPOINTS ====================

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  async changePassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.id, dto.newPassword, dto.confirmPassword);
  }

  @Post('mfa/setup')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate MFA setup — returns QR code' })
  async mfaSetup(
    @Request() req: any,
  ): Promise<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }> {
    return this.mfaService.generateSecret(req.user.id);
  }

  @Post('mfa/confirm')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm MFA setup with TOTP code — returns backup codes' })
  async mfaConfirm(
    @Request() req: any,
    @Body() dto: MfaConfirmDto,
  ): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.mfaService.confirmSetup(req.user.id, dto.token);
    return { backupCodes };
  }

  @Post('mfa/verify')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA token during login' })
  async mfaVerify(
    @Body() dto: MfaVerifyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponse> {
    const result = await this.authService.verifyMfaToken(dto.mfaPendingToken, dto.token);
    setTokenCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('mfa/regenerate-backup-codes')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes (requires current TOTP)' })
  async mfaRegenerateBackupCodes(
    @Request() req: any,
    @Body() dto: MfaRegenerateDto,
  ): Promise<{ backupCodes: string[] }> {
    const backupCodes = await this.mfaService.regenerateBackupCodes(req.user.id, dto.token);
    return { backupCodes };
  }

  @Post('mfa/disable')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA (requires password + TOTP)' })
  async mfaDisable(
    @Request() req: any,
    @Body() dto: MfaDisableDto,
  ): Promise<{ message: string }> {
    await this.mfaService.disable(req.user.id, dto.password, dto.token);
    return { message: 'MFA disabled successfully' };
  }
}
