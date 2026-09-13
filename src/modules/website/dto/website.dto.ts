import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsEnum, IsBoolean, MaxLength, IsArray, Min, Max } from 'class-validator';
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

  @ApiPropertyOptional({ enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  @IsOptional()
  @IsEnum(['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] as const)
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

  @ApiPropertyOptional({ example: 'ABC Construction' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiProperty({ example: 4.5, description: 'Rating from 0.5 to 5.0 in increments of 0.5' })
  @IsNumber()
  @Min(0.5)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'We handed Kassahun\'s team the keys to our entire ground floor...' })
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

  @ApiProperty({ enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  @IsEnum(['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] as const)
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
  price?: any;

  @ApiPropertyOptional()
  @IsOptional()
  mainImage?: any;

  @ApiPropertyOptional()
  @IsOptional()
  featureImages?: any;

  @ApiPropertyOptional()
  @IsOptional()
  images?: any;

  @ApiPropertyOptional()
  @IsOptional()
  isFeatured?: any;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: any;
}

export class CreateGalleryImageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] })
  @IsEnum(['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] as const)
  division: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'living_room' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ enum: ['tall', 'wide', 'square'], default: 'square' })
  @IsOptional()
  @IsString()
  aspect?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class CreateFaqDto {
  @ApiProperty({ example: 'How long does a custom order take?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  question: string;

  @ApiProperty({ example: 'Typically 2-4 weeks.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBlogPostDto {
  @ApiProperty({ example: 'Choosing the Right Wood for Your Custom Furniture' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  title: string;

  @ApiPropertyOptional({ example: 'choosing-the-right-wood' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'A guide to understanding wood species and durability.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({ example: 'Full blog post content in HTML or markdown...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'materials', enum: ['materials', 'aluminum', 'interior', 'furniture', 'general'] })
  @IsEnum(['materials', 'aluminum', 'interior', 'furniture', 'general'] as const)
  category: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateContactInfoDto {
  @ApiPropertyOptional({ example: 'Kotebe Hanamaryam Church, Addis Ababa, Ethiopia' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: '+251 99 443 7585' })
  @IsOptional()
  @IsString()
  phone1?: string;

  @ApiPropertyOptional({ example: '+251 911 670 799' })
  @IsOptional()
  @IsString()
  phone2?: string;

  @ApiPropertyOptional({ example: 'kashuntsegayeplc@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Mon – Fri: 8:00 AM – 6:00 PM' })
  @IsOptional()
  @IsString()
  weekdayHours?: string;

  @ApiPropertyOptional({ example: 'Sat: 8:00 AM – 1:00 PM' })
  @IsOptional()
  @IsString()
  saturdayHours?: string;

  @ApiPropertyOptional({ example: 'https://www.google.com/maps/...' })
  @IsOptional()
  @IsString()
  mapUrl?: string;

  @ApiPropertyOptional({ example: '9.005' })
  @IsOptional()
  @IsString()
  latitude?: string;

  @ApiPropertyOptional({ example: '38.763' })
  @IsOptional()
  @IsString()
  longitude?: string;
}

export class UpdateAboutPageDto {
  @ApiPropertyOptional({ example: 'About Us' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @ApiPropertyOptional({ example: 'We have been crafting fine furniture since 2010...' })
  @IsOptional()
  @IsString()
  description1?: string;

  @ApiPropertyOptional({ example: 'Our commitment to quality...' })
  @IsOptional()
  @IsString()
  description2?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  projectsCompleted?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  countriesServed?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  skilledArtisans?: number;
}

export class CreateServiceDto {
  @ApiProperty({ example: 'Custom Furniture & Woodwork' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'CUSTOM', description: 'Category tag shown on card' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @ApiProperty({ example: 'Handcrafted furniture and woodwork — from dining tables and wardrobes to built-in cabinetry.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: ['Custom furniture design', 'Built-in cabinetry', 'Wood paneling & molding', 'Restoration & refinishing'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bulletPoints?: string[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBeforeAfterDto {
  @ApiPropertyOptional({ example: 'Kitchen Renovation' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
