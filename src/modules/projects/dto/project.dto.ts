import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiPropertyOptional({ example: 'PRJ-2026-0001' })
  @IsOptional()
  @IsString()
  projectNumber?: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty({ enum: ['furniture', 'aluminum', 'interior_design'] })
  @IsEnum(['furniture', 'aluminum', 'interior_design'] as const)
  division: string;

  @ApiProperty({ example: 'Custom Mahogany Dining Set' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  orderDate: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadEmployeeId?: string;

  @ApiPropertyOptional({ enum: ['normal', 'urgent', 'vip'] })
  @IsOptional()
  @IsEnum(['normal', 'urgent', 'vip'] as const)
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['new', 'in_progress', 'completed', 'delivered', 'paid', 'cancelled'] })
  @IsOptional()
  @IsEnum(['new', 'in_progress', 'completed', 'delivered', 'paid', 'cancelled'] as const)
  status?: string;

  @ApiPropertyOptional({ enum: ['normal', 'urgent', 'vip'] })
  @IsOptional()
  @IsEnum(['normal', 'urgent', 'vip'] as const)
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leadEmployeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigneeIds?: string[];
}

export class UpdateProjectStatusDto {
  @ApiProperty({ enum: ['new', 'in_progress', 'completed', 'delivered', 'paid', 'cancelled'] })
  @IsEnum(['new', 'in_progress', 'completed', 'delivered', 'paid', 'cancelled'] as const)
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProjectAttachmentDto {
  @ApiProperty({ example: 'https://cloudinary.com/image.jpg' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ enum: ['photo', 'drawing', 'document', 'progress_photo', 'completion_photo'] })
  @IsEnum(['photo', 'drawing', 'document', 'progress_photo', 'completion_photo'] as const)
  fileType: string;

  @ApiPropertyOptional({ example: 'Front view of the cabinet' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: 9.0192 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 38.7525 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
