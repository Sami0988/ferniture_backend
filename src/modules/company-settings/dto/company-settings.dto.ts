import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanySettingDto {
  @ApiProperty({ example: 'company_name' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Kassahun Wood & Aluminum Work' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class BulkUpdateCompanySettingsDto {
  @ApiProperty({
    example: {
      company_name: 'Kassahun Wood & Aluminum Work',
      company_phone: '+251911234567',
      company_email: 'info@kassahun.com',
      company_address: 'Addis Ababa, Ethiopia',
      company_tin: '1234567890',
      vat_rate: '15',
    },
  })
  @IsNotEmpty()
  settings: Record<string, string>;
}
