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
  projectStatusHistory,
  materials,
  projectMaterials,
  invoices,
  invoiceItems,
  payments,
  suppliers,
  purchases,
  purchaseItems,
  companySettings,
} from '../schema';

async function seed() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('Clearing existing data...');
  await client.unsafe('TRUNCATE TABLE purchase_items CASCADE');
  await client.unsafe('TRUNCATE TABLE purchases CASCADE');
  await client.unsafe('TRUNCATE TABLE suppliers CASCADE');
  await client.unsafe('TRUNCATE TABLE invoice_items CASCADE');
  await client.unsafe('TRUNCATE TABLE payments CASCADE');
  await client.unsafe('TRUNCATE TABLE invoices CASCADE');
  await client.unsafe('TRUNCATE TABLE project_materials CASCADE');
  await client.unsafe('TRUNCATE TABLE project_assignees CASCADE');
  await client.unsafe('TRUNCATE TABLE project_status_history CASCADE');
  await client.unsafe('TRUNCATE TABLE project_payments CASCADE');
  await client.unsafe('TRUNCATE TABLE project_attachments CASCADE');
  await client.unsafe('TRUNCATE TABLE projects CASCADE');
  await client.unsafe('TRUNCATE TABLE materials CASCADE');
  await client.unsafe('TRUNCATE TABLE customers CASCADE');
  await client.unsafe('TRUNCATE TABLE employee_profiles CASCADE');
  await client.unsafe('TRUNCATE TABLE notifications CASCADE');
  await client.unsafe('TRUNCATE TABLE testimonials CASCADE');
  await client.unsafe('TRUNCATE TABLE gallery_images CASCADE');
  await client.unsafe('TRUNCATE TABLE products CASCADE');
  await client.unsafe('TRUNCATE TABLE faqs CASCADE');
  await client.unsafe('TRUNCATE TABLE contact_messages CASCADE');
  await client.unsafe('TRUNCATE TABLE quote_requests CASCADE');
  await client.unsafe('TRUNCATE TABLE audit_logs CASCADE');
  await client.unsafe('TRUNCATE TABLE company_settings CASCADE');
  await client.unsafe('TRUNCATE TABLE letter_templates CASCADE');
  await client.unsafe('TRUNCATE TABLE payment_letters CASCADE');
  await client.unsafe('TRUNCATE TABLE refresh_tokens CASCADE');
  await client.unsafe('TRUNCATE TABLE password_reset_otps CASCADE');
  await client.unsafe('TRUNCATE TABLE mfa_backup_codes CASCADE');
  await client.unsafe('TRUNCATE TABLE auth_audit_log CASCADE');
  await client.unsafe('TRUNCATE TABLE users CASCADE');
  console.log('Tables cleared.');

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // --- Users ---
  const [superAdmin] = await db.insert(users).values({
    fullName: 'Kassahun Owner',
    phone: '+251994437585',
    email: 'owner@kassahun.com',
    passwordHash,
    role: 'super_admin',
  }).returning();

  const [manager] = await db.insert(users).values({
    fullName: 'Manager One',
    phone: '+251911000002',
    email: 'manager@kassahun.com',
    passwordHash,
    role: 'manager',
  }).returning();

  const [emp1] = await db.insert(users).values({
    fullName: 'Abebe Carpenter',
    phone: '+251911000003',
    passwordHash,
    role: 'employee',
  }).returning();

  const [emp2] = await db.insert(users).values({
    fullName: 'Bereket Fabricator',
    phone: '+251911000004',
    passwordHash,
    role: 'employee',
  }).returning();

  const [emp3] = await db.insert(users).values({
    fullName: 'Chala Designer',
    phone: '+251911000005',
    passwordHash,
    role: 'employee',
  }).returning();

  await db.insert(employeeProfiles).values([
    { userId: emp1.id, specialty: 'carpenter', hireDate: '2024-03-01', idNumber: 'EMP-001' },
    { userId: emp2.id, specialty: 'aluminum_fabricator', hireDate: '2024-06-15', idNumber: 'EMP-002' },
    { userId: emp3.id, specialty: 'interior_designer', hireDate: '2025-01-10', idNumber: 'EMP-003' },
  ]);

  // --- Suppliers ---
  const [sup1] = await db.insert(suppliers).values({
    companyName: 'Addis Timber Supply',
    tinNumber: '0011223344',
    bankAccountNumber: '100020003000',
    phone: '+251911100001',
    address: 'Bole, Addis Ababa',
  }).returning();

  const [sup2] = await db.insert(suppliers).values({
    companyName: 'Ethio Aluminum Corp',
    tinNumber: '0022334455',
    bankAccountNumber: '200030004000',
    phone: '+251911100002',
    address: 'Merkato, Addis Ababa',
  }).returning();

  const [sup3] = await db.insert(suppliers).values({
    companyName: 'Asian Wood Imports',
    tinNumber: '0033445566',
    bankAccountNumber: '300040005000',
    phone: '+251911100003',
    address: 'Awash, Addis Ababa',
  }).returning();

  const [sup4] = await db.insert(suppliers).values({
    companyName: 'Hardware Hub Ethiopia',
    tinNumber: '0044556677',
    bankAccountNumber: '400050006000',
    phone: '+251911100004',
    address: 'Kazanchis, Addis Ababa',
  }).returning();

  const [sup5] = await db.insert(suppliers).values({
    companyName: 'Glass Works PLC',
    tinNumber: '0055667788',
    bankAccountNumber: '500060007000',
    phone: '+251911100005',
    address: 'Summit, Addis Ababa',
  }).returning();

  // --- Customers ---
  const [cust1] = await db.insert(customers).values({
    fullName: 'Ato Tesfaye Abate',
    phone: '+251922111222',
    email: 'tesfaye@gmail.com',
    address: 'Bole, Addis Ababa',
    tinNumber: 'TIN-001',
    createdBy: superAdmin.id,
  }).returning();

  const [cust2] = await db.insert(customers).values({
    fullName: 'W/ro Hiwot Dagne',
    phone: '+251933222333',
    address: 'Kazanchis, Addis Ababa',
    createdBy: manager.id,
  }).returning();

  const [cust3] = await db.insert(customers).values({
    fullName: 'Ato Daniel Mulugeta',
    phone: '+251944333444',
    email: 'daniel.m@gmail.com',
    address: 'Merkato, Addis Ababa',
    tinNumber: 'TIN-003',
    createdBy: superAdmin.id,
  }).returning();

  const [cust4] = await db.insert(customers).values({
    fullName: 'Ato Samuel Girma',
    phone: '+251955444555',
    email: 'samuel@company.com',
    address: 'Piassa, Addis Ababa',
    tinNumber: 'TIN-004',
    createdBy: manager.id,
  }).returning();

  const [cust5] = await db.insert(customers).values({
    fullName: 'W/ro Martha Tekle',
    phone: '+251966555666',
    address: 'CMC, Addis Ababa',
    tinNumber: 'TIN-005',
    createdBy: superAdmin.id,
  }).returning();

  const [cust6] = await db.insert(customers).values({
    fullName: 'Ato Yonas Berhanu',
    phone: '+251977666777',
    email: 'yonas@bank.com',
    address: 'Arat Kilo, Addis Ababa',
    tinNumber: 'TIN-006',
    createdBy: superAdmin.id,
  }).returning();

  // --- Materials ---
  const [matMahogany] = await db.insert(materials).values({
    name: 'Ethiopian Mahogany',
    category: 'wood_species',
    description: 'Premium local mahogany wood',
    unitCost: '15000',
    unit: 'board_ft',
    supplier: 'Addis Timber Supply',
    isPublicVisible: true,
  }).returning();

  const [matTeak] = await db.insert(materials).values({
    name: 'Teak Wood',
    category: 'wood_species',
    description: 'Imported teak for high-end furniture',
    unitCost: '25000',
    unit: 'board_ft',
    supplier: 'Asian Wood Imports',
    isPublicVisible: true,
  }).returning();

  const [matAlu] = await db.insert(materials).values({
    name: 'Matte Bronze Aluminum Profile',
    category: 'aluminum_profile',
    description: 'Heavy-duty aluminum profile with matte bronze finish',
    unitCost: '850',
    unit: 'meter',
    supplier: 'Ethio Aluminum Corp',
    isPublicVisible: true,
  }).returning();

  const [matGold] = await db.insert(materials).values({
    name: 'Gold Anodized Aluminum',
    category: 'aluminum_color',
    description: 'Gold anodized finish for decorative frames',
    unitCost: '1200',
    unit: 'meter',
    supplier: 'Ethio Aluminum Corp',
  }).returning();

  const [matFinish] = await db.insert(materials).values({
    name: 'Matte Lacquer Finish',
    category: 'wood_finish',
    description: 'Water-based matte lacquer for furniture',
    unitCost: '350',
    unit: 'liter',
    supplier: 'Hardware Hub Ethiopia',
    isPublicVisible: true,
  }).returning();

  const [matGlass] = await db.insert(materials).values({
    name: 'Tempered Glass Panel',
    category: 'glass',
    description: '6mm tempered glass for cabinet doors',
    unitCost: '2200',
    unit: 'sqm',
    supplier: 'Glass Works PLC',
    isPublicVisible: true,
  }).returning();

  const [matHandle] = await db.insert(materials).values({
    name: 'Stainless Steel Handle',
    category: 'hardware',
    description: 'Brushed stainless steel door handle',
    unitCost: '450',
    unit: 'piece',
    supplier: 'Hardware Hub Ethiopia',
  }).returning();

  // ===== PURCHASES =====
  // Strategy: HIGH purchases in Mar, Jun, Oct (stocking months)
  //           LOW purchases in Jan, Aug, Dec

  const allSuppliers = [sup1, sup2, sup3, sup4, sup5];
  let fsCounter = 1;

  async function insertPurchase(
    supplierIdx: number, date: string, items: { name: string; qty: number; price: number }[],
  ) {
    const sup = allSuppliers[supplierIdx % allSuppliers.length];
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const vatAmount = Math.round(subtotal * 0.15);
    const withholding = Math.round(subtotal * 0.03);
    const total = subtotal + vatAmount;

    const [p] = await db.insert(purchases).values({
      supplierId: sup.id,
      fsNumber: `FS-${String(fsCounter++).padStart(5, '0')}`,
      bankTransactionNumber: `TXN-${date.replace(/-/g, '')}-${fsCounter}`,
      purchaseDate: date,
      amountBeforeVat: String(subtotal),
      vatAmount: String(vatAmount),
      withholdingAmount: String(withholding),
      totalAmount: String(total),
      createdBy: superAdmin.id,
    }).returning();

    await db.insert(purchaseItems).values(
      items.map((i) => ({
        purchaseId: p.id,
        materialName: i.name,
        quantity: String(i.qty),
        unitPrice: String(i.price),
        lineTotal: String(i.qty * i.price),
      })),
    );

    return p;
  }

  // JAN - Low purchases
  await insertPurchase(0, '2026-01-10', [
    { name: 'Ethiopian Mahogany', qty: 10, price: 15000 },
    { name: 'Matte Lacquer Finish', qty: 5, price: 350 },
  ]);
  await insertPurchase(3, '2026-01-22', [
    { name: 'Stainless Steel Handle', qty: 20, price: 450 },
  ]);

  // FEB - Low purchases
  await insertPurchase(1, '2026-02-05', [
    { name: 'Matte Bronze Aluminum Profile', qty: 30, price: 850 },
    { name: 'Gold Anodized Aluminum', qty: 15, price: 1200 },
  ]);
  await insertPurchase(4, '2026-02-18', [
    { name: 'Tempered Glass Panel', qty: 10, price: 2200 },
  ]);

  // MAR - HIGH purchases (stocking up)
  await insertPurchase(0, '2026-03-03', [
    { name: 'Ethiopian Mahogany', qty: 50, price: 15000 },
    { name: 'Teak Wood', qty: 30, price: 25000 },
    { name: 'Matte Lacquer Finish', qty: 20, price: 350 },
  ]);
  await insertPurchase(1, '2026-03-12', [
    { name: 'Matte Bronze Aluminum Profile', qty: 100, price: 850 },
    { name: 'Gold Anodized Aluminum', qty: 50, price: 1200 },
  ]);
  await insertPurchase(2, '2026-03-20', [
    { name: 'Teak Wood', qty: 40, price: 25000 },
  ]);
  await insertPurchase(3, '2026-03-28', [
    { name: 'Stainless Steel Handle', qty: 100, price: 450 },
    { name: 'Tempered Glass Panel', qty: 25, price: 2200 },
  ]);

  // APR - Medium purchases
  await insertPurchase(0, '2026-04-08', [
    { name: 'Ethiopian Mahogany', qty: 20, price: 15000 },
  ]);
  await insertPurchase(4, '2026-04-20', [
    { name: 'Tempered Glass Panel', qty: 15, price: 2200 },
    { name: 'Stainless Steel Handle', qty: 30, price: 450 },
  ]);
  await insertPurchase(1, '2026-04-28', [
    { name: 'Matte Bronze Aluminum Profile', qty: 40, price: 850 },
  ]);

  // MAY - Medium purchases
  await insertPurchase(2, '2026-05-06', [
    { name: 'Teak Wood', qty: 15, price: 25000 },
  ]);
  await insertPurchase(3, '2026-05-20', [
    { name: 'Stainless Steel Handle', qty: 50, price: 450 },
    { name: 'Matte Lacquer Finish', qty: 10, price: 350 },
  ]);

  // JUN - HIGH purchases (mid-year restocking)
  await insertPurchase(0, '2026-06-02', [
    { name: 'Ethiopian Mahogany', qty: 60, price: 15000 },
    { name: 'Teak Wood', qty: 35, price: 25000 },
  ]);
  await insertPurchase(1, '2026-06-10', [
    { name: 'Matte Bronze Aluminum Profile', qty: 80, price: 850 },
    { name: 'Gold Anodized Aluminum', qty: 40, price: 1200 },
  ]);
  await insertPurchase(4, '2026-06-18', [
    { name: 'Tempered Glass Panel', qty: 30, price: 2200 },
  ]);
  await insertPurchase(3, '2026-06-28', [
    { name: 'Stainless Steel Handle', qty: 80, price: 450 },
    { name: 'Matte Lacquer Finish', qty: 15, price: 350 },
  ]);

  // JUL - Low purchases
  await insertPurchase(2, '2026-07-08', [
    { name: 'Teak Wood', qty: 8, price: 25000 },
  ]);
  await insertPurchase(0, '2026-07-22', [
    { name: 'Ethiopian Mahogany', qty: 5, price: 15000 },
  ]);

  // AUG - Low purchases
  await insertPurchase(1, '2026-08-05', [
    { name: 'Matte Bronze Aluminum Profile', qty: 20, price: 850 },
  ]);

  // SEP - Medium purchases
  await insertPurchase(0, '2026-09-10', [
    { name: 'Ethiopian Mahogany', qty: 15, price: 15000 },
    { name: 'Matte Lacquer Finish', qty: 8, price: 350 },
  ]);
  await insertPurchase(4, '2026-09-25', [
    { name: 'Tempered Glass Panel', qty: 12, price: 2200 },
  ]);

  // OCT - HIGH purchases (pre-holiday stocking)
  await insertPurchase(0, '2026-10-05', [
    { name: 'Ethiopian Mahogany', qty: 45, price: 15000 },
    { name: 'Teak Wood', qty: 25, price: 25000 },
  ]);
  await insertPurchase(1, '2026-10-15', [
    { name: 'Matte Bronze Aluminum Profile', qty: 70, price: 850 },
    { name: 'Gold Anodized Aluminum', qty: 35, price: 1200 },
  ]);
  await insertPurchase(3, '2026-10-28', [
    { name: 'Stainless Steel Handle', qty: 60, price: 450 },
    { name: 'Tempered Glass Panel', qty: 20, price: 2200 },
  ]);

  // NOV - Medium purchases
  await insertPurchase(2, '2026-11-08', [
    { name: 'Teak Wood', qty: 12, price: 25000 },
  ]);
  await insertPurchase(0, '2026-11-22', [
    { name: 'Ethiopian Mahogany', qty: 8, price: 15000 },
    { name: 'Matte Lacquer Finish', qty: 5, price: 350 },
  ]);

  // DEC - Low purchases
  await insertPurchase(4, '2026-12-10', [
    { name: 'Tempered Glass Panel', qty: 5, price: 2200 },
  ]);

  // ===== PROJECTS (WORK ORDERS) =====
  // Strategy: HIGH income in Feb, Jul, Nov
  //           LOW income in Apr, May, Sep

  const allCustomers = [cust1, cust2, cust3, cust4, cust5, cust6];
  let projCounter = 1;

  async function insertProject(
    custIdx: number, division: 'furniture' | 'aluminum' | 'interior_design',
    title: string, description: string, status: string,
    totalPrice: number, paidNow: number, orderDate: string, deliveryDate: string,
    paidAt?: string,
  ) {
    const cust = allCustomers[custIdx % allCustomers.length];
    const vat = Math.round(totalPrice * 0.15 / 1.15);
    const priceBeforeVat = totalPrice - vat;

    const [p] = await db.insert(projects).values({
      projectNumber: `KWA-2026-${String(projCounter++).padStart(4, '0')}`,
      customerId: cust.id,
      division,
      title,
      description,
      status: status as any,
      priority: 'normal',
      totalPrice,
      priceBeforeVat: String(priceBeforeVat),
      vatAmount: String(vat),
      paidNowPrice: paidNow,
      orderDate,
      deliveryDate,
      paidAt: paidAt ? new Date(paidAt) : null,
      leadEmployeeId: [emp1.id, emp2.id, emp3.id][projCounter % 3],
      createdBy: superAdmin.id,
    }).returning();

    await db.insert(projectAssignees).values([
      { projectId: p.id, employeeId: emp1.id },
      { projectId: p.id, employeeId: [emp1.id, emp2.id, emp3.id][projCounter % 3] },
    ]);

    return p;
  }

  async function insertInvoice(
    custIdx: number, project: any, number: string, date: string,
    items: { desc: string; qty: number; price: number }[],
  ) {
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const vat = Math.round(subtotal * 0.15);
    const total = subtotal + vat;

    const [inv] = await db.insert(invoices).values({
      invoiceNumber: number,
      projectId: project.id,
      customerId: allCustomers[custIdx % allCustomers.length].id,
      subtotal: String(subtotal),
      vatRate: '15',
      vatAmount: String(vat),
      totalAmount: String(total),
      paymentStatus: total <= project.paidNowPrice ? 'paid' : 'partial',
      createdBy: superAdmin.id,
    }).returning();

    await db.insert(invoiceItems).values(
      items.map((i) => ({
        invoiceId: inv.id,
        description: i.desc,
        quantity: String(i.qty),
        unitPrice: String(i.price),
        total: String(i.qty * i.price),
      })),
    );

    if (total <= project.paidNowPrice) {
      await db.insert(payments).values({
        invoiceId: inv.id,
        amount: String(total),
        method: 'bank_transfer',
        referenceNumber: `PAY-${number}`,
        paidAt: new Date(date),
        verifiedBy: superAdmin.id,
        verifiedAt: new Date(date),
      });
    }

    return inv;
  }

  // JAN - Medium income
  const janP1 = await insertProject(0, 'furniture', 'Custom Dining Table Set',
    'Mahogany 6-seater dining table with chairs', 'paid',
    120000, 120000, '2026-01-10', '2026-02-15', '2026-01-25');
  await insertInvoice(0, janP1, 'INV-2026-0001', '2026-01-15', [
    { desc: 'Mahogany Dining Table', qty: 1, price: 75000 },
    { desc: 'Dining Chairs', qty: 6, price: 7500 },
  ]);

  const janP2 = await insertProject(1, 'aluminum', 'Aluminum Door Frames',
    '3 aluminum door frames for office', 'paid',
    85000, 85000, '2026-01-18', '2026-02-20', '2026-02-25');
  await insertInvoice(1, janP2, 'INV-2026-0002', '2026-01-20', [
    { desc: 'Aluminum Door Frame', qty: 3, price: 28333 },
  ]);

  // FEB - HIGH income
  const febP1 = await insertProject(2, 'interior_design', 'Office Interior Redesign',
    'Complete office interior with custom furniture', 'paid',
    250000, 250000, '2026-02-01', '2026-03-15', '2026-03-20');
  await insertInvoice(2, febP1, 'INV-2026-0003', '2026-02-05', [
    { desc: 'Office Desk Set', qty: 10, price: 15000 },
    { desc: 'Conference Table', qty: 1, price: 45000 },
    { desc: 'Reception Counter', qty: 1, price: 55000 },
  ]);

  const febP2 = await insertProject(0, 'furniture', 'Kitchen Cabinet Set',
    'Custom mahogany kitchen cabinets', 'paid',
    180000, 180000, '2026-02-10', '2026-03-20', '2026-03-25');
  await insertInvoice(0, febP2, 'INV-2026-0004', '2026-02-12', [
    { desc: 'Upper Cabinets', qty: 1, price: 65000 },
    { desc: 'Lower Cabinets', qty: 1, price: 75000 },
    { desc: 'Countertop', qty: 1, price: 40000 },
  ]);

  const febP3 = await insertProject(3, 'aluminum', 'Aluminum Window Frames',
    '10 aluminum window frames', 'delivered',
    150000, 100000, '2026-02-15', '2026-03-25');
  await insertInvoice(3, febP3, 'INV-2026-0005', '2026-02-18', [
    { desc: 'Aluminum Window Frame (standard)', qty: 7, price: 15000 },
    { desc: 'Aluminum Window Frame (large)', qty: 3, price: 15000 },
  ]);

  // MAR - Medium income
  const marP1 = await insertProject(4, 'furniture', 'Bedroom Wardrobe Set',
    'Custom teak wardrobe with mirror panels', 'paid',
    160000, 160000, '2026-03-05', '2026-04-10', '2026-04-15');
  await insertInvoice(4, marP1, 'INV-2026-0006', '2026-03-08', [
    { desc: 'Teak Wardrobe', qty: 1, price: 95000 },
    { desc: 'Dressing Table', qty: 1, price: 35000 },
    { desc: 'Bedside Tables', qty: 2, price: 15000 },
  ]);

  const marP2 = await insertProject(5, 'aluminum', 'Aluminum Partition Walls',
    'Office partition walls with glass panels', 'delivered',
    95000, 95000, '2026-03-15', '2026-04-15', '2026-04-20');
  await insertInvoice(5, marP2, 'INV-2026-0007', '2026-03-18', [
    { desc: 'Aluminum Partition Wall', qty: 5, price: 19000 },
  ]);

  // APR - Low income
  const aprP1 = await insertProject(0, 'furniture', 'Side Table Set',
    'Simple mahogany side tables', 'cancelled',
    65000, 0, '2026-04-01', '2026-04-20');
  await insertInvoice(0, aprP1, 'INV-2026-0008', '2026-04-03', [
    { desc: 'Side Table', qty: 3, price: 21666 },
  ]);

  // MAY - Low income
  const mayP1 = await insertProject(1, 'aluminum', 'Small Aluminum Frames',
    '4 small aluminum frames', 'in_progress',
    55000, 25000, '2026-05-05', '2026-05-25');
  await insertInvoice(1, mayP1, 'INV-2026-0009', '2026-05-08', [
    { desc: 'Aluminum Frame (small)', qty: 4, price: 13750 },
  ]);

  // JUN - Medium income
  const junP1 = await insertProject(2, 'interior_design', 'Restaurant Interior',
    'Restaurant dining area design and furniture', 'delivered',
    120000, 80000, '2026-06-01', '2026-07-10');
  await insertInvoice(2, junP1, 'INV-2026-0010', '2026-06-05', [
    { desc: 'Dining Tables', qty: 8, price: 10000 },
    { desc: 'Chairs', qty: 32, price: 2500 },
  ]);

  const junP2 = await insertProject(3, 'furniture', 'Living Room Set',
    'Complete living room furniture set', 'paid',
    110000, 110000, '2026-06-15', '2026-07-20', '2026-07-25');
  await insertInvoice(3, junP2, 'INV-2026-0011', '2026-06-18', [
    { desc: 'Sofa Set', qty: 1, price: 65000 },
    { desc: 'TV Console', qty: 1, price: 25000 },
    { desc: 'Coffee Table', qty: 1, price: 20000 },
  ]);

  // JUL - HIGH income
  const julP1 = await insertProject(4, 'furniture', 'Hotel Furniture Order',
    '50 hotel room furniture sets', 'delivered',
    350000, 200000, '2026-07-01', '2026-08-30');
  await insertInvoice(4, julP1, 'INV-2026-0012', '2026-07-05', [
    { desc: 'Hotel Bed Frame', qty: 50, price: 4000 },
    { desc: 'Hotel Wardrobe', qty: 50, price: 2500 },
    { desc: 'Hotel Desk', qty: 50, price: 1000 },
  ]);

  const julP2 = await insertProject(5, 'aluminum', 'Aluminum Facade System',
    'Aluminum facade for commercial building', 'delivered',
    280000, 150000, '2026-07-08', '2026-08-25');
  await insertInvoice(5, julP2, 'INV-2026-0013', '2026-07-12', [
    { desc: 'Aluminum Facade Panel', qty: 100, price: 2800 },
  ]);

  const julP3 = await insertProject(0, 'interior_design', 'Showroom Design',
    'Full showroom interior design', 'paid',
    180000, 180000, '2026-07-15', '2026-08-20', '2026-08-25');
  await insertInvoice(0, julP3, 'INV-2026-0014', '2026-07-18', [
    { desc: 'Display Units', qty: 6, price: 20000 },
    { desc: 'Lighting Fixtures', qty: 1, price: 30000 },
    { desc: 'Flooring', qty: 1, price: 70000 },
  ]);

  // AUG - Medium income
  const augP1 = await insertProject(1, 'furniture', 'Office Desk Order',
    '20 custom office desks', 'paid',
    100000, 100000, '2026-08-01', '2026-08-25', '2026-08-20');
  await insertInvoice(1, augP1, 'INV-2026-0015', '2026-08-05', [
    { desc: 'Office Desk', qty: 20, price: 5000 },
  ]);

  const augP2 = await insertProject(2, 'aluminum', 'Security Doors',
    'Aluminum security doors', 'paid',
    75000, 75000, '2026-08-10', '2026-09-05', '2026-09-10');
  await insertInvoice(2, augP2, 'INV-2026-0016', '2026-08-13', [
    { desc: 'Aluminum Security Door', qty: 3, price: 25000 },
  ]);

  // SEP - Low income
  const sepP1 = await insertProject(3, 'furniture', 'Shoe Rack',
    'Custom mahogany shoe rack', 'new',
    45000, 0, '2026-09-05', '2026-09-25');
  await insertInvoice(3, sepP1, 'INV-2026-0017', '2026-09-08', [
    { desc: 'Shoe Rack', qty: 1, price: 45000 },
  ]);

  // OCT - Medium income
  const octP1 = await insertProject(4, 'interior_design', 'Bank Branch Interior',
    'Bank branch complete interior', 'paid',
    140000, 140000, '2026-10-01', '2026-11-10', '2026-11-15');
  await insertInvoice(4, octP1, 'INV-2026-0018', '2026-10-05', [
    { desc: 'Counter Desk', qty: 4, price: 20000 },
    { desc: 'Waiting Area Seating', qty: 10, price: 6000 },
  ]);

  const octP2 = await insertProject(5, 'furniture', 'Conference Table',
    'Large mahogany conference table', 'paid',
    90000, 90000, '2026-10-12', '2026-11-05', '2026-11-20');
  await insertInvoice(5, octP2, 'INV-2026-0019', '2026-10-15', [
    { desc: 'Conference Table', qty: 1, price: 70000 },
    { desc: 'Executive Chairs', qty: 8, price: 2500 },
  ]);

  // NOV - HIGH income
  const novP1 = await insertProject(0, 'furniture', 'Furniture Export Order',
    'Large furniture export order', 'delivered',
    220000, 120000, '2026-11-01', '2026-12-15');
  await insertInvoice(0, novP1, 'INV-2026-0020', '2026-11-05', [
    { desc: 'Dining Set', qty: 5, price: 30000 },
    { desc: 'Coffee Table', qty: 5, price: 14000 },
  ]);

  const novP2 = await insertProject(1, 'aluminum', 'Aluminum Storefront',
    'Full aluminum storefront for retail shop', 'paid',
    170000, 170000, '2026-11-08', '2026-12-10', '2026-12-15');
  await insertInvoice(1, novP2, 'INV-2026-0021', '2026-11-12', [
    { desc: 'Storefront Frame', qty: 1, price: 100000 },
    { desc: 'Glass Panels', qty: 10, price: 7000 },
  ]);

  const novP3 = await insertProject(2, 'interior_design', 'Villa Interior',
    'Luxury villa interior design and furniture', 'delivered',
    300000, 150000, '2026-11-15', '2026-12-20');
  await insertInvoice(2, novP3, 'INV-2026-0022', '2026-11-18', [
    { desc: 'Living Room Set', qty: 1, price: 120000 },
    { desc: 'Bedroom Set', qty: 3, price: 40000 },
    { desc: 'Dining Set', qty: 1, price: 100000 },
  ]);

  // DEC - Medium income
  const decP1 = await insertProject(3, 'furniture', 'Year-End Office Furniture',
    'Office furniture refresh order', 'paid',
    85000, 85000, '2026-12-01', '2026-12-20', '2026-12-20');
  await insertInvoice(3, decP1, 'INV-2026-0023', '2026-12-05', [
    { desc: 'Office Chair', qty: 15, price: 4000 },
    { desc: 'Filing Cabinet', qty: 5, price: 5000 },
  ]);

  const decP2 = await insertProject(4, 'aluminum', 'Window Replacement',
    'Replace old windows with aluminum frames', 'completed',
    70000, 50000, '2026-12-08', '2026-12-28');
  await insertInvoice(4, decP2, 'INV-2026-0024', '2026-12-12', [
    { desc: 'Aluminum Window Frame', qty: 7, price: 10000 },
  ]);

  // --- Company Settings ---
  await db.insert(companySettings).values([
    { key: 'vat_rate', value: '15' },
    { key: 'company_name', value: 'Kassahun Wood and Aluminum Work' },
    { key: 'company_phone', value: '+251911000000' },
    { key: 'company_email', value: 'info@kassahun.com' },
    { key: 'company_address', value: 'Addis Ababa, Ethiopia' },
    { key: 'company_tin', value: '0012345678' },
    { key: 'currency', value: 'ETB' },
    { key: 'signatory_name', value: 'Kassahun Owner' },
    { key: 'bank_name', value: 'Commercial Bank of Ethiopia' },
    { key: 'bank_account_number', value: '1000200030004' },
    { key: 'bank_account_name', value: 'Kassahun Wood and Aluminum Work PLC' },
  ]);

  console.log('Seed completed successfully!');
  console.log('--- Login Credentials ---');
  console.log('Super Admin: +251994437585 / password123');
  console.log('Manager:     +251911000002 / password123');
  console.log('Employee 1:  +251911000003 / password123');
  console.log('Employee 2:  +251911000004 / password123');
  console.log('Employee 3:  +251911000005 / password123');
  console.log('');
  console.log('--- Data Summary ---');
  console.log('5 Suppliers, 6 Customers');
  console.log('24 Projects across Jan-Dec');
  console.log('24 Purchases across Jan-Dec');
  console.log('');
  console.log('--- Purchase Pattern (VAT Input) ---');
  console.log('HIGH: Mar, Jun, Oct (stocking months)');
  console.log('LOW:  Jan, Jul, Aug, Dec');
  console.log('');
  console.log('--- Work Project Pattern (VAT Output) ---');
  console.log('HIGH: Feb, Jul, Nov');
  console.log('LOW:  Apr, May, Sep');

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
