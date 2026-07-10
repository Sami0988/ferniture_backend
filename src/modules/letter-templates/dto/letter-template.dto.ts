import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateLetterTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  htmlContent: string;

  @IsString()
  @IsOptional()
  cssContent?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  recipientCompanyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  recipientTitle?: string;

  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  dueDate?: string;
}

export class UpdateLetterTemplateDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  htmlContent?: string;

  @IsString()
  @IsOptional()
  cssContent?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  recipientCompanyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  recipientTitle?: string;

  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  dueDate?: string;
}
