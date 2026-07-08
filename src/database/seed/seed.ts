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
  projectAttachments,
  projectStatusHistory,
  projectPayments,
  materials,
  projectMaterials,
  invoices,
  invoiceItems,
  payments,
  testimonials,
  galleryImages,
  products,
  faqs,
  companySettings,
  notifications,
  contactMessages,
  quoteRequests,
  auditLogs,
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

  const [customer3] = await db
    .insert(customers)
    .values({
      fullName: 'Ato Daniel Mulugeta',
      phone: '+251944333444',
      email: 'daniel.m@gmail.com',
      address: 'Merkato, Addis Ababa',
      tinNumber: 'TIN-003',
      createdBy: superAdmin.id,
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

  const [matGlass] = await db
    .insert(materials)
    .values({
      name: 'Tempered Glass Panel',
      category: 'glass',
      description: '6mm tempered glass for cabinet doors',
      unitCost: '2200',
      unit: 'sqm',
      supplier: 'Addis Glass Works',
      isPublicVisible: true,
    })
    .returning();

  const [matHandle] = await db
    .insert(materials)
    .values({
      name: 'Stainless Steel Handle',
      category: 'hardware',
      description: 'Brushed stainless steel door handle',
      unitCost: '450',
      unit: 'piece',
      supplier: 'Hardware Hub',
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
      totalPrice: 120000,
      paidNowPrice: 30000,
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
      totalPrice: 95000,
      paidNowPrice: 0,
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
      totalPrice: 185000,
      paidNowPrice: 185000,
      orderDate: '2025-12-01',
      deliveryDate: '2026-01-31',
      completedAt: new Date('2026-01-28'),
      leadEmployeeId: employee3.id,
      createdBy: superAdmin.id,
    })
    .returning();

  const [project4] = await db
    .insert(projects)
    .values({
      projectNumber: 'KWA-2026-0004',
      customerId: customer3.id,
      division: 'furniture',
      title: 'Bedroom Wardrobe Set',
      description: 'Custom teak wardrobe with mirror panels',
      status: 'in_progress',
      priority: 'urgent',
      totalPrice: 185000,
      paidNowPrice: 50000,
      orderDate: '2026-03-10',
      deliveryDate: '2026-04-15',
      leadEmployeeId: employee1.id,
      createdBy: manager.id,
    })
    .returning();

  // --- Project Assignees ---
  await db.insert(projectAssignees).values([
    { projectId: project1.id, employeeId: employee1.id },
    { projectId: project1.id, employeeId: employee3.id },
    { projectId: project2.id, employeeId: employee2.id },
    { projectId: project3.id, employeeId: employee3.id },
    { projectId: project4.id, employeeId: employee1.id },
    { projectId: project4.id, employeeId: employee2.id },
  ]);

  // --- Project Status History ---
  await db.insert(projectStatusHistory).values([
    { projectId: project1.id, oldStatus: 'new', newStatus: 'in_progress', changedBy: manager.id, notes: 'Work started on dining table' },
    { projectId: project2.id, oldStatus: null, newStatus: 'new', changedBy: manager.id, notes: 'Order received' },
    { projectId: project3.id, oldStatus: 'new', newStatus: 'in_progress', changedBy: superAdmin.id, notes: 'Design phase started' },
    { projectId: project3.id, oldStatus: 'in_progress', newStatus: 'completed', changedBy: employee3.id, notes: 'All work completed' },
    { projectId: project4.id, oldStatus: null, newStatus: 'new', changedBy: manager.id, notes: 'Wardrobe order placed' },
    { projectId: project4.id, oldStatus: 'new', newStatus: 'in_progress', changedBy: employee1.id, notes: 'Material procurement started' },
  ]);

  // --- Project Attachments ---
  await db.insert(projectAttachments).values([
    { projectId: project1.id, fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/design1.jpg', fileType: 'drawing', caption: 'Initial design sketch', uploadedBy: employee3.id },
    { projectId: project1.id, fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/progress1.jpg', fileType: 'progress_photo', caption: 'Frame assembly in progress', uploadedBy: employee1.id },
    { projectId: project2.id, fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/measurement.pdf', fileType: 'document', caption: 'Window measurements', uploadedBy: employee2.id },
    { projectId: project3.id, fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/final1.jpg', fileType: 'completion_photo', caption: 'Completed living room', uploadedBy: employee3.id },
    { projectId: project4.id, fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1/wardrobe-design.jpg', fileType: 'photo', caption: 'Wardrobe reference photo', uploadedBy: employee1.id },
  ]);

  // --- Project Materials ---
  await db.insert(projectMaterials).values([
    { projectId: project1.id, materialId: matMahogany.id, quantity: '20', clientApproved: true },
    { projectId: project1.id, materialId: matMatteFinish.id, quantity: '2', clientApproved: true },
    { projectId: project1.id, materialId: matHandle.id, quantity: '12', clientApproved: true },
    { projectId: project2.id, materialId: matMatte.id, quantity: '50', clientApproved: false },
    { projectId: project2.id, materialId: matGold.id, quantity: '10', clientApproved: false },
    { projectId: project2.id, materialId: matGlass.id, quantity: '15', clientApproved: false },
    { projectId: project4.id, materialId: matTeak.id, quantity: '30', clientApproved: true },
    { projectId: project4.id, materialId: matGlass.id, quantity: '4', clientApproved: true },
    { projectId: project4.id, materialId: matHandle.id, quantity: '8', clientApproved: true },
  ]);

  // --- Project Payments ---
  await db.insert(projectPayments).values([
    { projectId: project1.id, amount: 30000, method: 'bank_transfer', note: 'Upfront deposit', recordedBy: superAdmin.id },
    { projectId: project3.id, amount: 185000, method: 'bank_transfer', note: 'Full payment', recordedBy: superAdmin.id },
    { projectId: project4.id, amount: 50000, method: 'telebirr', note: 'Down payment', recordedBy: manager.id },
    { projectId: project4.id, amount: 20000, method: 'cash', note: 'Second installment', recordedBy: manager.id },
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

  const [invoice2] = await db
    .insert(invoices)
    .values({
      invoiceNumber: 'INV-2026-0002',
      projectId: project1.id,
      customerId: customer1.id,
      subtotal: '120000',
      discountAmount: '5000',
      vatRate: '15',
      vatAmount: '17250',
      totalAmount: '132250',
      paymentStatus: 'partial',
      createdBy: manager.id,
    })
    .returning();

  const [invoice3] = await db
    .insert(invoices)
    .values({
      invoiceNumber: 'INV-2026-0003',
      projectId: project2.id,
      customerId: customer2.id,
      subtotal: '95000',
      vatRate: '15',
      vatAmount: '14250',
      totalAmount: '109250',
      paymentStatus: 'unpaid',
      createdBy: superAdmin.id,
    })
    .returning();

  // --- Invoice Items ---
  await db.insert(invoiceItems).values([
    { invoiceId: invoice1.id, description: 'Living Room Sofa Set', quantity: '1', unitPrice: '85000', total: '85000' },
    { invoiceId: invoice1.id, description: 'Coffee Table', quantity: '1', unitPrice: '35000', total: '35000' },
    { invoiceId: invoice1.id, description: 'TV Console', quantity: '1', unitPrice: '45000', total: '45000' },
    { invoiceId: invoice1.id, description: 'Interior Design Fee', quantity: '1', unitPrice: '20000', total: '20000' },
    { invoiceId: invoice2.id, description: 'Mahogany Dining Table (6-seater)', quantity: '1', unitPrice: '75000', total: '75000' },
    { invoiceId: invoice2.id, description: 'Dining Chair', quantity: '6', unitPrice: '7500', total: '45000' },
    { invoiceId: invoice3.id, description: 'Aluminum Window Frame (standard)', quantity: '8', unitPrice: '8500', total: '68000' },
    { invoiceId: invoice3.id, description: 'Aluminum Window Frame (large)', quantity: '2', unitPrice: '13500', total: '27000' },
  ]);

  // --- Payments ---
  await db.insert(payments).values([
    { invoiceId: invoice1.id, amount: '212750', method: 'bank_transfer', referenceNumber: 'TXN-20260128-001', paidAt: new Date('2026-01-28T10:30:00'), verifiedBy: superAdmin.id, verifiedAt: new Date('2026-01-28T14:00:00') },
    { invoiceId: invoice2.id, amount: '70000', method: 'telebirr', referenceNumber: 'TB-20260215-002', paidAt: new Date('2026-02-15T09:00:00'), verifiedBy: manager.id, verifiedAt: new Date('2026-02-15T11:30:00') },
    { invoiceId: invoice2.id, amount: '30000', method: 'cash', paidAt: new Date('2026-03-01T16:00:00'), verifiedBy: manager.id, verifiedAt: new Date('2026-03-01T16:30:00') },
  ]);

  // --- Testimonials ---
  await db.insert(testimonials).values([
    { customerName: 'Ato Tesfaye Abate', projectId: project3.id, rating: 5, reviewText: 'Excellent work! The team transformed our living room completely. Highly recommended.', isFeatured: true, isApproved: true },
    { customerName: 'W/ro Hiwot Dagne', rating: 4, reviewText: 'Good quality aluminum work. Delivery was on time. Will order again.', isFeatured: false, isApproved: true },
    { customerName: 'Ato Daniel Mulugeta', rating: 5, reviewText: 'Very professional team. The dining set exceeded our expectations.', isFeatured: true, isApproved: true },
  ]);

  // --- Gallery Images ---
  await db.insert(galleryImages).values([
    { title: 'Mahogany Dining Set', division: 'furniture', projectId: project1.id, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg', roomType: 'dining_room', isFeatured: true },
    { title: 'Aluminum Window Installation', division: 'aluminum', projectId: project2.id, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg', roomType: 'office', isFeatured: false },
    { title: 'Teak Bedroom Wardrobe', division: 'furniture', projectId: project4.id, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/wardrobe.jpg', roomType: 'bedroom', isFeatured: true },
    { title: 'Custom Coffee Table', division: 'furniture', projectId: project1.id, imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/coffee.jpg', roomType: 'living_room', isFeatured: false },
    { title: 'Office Aluminum Partitions', division: 'aluminum', imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/partition.jpg', roomType: 'office', isFeatured: true },
  ]);

  // --- Products ---
  await db.insert(products).values([
    { name: 'Custom Mahogany Dining Table', division: 'furniture', category: 'Tables', description: 'Handcrafted mahogany dining table, seats 6-8', materialId: matMahogany.id, price: '117500', mainImage: 'https://res.cloudinary.com/demo/image/upload/v1/dining.jpg', featureImages: [] },
    { name: 'Aluminum Sliding Windows', division: 'aluminum', category: 'Windows', description: 'Durable aluminum sliding windows with double glazing', materialId: matMatte.id, price: '8500', mainImage: 'https://res.cloudinary.com/demo/image/upload/v1/window.jpg', featureImages: [] },
    { name: 'Teak Bedroom Wardrobe', division: 'furniture', category: 'Storage', description: 'Spacious teak wardrobe with mirror panels', materialId: matTeak.id, price: '185000', mainImage: 'https://res.cloudinary.com/demo/image/upload/v1/wardrobe-prod.jpg', featureImages: [] },
    { name: 'Aluminum Cabinet Doors', division: 'aluminum', category: 'Cabinets', description: 'Sleek aluminum-framed cabinet doors with glass panels', materialId: matMatte.id, price: '13000', mainImage: 'https://res.cloudinary.com/demo/image/upload/v1/cabinet.jpg', featureImages: [] },
    { name: 'Living Room Sofa Set', division: 'furniture', category: 'Seating', description: 'Premium fabric sofa set, 3+2+1 configuration', materialId: matMahogany.id, price: '102500', mainImage: 'https://res.cloudinary.com/demo/image/upload/v1/sofa.jpg', featureImages: [] },
  ]);

  // --- FAQs ---
  await db.insert(faqs).values([
    { question: 'How long does a custom furniture order take?', answer: 'Typically 2-4 weeks depending on complexity and materials.', sortOrder: 1 },
    { question: 'Do you offer warranty?', answer: 'Yes, all our furniture comes with a 2-year workmanship warranty.', sortOrder: 2 },
    { question: 'Can I visit your workshop?', answer: 'Absolutely! We welcome visits. Please call ahead to schedule.', sortOrder: 3 },
    { question: 'What payment methods do you accept?', answer: 'We accept cash, bank transfer, Telebirr, and CBE Birr.', sortOrder: 4 },
    { question: 'Do you deliver outside Addis Ababa?', answer: 'Yes, we deliver nationwide. Delivery fees vary by location.', sortOrder: 5 },
  ]);

  // --- Notifications ---
  await db.insert(notifications).values([
    { userId: employee1.id, title: 'Job Assigned', body: 'You have been assigned to project KWA-2026-0001', type: 'job_assigned', relatedProjectId: project1.id },
    { userId: employee2.id, title: 'Job Assigned', body: 'You have been assigned to project KWA-2026-0002', type: 'job_assigned', relatedProjectId: project2.id },
    { userId: employee3.id, title: 'Job Completed', body: 'Project KWA-2026-0003 has been marked as completed', type: 'job_completed', relatedProjectId: project3.id },
    { userId: manager.id, title: 'Payment Received', body: 'Payment verified for INV-2026-0001', type: 'payment_verified', relatedProjectId: project3.id },
    { userId: employee1.id, title: 'Status Changed', body: 'Project KWA-2026-0004 status changed to in_progress', type: 'status_changed', relatedProjectId: project4.id },
    { userId: superAdmin.id, title: 'Overdue Invoice', body: 'INV-2026-0003 is overdue', type: 'overdue', relatedProjectId: project2.id },
  ]);

  // --- Contact Messages ---
  await db.insert(contactMessages).values([
    { name: 'Ato Samuel Getachew', email: 'samuel@gmail.com', phone: '+251911222333', message: 'I am interested in custom kitchen cabinets. Please contact me.', status: 'new' },
    { name: 'W/ro Martha Tekle', phone: '+251922333444', message: 'Do you repair aluminum windows? I have a broken frame.', status: 'read' },
    { name: 'Ato Yonas Berhanu', email: 'yonas@company.com', phone: '+251933444555', message: 'Looking for office furniture for our new branch in Bole.', status: 'replied' },
  ]);

  // --- Quote Requests ---
  await db.insert(quoteRequests).values([
    { name: 'Ato Samuel Getachew', email: 'samuel@gmail.com', phone: '+251911222333', division: 'furniture', description: 'Custom kitchen cabinets for 3-room apartment', budgetRange: '100000-200000', status: 'new' },
    { name: 'W/ro Martha Tekle', phone: '+251922333444', division: 'aluminum', description: 'Replace 5 broken aluminum window frames', budgetRange: '30000-50000', status: 'read' },
    { name: 'Ato Yonas Berhanu', email: 'yonas@company.com', phone: '+251933444555', division: 'furniture', description: 'Office desks and chairs for 20 employees', budgetRange: '200000-300000', status: 'new' },
  ]);

  // --- Audit Logs ---
  await db.insert(auditLogs).values([
    { userId: superAdmin.id, action: 'create', entityType: 'user', entityId: manager.id, metadata: { role: 'manager' } },
    { userId: manager.id, action: 'create', entityType: 'project', entityId: project2.id, metadata: { projectNumber: 'KWA-2026-0002' } },
    { userId: superAdmin.id, action: 'create', entityType: 'invoice', entityId: invoice1.id, metadata: { invoiceNumber: 'INV-2026-0001', total: '212750' } },
    { userId: superAdmin.id, action: 'verify_payment', entityType: 'payment', entityId: invoice1.id, metadata: { method: 'bank_transfer', amount: '212750' } },
    { userId: employee3.id, action: 'update_status', entityType: 'project', entityId: project3.id, metadata: { oldStatus: 'in_progress', newStatus: 'completed' } },
  ]);

  // --- Company Settings ---
  await db.insert(companySettings).values([
    { key: 'vat_rate', value: '15' },
    { key: 'company_name', value: 'Kassahun Wood and Aluminum Work' },
    { key: 'company_phone', value: '+251911000000' },
    { key: 'company_address', value: 'Addis Ababa, Ethiopia' },
    { key: 'company_tin', value: '0012345678' },
    { key: 'currency', value: 'ETB' },
    { key: 'logo_url', value: 'https://res.cloudinary.com/demo/image/upload/v1/logo.png' },
    { key: 'working_hours', value: 'Mon-Sat 8:00AM - 6:00PM' },
  ]);

  console.log('Seed completed successfully!');
  console.log('--- Login Credentials ---');
  console.log('Super Admin: +251911000001 / password123');
  console.log('Manager:     +251911000002 / password123');
  console.log('Employee 1:  +251911000003 / password123');
  console.log('Employee 2:  +251911000004 / password123');
  console.log('Employee 3:  +251911000005 / password123');
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
