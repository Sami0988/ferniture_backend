import {
  Controller, Post, Delete, UseInterceptors,
  UploadedFile, Param, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'projects' },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    return this.uploadsService.uploadImage(file, folder || 'kassahun');
  }

  @Post('document')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document (PDF, DOC)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'documents' },
      },
    },
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    return this.uploadsService.uploadDocument(file, folder || 'kassahun/documents');
  }

  @Delete(':publicId')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete an uploaded file' })
  async deleteFile(@Param('publicId') publicId: string) {
    const decodedId = decodeURIComponent(publicId);
    await this.uploadsService.deleteFile(decodedId);
    return { message: 'File deleted' };
  }
}
