import { IsString, IsNotEmpty, IsOptional, MinLength, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: '+251911234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Abebe Kebede' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+251911234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiPropertyOptional({ example: 'abebe@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'carpenter' })
  @IsOptional()
  @IsString()
  specialty?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export class MfaVerifyDto {
  @ApiProperty({ description: 'MFA pending token from login response' })
  @IsString()
  @IsNotEmpty()
  mfaPendingToken: string;

  @ApiProperty({ description: '6-digit TOTP code or 8-character backup code' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class MfaConfirmDto {
  @ApiProperty({ description: '6-digit TOTP code to confirm MFA setup' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class MfaRegenerateDto {
  @ApiProperty({ description: 'Current TOTP code to confirm regeneration' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class MfaDisableDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Current TOTP code' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class MfaSetupDto {}

export class MfaConfirmWithUserDto extends MfaConfirmDto {}

export class MfaRegenerateWithUserDto extends MfaRegenerateDto {}

export class MfaDisableWithUserDto extends MfaDisableDto {}

export class LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  mfaRequired?: boolean;
  mfaPendingToken?: string;
}
