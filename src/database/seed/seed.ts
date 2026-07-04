import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import {
  users,
  employeeProfiles,
  customers,
  projects,
  projectAssignees,
  materials,
  projectMaterials,
  invoices,
  invoiceItems,
  testimonials,
  galleryImages,
  products,
  faqs,
  companySettings,
} from '../schema';

async function seed() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // --- Users ---
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log('Database already seeded, skipping...');
    await client.end();
    process.exit(0);
  }

  const [superAdmin] = await db
    .insert(users)
    .values({
      fullName: 'Kassahun Owner',
      phone: '+251911000001',
      email: 'owner@kassahun.com',
      passwordHash,
      role: 'super_admin',
    })
    .returning();

  const [manager] = await db
    .insert(users)
    .values({
      fullName: 'Manager One',
      phone: '+251911000002',
      email: 'manager@kassahun.com',
      passwordHash,
      role: 'manager',
    })
    .returning();

  const [employee1] = await db
    .insert(users)
    .values({
      fullName: 'Abebe Carpenter',
      phone: '+251911000003',
      passwordHash,
      role: 'employee',
    })
    .returning();

  const [employee2] = await db
    .insert(users)
    .values({
      fullName: 'Bereket Fabricator',
      phone: '+251911000004',
      passwordHash,
      role: 'employee',
    })
    .returning();

  const [employee3] = await db
    .insert(users)
    .values({
      fullName: 'Chala Designer',
      phone: '+251911000005',
      passwordHash,
      role: 'employee',
    })
    .returning();

  // --- Employee Profiles ---
  await db.insert(employeeProfiles).values([
    { userId: employee1.id, specialty: 'carpenter', hireDate: '2024-03-01', idNumber: 'EMP-001' },
    { userId: employee2.id, specialty: 'aluminum_fabricator', hireDate: '2024-06-15', idNumber: 'EMP-002' },
    { userId: employee3.id, specialty: 'interior_designer', hireDate: '2025-01-10', idNumber: 'EMP-003' },
  ]);

  // --- Customers ---
  const [customer1] = await db
    .insert(customers)
    .values({
      fullName: 'Ato Tesfaye Abate',
      phone: '+251922111222',
      email: 'tesfaye@gmail.com',
      address: 'Bole, Addis Ababa',
      tinNumber: 'TIN-001',
      createdBy: superAdmin.id,
    })
    .returning();

  const [customer2] = await db
    .insert(customers)
    .values({
      fullName: 'W/ro Hiwot Dagne',
      phone: '+251933222333',
      address: 'Kazanchis, Addis Ababa',
      createdBy: manager.id,
    })
    .returning();

  // --- Materials ---
  const [matMahogany] = await db
    .insert(materials)
    .values({
      name: 'Ethiopian Mahogany',
      category: 'wood_species',
      description: 'Premium local mahogany wood',
      unitCost: '15000',
      unit: 'board_ft',
      supplier: 'Kassahun Timber',
      isPublicVisible: true,
    })
    .returning();

  const [matTeak] = await db
    .insert(materials)
    .values({
      name: 'Teak Wood',
      category: 'wood_species',
      description: 'Imported teak for high-end furniture',
      unitCost: '25000',
      unit: 'board_ft',
      supplier: 'Asian Imports',
      isPublicVisible: true,
    })
    .returning();

  const [matMatte] = await db
    .insert(materials)
    .values({
      name: 'Matte Bronze Aluminum Profile',
      category: 'aluminum_profile',
      description: 'Heavy-duty aluminum profile with matte bronze finish',
      unitCost: '850',
      unit: 'meter',
      supplier: 'AluPro Ethiopia',
      isPublicVisible: true,
    })
    .returning();

  const [matGold] = await db
    .insert(materials)
    .values({
      name: 'Gold Anodized Aluminum',
      category: 'aluminum_color',
      description: 'Gold anodized finish for decorative frames',
      unitCost: '1200',
      unit: 'meter',
      supplier: 'AluPro Ethiopia',
    })
    .returning();

  const [matMatteFinish] = await db
    .insert(materials)
    .values({
      name: 'Matte Lacquer Finish',
      category: 'wood_finish',
      description: 'Water-based matte lacquer for furniture',
      unitCost: '350',
      unit: 'liter',
      isPublicVisible: true,
    })
    .returning();

  // --- Projects ---
  const [project1] = await db
    .insert(projects)
    .values({
      projectNumber: 'KWA-2026-0001',
      customerId: customer1.id,
      division: 'furniture',
      title: 'Custom Dining Table and Chairs',
      description: '6-seater mahogany dining table with matching chairs',
      status: 'in_progress',
      priority: 'normal',
      orderDate: '2026-01-15',
      deliveryDate: '2026-02-28',
      leadEmployeeId: employee1.id,
      createdBy: superAdmin.id,
    })
    .returning();

  const [project2] = await db
    .insert(projects)
    .values({
      projectNumber: 'KWA-2026-0002',
      customerId: customer2.id,
      division: 'aluminum',
      title: 'Aluminum Window Frames',
      description: '10 aluminum window frames for office renovation',
      status: 'new',
      priority: 'urgent',
      orderDate: '2026-02-01',
      deliveryDate: '2026-03-15',
      leadEmployeeId: employee2.id,
      createdBy: manager.id,
    })
    .returning();

  const [project3] = await db
    .insert(projects)
    .values({
      projectNumber: 'KWA-2026-0003',
      customerId: customer1.id,
      division: 'interior_design',
      title: 'Living Room Interior Redesign',
      description: 'Complete living room redesign with custom furniture',
      status: 'completed',
      priority: 'vip',
      orderDate: '2025-12-01',
      deliveryDate: '2026-01-31',
      completedAt: new Date('2026-01-28'),
      leadEmployeeId: employee3.id,
      createdBy: superAdmin.id,
    })
    .returning();

  // --- Project Assignees ---
  await db.insert(projectAssignees).values([
    { projectId: project1.id, employeeId: employee1.id },
    { projectId: project1.id, employeeId: employee3.id },
    { projectId: project2.id, employeeId: employee2.id },
    { projectId: project3.id, employeeId: employee3.id },
  ]);

  // --- Project Materials ---
  await db.insert(projectMaterials).values([
    { projectId: project1.id, materialId: matMahogany.id, quantity: '20', clientApproved: true },
    { projectId: project1.id, materialId: matMatteFinish.id, quantity: '2', clientApproved: true },
    { projectId: project2.id, materialId: matMatte.id, quantity: '50', clientApproved: false },
    { projectId: project2.id, materialId: matGold.id, quantity: '10', clientApproved: false },
  ]);

  // --- Invoices ---
  const [invoice1] = await db
    .insert(invoices)
    .values({
      invoiceNumber: 'INV-2026-0001',
      projectId: project3.id,
      customerId: customer1.id,
      subtotal: '185000',
      vatRate: '15',
      vatAmount: '27750',
      totalAmount: '212750',
      paymentStatus: 'paid',
      createdBy: superAdmin.id,
    })
    .returning();

  await db.insert(invoiceItems).values([
    { invoiceId: invoice1.id, description: 'Living Room Sofa Set', quantity: '1', unitPrice: '85000', total: '85000' },
    { invoiceId: invoice1.id, description: 'Coffee Table', quantity: '1', unitPrice: '35000', total: '35000' },
    { invoiceId: invoice1.id, description: 'TV Console', quantity: '1', unitPrice: '45000', total: '45000' },
    { invoiceId: invoice1.id, description: 'Interior Design Fee', quantity: '1', unitPrice: '20000', total: '20000' },
  ]);

  // --- Testimonials ---
  await db.insert(testimonials).values([
    {
      customerName: 'Ato Tesfaye Abate',
      projectId: project3.id,
      rating: 5,
      reviewText: 'Excellent work! The team transformed our living room completely. Highly recommended.',
      isFeatured: true,
      isApproved: true,
    },
  ]);

  // --- Gallery Images ---
  await db.insert(galleryImages).values([
    {
      title: 'Mahogany Dining Set',
      division: 'furniture',
      projectId: project1.id,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      roomType: 'dining_room',
      isFeatured: true,
    },
    {
      title: 'Aluminum Window Installation',
      division: 'aluminum',
      projectId: project2.id,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg',
      roomType: 'office',
      isFeatured: false,
    },
  ]);

  // --- Products ---
  await db.insert(products).values([
    {
      name: 'Custom Mahogany Dining Table',
      division: 'furniture',
      category: 'Tables',
      description: 'Handcrafted mahogany dining table, seats 6-8',
      materialId: matMahogany.id,
      priceRangeMin: '85000',
      priceRangeMax: '150000',
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/v1/dining.jpg'],
    },
    {
      name: 'Aluminum Sliding Windows',
      division: 'aluminum',
      category: 'Windows',
      description: 'Durable aluminum sliding windows with double glazing',
      materialId: matMatte.id,
      priceRangeMin: '5000',
      priceRangeMax: '12000',
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/v1/window.jpg'],
    },
  ]);

  // --- FAQs ---
  await db.insert(faqs).values([
    {
      question: 'How long does a custom furniture order take?',
      answer: 'Typically 2-4 weeks depending on complexity and materials.',
      sortOrder: 1,
    },
    {
      question: 'Do you offer warranty?',
      answer: 'Yes, all our furniture comes with a 2-year workmanship warranty.',
      sortOrder: 2,
    },
    {
      question: 'Can I visit your workshop?',
      answer: 'Absolutely! We welcome visits. Please call ahead to schedule.',
      sortOrder: 3,
    },
  ]);

  // --- Company Settings ---
  await db.insert(companySettings).values([
    { key: 'vat_rate', value: '15' },
    { key: 'company_name', value: 'Kassahun Wood and Aluminum Work' },
    { key: 'company_phone', value: '+251911000000' },
    { key: 'company_address', value: 'Addis Ababa, Ethiopia' },
    { key: 'company_tin', value: '0012345678' },
  ]);

  console.log('Seed completed successfully!');
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
