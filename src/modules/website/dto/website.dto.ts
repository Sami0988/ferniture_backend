import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+251911234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'I need a custom kitchen cabinet' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class CreateQuoteRequestDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+251911234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ enum: ['furniture', 'aluminum', 'interior_design'] })
  @IsOptional()
  @IsEnum(['furniture', 'aluminum', 'interior_design'] as const)
  division?: string;

  @ApiProperty({ example: 'I need 3 custom wardrobes for my bedroom' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: '50,000 - 100,000 ETB' })
  @IsOptional()
  @IsString()
  budgetRange?: string;
}

export class CreateTestimonialDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty()
  @IsNumber()
  rating: number;

  @ApiProperty({ example: 'Excellent work! Highly recommended.' })
  @IsString()
  @IsNotEmpty()
  reviewText: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Custom Mahogany Dining Table' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['furniture', 'aluminum', 'interior_design'] })
  @IsEnum(['furniture', 'aluminum', 'interior_design'] as const)
  division: string;

  @ApiPropertyOptional({ example: 'Tables' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priceRangeMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priceRangeMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  imageUrls?: string[];
}

export class CreateGalleryImageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ['furniture', 'aluminum', 'interior_design'] })
  @IsEnum(['furniture', 'aluminum', 'interior_design'] as const)
  division: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'living_room' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class CreateFaqDto {
  @ApiProperty({ example: 'How long does a custom order take?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'Typically 2-4 weeks.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
