import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['unpaid', 'partial', 'paid'] })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class InvoiceItemDto {
  @ApiProperty({ example: 'Custom Sofa Set' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  vatRate?: number;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['cash', 'bank_transfer', 'telebirr', 'cbe_birr'] })
  @IsEnum(['cash', 'bank_transfer', 'telebirr', 'cbe_birr'] as const)
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty()
  @IsDateString()
  paidAt: string;
}
