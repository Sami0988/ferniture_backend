import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['new', 'in_progress', 'completed', 'delivered', 'paid', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  @IsOptional()
  @IsString()
  division?: string;

  @ApiPropertyOptional({ enum: ['normal', 'urgent', 'vip'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

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

  @ApiPropertyOptional({ example: 2500.00 })
  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @ApiPropertyOptional({ example: 500.00 })
  @IsOptional()
  @IsNumber()
  paidNowPrice?: number;

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

  @ApiPropertyOptional({ example: 'Downtown Branch' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  city?: string;

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

  @ApiPropertyOptional({ example: 'Downtown Branch' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 2500.00 })
  @IsOptional()
  @IsNumber()
  totalPrice?: number;

  @ApiPropertyOptional({ example: 500.00 })
  @IsOptional()
  @IsNumber()
  paidNowPrice?: number;

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

export class PayProjectDto {
  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['cash', 'bank_transfer', 'telebirr', 'cbe_birr'] })
  @IsEnum(['cash', 'bank_transfer', 'telebirr', 'cbe_birr'] as const)
  method: string;

  @ApiPropertyOptional({ example: 'Final payment' })
  @IsOptional()
  @IsString()
  note?: string;
}
