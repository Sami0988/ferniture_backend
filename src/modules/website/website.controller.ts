import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WebsiteService } from './website.service';
import {
  CreateContactMessageDto,
  CreateQuoteRequestDto,
  CreateTestimonialDto,
  CreateProductDto,
  CreateGalleryImageDto,
  CreateFaqDto,
} from './dto/website.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

// ==================== PUBLIC (no auth) ====================

@ApiTags('Website - Products')
@Controller('website/products')
export class PublicProductsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'List public products' })
  @ApiQuery({ name: 'division', required: false })
  findAll(@Query('division') division?: string, @Query() pagination: PaginationDto = new PaginationDto()) {
    return this.websiteService.getProductsPaginated(pagination, division);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.websiteService.getProductById(id);
  }
}

@ApiTags('Website - Gallery')
@Controller('website/gallery')
export class PublicGalleryController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'List gallery images' })
  @ApiQuery({ name: 'division', required: false })
  findAll(@Query('division') division?: string, @Query() pagination: PaginationDto = new PaginationDto()) {
    return this.websiteService.getGalleryPaginated(pagination, division);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Featured gallery images' })
  findFeatured() {
    return this.websiteService.getFeaturedGallery();
  }
}

@ApiTags('Website - Testimonials')
@Controller('website/testimonials')
export class PublicTestimonialsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'List approved testimonials' })
  findAll(@Query() pagination: PaginationDto) {
    return this.websiteService.getTestimonialsPaginated(pagination, true);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Featured testimonials' })
  findFeatured() {
    return this.websiteService.getFeaturedTestimonials();
  }

  @Post()
  @ApiOperation({ summary: 'Submit a testimonial' })
  create(@Body() dto: CreateTestimonialDto) {
    return this.websiteService.createTestimonial(dto);
  }
}

@ApiTags('Website - Contact')
@Controller('website/contact')
export class PublicContactController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a contact message' })
  create(@Body() dto: CreateContactMessageDto) {
    return this.websiteService.submitContactMessage(dto);
  }
}

@ApiTags('Website - Quotes')
@Controller('website/quotes')
export class PublicQuotesController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a quote request' })
  create(@Body() dto: CreateQuoteRequestDto) {
    return this.websiteService.submitQuoteRequest(dto);
  }
}

@ApiTags('Website - FAQs')
@Controller('website/faqs')
export class PublicFaqsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'List FAQs' })
  findAll(@Query() pagination: PaginationDto) {
    return this.websiteService.getPublicFaqs();
  }
}

// ==================== ADMIN (auth required) ====================

@ApiTags('Admin - Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all products (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'division', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('division') division?: string,
    @Query('search') search?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.websiteService.getAllProductsPaginated(pagination, { division, search });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get product by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.websiteService.getProductById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'featureImages', maxCount: 5 },
    { name: 'images', maxCount: 10 },
  ]))
  @ApiOperation({ summary: 'Create a product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        division: { type: 'string', enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] },
        category: { type: 'string' },
        description: { type: 'string' },
        materialId: { type: 'string' },
        price: { type: 'number' },
        mainImage: { type: 'string', format: 'binary' },
        featureImages: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
        images: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 10 },
      },
    },
  })
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.websiteService.createProduct(dto, files);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'featureImages', maxCount: 5 },
    { name: 'images', maxCount: 10 },
  ]))
  @ApiOperation({ summary: 'Update a product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        division: { type: 'string', enum: ['furniture', 'aluminum', 'interior_design', 'custom_orders', 'accessories'] },
        category: { type: 'string' },
        description: { type: 'string' },
        materialId: { type: 'string' },
        price: { type: 'number' },
        mainImage: { type: 'string', format: 'binary' },
        featureImages: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
        images: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 10 },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
    @UploadedFiles() files?: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.websiteService.updateProduct(id, dto, files);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id') id: string) {
    return this.websiteService.deleteProduct(id);
  }
}

@ApiTags('Admin - Gallery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/gallery')
export class AdminGalleryController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Add gallery image' })
  create(@Body() dto: CreateGalleryImageDto) {
    return this.websiteService.createGalleryImage(dto);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update gallery image' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateGalleryImageDto>) {
    return this.websiteService.updateGalleryImage(id, dto);
  }

  @Patch(':id/feature')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Toggle gallery image featured status' })
  toggleFeatured(@Param('id') id: string) {
    return this.websiteService.toggleGalleryFeatured(id);
  }

  @Delete(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Delete gallery image' })
  remove(@Param('id') id: string) {
    return this.websiteService.deleteGalleryImage(id);
  }
}

@ApiTags('Admin - Testimonials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/testimonials')
export class AdminTestimonialsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all testimonials (admin)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.websiteService.getTestimonialsPaginated(pagination);
  }

  @Patch(':id/approve')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Approve a testimonial' })
  approve(@Param('id') id: string) {
    return this.websiteService.approveTestimonial(id);
  }

  @Patch(':id/feature')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Toggle testimonial featured status' })
  toggleFeatured(@Param('id') id: string) {
    return this.websiteService.toggleTestimonialFeatured(id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a testimonial' })
  remove(@Param('id') id: string) {
    return this.websiteService.deleteTestimonial(id);
  }
}

@ApiTags('Admin - Contact Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/contact')
export class AdminContactController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List contact messages' })
  findAll(@Query() pagination: PaginationDto) {
    return this.websiteService.getContactMessages(pagination);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update message status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.websiteService.updateContactStatus(id, body.status);
  }
}

@ApiTags('Admin - Quote Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/quotes')
export class AdminQuotesController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List quote requests' })
  findAll(@Query() pagination: PaginationDto) {
    return this.websiteService.getQuoteRequests(pagination);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update quote status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.websiteService.updateQuoteStatus(id, body.status);
  }
}

@ApiTags('Admin - FAQs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/faqs')
export class AdminFaqsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all FAQs (admin)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.websiteService.getAllFaqsPaginated(pagination);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Create FAQ' })
  create(@Body() dto: CreateFaqDto) {
    return this.websiteService.createFaq(dto);
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update FAQ' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateFaqDto>) {
    return this.websiteService.updateFaq(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete FAQ' })
  remove(@Param('id') id: string) {
    return this.websiteService.deleteFaq(id);
  }
}
