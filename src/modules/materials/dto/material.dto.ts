import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Ethiopian Mahogany' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['wood_species', 'wood_finish', 'aluminum_profile', 'aluminum_color', 'hardware', 'glass', 'other'] })
  @IsEnum(['wood_species', 'wood_finish', 'aluminum_profile', 'aluminum_color', 'hardware', 'glass', 'other'] as const)
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  unitCost?: any;

  @ApiPropertyOptional({ example: 'board_ft' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swatchImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isPublicVisible?: any;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: any;

  @ApiPropertyOptional()
  @IsOptional()
  swatchImage?: any;

  @ApiPropertyOptional()
  @IsOptional()
  images?: any;
}

export class UpdateMaterialDto {
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
  unitCost?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swatchImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isPublicVisible?: any;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: any;

  @ApiPropertyOptional()
  @IsOptional()
  swatchImage?: any;

  @ApiPropertyOptional()
  @IsOptional()
  images?: any;
}

export class AddProjectMaterialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  samplePhotoUrl?: string;
}

export class ApproveProjectMaterialDto {
  @ApiProperty()
  @IsBoolean()
  clientApproved: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
