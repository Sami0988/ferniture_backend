import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Res, Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LetterTemplatesService } from './letter-templates.service';
import { CreateLetterTemplateDto, UpdateLetterTemplateDto } from './dto/letter-template.dto';

@ApiTags('Letter Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('letter-templates')
export class LetterTemplatesController {
  constructor(private readonly service: LetterTemplatesService) {}

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create a letter template' })
  create(@Body() dto: CreateLetterTemplateDto, @Req() req: Request) {
    return this.service.create(dto, (req as any).user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all letter templates' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get letter template by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update letter template' })
  update(@Param('id') id: string, @Body() dto: UpdateLetterTemplateDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview template as PDF' })
  async preview(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.service.preview(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="template-preview.pdf"',
      'Cache-Control': 'no-cache',
    });
    res.end(pdfBuffer);
  }

  @Post(':id/set-default')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Set template as default' })
  setDefault(@Param('id') id: string) {
    return this.service.setDefault(id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete letter template' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
