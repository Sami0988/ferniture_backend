import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { eq, desc, and, sql, ilike } from 'drizzle-orm';
import {
  products, galleryImages, testimonials,
  contactMessages, quoteRequests, faqs, materials, projects, blogPosts, aboutPage, services, beforeAfter, contactInfo,
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

  async findPublicProductsForStore(): Promise<any[]> {
    return this.db
      .select({
        id: products.id,
        name: products.name,
        division: products.division,
        category: products.category,
        price: products.price,
        mainImage: products.mainImage,
        description: products.description,
        materialName: materials.name,
        materialCategory: materials.category,
      })
      .from(products)
      .leftJoin(materials, eq(products.materialId, materials.id))
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));
  }

  async findPublicProductsForStorePaginated(page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.isActive, true));

    const data = await this.db
      .select({
        id: products.id,
        name: products.name,
        division: products.division,
        category: products.category,
        price: products.price,
        mainImage: products.mainImage,
        description: products.description,
        materialName: materials.name,
        materialCategory: materials.category,
      })
      .from(products)
      .leftJoin(materials, eq(products.materialId, materials.id))
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: countResult.count };
  }

  async findProductsPaginated(pagination: PaginationDto, division?: string): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
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
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
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
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
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

  // --- Projects for Store ---
  async findProjectsForStore(): Promise<any[]> {
    return this.db
      .select({
        id: projects.id,
        title: projects.title,
        division: projects.division,
        coverImage: projects.coverImage,
        imageUrl: galleryImages.imageUrl,
        aspect: galleryImages.aspect,
      })
      .from(projects)
      .leftJoin(galleryImages, eq(projects.id, galleryImages.projectId))
      .where(eq(projects.status, 'completed'))
      .orderBy(desc(projects.deliveredAt));
  }

  async findProjectsForStorePaginated(page: number = 1, limit: number = 20, division?: string): Promise<{ data: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: any[] = [eq(projects.status, 'completed')];
    if (division) conditions.push(eq(projects.division, division as any));
    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(where as any);

    const data = await this.db
      .select({
        id: projects.id,
        title: projects.title,
        division: projects.division,
        coverImage: projects.coverImage,
        imageUrl: galleryImages.imageUrl,
        aspect: galleryImages.aspect,
      })
      .from(projects)
      .leftJoin(galleryImages, eq(projects.id, galleryImages.projectId))
      .where(where as any)
      .orderBy(desc(projects.deliveredAt))
      .limit(limit)
      .offset(offset);

    return { data, total: countResult.count };
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
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
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
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
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
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
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
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
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

  // --- Blog Posts ---
  async findPublishedBlogPosts(category?: string): Promise<any[]> {
    const conditions = [eq(blogPosts.isPublished, true)];
    if (category) conditions.push(eq(blogPosts.category, category as any));
    return this.db
      .select()
      .from(blogPosts)
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async findBlogPostBySlug(slug: string): Promise<any> {
    const [post] = await this.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    return post || null;
  }

  async findBlogPostById(id: string): Promise<any> {
    const [post] = await this.db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    return post || null;
  }

  async findAllBlogPostsPaginated(pagination: PaginationDto, filters?: { category?: string; search?: string }): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.category) conditions.push(eq(blogPosts.category, filters.category as any));
    if (filters?.search) conditions.push(ilike(blogPosts.title, `%${filters.search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(blogPosts)
      .where(where as any);

    const data = await this.db
      .select()
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async createBlogPost(data: any) {
    const [post] = await this.db.insert(blogPosts).values(data).returning();
    return post;
  }

  async updateBlogPost(id: string, data: any) {
    const [updated] = await this.db
      .update(blogPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Blog post not found');
    return updated;
  }

  async deleteBlogPost(id: string) {
    await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // --- About Page ---
  async getAboutPage(): Promise<any> {
    const [row] = await this.db.select().from(aboutPage).limit(1);
    return row || null;
  }

  async upsertAboutPage(data: any): Promise<any> {
    const existing = await this.getAboutPage();
    if (existing) {
      const [updated] = await this.db
        .update(aboutPage)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(aboutPage.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await this.db.insert(aboutPage).values(data).returning();
    return created;
  }

  // --- Services ---
  async findPublicServices(): Promise<any[]> {
    return this.db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(services.sortOrder);
  }

  async findServiceById(id: string): Promise<any> {
    const [service] = await this.db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service || null;
  }

  async findAllServicesPaginated(pagination: PaginationDto, filters?: { category?: string; search?: string }): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (filters?.category) conditions.push(eq(services.category, filters.category));
    if (filters?.search) conditions.push(ilike(services.title, `%${filters.search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(services)
      .where(where as any);

    const data = await this.db
      .select()
      .from(services)
      .where(where)
      .orderBy(services.sortOrder)
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async createService(data: any) {
    const [service] = await this.db.insert(services).values(data).returning();
    return service;
  }

  async updateService(id: string, data: any) {
    const [updated] = await this.db
      .update(services)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Service not found');
    return updated;
  }

  async deleteService(id: string) {
    await this.db.delete(services).where(eq(services.id, id));
  }

  // --- Before & After ---
  async findPublicBeforeAfter(): Promise<any[]> {
    return this.db
      .select()
      .from(beforeAfter)
      .where(eq(beforeAfter.isActive, true))
      .orderBy(beforeAfter.sortOrder);
  }

  async findBeforeAfterById(id: string): Promise<any> {
    const [item] = await this.db
      .select()
      .from(beforeAfter)
      .where(eq(beforeAfter.id, id));
    return item || null;
  }

  async findAllBeforeAfterPaginated(pagination: PaginationDto): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(beforeAfter);

    const data = await this.db
      .select()
      .from(beforeAfter)
      .orderBy(beforeAfter.sortOrder)
      .limit(limit)
      .offset(offset);

    return new PaginatedResult(data, countResult.count, page, limit);
  }

  async createBeforeAfter(data: any) {
    const [item] = await this.db.insert(beforeAfter).values(data).returning();
    return item;
  }

  async updateBeforeAfter(id: string, data: any) {
    const [updated] = await this.db
      .update(beforeAfter)
      .set(data)
      .where(eq(beforeAfter.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Before & After not found');
    return updated;
  }

  async deleteBeforeAfter(id: string) {
    await this.db.delete(beforeAfter).where(eq(beforeAfter.id, id));
  }

  // --- Contact Info ---
  async getContactInfo(): Promise<any> {
    const [row] = await this.db.select().from(contactInfo).limit(1);
    return row || null;
  }

  async upsertContactInfo(data: any): Promise<any> {
    const existing = await this.getContactInfo();
    if (existing) {
      const [updated] = await this.db
        .update(contactInfo)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(contactInfo.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await this.db.insert(contactInfo).values(data).returning();
    return created;
  }
}
