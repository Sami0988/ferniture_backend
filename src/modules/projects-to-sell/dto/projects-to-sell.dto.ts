import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectToSellDto {
  @ApiProperty({ example: 'Modern Walnut Dining Table' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Elegant 6-seater dining table made from solid walnut wood' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Dining Table' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ enum: ['furniture', 'aluminum', 'interior_design'] })
  @IsEnum(['furniture', 'aluminum', 'interior_design'] as const)
  division: string;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  image?: any;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProjectToSellDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['furniture', 'aluminum', 'interior_design'] })
  @IsOptional()
  @IsEnum(['furniture', 'aluminum', 'interior_design'] as const)
  division?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  image?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProjectsToSellQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['furniture', 'aluminum', 'interior_design'] })
  @IsOptional()
  @IsString()
  division?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
