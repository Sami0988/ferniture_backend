import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGalleryProjectDto {
  @ApiPropertyOptional({ example: 'Living Room Renovation' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  @IsEnum(['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] as const)
  division: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'living_room' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ enum: ['tall', 'wide', 'square'], default: 'square' })
  @IsOptional()
  @IsString()
  aspect?: string;

  @ApiPropertyOptional({ description: 'UUID of the associated project' })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

export class UpdateGalleryProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  @IsOptional()
  @IsEnum(['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] as const)
  division?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ enum: ['tall', 'wide', 'square'] })
  @IsOptional()
  @IsString()
  aspect?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

export class GalleryProjectQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  @IsOptional()
  @IsString()
  division?: string;

  @ApiPropertyOptional({ description: 'Filter by project UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
