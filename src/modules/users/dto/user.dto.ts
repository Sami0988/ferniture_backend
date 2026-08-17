import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsIn, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PASSWORD_MIN_LENGTH = 8;

export class CreateUserDto {
  @ApiProperty({ example: 'Abebe Kebede' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+251911234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'abebe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  password: string;

  @ApiPropertyOptional({ enum: ['super_admin', 'manager', 'employee'] })
  @IsOptional()
  @IsString()
  @IsIn(['super_admin', 'manager', 'employee'])
  role?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['super_admin', 'manager', 'employee'] })
  @IsOptional()
  @IsString()
  @IsIn(['super_admin', 'manager', 'employee'])
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
