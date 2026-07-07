import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, and, sql, ilike } from 'drizzle-orm';
import {
  products, galleryImages, testimonials,
  contactMessages, quoteRequests, faqs,
} from '../../database/schema';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class WebsiteRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  // --- Products ---
  async findPublicProducts(division?: string): Promise<any[]> {
    const conditions = [eq(products.isActive, true)];
    if (division) conditions.push(eq(products.division, division as any));
    return this.db.select().from(products).where(and(...conditions)).orderBy(desc(products.createdAt));
  }

  async findProductsPaginated(pagination: PaginationDto, division?: string): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const conditions = [eq(products.isActive, true)];
    if (division) conditions.push(eq(products.division, division as any));
    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where as any);

    const data = await this.db
      .select()
      .from(products)
      .where(where as any)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findAllProductsPaginated(pagination: PaginationDto, filters?: { division?: string; search?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.division) conditions.push(eq(products.division, filters.division as any));
    if (filters?.search) conditions.push(ilike(products.name, `%${filters.search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where as any);

    const data = await this.db
      .select()
      .from(products)
      .where(where as any)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findProductById(id: string) {
    const [product] = await this.db.select().from(products).where(eq(products.id, id));
    return product || null;
  }

  async findProductByName(name: string) {
    const [product] = await this.db.select().from(products).where(eq(products.name, name));
    return product || null;
  }

  async createProduct(data: any) {
    const [product] = await this.db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: string, data: any) {
    const [updated] = await this.db.update(products).set(data).where(eq(products.id, id)).returning();
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async deleteProduct(id: string) {
    await this.db.delete(products).where(eq(products.id, id));
  }

  // --- Gallery ---
  async findPublicGallery(division?: string): Promise<any[]> {
    const conditions: any[] = [];
    if (division) conditions.push(eq(galleryImages.division, division as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return this.db.select().from(galleryImages).where(where as any).orderBy(desc(galleryImages.createdAt));
  }

  async findGalleryPaginated(pagination: PaginationDto, division?: string): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const conditions: any[] = [];
    if (division) conditions.push(eq(galleryImages.division, division as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(galleryImages)
      .where(where as any);

    const data = await this.db
      .select()
      .from(galleryImages)
      .where(where as any)
      .orderBy(desc(galleryImages.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findFeaturedGallery(): Promise<any[]> {
    return this.db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.isFeatured, true))
      .orderBy(desc(galleryImages.createdAt));
  }

  async createGalleryImage(data: any) {
    const [image] = await this.db.insert(galleryImages).values(data).returning();
    return image;
  }

  async deleteGalleryImage(id: string) {
    await this.db.delete(galleryImages).where(eq(galleryImages.id, id));
  }

  async toggleGalleryFeatured(id: string) {
    const [existing] = await this.db.select().from(galleryImages).where(eq(galleryImages.id, id));
    if (!existing) throw new NotFoundException('Gallery image not found');

    const [updated] = await this.db
      .update(galleryImages)
      .set({ isFeatured: !existing.isFeatured })
      .where(eq(galleryImages.id, id))
      .returning();
    return updated;
  }

  async updateGalleryImage(id: string, data: any) {
    const [updated] = await this.db.update(galleryImages).set(data).where(eq(galleryImages.id, id)).returning();
    if (!updated) throw new NotFoundException('Gallery image not found');
    return updated;
  }

  // --- Testimonials ---
  async findPublicTestimonials(): Promise<any[]> {
    return this.db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isApproved, true))
      .orderBy(desc(testimonials.createdAt));
  }

  async findTestimonialsPaginated(pagination: PaginationDto, approvedOnly: boolean = false): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const conditions = approvedOnly ? [eq(testimonials.isApproved, true)] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(testimonials)
      .where(where as any);

    const data = await this.db
      .select()
      .from(testimonials)
      .where(where as any)
      .orderBy(desc(testimonials.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findFeaturedTestimonials(): Promise<any[]> {
    return this.db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.isApproved, true), eq(testimonials.isFeatured, true)))
      .orderBy(desc(testimonials.createdAt));
  }

  async createTestimonial(data: any) {
    const [testimonial] = await this.db.insert(testimonials).values(data).returning();
    return testimonial;
  }

  async approveTestimonial(id: string) {
    const [updated] = await this.db
      .update(testimonials)
      .set({ isApproved: true })
      .where(eq(testimonials.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Testimonial not found');
    return updated;
  }

  async deleteTestimonial(id: string) {
    await this.db.delete(testimonials).where(eq(testimonials.id, id));
  }

  async toggleTestimonialFeatured(id: string) {
    const [existing] = await this.db.select().from(testimonials).where(eq(testimonials.id, id));
    if (!existing) throw new NotFoundException('Testimonial not found');

    const [updated] = await this.db
      .update(testimonials)
      .set({ isFeatured: !existing.isFeatured })
      .where(eq(testimonials.id, id))
      .returning();
    return updated;
  }

  // --- Contact Messages ---
  async createContactMessage(data: any) {
    const [message] = await this.db.insert(contactMessages).values(data).returning();
    return message;
  }

  async findContactMessages(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactMessages);

    const data = await this.db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async updateContactStatus(id: string, status: string) {
    const [updated] = await this.db
      .update(contactMessages)
      .set({ status: status as any })
      .where(eq(contactMessages.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Message not found');
    return updated;
  }

  // --- Quote Requests ---
  async createQuoteRequest(data: any) {
    const [quote] = await this.db.insert(quoteRequests).values(data).returning();
    return quote;
  }

  async findQuoteRequests(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(quoteRequests);

    const data = await this.db
      .select()
      .from(quoteRequests)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async updateQuoteStatus(id: string, status: string) {
    const [updated] = await this.db
      .update(quoteRequests)
      .set({ status: status as any })
      .where(eq(quoteRequests.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Quote request not found');
    return updated;
  }

  // --- FAQs ---
  async findPublicFaqs(): Promise<any[]> {
    return this.db
      .select()
      .from(faqs)
      .where(eq(faqs.isActive, true))
      .orderBy(faqs.sortOrder);
  }

  async findAllFaqsPaginated(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(faqs);

    const data = await this.db
      .select()
      .from(faqs)
      .orderBy(faqs.sortOrder)
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async findAllFaqs(): Promise<any[]> {
    return this.db.select().from(faqs).orderBy(faqs.sortOrder);
  }

  async createFaq(data: any) {
    const [faq] = await this.db.insert(faqs).values(data).returning();
    return faq;
  }

  async updateFaq(id: string, data: any) {
    const [updated] = await this.db.update(faqs).set(data).where(eq(faqs.id, id)).returning();
    if (!updated) throw new NotFoundException('FAQ not found');
    return updated;
  }

  async deleteFaq(id: string) {
    await this.db.delete(faqs).where(eq(faqs.id, id));
  }
}
