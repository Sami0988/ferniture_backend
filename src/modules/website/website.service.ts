import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { WebsiteRepository } from './website.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class WebsiteService {
  constructor(
    private readonly repo: WebsiteRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly uploadsService: UploadsService,
  ) {}

  // Products
  async getPublicProducts(division?: string) {
    const cacheKey = `products:${division || 'all'}`;
    let products = await this.cache.get<any[]>(cacheKey);
    if (!products) {
      products = await this.repo.findPublicProducts(division);
      await this.cache.set(cacheKey, products, 300); // 5 min TTL
    }
    return products;
  }

  async getPublicProductsForStore(page?: number, limit?: number) {
    if (page || limit) {
      const p = page || 1;
      const l = limit || 20;
      const cacheKey = `products:store:${p}:${l}`;
      let cached = await this.cache.get<{ data: any[]; total: number }>(cacheKey);
      if (!cached) {
        cached = await this.repo.findPublicProductsForStorePaginated(p, l);
        await this.cache.set(cacheKey, cached, 300);
      }

      const divisionMap: Record<string, string> = {
        furniture: 'Furniture',
        aluminum: 'Aluminum',
        interior_design: 'Interior',
        custom_orders: 'Custom Orders',
        accessories: 'Accessories',
      };

      const materialTypeMap: Record<string, string> = {
        wood_species: 'Wood',
        wood_finish: 'Wood',
        aluminum_profile: 'Aluminum',
        aluminum_color: 'Aluminum',
        hardware: 'Hardware',
        glass: 'Glass',
        other: 'Other',
      };

      const products = cached.data.map((p) => ({
        id: p.id,
        name: p.name,
        category: divisionMap[p.division] || p.division,
        material: p.materialName || (p.materialCategory ? materialTypeMap[p.materialCategory] : null) || 'Unknown',
        price: p.price ? Number(p.price) : null,
        image: p.mainImage,
        description: p.description || null,
      }));

      return {
        products,
        total: cached.total,
        page: p,
        limit: l,
        totalPages: Math.ceil(cached.total / l),
      };
    }

    const cacheKey = 'products:store';
    let rawProducts = await this.cache.get<any[]>(cacheKey);
    if (!rawProducts) {
      rawProducts = await this.repo.findPublicProductsForStore();
      await this.cache.set(cacheKey, rawProducts, 300);
    }

    const divisionMap: Record<string, string> = {
      furniture: 'Furniture',
      aluminum: 'Aluminum',
      interior_design: 'Interior',
      custom_orders: 'Custom Orders',
      accessories: 'Accessories',
    };

    const materialTypeMap: Record<string, string> = {
      wood_species: 'Wood',
      wood_finish: 'Wood',
      aluminum_profile: 'Aluminum',
      aluminum_color: 'Aluminum',
      hardware: 'Hardware',
      glass: 'Glass',
      other: 'Other',
    };

    const products = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: divisionMap[p.division] || p.division,
      material: p.materialName || (p.materialCategory ? materialTypeMap[p.materialCategory] : null) || 'Unknown',
      price: p.price ? Number(p.price) : null,
      image: p.mainImage,
      description: p.description || null,
    }));

    return { products };
  }

  async getProductsPaginated(pagination: PaginationDto, division?: string) {
    return this.repo.findProductsPaginated(pagination, division);
  }

  async getAllProductsPaginated(pagination: PaginationDto, filters?: { division?: string; search?: string }) {
    return this.repo.findAllProductsPaginated(pagination, filters);
  }

  async getProductById(id: string) {
    const product = await this.repo.findProductById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(data: any, files?: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[]; images?: Express.Multer.File[] }) {
    const existing = await this.repo.findProductByName(data.name);
    if (existing) throw new ConflictException('A product with this name already exists');

    if (files?.mainImage?.[0]) {
      const result = await this.uploadsService.uploadImage(files.mainImage[0], 'kassahun/products/main');
      data.mainImage = result.url;
    }

    if (files?.featureImages?.length) {
      const uploadPromises = files.featureImages.map(file => this.uploadsService.uploadImage(file, 'kassahun/products/features'));
      const results = await Promise.all(uploadPromises);
      data.featureImages = results.map(r => r.url);
    }

    if (files?.images?.length) {
      const uploadPromises = files.images.map(file => this.uploadsService.uploadImage(file, 'kassahun/products/images'));
      const results = await Promise.all(uploadPromises);
      data.mainImage = data.mainImage || results[0]?.url;
      data.featureImages = [...(data.featureImages || []), ...results.map(r => r.url)].slice(0, 5);
    }

    await this.cache.del('products:all');
    return this.repo.createProduct(data);
  }

  async updateProduct(id: string, data: any, files?: { mainImage?: Express.Multer.File[]; featureImages?: Express.Multer.File[]; images?: Express.Multer.File[] }) {
    await this.getProductById(id);

    if (files?.mainImage?.[0]) {
      const result = await this.uploadsService.uploadImage(files.mainImage[0], 'kassahun/products/main');
      data.mainImage = result.url;
    }

    if (files?.featureImages?.length) {
      const uploadPromises = files.featureImages.map(file => this.uploadsService.uploadImage(file, 'kassahun/products/features'));
      const results = await Promise.all(uploadPromises);
      data.featureImages = results.map(r => r.url);
    }

    if (files?.images?.length) {
      const uploadPromises = files.images.map(file => this.uploadsService.uploadImage(file, 'kassahun/products/images'));
      const results = await Promise.all(uploadPromises);
      data.mainImage = data.mainImage || results[0]?.url;
      data.featureImages = [...(data.featureImages || []), ...results.map(r => r.url)].slice(0, 5);
    }

    await this.cache.del('products:all');
    return this.repo.updateProduct(id, data);
  }

  async deleteProduct(id: string) {
    await this.getProductById(id);
    await this.cache.del('products:all');
    await this.repo.deleteProduct(id);
  }

  // Gallery
  async getPublicGallery(division?: string) {
    const cacheKey = `gallery:${division || 'all'}`;
    let images = await this.cache.get<any[]>(cacheKey);
    if (!images) {
      images = await this.repo.findPublicGallery(division);
      await this.cache.set(cacheKey, images, 300);
    }
    return images;
  }

  async getGalleryPaginated(pagination: PaginationDto, division?: string) {
    return this.repo.findGalleryPaginated(pagination, division);
  }

  async getFeaturedGallery() {
    const cacheKey = 'gallery:featured';
    let images = await this.cache.get<any[]>(cacheKey);
    if (!images) {
      images = await this.repo.findFeaturedGallery();
      await this.cache.set(cacheKey, images, 300);
    }
    return images;
  }

  async createGalleryImage(data: any) {
    await this.cache.del('gallery:all');
    await this.cache.del('gallery:featured');
    return this.repo.createGalleryImage(data);
  }

  async deleteGalleryImage(id: string) {
    await this.cache.del('gallery:all');
    await this.cache.del('gallery:featured');
    await this.repo.deleteGalleryImage(id);
  }

  async toggleGalleryFeatured(id: string) {
    await this.cache.del('gallery:all');
    await this.cache.del('gallery:featured');
    return this.repo.toggleGalleryFeatured(id);
  }

  async updateGalleryImage(id: string, data: any) {
    await this.cache.del('gallery:all');
    await this.cache.del('gallery:featured');
    return this.repo.updateGalleryImage(id, data);
  }

  async getProjectsForStore(page?: number, limit?: number, division?: string) {
    const divisionMap: Record<string, string> = {
      furniture: 'Furniture',
      aluminum: 'Aluminum',
      interior_design: 'Interior',
      custom_orders: 'Custom Orders',
      accessories: 'Accessories',
    };

    const transformProject = (p: any) => ({
      id: p.id,
      title: p.title,
      division: divisionMap[p.division] || p.division,
      aspect: p.aspect || 'square',
      image: p.imageUrl || p.coverImage,
    });

    if (page || limit || division) {
      const p = page || 1;
      const l = limit || 20;
      const cacheKey = `projects:store:${p}:${l}:${division || 'all'}`;
      let cached = await this.cache.get<{ data: any[]; total: number }>(cacheKey);
      if (!cached) {
        cached = await this.repo.findProjectsForStorePaginated(p, l, division);
        await this.cache.set(cacheKey, cached, 300);
      }

      return {
        projects: cached.data.map(transformProject),
        total: cached.total,
        page: p,
        limit: l,
        totalPages: Math.ceil(cached.total / l),
      };
    }

    const cacheKey = 'projects:store';
    let rawProjects = await this.cache.get<any[]>(cacheKey);
    if (!rawProjects) {
      rawProjects = await this.repo.findProjectsForStore();
      await this.cache.set(cacheKey, rawProjects, 300);
    }

    return { projects: rawProjects.map(transformProject) };
  }

  // Testimonials
  async getPublicTestimonials() {
    const cacheKey = 'testimonials:all';
    let testimonials = await this.cache.get<any[]>(cacheKey);
    if (!testimonials) {
      testimonials = await this.repo.findPublicTestimonials();
      await this.cache.set(cacheKey, testimonials, 300);
    }
    return testimonials;
  }

  async getTestimonialsPaginated(pagination: PaginationDto, approvedOnly: boolean = false) {
    return this.repo.findTestimonialsPaginated(pagination, approvedOnly);
  }

  async getFeaturedTestimonials() {
    const cacheKey = 'testimonials:featured';
    let testimonials = await this.cache.get<any[]>(cacheKey);
    if (!testimonials) {
      testimonials = await this.repo.findFeaturedTestimonials();
      await this.cache.set(cacheKey, testimonials, 300);
    }
    return testimonials;
  }

  async createTestimonial(data: any) {
    await this.cache.del('testimonials:all');
    await this.cache.del('testimonials:featured');
    return this.repo.createTestimonial(data);
  }

  async approveTestimonial(id: string) {
    await this.cache.del('testimonials:all');
    return this.repo.approveTestimonial(id);
  }

  async deleteTestimonial(id: string) {
    await this.cache.del('testimonials:all');
    await this.cache.del('testimonials:featured');
    await this.repo.deleteTestimonial(id);
  }

  async toggleTestimonialFeatured(id: string) {
    await this.cache.del('testimonials:all');
    await this.cache.del('testimonials:featured');
    return this.repo.toggleTestimonialFeatured(id);
  }

  // Contact Messages
  async submitContactMessage(data: any) {
    return this.repo.createContactMessage(data);
  }

  async getContactMessages(pagination: PaginationDto) {
    return this.repo.findContactMessages(pagination);
  }

  async updateContactStatus(id: string, status: string) {
    return this.repo.updateContactStatus(id, status);
  }

  // Quote Requests
  async submitQuoteRequest(data: any) {
    return this.repo.createQuoteRequest(data);
  }

  async getQuoteRequests(pagination: PaginationDto) {
    return this.repo.findQuoteRequests(pagination);
  }

  async updateQuoteStatus(id: string, status: string) {
    return this.repo.updateQuoteStatus(id, status);
  }

  // FAQs
  async getPublicFaqs() {
    const cacheKey = 'faqs:all';
    let faqs = await this.cache.get<any[]>(cacheKey);
    if (!faqs) {
      faqs = await this.repo.findPublicFaqs();
      await this.cache.set(cacheKey, faqs, 600); // 10 min — FAQs rarely change
    }
    return faqs;
  }

  async getAllFaqs() {
    return this.repo.findAllFaqs();
  }

  async getAllFaqsPaginated(pagination: PaginationDto) {
    return this.repo.findAllFaqsPaginated(pagination);
  }

  async createFaq(data: any) {
    await this.cache.del('faqs:all');
    return this.repo.createFaq(data);
  }

  async updateFaq(id: string, data: any) {
    await this.cache.del('faqs:all');
    return this.repo.updateFaq(id, data);
  }

  async deleteFaq(id: string) {
    await this.cache.del('faqs:all');
    await this.repo.deleteFaq(id);
  }
}
