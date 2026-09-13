import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseInterceptors,
  UploadedFiles, UploadedFile, Header,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { WebsiteService } from './website.service';
import {
  CreateContactMessageDto,
  CreateQuoteRequestDto,
  CreateTestimonialDto,
  CreateProductDto,
  CreateGalleryImageDto,
  CreateFaqDto,
  CreateBlogPostDto,
  UpdateAboutPageDto,
  CreateServiceDto,
  CreateBeforeAfterDto,
  UpdateContactInfoDto,
} from './dto/website.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

// ==================== PUBLIC (no auth) ====================

@ApiTags('Website - Products')
@Controller('website/products')
export class PublicProductsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('store')
  @Public()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'List products for storefront (no auth required)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findStoreProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.websiteService.getPublicProductsForStore(p, l);
  }

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

@ApiTags('Website - Projects')
@Controller('website/projects')
export class PublicProjectsController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get('store')
  @Public()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  @ApiOperation({ summary: 'List completed projects for storefront' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'division', required: false, enum: ['furniture', 'aluminum', 'interior_design'] })
  findStoreProjects(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('division') division?: string,
  ) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.websiteService.getProjectsForStore(p, l, division);
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

// ==================== PUBLIC BLOG ====================

@ApiTags('Website - Blog')
@Controller('website/blog')
export class PublicBlogController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'List published blog posts' })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('category') category?: string) {
    return this.websiteService.getPublicBlogPosts(category);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get blog post by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.websiteService.getBlogPostBySlug(slug);
  }
}

// ==================== ADMIN BLOG ====================

@ApiTags('Admin - Blog')
@ApiBearerAuth()
@Controller('admin/blog')
export class AdminBlogController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all blog posts (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.websiteService.getAllBlogPostsPaginated(pagination, { category, search });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get blog post by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.websiteService.getBlogPostById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'featureImages', maxCount: 5 },
  ]))
  @ApiOperation({ summary: 'Create blog post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        slug: { type: 'string' },
        excerpt: { type: 'string' },
        content: { type: 'string' },
        category: { type: 'string', enum: ['materials', 'aluminum', 'interior', 'furniture', 'general'] },
        isPublished: { type: 'boolean' },
        mainImage: { type: 'string', format: 'binary' },
        featureImages: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
      },
    },
  })
  create(
    @Body() dto: CreateBlogPostDto,
    @UploadedFiles() files: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[] },
  ) {
    return this.websiteService.createBlogPost(dto, {
      mainImage: files?.mainImage?.[0],
      featureImages: files?.featureImages,
    });
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'featureImages', maxCount: 5 },
  ]))
  @ApiOperation({ summary: 'Update blog post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        slug: { type: 'string' },
        excerpt: { type: 'string' },
        content: { type: 'string' },
        category: { type: 'string', enum: ['materials', 'aluminum', 'interior', 'furniture', 'general'] },
        isPublished: { type: 'boolean' },
        mainImage: { type: 'string', format: 'binary' },
        featureImages: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBlogPostDto>,
    @UploadedFiles() files: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[] },
  ) {
    return this.websiteService.updateBlogPost(id, dto, {
      mainImage: files?.mainImage?.[0],
      featureImages: files?.featureImages,
    });
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete blog post' })
  remove(@Param('id') id: string) {
    return this.websiteService.deleteBlogPost(id);
  }
}

// ==================== PUBLIC ABOUT ====================

@ApiTags('Website - About')
@Controller('website/about')
export class PublicAboutController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'Get about page content' })
  getAboutPage() {
    return this.websiteService.getAboutPage();
  }
}

// ==================== ADMIN ABOUT ====================

@ApiTags('Admin - About')
@ApiBearerAuth()
@Controller('admin/about')
export class AdminAboutController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get about page content (admin)' })
  getAboutPage() {
    return this.websiteService.getAboutPage();
  }

  @Patch()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update about page' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description1: { type: 'string' },
        description2: { type: 'string' },
        yearsOfExperience: { type: 'number' },
        projectsCompleted: { type: 'number' },
        countriesServed: { type: 'number' },
        skilledArtisans: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Body() dto: UpdateAboutPageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.websiteService.updateAboutPage(dto, file);
  }
}

// ==================== PUBLIC SERVICES ====================

@ApiTags('Website - Services')
@Controller('website/services')
export class PublicServicesController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'List active services' })
  findAll() {
    return this.websiteService.getPublicServices();
  }
}

// ==================== ADMIN SERVICES ====================

@ApiTags('Admin - Services')
@ApiBearerAuth()
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all services (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.websiteService.getAllServicesPaginated(pagination, { category, search });
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get service by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.websiteService.getServiceById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'featureImages', maxCount: 5 },
  ]))
  @ApiOperation({ summary: 'Create service' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        bulletPoints: { type: 'array', items: { type: 'string' } },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean' },
        mainImage: { type: 'string', format: 'binary' },
        featureImages: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
      },
    },
  })
  create(
    @Body() dto: CreateServiceDto,
    @UploadedFiles() files: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[] },
  ) {
    return this.websiteService.createService(dto, {
      mainImage: files?.mainImage?.[0],
      featureImages: files?.featureImages,
    });
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'mainImage', maxCount: 1 },
    { name: 'featureImages', maxCount: 5 },
  ]))
  @ApiOperation({ summary: 'Update service' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        bulletPoints: { type: 'array', items: { type: 'string' } },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean' },
        mainImage: { type: 'string', format: 'binary' },
        featureImages: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 5 },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceDto>,
    @UploadedFiles() files: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[] },
  ) {
    return this.websiteService.updateService(id, dto, {
      mainImage: files?.mainImage?.[0],
      featureImages: files?.featureImages,
    });
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete service' })
  remove(@Param('id') id: string) {
    return this.websiteService.deleteService(id);
  }
}

// ==================== PUBLIC BEFORE & AFTER ====================

@ApiTags('Website - Before & After')
@Controller('website/before-after')
export class PublicBeforeAfterController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'List active before & after pairs' })
  findAll() {
    return this.websiteService.getPublicBeforeAfter();
  }
}

// ==================== ADMIN BEFORE & AFTER ====================

@ApiTags('Admin - Before & After')
@ApiBearerAuth()
@Controller('admin/before-after')
export class AdminBeforeAfterController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'List all before & after (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 };
    return this.websiteService.getAllBeforeAfterPaginated(pagination);
  }

  @Get(':id')
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get before & after by ID' })
  findOne(@Param('id') id: string) {
    return this.websiteService.getBeforeAfterById(id);
  }

  @Post()
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Create before & after pair' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean' },
        beforeImage: { type: 'string', format: 'binary' },
        afterImage: { type: 'string', format: 'binary' },
      },
    },
  })
  create(
    @Body() dto: CreateBeforeAfterDto,
    @UploadedFiles() files: { beforeImage?: Express.Multer.File[]; afterImage?: Express.Multer.File[] },
  ) {
    return this.websiteService.createBeforeAfter(dto, {
      beforeImage: files?.beforeImage?.[0],
      afterImage: files?.afterImage?.[0],
    });
  }

  @Patch(':id')
  @Roles('super_admin', 'manager')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Update before & after pair' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        sortOrder: { type: 'number' },
        isActive: { type: 'boolean' },
        beforeImage: { type: 'string', format: 'binary' },
        afterImage: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBeforeAfterDto>,
    @UploadedFiles() files: { beforeImage?: Express.Multer.File[]; afterImage?: Express.Multer.File[] },
  ) {
    return this.websiteService.updateBeforeAfter(id, dto, {
      beforeImage: files?.beforeImage?.[0],
      afterImage: files?.afterImage?.[0],
    });
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete before & after pair' })
  remove(@Param('id') id: string) {
    return this.websiteService.deleteBeforeAfter(id);
  }
}

// ==================== PUBLIC CONTACT INFO ====================

@ApiTags('Website - Contact Info')
@Controller('website/contact-info')
export class PublicContactInfoController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @ApiOperation({ summary: 'Get contact info (address, phones, hours, map)' })
  getContactInfo() {
    return this.websiteService.getContactInfo();
  }
}

// ==================== ADMIN CONTACT INFO ====================

@ApiTags('Admin - Contact Info')
@ApiBearerAuth()
@Controller('admin/contact-info')
export class AdminContactInfoController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Get()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Get contact info (admin)' })
  getContactInfo() {
    return this.websiteService.getContactInfo();
  }

  @Patch()
  @Roles('super_admin', 'manager')
  @ApiOperation({ summary: 'Update contact info' })
  update(@Body() dto: UpdateContactInfoDto) {
    return this.websiteService.updateContactInfo(dto);
  }
}
