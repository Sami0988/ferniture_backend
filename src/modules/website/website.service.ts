import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { WebsiteRepository } from './website.repository';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class WebsiteService {
  constructor(
    private readonly repo: WebsiteRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
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

  async getProductById(id: string) {
    const product = await this.repo.findProductById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(data: any) {
    await this.cache.del('products:all');
    return this.repo.createProduct(data);
  }

  async updateProduct(id: string, data: any) {
    await this.getProductById(id);
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
