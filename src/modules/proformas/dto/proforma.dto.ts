import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProformaItemDto {
  @ApiProperty({ example: 'Custom Sofa Set' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Sofa' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ enum: ['PCS', 'M2', 'ML', 'SET', 'LOT', 'KG'], default: 'PCS' })
  @IsIn(['PCS', 'M2', 'ML', 'SET', 'LOT', 'KG'])
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateProformaDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'Kassahun Wood and Aluminum Work' })
  @IsString()
  @IsNotEmpty()
  billedToName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billedToAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billedToPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billedToTin?: string;

  @ApiPropertyOptional({ example: 'Furniture Quotation' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({ example: 'Sofa, Kitchen Cabinet, Closet' })
  @IsString()
  @IsOptional()
  materialSummary?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  vatRate?: number;

  @ApiProperty({ type: [CreateProformaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProformaItemDto)
  items: CreateProformaItemDto[];
}

export class UpdateProformaDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billedToName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billedToAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billedToPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billedToTin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  materialSummary?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  vatRate?: number;

  @ApiPropertyOptional({ type: [CreateProformaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProformaItemDto)
  @IsOptional()
  items?: CreateProformaItemDto[];
}

export class QueryProformasDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'sent', 'accepted', 'expired', 'cancelled'] })
  @IsIn(['draft', 'sent', 'accepted', 'expired', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
