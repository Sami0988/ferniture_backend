import { IsString, IsUUID, IsOptional, IsNotEmpty, IsIn } from 'class-validator';

export class CreatePaymentLetterDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsUUID()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsNotEmpty()
  recipientCompanyName: string;

  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientTitle?: string;

  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class UpdatePaymentLetterDto {
  @IsString()
  @IsOptional()
  recipientCompanyName?: string;

  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientTitle?: string;

  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  templateId?: string;

  @IsIn(['draft', 'sent', 'paid'])
  @IsOptional()
  status?: string;
}

export class QueryPaymentLettersDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsIn(['draft', 'sent', 'paid'])
  @IsOptional()
  status?: string;
}
